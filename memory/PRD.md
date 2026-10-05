# Readbox — Letterboxd for Reading

## Product
A web app to log reading resources (PDFs, articles, books) with AI-extracted synopsis, topic checklists, essay-style notes, spaced-repetition of highlights, and a Letterboxd-inspired dark, cinematic UI.

## Implemented
- Reading logging with PDF upload + AI synopsis/author/title/cover_prompt (single Claude call)
- Diary ledger view + Readings grid view (Letterboxd-style)
- Reading detail with 5 tabs: Synopsis, Topics Checklist, AI Notes (essay-style), My Highlights, Quiz
- Manual highlights + SM-2 spaced repetition (flashcard flip via framer-motion)
- AI-generated artistic cover art (Gemini Nano Banana / DALL·E 3)
- Tags (23 icons + 12 colors popover picker)
- Search + tag filter on Diary and Readings grid
- Monthly Recap page /recap/:year/:month with animated reveals, standouts, mosaic, share
- **[Feb 2026] Currently Reading vs Completed tracker** — status, total_pages, pages_read. LogDialog toggle, Home "Continue Reading" strip, /readings section with progress ring, ReadingDetail status pill with inline page inputs (auto-completes at 100%).
- **[Feb 2026] Like toggle** — pink (#FF2A79) heart. Optimistic on /diary, /readings, ReadingDetail; new /likes route with unlike overlay.
- **[Feb 2026] Clickable & Editable Author** — /author/:name filtered view with stats; inline pencil-edit on Detail.
- **[Feb 2026] Select All / Deselect All** on AI checklist.
- **[Feb 2026] Backend response normalization** — legacy readings return new schema fields.
- **[Feb 2026] Lists (P1)** — Dune-style pastel cards with 4-cover mosaic previews. Create/edit/delete lists, add/remove readings. `AddToListButton` popover on ReadingDetail with quick-create. 8-color palette shared backend↔frontend.
- **[Feb 2026] Wishlist (P1)** — Manual or PDF-attached items. Notes field. `Start Reading` promotes wishlist → Currently Reading (copies PDF, extracts text, deletes original wishlist doc). PDF copy failure fails safe (clears storage_path so reading doesn't dangle).
- **[Oct 2026] Log from Link** — "From Link" mode in Log dialog. `POST /api/import/url` fetches + extracts (trafilatura; PDFs via pypdf) for preview with word count and paywall/JS warnings; `POST /readings` accepts `source_url` (+ optional previewed `text_content`, `site_name`). SSRF-guarded (public IPs only, redirects re-checked, 25 MB cap). Paywalled/login pages still need the extension.
- **[Oct 2026] Universal book search** — `GET /api/books/search?q=` (Google Books, Open Library fallback; optional `GOOGLE_BOOKS_API_KEY`), `GET /api/books/{gb:…|ol:…}` cached 30 days in `book_cache`. Header search → `/search` (your library + catalog) → `/book/:bookId` preview page with Log it / Start reading / Want to read (wishlist) — browse without logging. "Find Book" mode in Log dialog. Readings/wishlist store `book_id`, `cover_url`, `book_description`, `book_blurb`; descriptions are cleaned and capped to a 2–3 sentence blurb so every book card has the same shape.

## Backlog

### P1 (still open)
- Export notes/highlights to markdown
- In-app PDF viewer

### P2
- AI-normalized book blurbs (one call per book, cached globally in `book_cache`) once LLM budget is back
- 100-cover canon uploader (admin UI + `/api/canon/daily` endpoint to rotate favorite covers on the homepage)
- Migrate cover gen to fal.ai FLUX Pro 1.1 (needs fal.ai key)
- Multi-user auth
- "Readbox Wrapped" — yearly recap page (top 5 covers, most-highlighted lines, longest streak, share)

## Known Blockers
- **Universal LLM Key budget exhausted** → AI endpoints (`/checklist/generate`, `/notes/generate`, `/quiz/generate`, `/cover/generate`, `/highlights/suggest`) return 500. Not a code bug. User is resolving with support@emergent.sh. Instructions displayed to user this session.

## Refactor Notes
- `server.py` (~1030 lines) getting large. Consider splitting into `routes/readings.py`, `routes/lists.py`, `routes/wishlist.py`, `routes/ai.py`.
- `ActivityPage.jsx` growing; could extract Timeline/Carousel/ContinueReading into `/src/components/home/`.

## Test Suite
- `/app/backend/tests/test_p0_features.py` — P0 regression (Currently Reading, Likes, Author, Select All).
- `/app/backend/tests/test_lists_wishlist.py` — P1 Lists + Wishlist CRUD + conversion.
- `/app/backend/tests/test_importers.py` — offline unit tests for link extraction, SSRF guard, description cleanup, catalog parsing/fallback.
