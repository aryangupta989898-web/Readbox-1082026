"""Backend tests for P0 features: status/pages tracking, like toggle, author edit."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://readbox-preview.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# Track created ids for cleanup
_created_ids = []


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    yield s
    # cleanup
    for rid in _created_ids:
        try:
            s.delete(f"{API}/readings/{rid}", timeout=15)
        except Exception:
            pass


# ===== Basic connectivity =====
def test_api_root(session):
    r = session.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "message" in data


# ===== Create reading with status=reading + pages =====
def test_create_reading_currently_reading_with_pages(session):
    """POST /api/readings with form status=reading, total_pages=200, pages_read=45."""
    files = {}
    data = {
        "title": "TEST_CurrentlyReading_Book",
        "author": "TEST_Author_One",
        "status": "reading",
        "total_pages": "200",
        "pages_read": "45",
    }
    r = session.post(f"{API}/readings", data=data, files=files, timeout=30)
    assert r.status_code == 200, f"Got {r.status_code}: {r.text}"
    body = r.json()
    _created_ids.append(body["id"])

    assert body["title"] == "TEST_CurrentlyReading_Book"
    assert body["author"] == "TEST_Author_One"
    assert body["status"] == "reading"
    assert body["total_pages"] == 200
    assert body["pages_read"] == 45
    assert body["liked"] is False

    # Verify persistence via GET
    g = session.get(f"{API}/readings/{body['id']}", timeout=15)
    assert g.status_code == 200
    got = g.json()
    assert got["status"] == "reading"
    assert got["total_pages"] == 200
    assert got["pages_read"] == 45


def test_create_reading_completed_default(session):
    """POST without status should default to completed."""
    r = session.post(
        f"{API}/readings",
        data={"title": "TEST_Completed_Book", "author": "TEST_Author_Two"},
        timeout=30,
    )
    assert r.status_code == 200
    body = r.json()
    _created_ids.append(body["id"])
    assert body["status"] == "completed"
    # pages_read should be null/None for completed with no pages_read provided
    assert body.get("total_pages") is None
    # pages_read should be None for completed (per server logic)
    assert body.get("pages_read") is None
    assert body["liked"] is False


def test_create_reading_status_reading_defaults_pages_read_zero(session):
    """When status=reading and pages_read omitted, server defaults pages_read to 0."""
    r = session.post(
        f"{API}/readings",
        data={"title": "TEST_ReadingNoPages", "status": "reading"},
        timeout=30,
    )
    assert r.status_code == 200
    body = r.json()
    _created_ids.append(body["id"])
    assert body["status"] == "reading"
    assert body["pages_read"] == 0


# ===== PATCH endpoint tests =====
def test_patch_liked_toggle(session):
    """PATCH liked=true then liked=false."""
    r = session.post(f"{API}/readings", data={"title": "TEST_LikeToggle"}, timeout=30)
    assert r.status_code == 200
    rid = r.json()["id"]
    _created_ids.append(rid)

    # like
    p = session.patch(f"{API}/readings/{rid}", json={"liked": True}, timeout=15)
    assert p.status_code == 200
    assert p.json()["liked"] is True

    # verify persisted
    g = session.get(f"{API}/readings/{rid}", timeout=15).json()
    assert g["liked"] is True

    # unlike
    p2 = session.patch(f"{API}/readings/{rid}", json={"liked": False}, timeout=15)
    assert p2.status_code == 200
    assert p2.json()["liked"] is False


def test_patch_author(session):
    r = session.post(f"{API}/readings", data={"title": "TEST_AuthorEdit", "author": "TEST_Old_Author"}, timeout=30)
    rid = r.json()["id"]
    _created_ids.append(rid)

    p = session.patch(f"{API}/readings/{rid}", json={"author": "TEST_New_Author"}, timeout=15)
    assert p.status_code == 200
    assert p.json()["author"] == "TEST_New_Author"

    g = session.get(f"{API}/readings/{rid}", timeout=15).json()
    assert g["author"] == "TEST_New_Author"


def test_patch_status_and_pages(session):
    r = session.post(f"{API}/readings", data={"title": "TEST_StatusPages"}, timeout=30)
    rid = r.json()["id"]
    _created_ids.append(rid)

    # move to reading with pages
    p = session.patch(
        f"{API}/readings/{rid}",
        json={"status": "reading", "total_pages": 300, "pages_read": 100},
        timeout=15,
    )
    assert p.status_code == 200
    body = p.json()
    assert body["status"] == "reading"
    assert body["total_pages"] == 300
    assert body["pages_read"] == 100

    # verify
    g = session.get(f"{API}/readings/{rid}", timeout=15).json()
    assert g["status"] == "reading"
    assert g["total_pages"] == 300
    assert g["pages_read"] == 100

    # mark completed
    p2 = session.patch(f"{API}/readings/{rid}", json={"status": "completed"}, timeout=15)
    assert p2.status_code == 200
    assert p2.json()["status"] == "completed"


# ===== GET /api/readings returns new fields =====
def test_list_readings_includes_new_fields(session):
    r = session.get(f"{API}/readings", timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    # Every item should have the keys (even if null)
    for it in items:
        assert "status" in it
        assert "total_pages" in it
        assert "pages_read" in it
        assert "liked" in it


def test_patch_nonexistent_returns_404(session):
    p = session.patch(f"{API}/readings/does-not-exist-xyz", json={"liked": True}, timeout=15)
    assert p.status_code == 404
