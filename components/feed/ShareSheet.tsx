"use client";

import { useCallback, useState } from "react";
import { LinkIcon, ShareIcon } from "@/components/icons";
import type { Clip } from "@/lib/feed/types";
import { callRpc } from "@/lib/social/client";
import { useFeed } from "@/lib/store/feed";
import { useUi } from "@/lib/store/ui";
import { Sheet } from "./Sheet";

/** Share a clip: copy its link, or hand it to the phone's own share sheet. */
export function ShareSheet({ clip, signedIn }: { clip: Clip; signedIn: boolean }) {
  const openSheet = useFeed((s) => s.openSheet);
  const patch = useFeed((s) => s.patch);
  const showToast = useUi((s) => s.showToast);
  const close = useCallback(() => openSheet(null), [openSheet]);
  // The sheet only ever opens after a tap, in the browser, so window is there.
  const [url] = useState(() => `${window.location.origin}/v/${clip.id}`);
  const [canShare] = useState(() => typeof navigator.share === "function");

  const counted = () => {
    if (!signedIn) return;
    void callRpc<number | null>("record_share", { p_video: clip.id }).then((res) => {
      if (res.ok && typeof res.data === "number") patch(clip.id, { shareCount: res.data });
    });
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
      counted();
      close();
    } catch {
      showToast("Copy the link from the box.");
    }
  }

  async function native() {
    try {
      await navigator.share({ title: `@${clip.author.username} on YapTok`, text: clip.caption, url });
      counted();
      close();
    } catch {
      // The person closed the share sheet: nothing to do.
    }
  }

  return (
    <Sheet title="Share" onClose={close}>
      <div className="space-y-3 p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <input aria-label="Link to this clip" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="field text-[14px]" data-share-url />
        <div className="flex gap-2">
          <button type="button" onClick={() => void copy()} className="btn-primary flex-1" data-share-copy>
            <LinkIcon className="h-5 w-5" />
            Copy link
          </button>
          {canShare && (
            <button type="button" onClick={() => void native()} className="btn-ghost flex-1">
              <ShareIcon className="h-5 w-5" />
              More
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
