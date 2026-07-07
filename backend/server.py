from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Response, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import io
import json
import re
import uuid
import base64
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from pypdf import PdfReader
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
CLAUDE_MODEL = "claude-sonnet-4-6"
APP_NAME = "readbox"
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
DEFAULT_USER = "default_user"

storage_key = None

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ============ Object Storage ============
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ============ Models ============
class ReadingCreate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    read_date: Optional[str] = None
    rating: Optional[float] = None
    review: Optional[str] = None
    liked: Optional[bool] = False


class ReadingUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    read_date: Optional[str] = None
    rating: Optional[float] = None
    review: Optional[str] = None
    liked: Optional[bool] = None


class HighlightCreate(BaseModel):
    text: str
    note: Optional[str] = None


class ChecklistToggle(BaseModel):
    checked: bool


class QuizAnswer(BaseModel):
    quiz_id: str
    question_index: int
    selected: int


class ReviewGrade(BaseModel):
    grade: int  # 0..3: again, hard, good, easy


class TagUpdate(BaseModel):
    tags: List[dict]  # [{name, color, icon}]


# ============ Helpers ============
def now_iso():
    return datetime.now(timezone.utc).isoformat()


def extract_pdf_text(data: bytes, max_chars: int = 40000) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        text = ""
        for page in reader.pages:
            text += (page.extract_text() or "") + "\n"
            if len(text) > max_chars:
                break
        return text[:max_chars].strip()
    except Exception as e:
        logger.error(f"PDF extract error: {e}")
        return ""


def strip_id(doc):
    if doc and "_id" in doc:
        doc.pop("_id")
    return doc


async def call_claude(system_message: str, user_text: str, session_id: str) -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_message,
    ).with_model("anthropic", CLAUDE_MODEL)
    response = await chat.send_message(UserMessage(text=user_text))
    return response if isinstance(response, str) else str(response)


def parse_json_block(text: str):
    # try to find first JSON in text
    match = re.search(r"\{[\s\S]*\}|\[[\s\S]*\]", text)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except Exception:
        return None


# ============ Startup ============
@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ============ Readings ============
@api_router.post("/readings")
async def create_reading(
    file: Optional[UploadFile] = File(None),
    title: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    read_date: Optional[str] = Form(None),
    rating: Optional[float] = Form(None),
    review: Optional[str] = Form(None),
    liked: Optional[bool] = Form(False),
):
    reading_id = str(uuid.uuid4())
    storage_path = None
    pdf_text = ""
    file_name = None

    if file:
        data = await file.read()
        ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "pdf"
        storage_path = f"{APP_NAME}/uploads/{DEFAULT_USER}/{reading_id}.{ext}"
        try:
            result = put_object(storage_path, data, file.content_type or "application/pdf")
            storage_path = result["path"]
        except Exception as e:
            logger.error(f"Storage upload failed: {e}")
            raise HTTPException(status_code=500, detail="File upload failed")
        pdf_text = extract_pdf_text(data)
        file_name = file.filename

    inferred_title = title or (file_name.rsplit(".", 1)[0] if file_name else "Untitled Reading")

    reading = {
        "id": reading_id,
        "user_id": DEFAULT_USER,
        "title": inferred_title,
        "author": author or "",
        "read_date": read_date or now_iso()[:10],
        "rating": rating,
        "review": review or "",
        "liked": bool(liked),
        "storage_path": storage_path,
        "file_name": file_name,
        "pdf_text": pdf_text,
        "synopsis": "",
        "cover_color": _pick_color(inferred_title),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }

    await db.readings.insert_one(reading)

    # Generate synopsis + author in one call to save budget
    if pdf_text:
        try:
            raw = await call_claude(
                "You analyze reading materials. Return ONLY valid JSON.",
                (
                    "Given this reading, return JSON: {\"author\": \"detected author or empty string\", "
                    "\"title_suggestion\": \"clean title or empty\", "
                    "\"synopsis\": \"3-5 sentence engaging synopsis capturing core thesis\", "
                    "\"cover_prompt\": \"one-line artistic painted book-cover-style visual prompt (no text on cover), evocative and thematic\"}\n\n"
                    f"READING:\n{pdf_text[:15000]}"
                ),
                f"analyze-{reading_id}",
            )
            data = parse_json_block(raw) or {}
            update = {}
            if isinstance(data, dict):
                if data.get("synopsis"):
                    update["synopsis"] = data["synopsis"].strip()
                if data.get("author") and not author:
                    update["author"] = data["author"].strip()
                if data.get("title_suggestion") and not title:
                    update["title"] = data["title_suggestion"].strip()
                if data.get("cover_prompt"):
                    update["cover_prompt"] = data["cover_prompt"].strip()
            if update:
                await db.readings.update_one({"id": reading_id}, {"$set": update})
                reading.update(update)
        except Exception as e:
            logger.error(f"Analysis failed: {e}")

    return strip_id(reading)


def _pick_color(seed: str) -> str:
    palette = ["#00E054", "#FF8000", "#40BCF4", "#FF2A79", "#9D4EDD", "#FFB800", "#5B8FF9", "#F5A623"]
    return palette[sum(ord(c) for c in seed) % len(palette)]


@api_router.get("/readings")
async def list_readings():
    items = await db.readings.find(
        {"user_id": DEFAULT_USER},
        {"_id": 0, "pdf_text": 0},
    ).sort("read_date", -1).to_list(1000)
    return items


@api_router.get("/readings/{reading_id}")
async def get_reading(reading_id: str):
    doc = await db.readings.find_one({"id": reading_id, "user_id": DEFAULT_USER}, {"_id": 0, "pdf_text": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Reading not found")
    return doc


@api_router.patch("/readings/{reading_id}")
async def update_reading(reading_id: str, upd: ReadingUpdate):
    update = {k: v for k, v in upd.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    result = await db.readings.update_one({"id": reading_id, "user_id": DEFAULT_USER}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await db.readings.find_one({"id": reading_id}, {"_id": 0, "pdf_text": 0})
    return doc


@api_router.delete("/readings/{reading_id}")
async def delete_reading(reading_id: str):
    await db.readings.delete_one({"id": reading_id, "user_id": DEFAULT_USER})
    await db.highlights.delete_many({"reading_id": reading_id})
    await db.checklist.delete_many({"reading_id": reading_id})
    await db.notes.delete_many({"reading_id": reading_id})
    await db.quizzes.delete_many({"reading_id": reading_id})
    return {"ok": True}


@api_router.get("/readings/{reading_id}/pdf")
async def get_reading_pdf(reading_id: str):
    doc = await db.readings.find_one({"id": reading_id, "user_id": DEFAULT_USER})
    if not doc or not doc.get("storage_path"):
        raise HTTPException(status_code=404, detail="File not found")
    data, ct = get_object(doc["storage_path"])
    return Response(content=data, media_type=ct)


# ============ Checklist (AI topic checklist) ============
@api_router.post("/readings/{reading_id}/checklist/generate")
async def generate_checklist(reading_id: str):
    doc = await db.readings.find_one({"id": reading_id, "user_id": DEFAULT_USER})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    text = doc.get("pdf_text") or ""
    if not text:
        raise HTTPException(status_code=400, detail="No text extracted from source")

    prompt = (
        "Analyze the reading below and produce a checklist of 8-14 distinct topics/concepts/ideas the reader could learn from it. "
        "Return ONLY a JSON array of objects like: [{\"topic\": \"...\", \"description\": \"one short line\"}].\n\n"
        f"READING:\n{text[:18000]}"
    )
    raw = await call_claude(
        "You extract learnable topics from reading materials as structured JSON.",
        prompt,
        f"checklist-{reading_id}",
    )
    items = parse_json_block(raw) or []
    if not isinstance(items, list):
        items = []

    await db.checklist.delete_many({"reading_id": reading_id})
    stored = []
    for it in items:
        entry = {
            "id": str(uuid.uuid4()),
            "reading_id": reading_id,
            "topic": (it.get("topic") if isinstance(it, dict) else str(it))[:250],
            "description": (it.get("description") if isinstance(it, dict) else "")[:500],
            "checked": False,
            "created_at": now_iso(),
        }
        stored.append(entry)
    if stored:
        await db.checklist.insert_many([dict(s) for s in stored])
    return [{k: v for k, v in s.items()} for s in stored]


@api_router.get("/readings/{reading_id}/checklist")
async def get_checklist(reading_id: str):
    items = await db.checklist.find({"reading_id": reading_id}, {"_id": 0}).to_list(500)
    return items


@api_router.patch("/checklist/{item_id}")
async def toggle_checklist(item_id: str, upd: ChecklistToggle):
    await db.checklist.update_one({"id": item_id}, {"$set": {"checked": upd.checked}})
    return {"ok": True}


# ============ AI Notes (based on checked items) ============
@api_router.post("/readings/{reading_id}/notes/generate")
async def generate_notes(reading_id: str):
    doc = await db.readings.find_one({"id": reading_id, "user_id": DEFAULT_USER})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    checked = await db.checklist.find({"reading_id": reading_id, "checked": True}, {"_id": 0}).to_list(200)
    if not checked:
        raise HTTPException(status_code=400, detail="Check at least one topic first")

    topics = "\n".join(f"- {c['topic']}: {c.get('description','')}" for c in checked)
    prompt = (
        "Write a comprehensive, engaging ESSAY (NOT bullet points, NOT lists) that weaves together the reader's selected topics "
        "into a smooth, cohesive narrative. Rules:\n"
        "1. Pure flowing prose in 4-7 paragraphs. NO bullet points, NO numbered lists, NO markdown lists.\n"
        "2. Cover EVERY selected topic thoroughly, but connect them so ideas flow naturally.\n"
        "3. Explain concepts in your own words — do NOT quote verbatim. Make it accessible even 8 months later.\n"
        "4. Include 2-3 rhetorical questions placed thoughtfully to force active reading.\n"
        "5. Use relatable analogies and vivid examples. Make it interesting, not academic.\n"
        "6. Precise and succinct — no filler. Every sentence earns its place.\n"
        "7. Use `## Title` for the essay title only (one line). Rest is prose paragraphs separated by blank lines.\n\n"
        f"SELECTED TOPICS TO WEAVE TOGETHER:\n{topics}\n\n"
        f"SOURCE READING:\n{(doc.get('pdf_text') or '')[:18000]}"
    )
    notes_text = await call_claude(
        "You are a masterful essayist who transforms academic topics into vivid, flowing prose that hooks readers and lingers in memory. Write in essay form only — never bullet points.",
        prompt,
        f"notes-{reading_id}",
    )
    entry = {
        "id": str(uuid.uuid4()),
        "reading_id": reading_id,
        "content": notes_text.strip(),
        "topics": [c["topic"] for c in checked],
        "created_at": now_iso(),
    }
    await db.notes.delete_many({"reading_id": reading_id})
    await db.notes.insert_one(dict(entry))
    return entry


@api_router.get("/readings/{reading_id}/notes")
async def get_notes(reading_id: str):
    doc = await db.notes.find_one({"reading_id": reading_id}, {"_id": 0})
    return doc or None


# ============ Highlights ============
@api_router.post("/readings/{reading_id}/highlights")
async def create_highlight(reading_id: str, h: HighlightCreate):
    entry = {
        "id": str(uuid.uuid4()),
        "reading_id": reading_id,
        "text": h.text,
        "note": h.note or "",
        # SM-2 spaced rep state
        "ease": 2.5,
        "interval_days": 0,
        "repetitions": 0,
        "due_date": now_iso()[:10],
        "created_at": now_iso(),
    }
    await db.highlights.insert_one(dict(entry))
    return entry


@api_router.get("/readings/{reading_id}/highlights")
async def list_highlights(reading_id: str):
    items = await db.highlights.find({"reading_id": reading_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return items


@api_router.delete("/highlights/{highlight_id}")
async def delete_highlight(highlight_id: str):
    await db.highlights.delete_one({"id": highlight_id})
    return {"ok": True}


# ============ Spaced Repetition (SM-2) ============
@api_router.get("/revision/due")
async def revision_due():
    today = now_iso()[:10]
    items = await db.highlights.find({"due_date": {"$lte": today}}, {"_id": 0}).to_list(1000)
    # attach reading titles
    reading_ids = list({i["reading_id"] for i in items})
    readings = await db.readings.find({"id": {"$in": reading_ids}}, {"_id": 0, "id": 1, "title": 1, "cover_color": 1}).to_list(1000)
    rmap = {r["id"]: r for r in readings}
    for i in items:
        r = rmap.get(i["reading_id"], {})
        i["reading_title"] = r.get("title", "")
        i["cover_color"] = r.get("cover_color", "#00E054")
    return items


@api_router.get("/revision/readings")
async def revision_readings():
    """Grouped by reading with counts of due highlights."""
    pipeline = [
        {"$group": {"_id": "$reading_id", "total": {"$sum": 1}}},
    ]
    cursor = db.highlights.aggregate(pipeline)
    counts = {}
    async for c in cursor:
        counts[c["_id"]] = c["total"]
    readings = await db.readings.find({"user_id": DEFAULT_USER}, {"_id": 0, "id": 1, "title": 1, "author": 1, "cover_color": 1}).to_list(1000)
    result = []
    for r in readings:
        rid = r["id"]
        if rid not in counts:
            continue
        result.append({**r, "highlight_count": counts[rid]})
    return result


@api_router.post("/highlights/{highlight_id}/review")
async def review_highlight(highlight_id: str, grade: ReviewGrade):
    h = await db.highlights.find_one({"id": highlight_id})
    if not h:
        raise HTTPException(status_code=404, detail="Not found")
    # SM-2 style
    q = max(0, min(3, grade.grade))  # 0 again, 1 hard, 2 good, 3 easy
    ease = h.get("ease", 2.5)
    reps = h.get("repetitions", 0)
    interval = h.get("interval_days", 0)

    if q == 0:
        reps = 0
        interval = 1
    else:
        if reps == 0:
            interval = 1
        elif reps == 1:
            interval = 3 if q >= 2 else 2
        else:
            mult = {1: 1.2, 2: ease, 3: ease * 1.3}[q]
            interval = max(1, round(interval * mult))
        reps += 1
        # ease adjust
        ease = ease + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02))
        ease = max(1.3, ease)

    due = (datetime.now(timezone.utc) + timedelta(days=interval)).date().isoformat()
    await db.highlights.update_one(
        {"id": highlight_id},
        {"$set": {"ease": ease, "repetitions": reps, "interval_days": interval, "due_date": due}},
    )
    return {"ease": ease, "repetitions": reps, "interval_days": interval, "due_date": due}


# ============ Quiz ============
@api_router.post("/readings/{reading_id}/quiz/generate")
async def generate_quiz(reading_id: str):
    doc = await db.readings.find_one({"id": reading_id, "user_id": DEFAULT_USER})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    text = doc.get("pdf_text") or ""
    if not text:
        raise HTTPException(status_code=400, detail="No text available")

    prompt = (
        "Create a 6-question multiple-choice quiz from this reading. Each question has 4 options and one correct answer index (0-3). "
        "Return ONLY JSON like: {\"questions\": [{\"q\":\"...\", \"options\":[\"a\",\"b\",\"c\",\"d\"], \"answer\": 0, \"explanation\": \"...\"}]}.\n\n"
        f"READING:\n{text[:18000]}"
    )
    raw = await call_claude(
        "You are a quiz author producing rigorous multiple-choice questions as structured JSON.",
        prompt,
        f"quiz-{reading_id}",
    )
    parsed = parse_json_block(raw) or {}
    questions = parsed.get("questions", []) if isinstance(parsed, dict) else []
    quiz = {
        "id": str(uuid.uuid4()),
        "reading_id": reading_id,
        "questions": questions,
        "created_at": now_iso(),
    }
    await db.quizzes.delete_many({"reading_id": reading_id})
    await db.quizzes.insert_one(dict(quiz))
    return quiz


@api_router.get("/readings/{reading_id}/quiz")
async def get_quiz(reading_id: str):
    doc = await db.quizzes.find_one({"reading_id": reading_id}, {"_id": 0})
    return doc or None


# ============ Tags ============
@api_router.patch("/readings/{reading_id}/tags")
async def update_tags(reading_id: str, upd: TagUpdate):
    # Sanitize tags
    clean = []
    for t in upd.tags[:20]:
        if not isinstance(t, dict):
            continue
        name = str(t.get("name", "")).strip()[:40]
        if not name:
            continue
        clean.append({
            "name": name,
            "color": str(t.get("color", "#00E054"))[:20],
            "icon": str(t.get("icon", "Tag"))[:40],
        })
    await db.readings.update_one(
        {"id": reading_id, "user_id": DEFAULT_USER},
        {"$set": {"tags": clean, "updated_at": now_iso()}},
    )
    return {"tags": clean}


# ============ Cover Art Generation ============
@api_router.post("/readings/{reading_id}/cover/generate")
async def generate_cover(reading_id: str):
    doc = await db.readings.find_one({"id": reading_id, "user_id": DEFAULT_USER})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    # Build prompt
    prompt_seed = doc.get("cover_prompt") or f"Book about {doc.get('title', 'a topic')}"
    art_prompt = (
        f"Artistic painted book cover art for a reading titled '{doc.get('title', '')}'. "
        f"Theme: {prompt_seed}. "
        "Style: painterly, evocative, thematic illustration in the vein of Life of Pi, The Old Man and the Sea, "
        "or Penguin Classics covers. Rich color palette, atmospheric. NO TEXT, NO WORDS, NO LETTERS on the image. "
        "Portrait 2:3 aspect ratio. Beautiful and artistic."
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"cover-{reading_id}",
            system_message="You generate artistic book cover imagery.",
        )
        chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
        _, images = await chat.send_message_multimodal_response(UserMessage(text=art_prompt))
        if not images:
            raise HTTPException(status_code=500, detail="No image generated")
        img = images[0]
        image_bytes = base64.b64decode(img["data"])
        mime = img.get("mime_type", "image/png")
        ext = "png" if "png" in mime else "jpg"
        path = f"{APP_NAME}/covers/{DEFAULT_USER}/{reading_id}.{ext}"
        result = put_object(path, image_bytes, mime)
        await db.readings.update_one({"id": reading_id}, {"$set": {"cover_image_path": result["path"], "cover_mime": mime}})
        return {"cover_image_path": result["path"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cover gen failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/readings/{reading_id}/cover")
async def get_cover(reading_id: str):
    doc = await db.readings.find_one({"id": reading_id, "user_id": DEFAULT_USER})
    if not doc or not doc.get("cover_image_path"):
        raise HTTPException(status_code=404, detail="No cover")
    data, ct = get_object(doc["cover_image_path"])
    return Response(content=data, media_type=doc.get("cover_mime") or ct)


# ============ Activity/Stats ============
@api_router.get("/activity")
async def activity():
    total_readings = await db.readings.count_documents({"user_id": DEFAULT_USER})
    total_highlights = await db.highlights.count_documents({})
    today = now_iso()[:10]
    due_count = await db.highlights.count_documents({"due_date": {"$lte": today}})
    recent = await db.readings.find({"user_id": DEFAULT_USER}, {"_id": 0, "pdf_text": 0}).sort("created_at", -1).limit(6).to_list(6)
    return {
        "total_readings": total_readings,
        "total_highlights": total_highlights,
        "due_reviews": due_count,
        "recent": recent,
    }


@api_router.get("/recap/{year}/{month}")
async def monthly_recap(year: int, month: int):
    prefix = f"{year:04d}-{month:02d}"
    readings = await db.readings.find(
        {"user_id": DEFAULT_USER, "read_date": {"$regex": f"^{prefix}"}},
        {"_id": 0, "pdf_text": 0},
    ).to_list(1000)
    reading_ids = [r["id"] for r in readings]
    highlights = await db.highlights.find({"reading_id": {"$in": reading_ids}}, {"_id": 0}).to_list(2000)

    tag_counts = {}
    tag_meta = {}
    for r in readings:
        for t in (r.get("tags") or []):
            key = t.get("name")
            if not key:
                continue
            tag_counts[key] = tag_counts.get(key, 0) + 1
            tag_meta[key] = t
    top_tags = [
        {**tag_meta[name], "count": count}
        for name, count in sorted(tag_counts.items(), key=lambda x: -x[1])[:6]
    ]

    top_readings = sorted(
        [r for r in readings if r.get("rating")],
        key=lambda r: (-(r.get("rating") or 0), r.get("read_date") or ""),
    )[:3]

    # Streak: count unique days read this month
    unique_days = len({r.get("read_date") for r in readings if r.get("read_date")})

    top_highlights = highlights[:3]
    rmap = {r["id"]: r for r in readings}
    for h in top_highlights:
        h["reading_title"] = rmap.get(h["reading_id"], {}).get("title", "")

    return {
        "year": year,
        "month": month,
        "total_readings": len(readings),
        "total_highlights": len(highlights),
        "unique_days": unique_days,
        "top_tags": top_tags,
        "top_readings": top_readings,
        "top_highlights": top_highlights,
        "readings": readings,
    }


@api_router.get("/recap/months")
async def recap_months():
    """List months that have readings."""
    readings = await db.readings.find(
        {"user_id": DEFAULT_USER},
        {"_id": 0, "read_date": 1},
    ).to_list(5000)
    months = sorted({(r.get("read_date") or "")[:7] for r in readings if r.get("read_date")}, reverse=True)
    return [m for m in months if m]


@api_router.get("/")
async def root():
    return {"message": "Readbox API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
