// How the feed moves and what it shows: lib/feed/nav.ts, types.ts, format.ts.
import assert from "node:assert/strict";
import { test } from "node:test";
import { clipLength, compactCount, rpcCode, socialErrorText, timeAgo } from "../lib/feed/format.ts";
import { clampIndex, dragOffset, keyAction, shouldLoadMore, slotMode, swipeStep, wheelStep, WHEEL_COOLDOWN_MS } from "../lib/feed/nav.ts";
import { clipSources, feedCursor, mergeClips, readClip, readClips } from "../lib/feed/types.ts";

const row = (n, extra = {}) => ({
  id: `aaaaaaaa-bbbb-4ccc-8ddd-${String(n).padStart(12, "0")}`,
  caption: `clip ${n}`,
  hashtags: ["a"],
  visibility: "public",
  status: "ready",
  duration_s: "7.5",
  width: 720,
  height: 1280,
  hls_key: `hls/aaaaaaaa-bbbb-4ccc-8ddd-${String(n).padStart(12, "0")}/master.m3u8`,
  thumbnail_url: null,
  like_count: 3,
  comment_count: "2",
  view_count: 10,
  share_count: 0,
  published_at: `2026-11-0${n}T10:00:00Z`,
  created_at: `2026-11-0${n}T09:00:00Z`,
  removed: false,
  author: { id: "11111111-2222-4333-8444-555555555555", username: "mira", display_name: "", avatar_url: null, verified: true },
  liked: true,
  following: false,
  mine: false,
  ...extra,
});

test("keys: arrows, j and k step; space plays; m, l and c do their thing", () => {
  assert.deepEqual(keyAction({ key: "ArrowDown" }), { type: "step", step: 1 });
  assert.deepEqual(keyAction({ key: "J" }), { type: "step", step: 1 });
  assert.deepEqual(keyAction({ key: "PageUp" }), { type: "step", step: -1 });
  assert.deepEqual(keyAction({ key: " " }), { type: "toggle-play" });
  assert.deepEqual(keyAction({ key: "m" }), { type: "toggle-mute" });
  assert.deepEqual(keyAction({ key: "l" }), { type: "like" });
  assert.deepEqual(keyAction({ key: "c" }), { type: "comments" });
});

test("keys: nothing while typing, with a modifier, or space on a button", () => {
  assert.equal(keyAction({ key: "j", targetTag: "INPUT" }), null);
  assert.equal(keyAction({ key: "ArrowDown", targetTag: "textarea" }), null);
  assert.equal(keyAction({ key: "l", targetEditable: true }), null);
  assert.equal(keyAction({ key: "l", ctrlKey: true }), null);
  assert.equal(keyAction({ key: " ", targetTag: "BUTTON" }), null);
  assert.equal(keyAction({ key: "x" }), null);
});

test("wheel: one flick is one clip", () => {
  assert.equal(wheelStep(100, 1000, 0), 1);
  assert.equal(wheelStep(-100, 1000, 0), -1);
  assert.equal(wheelStep(4, 1000, 0), 0, "a resting finger");
  assert.equal(wheelStep(100, 1000, 1000 - WHEEL_COOLDOWN_MS + 1), 0, "still cooling down");
  assert.equal(wheelStep(100, 1000 + WHEEL_COOLDOWN_MS, 1000), 1);
});

test("swipe: far enough or fast enough, up is next", () => {
  assert.equal(swipeStep(-200, 600, 800), 1, "a slow long drag up");
  assert.equal(swipeStep(200, 600, 800), -1);
  assert.equal(swipeStep(-60, 100, 800), 1, "a short fast flick");
  assert.equal(swipeStep(-60, 600, 800), 0, "short and slow: stays");
  assert.equal(swipeStep(-10, 5, 800), 0, "a tap that wobbled");
});

test("drag: resistance past either end", () => {
  assert.equal(dragOffset(90, 0, 5), 30);
  assert.equal(dragOffset(-90, 4, 5), -30);
  assert.equal(dragOffset(-90, 0, 5), -90);
});

test("slots: play one, preload the next, keep the previous cover, drop the rest", () => {
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => slotMode(i, 2)), ["off", "poster", "active", "preload", "off"]);
  assert.equal(clampIndex(9, 3), 2);
  assert.equal(clampIndex(-1, 3), 0);
  assert.equal(clampIndex(5, 0), 0);
});

test("load more a few clips before the end, once", () => {
  assert.ok(shouldLoadMore(4, 8, true, false));
  assert.ok(!shouldLoadMore(2, 8, true, false));
  assert.ok(!shouldLoadMore(7, 8, false, false));
  assert.ok(!shouldLoadMore(7, 8, true, true));
});

test("clips are read field by field", () => {
  const clip = readClip(row(1));
  assert.equal(clip.durationS, 7.5);
  assert.equal(clip.commentCount, 2);
  assert.equal(clip.author.displayName, "mira", "an empty name falls back to the username");
  assert.equal(clip.liked, true);
  assert.equal(readClip({ id: "nope" }), null);
  assert.equal(readClip(row(1, { author: null })), null);
  assert.equal(readClips([row(1), "junk", row(2)]).length, 2);
  assert.deepEqual(readClips(null), []);
});

test("sources: the public bucket when there is one, else the media route", () => {
  const clip = readClip(row(1));
  assert.deepEqual(clipSources(clip, "https://media.example.com"), {
    src: `https://media.example.com/hls/${clip.id}/master.m3u8`,
    poster: `https://media.example.com/hls/${clip.id}/thumb-1.webp`,
  });
  assert.deepEqual(clipSources(clip, null), { src: `/api/media/${clip.id}/master.m3u8`, poster: `/api/media/${clip.id}/thumb-1.webp` });
  assert.equal(clipSources(readClip(row(1, { status: "processing", hls_key: null })), null).src, null);
});

test("paging: the cursor is the last clip, and pages never repeat a clip", () => {
  const a = readClips([row(3), row(2)]);
  assert.deepEqual(feedCursor(a), { before: "2026-11-02T10:00:00Z", beforeId: a[1].id });
  assert.equal(feedCursor([]), null);
  assert.deepEqual(mergeClips(a, readClips([row(2), row(1)])).map((c) => c.caption), ["clip 3", "clip 2", "clip 1"]);
});

test("counts, times and lengths", () => {
  assert.deepEqual([0, 999, 1000, 1999, 15300, 3_400_000].map(compactCount), ["0", "999", "1K", "1.9K", "15K", "3.4M"]);
  const now = Date.parse("2026-11-11T12:00:00Z");
  assert.equal(timeAgo("2026-11-11T11:59:40Z", now), "now");
  assert.equal(timeAgo("2026-11-11T09:00:00Z", now), "3h");
  assert.equal(timeAgo("2026-11-01T12:00:00Z", now), "1w");
  assert.equal(timeAgo("2026-03-03T12:00:00Z", now), "Mar 3, 2026");
  assert.equal(timeAgo(null), "");
  assert.equal(clipLength(75.4), "1:15");
});

test("error codes from the database become plain words", () => {
  assert.equal(rpcCode({ message: "comments_off" }), "comments_off");
  assert.equal(rpcCode({ message: "permission denied for function x" }), "error");
  assert.equal(rpcCode(null), null);
  assert.match(socialErrorText("comments_off"), /switched off/);
  assert.equal(socialErrorText("no_db"), "database not connected");
});
