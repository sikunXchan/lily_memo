# Demo Video Brief — lily.ai (DSH Hacks V1)

## Hackathon
**DSH Hacks V1** — Theme: AI × STEM Education  
Submission URL: https://dsh-hacks-v1.devpost.com/

## Project
**lily.ai** — An AI assistant that generates diagrams/figures from user input and automatically adds them to memo notes.

## Video Requirements (from devpost)
- Explain the purpose of the project
- Showcase project features
- Demonstrate how users interact with the prototype
- Language: **English**

---

## Planned Structure

| # | Section | Duration | Notes |
|---|---------|----------|-------|
| 1 | **Hook / Title card** | ~5s | Text overlay: "lily.ai — AI-Powered Learning Memos" |
| 2 | **Problem statement** | ~15s | Voiceover / text: students struggle to visualize STEM concepts |
| 3 | **Demo: AI creates a diagram** | ~30s | clip1 = `hackathon(1).MP4` — shows AI generating a figure |
| 4 | **Demo: diagram added to memo** | ~20s | clip1 continued or separate clip |
| 5 | **Additional features** | ~20s | Other clips (TBD — user will record) |
| 6 | **Impact / Closing** | ~10s | Text overlay + logo |

**Target total length:** ~90–120 seconds

---

## Clips

| File | Drive ID | Status | Usage |
|------|----------|--------|-------|
| `hackathon(1).MP4` | `1msjIZmrhEhIk2fA72q4RCN413El6WkJt` | ✅ In Drive | clip1 — AI diagram creation + memo add |
| clip2 | TBD | ⏳ To be recorded | TBD |
| clip3 | TBD | ⏳ To be recorded | TBD |

---

## Editing Plan (FFmpeg-based)

1. Download all clips from Google Drive
2. Normalize resolution & frame rate (1080p, 30fps)
3. Trim each clip to needed portion
4. Concatenate in order
5. Add text overlays (title, section labels) with `drawtext`
6. Export final `demo_final.mp4`

---

## TODO
- [ ] Record remaining clips (user)
- [ ] Upload clips to Drive "ハッカソン動画" folder
- [ ] Download clip1 (`hackathon(1).MP4`) and inspect content
- [ ] Decide exact trim points per clip
- [ ] Add English voiceover or on-screen text
- [ ] Export final video
