# Readbox — Letterboxd for Reading

## Problem Statement
User wants a Letterboxd-inspired app for tracking their reading (PDFs, articles) with AI-powered synopses, an AI topic checklist that generates summary notes for chosen topics, user-entered highlights for spaced repetition (SM-2), and AI-generated quizzes per reading. Diary view mimics Letterboxd's ledger row layout; Readings view is a dense 2:3 cover grid.

## Architecture
- Backend: FastAPI (single-user, no auth), MongoDB, Emergent Object Storage for PDFs, Claude Sonnet 4.6 via emergentintegrations
- Frontend: React 19 + Tailwind + shadcn/ui + framer-motion + @phosphor-icons/react
- Design: Dark Letterboxd palette (#14181C base, #00E054 stars, #FF8000 hearts)

## Implemented (2026-02-07)
- Reading logging with PDF upload, auto-date, AI synopsis on upload
- Diary ledger view (month tags, day, cover, rating, like, review, PDF icons)
- Readings grid (2:3 covers with rating stars)
- Reading detail: hero + tabs (Synopsis / Checklist / Notes / Highlights / Quiz)
- AI topic checklist generation → user checks → AI notes generation
- Manual highlights CRUD with SM-2 spaced repetition state
- Revision view: due-highlights flashcards (framer-motion flip) + quizzes list
- AI quiz generation with grading
- Activity dashboard with stats

## Backlog
- P1: Search/filter on diary + readings
- P1: Reading-level tags & lists (Letterboxd-style "lists")
- P2: Export notes/highlights to markdown
- P2: Multi-user auth
- P2: Per-highlight page reference & PDF viewer inline

## Credentials
Single-user mode (no auth). All data belongs to `default_user`.
