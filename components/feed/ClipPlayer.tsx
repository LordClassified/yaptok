"use client";

import type Hls from "hls.js";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { PlayIcon } from "@/components/icons";

/** Safari (desktop and iOS) plays HLS itself; everybody else gets hls.js. */
function preferNative(video: HTMLVideoElement): boolean {
  if (!video.canPlayType("application/vnd.apple.mpegurl")) return false;
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/chrome|chromium|crios|android|edg/i.test(ua);
}

export type ClipPlayerHandle = { togglePlay: () => void };

/**
 * One clip's video.
 *   active   the stream is open and playing, on a loop
 *   preload  the stream is open and buffering its first seconds, paused, so
 *            the swipe to it starts at once
 *   poster   only the cover image
 * Browsers only autoplay without sound, so the feed starts muted; the sound
 * button in the feed turns it on for this clip and every one after it.
 * A tap plays or pauses.
 */
export function ClipPlayer({
  src,
  poster,
  mode,
  muted,
  cover = true,
  ref,
  onWatched,
}: {
  src: string | null;
  poster: string | null;
  mode: "active" | "preload" | "poster";
  muted: boolean;
  /** Fill the frame (vertical clips) or show the whole picture with bars (wide ones). */
  cover?: boolean;
  ref?: Ref<ClipPlayerHandle>;
  /** Called with the seconds played when the clip leaves the screen. */
  onWatched?: (seconds: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const open = mode !== "poster" && src !== null;
  const active = mode === "active";

  // Open the stream for the clip on screen and the next one; let it go otherwise.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !open || !src) return;
    let hls: Hls | null = null;
    let cancelled = false;
    setFailed(false);
    if (preferNative(video)) {
      video.preload = "auto";
      video.src = src;
    } else {
      void import("hls.js").then(({ default: HlsClass }) => {
        if (cancelled) return;
        if (!HlsClass.isSupported()) {
          video.src = src;
          return;
        }
        // A short clip: a small buffer is plenty, and keeps the next clip's preload cheap.
        hls = new HlsClass({ maxBufferLength: 10, backBufferLength: 10, capLevelToPlayerSize: true });
        hls.on(HlsClass.Events.ERROR, (_e, data) => {
          if (!data.fatal || !hls) return;
          if (data.type === HlsClass.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === HlsClass.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else setFailed(true);
        });
        hls.loadSource(new URL(src, window.location.href).toString());
        hls.attachMedia(video);
      });
    }
    return () => {
      cancelled = true;
      video.pause();
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
      setProgress(0);
    };
  }, [open, src]);

  // Play while on screen; pause and rewind when it is the one waiting.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !open) return;
    if (!active) {
      video.pause();
      return;
    }
    let cancelled = false;
    const play = () => {
      video.play().catch(() => {
        if (!cancelled) setPaused(true);
      });
    };
    play();
    // The stream may not be attached yet on the first clip: try again when it can play.
    video.addEventListener("canplay", play, { once: true });
    return () => {
      cancelled = true;
      video.removeEventListener("canplay", play);
      onWatched?.(video.currentTime);
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // Not seekable yet: nothing to rewind.
      }
    };
    // onWatched is read when the clip leaves; a new function must not restart playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted, mode]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !active) return;
    if (video.paused) void video.play().catch(() => setPaused(true));
    else video.pause();
  };
  useImperativeHandle(ref, () => ({ togglePlay }));

  return (
    <div className="absolute inset-0" data-clip-player={mode}>
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        loop
        playsInline
        muted={muted}
        preload="none"
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration > 0) setProgress(v.currentTime / v.duration);
        }}
        className={`h-full w-full bg-black ${cover ? "object-cover" : "object-contain"}`}
      />
      <button
        type="button"
        onClick={togglePlay}
        aria-label={paused ? "Play" : "Pause"}
        data-clip-tap
        className="absolute inset-0 cursor-pointer"
      >
        {active && paused && !failed && src && (
          <span className="absolute left-1/2 top-1/2 grid h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45">
            <PlayIcon className="h-10 w-10 text-white" />
          </span>
        )}
      </button>
      {(failed || !src) && active && (
        <p className="over-video pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-[14px] text-white">
          This clip can&apos;t play right now.
        </p>
      )}
      {active && (
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
          <div className="h-full bg-[var(--brand)]" style={{ width: `${Math.round(progress * 1000) / 10}%` }} />
        </div>
      )}
    </div>
  );
}
