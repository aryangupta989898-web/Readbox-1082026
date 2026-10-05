"""Offline unit tests for link import + book search helpers (no network, no Mongo)."""
import pytest

import importers


ARTICLE_HTML = """
<html><head>
<title>The Quiet Art of Reading Slowly</title>
<meta name="author" content="Jane Doe">
<meta property="og:site_name" content="Example Review">
</head><body>
<nav>Home | About | Subscribe</nav>
<article>
<h1>The Quiet Art of Reading Slowly</h1>
""" + "".join(
    f"<p>Paragraph {i}: slow reading lets ideas settle, and the reader notices structure, argument and tone that a skim would miss entirely.</p>"
    for i in range(8)
) + """
</article>
<footer>Copyright 2026 Example Review. All rights reserved.</footer>
</body></html>
"""


def test_extract_article_pulls_text_and_metadata():
    out = importers.extract_article(ARTICLE_HTML, "https://www.example.com/slow-reading")
    assert out["title"] == "The Quiet Art of Reading Slowly"
    assert out["author"] == "Jane Doe"
    assert out["site_name"] == "Example Review"
    assert "slow reading lets ideas settle" in out["text"]
    assert "Subscribe" not in out["text"]
    assert importers.word_count(out["text"]) > 100


@pytest.mark.parametrize("url", [
    "http://localhost/admin",
    "http://127.0.0.1:8001/api",
    "http://10.0.0.5/",
    "http://169.254.169.254/latest/meta-data",
    "file:///etc/passwd",
    "ftp://example.com/x",
])
def test_private_and_non_http_urls_are_blocked(url):
    with pytest.raises(importers.ImportFailed):
        importers.fetch_url(url)


def test_normalize_url_adds_scheme():
    assert importers.normalize_url(" example.com/a ") == "https://example.com/a"
    assert importers.normalize_url("http://x.org") == "http://x.org"


def test_is_pdf_by_magic_bytes():
    assert importers.is_pdf(b"%PDF-1.7 ...", "application/octet-stream")
    assert not importers.is_pdf(b"<html>", "text/html")


def test_clean_description_strips_html_and_open_library_boilerplate():
    gb = "<p><b>New York Times Bestseller</b></p><p>Destined to become a modern classic &amp; more.</p>"
    assert importers.clean_description(gb) == "New York Times Bestseller\nDestined to become a modern classic & more."

    ol = {
        "type": "/type/text",
        "value": "A **brief** history of [humankind](https://x.org).([source][1])\n\n----------\nAlso contained in:\n - [Other](https://y)\n\n  [1]: https://src",
    }
    assert importers.clean_description(ol) == "A brief history of humankind."


def test_blurb_is_short_and_sentence_aligned():
    desc = (
        "One hundred thousand years ago, at least six species of human inhabited the earth. "
        "Today there is just one. Us. Homo sapiens. How did our species succeed in the battle for dominance? "
        "Why did our foraging ancestors come together to create cities and kingdoms? " * 3
    )
    blurb = importers.make_blurb(desc)
    assert 40 < len(blurb) <= 321
    assert blurb.startswith("One hundred thousand years ago")
    assert blurb.endswith((".", "?", "!", "…"))
    assert importers.make_blurb("") == ""


GOOGLE_ITEM = {
    "id": "FmyBAwAAQBAJ",
    "volumeInfo": {
        "title": "Sapiens",
        "subtitle": "A Brief History of Humankind",
        "authors": ["Yuval Noah Harari"],
        "publishedDate": "2014-09-04",
        "pageCount": 466,
        "categories": ["History"],
        "description": "<p>From a renowned historian comes a groundbreaking narrative of humanity. It is bold.</p>",
        "imageLinks": {"thumbnail": "http://books.google.com/books/content?id=FmyBAwAAQBAJ&printsec=frontcover&img=1&zoom=5&edge=curl"},
    },
}


def test_google_volume_is_normalized():
    b = importers._from_google(GOOGLE_ITEM)
    assert b["id"] == "gb:FmyBAwAAQBAJ"
    assert b["title"] == "Sapiens: A Brief History of Humankind"
    assert b["authors"] == ["Yuval Noah Harari"]
    assert b["year"] == 2014 and b["page_count"] == 466
    assert b["cover_url"].startswith("https://") and "edge=curl" not in b["cover_url"] and "zoom=1" in b["cover_url"]
    assert b["description"].startswith("From a renowned historian")


def test_search_falls_back_to_open_library(monkeypatch):
    def boom(q, limit):
        raise RuntimeError("quota exceeded")

    def ol(q, limit):
        return [importers._from_open_library_doc({
            "key": "/works/OL17075811W", "title": "How to Lie with Statistics",
            "author_name": ["Darrell Huff"], "first_publish_year": 1954, "cover_i": 123,
        })]

    monkeypatch.setattr(importers, "search_google_books", boom)
    monkeypatch.setattr(importers, "search_open_library", ol)
    results = importers.search_books("how to lie with statistics")
    assert results[0]["id"] == "ol:OL17075811W"
    assert results[0]["cover_url"] == "https://covers.openlibrary.org/b/id/123-L.jpg"


def test_search_dedupes_editions(monkeypatch):
    item2 = {**GOOGLE_ITEM, "id": "other", "volumeInfo": {**GOOGLE_ITEM["volumeInfo"], "subtitle": "Illustrated"}}
    monkeypatch.setattr(importers, "search_google_books", lambda q, l: [importers._from_google(GOOGLE_ITEM), importers._from_google(item2)])
    assert len(importers.search_books("sapiens")) == 1


def test_search_raises_when_all_catalogs_fail(monkeypatch):
    def boom(q, limit):
        raise RuntimeError("down")
    monkeypatch.setattr(importers, "search_google_books", boom)
    monkeypatch.setattr(importers, "search_open_library", boom)
    with pytest.raises(importers.ImportFailed):
        importers.search_books("anything")


def test_get_book_rejects_bad_ids():
    for bad in ["", "gb:", "xx:abc", "gb:../../etc", "ol:a b"]:
        with pytest.raises(importers.ImportFailed):
            importers.get_book(bad)
