# Roadmap: what a complete short video app has, and where YapTok is

The goal: everything people expect from an app of this kind, finished to a
high standard, with YapTok's own name, mark and look. One feature per session,
each behind its flag in `/admin`.

Status on 2026-11-11: **9 built, 8 partial, 15 missing** (32 items).

## Checklist

| # | Item | Status | What is there, what is not |
| --- | --- | --- | --- |
| 1 | For You feed | partial | Works, paged, newest first. No ranking yet |
| 2 | Ranking signals (watch time, rewatches, likes, shares, follows, not interested) | missing | Views are counted once a day per viewer; watch time is not recorded |
| 3 | Following feed | missing | |
| 4 | Swipe player: autoplay, next clip preloaded | built | Swipe, wheel, keys; three clips in the page at a time |
| 5 | Sound choice remembered | built | On the device; falls back to muted when the browser refuses |
| 6 | Double tap to like | built | `gestures` flag |
| 7 | Hold to pause, hold for double speed | built | `gestures` flag |
| 8 | Scrub bar | built | `scrub` flag |
| 9 | Captions on clips | missing | Needs speech to text, or a caption file from the creator |
| 10 | Like | built | Instant, put back if the database says no |
| 11 | Comments | partial | One level, delete, report. No replies, comment likes, pins or mentions |
| 12 | Share | partial | Copy link and the phone share sheet. No repost |
| 13 | Save to collections | missing | |
| 14 | Repost | missing | |
| 15 | Clips made with another clip (side by side, or continuing from it) | missing | Needs the encoder to join two videos |
| 16 | Sounds: pick one, a page per sound, original audio | missing | Original audio from creators only, see below |
| 17 | Upload | built | Multipart to storage, progress, cancel, processing state |
| 18 | Record in the app | partial | Written behind the `record` flag, never tried with a real camera |
| 19 | Editor: trim, several clips, text, stickers, filters, speed, cover | partial | Only the cover frame |
| 20 | Drafts | missing | |
| 21 | Hashtags and hashtag pages | partial | Saved on upload, shown on the clip. No pages |
| 22 | Search: clips, people, sounds, tags | missing | |
| 23 | Discover and trending | missing | |
| 24 | Profiles | partial | Grid, bio, counts, follow. No picture upload, liked or saved tabs, links, follow lists |
| 25 | Direct messages | missing | |
| 26 | Activity inbox and notifications | missing | |
| 27 | Live streams | missing | Last phase, needs a streaming service |
| 28 | Creator analytics | missing | |
| 29 | Privacy: private account, who can comment or message, block, mute | missing | |
| 30 | Reports and a moderation queue | built | |
| 31 | Age gating | partial | 13 or older at sign up. No age limits on single clips |
| 32 | Admin panel with a switch for every feature | built | Plus site settings, log, stats |

## Phases, in the order people feel them

1. **The player and the basics you touch every minute.** Gestures, scrub bar
   and sound memory (done, branch `feature/player-polish`). Next: Following
   feed, save a clip, liked and saved tabs on the profile, profile pictures,
   follower and following lists.
2. **Finding things.** Hashtag pages, search, a Discover page, and a real
   ranking for For You: record watch time and rewatches, add "not interested",
   score clips from those plus likes, shares and follows.
3. **Talking.** Comment replies, likes, pins and mentions; the activity inbox;
   block and mute; private accounts; who can comment.
4. **Making.** Drafts; an editor (trim, text, speed, filters); sounds from
   original audio; repost; clips made with another clip.
5. **Staying in touch.** Direct messages, push notifications, creator
   analytics, captions.
6. **Live streams.**

## What needs something from outside

| Piece | Why | Cost or decision |
| --- | --- | --- |
| Supabase project | The database and sign in | Free tier to start |
| Cloudflare R2 bucket and an encoder box | Storing and encoding clips | Storage and one small server; grows with uploads |
| A public address for the bucket (CDN) | Fast first frame far from the server | Cloudflare, with a domain |
| An email sender | Confirm and reset emails | Needed before sign-ups open to everyone |
| Push keys | Notifications on phones | Web push keys are free; store apps are a separate project |
| Music | Sounds | Original audio from creators only, unless a catalogue is licensed. Unlicensed music must not be offered |
| Speech to text | Automatic captions | A paid service or a second worker |
| A live streaming service | Phase 6 | Paid, by the minute |

## The quality bar, measured

Measured on 2026-11-11 with the production build, a phone sized headless
browser and the local stack on the same machine. This is a best case: no real
network distance, no real phone. The same script must be run again on the
real site.

| Target | Result |
| --- | --- |
| First clip playing in under a second | 0.4 to 0.6 s unthrottled. With a 4x slower CPU, about 6 Mbit and 150 ms latency: 0.8 to 1.0 s with a warm cache, **3.7 s on the very first visit** (not met: the scripts have to arrive first) |
| No blank frame between clips | The next clip was fully buffered at every swipe and playing 80 to 115 ms after it |
| 60 fps swipes | 16.7 ms per frame, none over 20 ms, unthrottled. With a 4x slower CPU: 18 to 19 ms average, worst 33 to 50 ms (not met on a slow phone) |
| No layout jumps | Layout shift score 0 on the feed |
| Every tap answered at once | Like, follow, comment and the admin switches change before the server answers and are put back if it says no. A single tap on the video waits 0.26 s when gestures are on, to tell it from a double tap |
