"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Avatar } from "@/components/Avatar";
import { VerifiedIcon } from "@/components/icons";
import { timeAgo } from "@/lib/feed/format";
import { callRpc } from "@/lib/social/client";
import { noticeHref, noticeText, type Notice } from "@/lib/social/inbox";
import { useUi } from "@/lib/store/ui";

/** The inbox: what happened, newest first. Opening the page marks everything read. */
export function InboxList({ notices }: { notices: Notice[] }) {
  const setUnread = useUi((s) => s.setUnread);
  useEffect(() => {
    void callRpc("inbox_mark_read").then(() => setUnread(0));
  }, [setUnread]);

  if (notices.length === 0) {
    return (
      <div className="mt-16 text-center" data-inbox-empty>
        <p className="text-[16px] font-medium text-text">Nothing yet</p>
        <p className="mt-1 text-[14px] text-text-2">Likes, comments, replies and new followers show up here.</p>
      </div>
    );
  }
  return (
    <ul className="mt-2 divide-y divide-divider" data-inbox>
      {notices.map((n) => (
        <li key={n.id}>
          <Link href={noticeHref(n)} prefetch={false} className="flex items-center gap-3 py-3 hover:bg-hover" data-notice={n.kind} data-unread={n.unread}>
            <span className="relative shrink-0">
              <Avatar name={n.actor.displayName} url={n.actor.avatarUrl} size={44} />
              {n.unread && <span aria-label="New" className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--page)] bg-[var(--accent)]" />}
            </span>
            <span className="min-w-0 flex-1 text-[14px] leading-5">
              <span className="inline-flex items-center gap-1 font-medium text-text">
                @{n.actor.username}
                {n.actor.verified && <VerifiedIcon className="h-3.5 w-3.5" />}
              </span>{" "}
              <span className="text-text-2">{noticeText(n.kind)}</span> <span className="text-text-3">· {timeAgo(n.createdAt)}</span>
              {n.comment && <span className="mt-0.5 line-clamp-1 block text-text">{n.comment}</span>}
            </span>
            {n.video && (
              <span className="h-14 w-8 shrink-0 overflow-hidden rounded bg-skeleton">
                {n.video.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- covers come from the media bucket, whose address is only known at request time
                  <img src={n.video.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
