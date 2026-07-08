# Readbox — Letterboxd for Reading

## Product
A web app to log reading resources (PDFs, articles, books) with AI-extracted synopsis, topic checklists, essay-style notes, spaced-repetition of highlights, and a Letterboxd-inspired dark, cinematic UI.

## Implemented
- Reading logging with PDF upload + AI synopsis/author/title/cover_prompt (single Claude call)
- Diary ledger view + Readings grid view (Letterboxd-style)
- Reading detail with 5 tabs: Synopsis, Topics Checklist, AI Notes (essay-style), My Highlights, Quiz
- Manual highlights + SM-2 spaced repetition (flashcard flip via framer-motion)
- AI-generated artistic cover art (Gemini Nano Banana / DALL·E 3, painterly no-text)
- Tags feature: 23 icons + 12 colors, popover picker
- Search + tag filter on Diary and Readings grid (animated layout)
- Monthly Recap page /recap/:year/:month with animated stat reveals, gradient orbs, standouts, top tags, mosaic, share buttons
- Clickable month tags in Diary → navigate to that month's Recap
- **[Feb 2026] Currently Reading vs Completed tracker** — `status`, `total_pages`, `pages_read` fields. LogReadingDialog toggle, Home "Continue Reading" strip with progress bar, /readings Currently Reading section with progress ring overlay, ReadingDetail status pill with inline page inputs (auto-completes when pages_read >= total_pages).
- **[Feb 2026] Like toggle** — independent from rating (pink #FF2A79 heart). Optimistic toggle on /diary, /readings, ReadingDetail; new `/likes` route with unlike overlay.
- **[Feb 2026] Clickable & Editable Author** — clickable on /diary and ReadingDetail → `/author/:name` filtered view with stats (Readings/Avg/Liked). Inline pencil edit on ReadingDetail.
- **[Feb 2026] Select All / Deselect All** button on AI checklist.
- **[Feb 2026] Backend response normalization** — legacy readings always return the new schema fields.

## Backlog

### P1
- Lists functionality (create custom lists, import completed readings, style as pastel Dune-style cards)
- Wishlist feature (upload PDF or manually enter name/author to read later)
- Export notes/highlights to markdown
- In-app PDF viewer

### P2
- 100-cover canon uploader (admin UI + `/api/canon/daily` endpoint to rotate favorite covers on the homepage)
- Migrate cover gen to fal.ai FLUX Pro 1.1 (needs fal.ai key)
- Multi-user auth

## Known Blockers
- **Universal LLM Key budget exhausted** → AI endpoints (`/checklist/generate`, `/notes/generate`, `/quiz/generate`, `/cover/generate`, `/highlights/suggest`) return 500. Not a code bug. User is resolving with Emergent support.

## Refactor Notes
- `server.py` (~800 lines) and `ActivityPage.jsx` (~250 lines) growing large. Consider splitting into routers / smaller components when adding lists + wishlist.
