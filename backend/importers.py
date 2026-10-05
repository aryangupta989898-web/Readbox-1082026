"""Import helpers: fetch an article/PDF from a link, and search public book catalogs.

Kept free of FastAPI/Mongo so it can be unit-tested in isolation.
"""
import html as html_lib
import ipaddress
import os
import re
import socket
from typing import Optional
from urllib.parse import urlparse, urljoin

import requests
import trafilatura

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 Readbox/1.0"
)
MAX_FETCH_BYTES = 25 * 1024 * 1024  # 25 MB
MAX_REDIRECTS = 5
FETCH_TIMEOUT = 20

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
OPEN_LIBRARY_URL = "https://openlibrary.org"
BOOK_TIMEOUT = 10


class ImportFailed(Exception):
    """User-facing import failure (message is safe to show)."""


# ============ URL fetching ============
def _assert_public_host(url: str) -> None:
    """Block requests to localhost / private networks (SSRF protection)."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ImportFailed("Only http(s) links are supported")
    try:
        infos = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
    except socket.gaierror:
        raise ImportFailed("Couldn't resolve that website")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0].split("%")[0])
        if not ip.is_global:
            raise ImportFailed("That address isn't allowed")


def normalize_url(url: str) -> str:
    url = (url or "").strip()
    if url and not re.match(r"^https?://", url, re.I):
        url = "https://" + url
    return url


def fetch_url(url: str) -> tuple[bytes, str, str]:
    """Return (body, content_type, final_url). Follows redirects, re-checking each hop."""
    current = normalize_url(url)
    for _ in range(MAX_REDIRECTS + 1):
        _assert_public_host(current)
        try:
            resp = requests.get(
                current,
                headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8"},
                timeout=FETCH_TIMEOUT,
                allow_redirects=False,
                stream=True,
            )
        except requests.RequestException:
            raise ImportFailed("Couldn't reach that link")
        if resp.is_redirect or resp.status_code in (301, 302, 303, 307, 308):
            location = resp.headers.get("Location")
            resp.close()
            if not location:
                raise ImportFailed("Broken redirect")
            current = urljoin(current, location)
            continue
        if resp.status_code in (401, 402, 403):
            raise ImportFailed("That site blocked the download (login, paywall or bot protection). Try the Chrome extension or paste the text.")
        if resp.status_code >= 400:
            raise ImportFailed(f"The site returned an error ({resp.status_code})")
        chunks, total = [], 0
        for chunk in resp.iter_content(64 * 1024):
            total += len(chunk)
            if total > MAX_FETCH_BYTES:
                resp.close()
                raise ImportFailed("That file is too large (over 25 MB)")
            chunks.append(chunk)
        content_type = (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        return b"".join(chunks), content_type, current
    raise ImportFailed("Too many redirects")


def is_pdf(body: bytes, content_type: str) -> bool:
    return content_type == "application/pdf" or body[:5] == b"%PDF-"


def extract_article(html: str, url: str) -> dict:
    """Pull main text + metadata from an HTML page."""
    text = trafilatura.extract(
        html, url=url, include_comments=False, include_tables=False, favor_precision=True
    ) or ""
    meta = trafilatura.extract_metadata(html, default_url=url)
    title = (meta.title if meta else "") or ""
    author = (meta.author if meta else "") or ""
    site_name = (meta.sitename if meta else "") or (urlparse(url).hostname or "").removeprefix("www.")
    return {
        "title": title.strip()[:250],
        "author": author.strip()[:120],
        "site_name": site_name.strip()[:120],
        "text": text.strip(),
    }


def word_count(text: str) -> int:
    return len((text or "").split())


# ============ Book search ============
_SENTENCE_END = re.compile(r"(?<=[.!?])\s+(?=[A-Z\"“])")


def clean_description(raw: Optional[str]) -> str:
    """Normalize catalog descriptions (HTML from Google Books, markdown from Open Library)."""
    if not raw:
        return ""
    if isinstance(raw, dict):  # Open Library sometimes returns {"type":..., "value":...}
        raw = raw.get("value") or ""
    text = str(raw)
    text = re.sub(r"<\s*br\s*/?>|</p>|</li>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = html_lib.unescape(text)
    # Open Library boilerplate: "----------\nAlso contained in: ..." / "([source][1])" / link refs
    text = re.split(r"\n\s*-{3,}\s*\n|\n\s*\*\*?(Also contained in|Contains)\b", text)[0]
    text = re.sub(r"\(\[(source|Source)\]\[\d+\]\)", "", text)
    text = re.sub(r"^\s*\[\d+\]:\s*\S+\s*$", "", text, flags=re.M)
    text = re.sub(r"\[([^\]]+)\]\((?:[^)]+)\)", r"\1", text)  # markdown links → label
    text = re.sub(r"\[([^\]]+)\]\[\d+\]", r"\1", text)
    text = re.sub(r"[*_]{1,3}([^*_]+)[*_]{1,3}", r"\1", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def make_blurb(description: str, max_chars: int = 320) -> str:
    """First 2–3 sentences, so every book card has the same shape regardless of source."""
    if not description:
        return ""
    first_para = description.split("\n\n")[0].replace("\n", " ").strip()
    out = ""
    for sentence in _SENTENCE_END.split(first_para):
        if out and len(out) + len(sentence) + 1 > max_chars:
            break
        out = f"{out} {sentence}".strip()
        if len(out) >= max_chars * 0.6 and out.count(".") >= 2:
            break
    if len(out) > max_chars:
        out = out[: max_chars].rsplit(" ", 1)[0].rstrip(",;:") + "…"
    return out


def _year(date_str) -> Optional[int]:
    m = re.search(r"\d{4}", str(date_str or ""))
    return int(m.group(0)) if m else None


def _https(url: Optional[str]) -> str:
    return (url or "").replace("http://", "https://", 1)


def _gb_cover(volume_id: str, links: dict) -> str:
    if not links:
        return ""
    # Request a larger rendition than the default thumbnail when available
    url = links.get("large") or links.get("medium") or links.get("thumbnail") or links.get("smallThumbnail") or ""
    url = _https(url).replace("&edge=curl", "")
    return re.sub(r"zoom=\d", "zoom=1", url)


def _from_google(item: dict) -> dict:
    info = item.get("volumeInfo") or {}
    description = clean_description(info.get("description"))
    return {
        "id": f"gb:{item.get('id')}",
        "source": "Google Books",
        "title": (info.get("title") or "").strip() + (f": {info['subtitle']}" if info.get("subtitle") else ""),
        "authors": info.get("authors") or [],
        "year": _year(info.get("publishedDate")),
        "page_count": info.get("pageCount") or None,
        "cover_url": _gb_cover(item.get("id"), info.get("imageLinks") or {}),
        "subjects": (info.get("categories") or [])[:6],
        "publisher": info.get("publisher") or "",
        "isbn": next((i["identifier"] for i in info.get("industryIdentifiers") or [] if i.get("type") == "ISBN_13"), ""),
        "description": description,
        "blurb": make_blurb(description),
        "info_url": info.get("infoLink") or "",
    }


def _from_open_library_doc(doc: dict) -> dict:
    cover_id = doc.get("cover_i")
    return {
        "id": f"ol:{(doc.get('key') or '').rsplit('/', 1)[-1]}",
        "source": "Open Library",
        "title": doc.get("title") or "",
        "authors": doc.get("author_name") or [],
        "year": doc.get("first_publish_year"),
        "page_count": doc.get("number_of_pages_median"),
        "cover_url": f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else "",
        "subjects": (doc.get("subject") or [])[:6],
        "publisher": "",
        "isbn": "",
        "description": "",
        "blurb": "",
        "info_url": f"{OPEN_LIBRARY_URL}{doc.get('key')}" if doc.get("key") else "",
    }


def _google_params(extra: dict) -> dict:
    key = os.environ.get("GOOGLE_BOOKS_API_KEY")
    return {**extra, **({"key": key} if key else {})}


def search_google_books(query: str, limit: int = 12) -> list[dict]:
    resp = requests.get(
        GOOGLE_BOOKS_URL,
        params=_google_params({"q": query, "maxResults": limit, "printType": "books", "orderBy": "relevance"}),
        timeout=BOOK_TIMEOUT,
    )
    resp.raise_for_status()
    return [_from_google(i) for i in resp.json().get("items") or []]


def search_open_library(query: str, limit: int = 12) -> list[dict]:
    resp = requests.get(
        f"{OPEN_LIBRARY_URL}/search.json",
        params={
            "q": query,
            "limit": limit,
            "fields": "key,title,author_name,first_publish_year,cover_i,number_of_pages_median,subject",
        },
        headers={"User-Agent": USER_AGENT},
        timeout=BOOK_TIMEOUT,
    )
    resp.raise_for_status()
    return [_from_open_library_doc(d) for d in resp.json().get("docs") or []]


def _dedupe(results: list[dict]) -> list[dict]:
    seen, out = set(), []
    for r in results:
        key = (re.sub(r"\W+", "", r["title"].split(":")[0].lower()), (r["authors"] or [""])[0].lower())
        if key in seen or not r["title"]:
            continue
        seen.add(key)
        out.append(r)
    return out


def search_books(query: str, limit: int = 12) -> list[dict]:
    """Google Books first (better descriptions + covers), Open Library as a fallback."""
    query = (query or "").strip()
    if not query:
        return []
    errors = []
    for searcher in (search_google_books, search_open_library):
        try:
            results = _dedupe(searcher(query, limit))
            if results:
                return results[:limit]
        except Exception as e:  # noqa: BLE001 — try the next catalog
            errors.append(e)
    if errors and len(errors) == 2:
        raise ImportFailed("Book search is unavailable right now")
    return []


def get_book(book_id: str) -> dict:
    """Full details for one catalog id ("gb:<volumeId>" or "ol:<OL…W>")."""
    source, _, raw_id = (book_id or "").partition(":")
    if not raw_id or not re.fullmatch(r"[A-Za-z0-9_-]{2,40}", raw_id):
        raise ImportFailed("Unknown book")
    if source == "gb":
        resp = requests.get(f"{GOOGLE_BOOKS_URL}/{raw_id}", params=_google_params({}), timeout=BOOK_TIMEOUT)
        if resp.status_code == 404:
            raise ImportFailed("Book not found")
        resp.raise_for_status()
        return _from_google(resp.json())
    if source == "ol":
        resp = requests.get(f"{OPEN_LIBRARY_URL}/works/{raw_id}.json", headers={"User-Agent": USER_AGENT}, timeout=BOOK_TIMEOUT)
        if resp.status_code == 404:
            raise ImportFailed("Book not found")
        resp.raise_for_status()
        work = resp.json()
        authors = []
        for a in (work.get("authors") or [])[:3]:
            key = (a.get("author") or {}).get("key")
            if not key:
                continue
            try:
                ar = requests.get(f"{OPEN_LIBRARY_URL}{key}.json", headers={"User-Agent": USER_AGENT}, timeout=BOOK_TIMEOUT)
                if ar.ok and ar.json().get("name"):
                    authors.append(ar.json()["name"])
            except requests.RequestException:
                pass
        covers = [c for c in work.get("covers") or [] if isinstance(c, int) and c > 0]
        description = clean_description(work.get("description"))
        return {
            "id": book_id,
            "source": "Open Library",
            "title": work.get("title") or "",
            "authors": authors,
            "year": _year(work.get("first_publish_date")),
            "page_count": None,
            "cover_url": f"https://covers.openlibrary.org/b/id/{covers[0]}-L.jpg" if covers else "",
            "subjects": (work.get("subjects") or [])[:6],
            "publisher": "",
            "isbn": "",
            "description": description,
            "blurb": make_blurb(description),
            "info_url": f"{OPEN_LIBRARY_URL}/works/{raw_id}",
        }
    raise ImportFailed("Unknown book")
