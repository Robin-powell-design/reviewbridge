# ReviewBridge — Progress Notes

## Where we are
- **Standalone HTML prototype** — fully functional locally
- **Committed:** `b6af82c` on `master` branch
- **Location:** `/Users/robinpowell/Desktop/AI. workflow/reviewbridge/`

## What works
- Create reviews (title, context, Figma/prototype URL, Loom, structured questions)
- Reviewer view with Figma iframe embed
- Vibe check slider (😐 Meh → 😍 Love it)
- Structured feedback questions (text, rating, yes/no)
- Pin mode (lilac off / orange on) for commenting on specific areas
- AI Design Review scores (visual hierarchy, accessibility, consistency, usability)
- AI suggestions visible to designer only, hidden from reviewers (role-based)
- Close/archive and delete reviews with confirmation
- Archived reviews section (collapsible)
- Feedback responses save to localStorage
- Results view with aggregated vibe scores
- Share link generation (works locally, not yet for external users)

## What's next — deploy as a real web app
1. **Set up Supabase** (free) — Robin needs to create a project and share the URL + anon key
2. **Replace localStorage with Supabase** — reviews, responses, all stored in the cloud
3. **Deploy to Vercel** — gives a real URL (e.g. reviewbridge.vercel.app)
4. **Share links work for real** — anyone with the link can open the reviewer view
5. **Email invites** — wire up email sending via Supabase or Resend
6. **Auth (optional)** — simple PIN or login so only Robin can create reviews

## Known issues to fix in next session
- Email invite button doesn't send (waiting for backend)
- Share links only work locally (need deployment)
- AI Vibe Check is hardcoded demo data (could wire to Claude API later)
- Pin comments don't persist across page reloads for reviewers (needs Supabase)
