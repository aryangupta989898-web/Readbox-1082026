"""Backend tests for Lists & Wishlist P1 features."""
import io
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

# Track created ids for cleanup
_created_readings = []
_created_lists = []
_created_wishlist = []


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    yield s
    # Cleanup
    for lid in list(_created_lists):
        try:
            s.delete(f"{API}/lists/{lid}", timeout=15)
        except Exception:
            pass
    for wid in list(_created_wishlist):
        try:
            s.delete(f"{API}/wishlist/{wid}", timeout=15)
        except Exception:
            pass
    for rid in list(_created_readings):
        try:
            s.delete(f"{API}/readings/{rid}", timeout=15)
        except Exception:
            pass


@pytest.fixture(scope="module")
def sample_readings(session):
    """Create 2 sample readings to use for list/wishlist tests."""
    ids = []
    for t in ["TEST_ListReading_A", "TEST_ListReading_B"]:
        r = session.post(f"{API}/readings", data={"title": t, "author": "TEST_ListsAuthor"}, timeout=30)
        assert r.status_code == 200, r.text
        rid = r.json()["id"]
        _created_readings.append(rid)
        ids.append(rid)
    return ids


# ============ LISTS ============
class TestLists:
    def test_create_list(self, session):
        payload = {"title": "TEST_MyList", "description": "A test list", "cover_color": "#D9C7A0"}
        r = session.post(f"{API}/lists", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        _created_lists.append(body["id"])
        assert "id" in body
        assert body["title"] == "TEST_MyList"
        assert body["description"] == "A test list"
        assert body["cover_color"] == "#D9C7A0"
        assert body["reading_ids"] == []
        assert "created_at" in body

    def test_create_list_default_color(self, session):
        r = session.post(f"{API}/lists", json={"title": "TEST_ListAutoColor"}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        _created_lists.append(body["id"])
        # Cover color should default to one of LIST_PALETTE colors
        palette = ["#D9C7A0", "#C9B8E6", "#A8C5B5", "#E8B4A0", "#B5C7DE", "#E6C9A0", "#C7DEBB", "#DEB5C0"]
        assert body["cover_color"] in palette

    def test_get_lists_has_preview_and_count(self, session, sample_readings):
        # Create list with readings
        r = session.post(f"{API}/lists", json={"title": "TEST_ListWithReadings", "reading_ids": sample_readings}, timeout=15)
        assert r.status_code == 200
        lid = r.json()["id"]
        _created_lists.append(lid)

        # Fetch all lists
        g = session.get(f"{API}/lists", timeout=15)
        assert g.status_code == 200
        lists = g.json()
        assert isinstance(lists, list)
        found = next((l for l in lists if l["id"] == lid), None)
        assert found is not None
        assert "preview" in found
        assert "count" in found
        assert found["count"] == len(sample_readings)
        assert len(found["preview"]) == min(4, len(sample_readings))
        # Preview items should be reading objects with basic fields
        for p in found["preview"]:
            assert "id" in p and "title" in p

    def test_get_list_detail_hydrated_and_ordered(self, session, sample_readings):
        r = session.post(f"{API}/lists", json={"title": "TEST_DetailList", "reading_ids": sample_readings}, timeout=15)
        lid = r.json()["id"]
        _created_lists.append(lid)

        g = session.get(f"{API}/lists/{lid}", timeout=15)
        assert g.status_code == 200
        doc = g.json()
        assert "readings" in doc
        assert len(doc["readings"]) == len(sample_readings)
        # Order preserved
        assert [x["id"] for x in doc["readings"]] == sample_readings

    def test_patch_list(self, session):
        r = session.post(f"{API}/lists", json={"title": "TEST_ToPatch"}, timeout=15)
        lid = r.json()["id"]
        _created_lists.append(lid)

        p = session.patch(f"{API}/lists/{lid}", json={"title": "TEST_Patched", "description": "new", "cover_color": "#C9B8E6"}, timeout=15)
        assert p.status_code == 200
        updated = p.json()
        assert updated["title"] == "TEST_Patched"
        assert updated["description"] == "new"
        assert updated["cover_color"] == "#C9B8E6"

        # Verify persistence
        g = session.get(f"{API}/lists/{lid}", timeout=15).json()
        assert g["title"] == "TEST_Patched"

    def test_add_reading_idempotent(self, session, sample_readings):
        r = session.post(f"{API}/lists", json={"title": "TEST_AddReadingList"}, timeout=15)
        lid = r.json()["id"]
        _created_lists.append(lid)

        rid = sample_readings[0]
        # Add first time
        a1 = session.post(f"{API}/lists/{lid}/readings", json={"reading_id": rid}, timeout=15)
        assert a1.status_code == 200
        # Add same reading again (should be idempotent)
        a2 = session.post(f"{API}/lists/{lid}/readings", json={"reading_id": rid}, timeout=15)
        assert a2.status_code == 200

        detail = session.get(f"{API}/lists/{lid}", timeout=15).json()
        assert detail["reading_ids"].count(rid) == 1

    def test_remove_reading_from_list(self, session, sample_readings):
        r = session.post(f"{API}/lists", json={"title": "TEST_RemoveReadingList", "reading_ids": sample_readings}, timeout=15)
        lid = r.json()["id"]
        _created_lists.append(lid)

        rid = sample_readings[0]
        d = session.delete(f"{API}/lists/{lid}/readings/{rid}", timeout=15)
        assert d.status_code == 200
        detail = session.get(f"{API}/lists/{lid}", timeout=15).json()
        assert rid not in detail["reading_ids"]

    def test_delete_list(self, session):
        r = session.post(f"{API}/lists", json={"title": "TEST_ToDelete"}, timeout=15)
        lid = r.json()["id"]

        d = session.delete(f"{API}/lists/{lid}", timeout=15)
        assert d.status_code == 200

        g = session.get(f"{API}/lists/{lid}", timeout=15)
        assert g.status_code == 404

    def test_get_nonexistent_list(self, session):
        g = session.get(f"{API}/lists/nonexistent-xyz", timeout=15)
        assert g.status_code == 404


# ============ WISHLIST ============
class TestWishlist:
    def test_create_wishlist_no_file(self, session):
        r = session.post(
            f"{API}/wishlist",
            data={"title": "TEST_WishItem_NoPDF", "author": "TEST_WA", "notes": "read later"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        _created_wishlist.append(body["id"])
        assert body["title"] == "TEST_WishItem_NoPDF"
        assert body["author"] == "TEST_WA"
        assert body["notes"] == "read later"
        assert body["storage_path"] is None
        assert "cover_color" in body
        assert "created_at" in body

    def test_create_wishlist_title_only(self, session):
        r = session.post(f"{API}/wishlist", data={"title": "TEST_TitleOnly"}, timeout=30)
        assert r.status_code == 200
        body = r.json()
        _created_wishlist.append(body["id"])
        assert body["title"] == "TEST_TitleOnly"
        assert body["author"] == ""
        assert body["notes"] == ""

    def test_get_wishlist_sorted_newest_first(self, session):
        g = session.get(f"{API}/wishlist", timeout=15)
        assert g.status_code == 200
        items = g.json()
        assert isinstance(items, list)
        # Verify our TEST_ items present
        titles = [i["title"] for i in items]
        assert "TEST_WishItem_NoPDF" in titles
        # Check sort desc by created_at
        created_dates = [i["created_at"] for i in items if i.get("created_at")]
        assert created_dates == sorted(created_dates, reverse=True)

    def test_patch_wishlist(self, session):
        r = session.post(f"{API}/wishlist", data={"title": "TEST_WishPatch"}, timeout=30)
        wid = r.json()["id"]
        _created_wishlist.append(wid)

        p = session.patch(f"{API}/wishlist/{wid}", json={"title": "TEST_WishPatched", "author": "NewAuthor", "notes": "n"}, timeout=15)
        assert p.status_code == 200
        upd = p.json()
        assert upd["title"] == "TEST_WishPatched"
        assert upd["author"] == "NewAuthor"
        assert upd["notes"] == "n"

    def test_delete_wishlist(self, session):
        r = session.post(f"{API}/wishlist", data={"title": "TEST_WishDelete"}, timeout=30)
        wid = r.json()["id"]

        d = session.delete(f"{API}/wishlist/{wid}", timeout=15)
        assert d.status_code == 200

        # Verify gone
        items = session.get(f"{API}/wishlist", timeout=15).json()
        assert not any(i["id"] == wid for i in items)

    def test_convert_wishlist_to_reading(self, session):
        # Create wishlist item
        r = session.post(f"{API}/wishlist", data={"title": "TEST_ConvertMe", "author": "TEST_ConvertA", "notes": "test"}, timeout=30)
        wid = r.json()["id"]

        # Convert
        c = session.post(f"{API}/wishlist/{wid}/convert?status=reading", timeout=30)
        assert c.status_code == 200, c.text
        reading = c.json()
        _created_readings.append(reading["id"])

        assert reading["title"] == "TEST_ConvertMe"
        assert reading["author"] == "TEST_ConvertA"
        assert reading["status"] == "reading"
        assert "id" in reading

        # Verify wishlist item is gone
        items = session.get(f"{API}/wishlist", timeout=15).json()
        assert not any(i["id"] == wid for i in items)

        # Verify reading exists
        g = session.get(f"{API}/readings/{reading['id']}", timeout=15)
        assert g.status_code == 200
        assert g.json()["status"] == "reading"

    def test_convert_nonexistent_wishlist(self, session):
        c = session.post(f"{API}/wishlist/nonexistent-abc/convert?status=reading", timeout=15)
        assert c.status_code == 404
