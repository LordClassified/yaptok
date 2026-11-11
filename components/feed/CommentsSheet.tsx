"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Avatar } from "@/components/Avatar";
import { FlagIcon, TrashIcon, VerifiedIcon } from "@/components/icons";
import { socialErrorText, timeAgo } from "@/lib/feed/format";
import { readAuthor, type Clip, type ClipAuthor } from "@/lib/feed/types";
import { callRpc, loginUrl } from "@/lib/social/client";
import { useFeed } from "@/lib/store/feed";
import { useFlag, useSession } from "@/lib/store/session";
import { ReportSheet } from "./ReportSheet";
import { Sheet } from "./Sheet";

type Comment = { id: string; body: string; createdAt: string; author: ClipAuthor; mine: boolean };

export const COMMENT_MAX = 500;

function readComments(value: unknown): Comment[] {
  if (!Array.isArray(value)) return [];
  const out: Comment[] = [];
  for (const row of value as Record<string, unknown>[]) {
    const author = readAuthor(row?.author);
    if (!author || typeof row.id !== "string" || typeof row.body !== "string") continue;
    out.push({ id: row.id, body: row.body, createdAt: String(row.created_at ?? ""), author, mine: row.mine === true });
  }
  return out;
}

/**
 * The comment drawer of one clip: newest first, a box to write one, delete
 * for your own comments (and any comment on your own clip), report for the
 * rest. Writing stops when the owner pauses comments in /admin/settings.
 */
export function CommentsSheet({ clip, signedIn }: { clip: Clip; signedIn: boolean }) {
  const openSheet = useFeed((s) => s.openSheet);
  const patch = useFeed((s) => s.patch);
  const enabled = useSession((s) => s.settings.commentsEnabled);
  const reports = useFlag("reports");
  const [items, setItems] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);
  const close = useCallback(() => openSheet(null), [openSheet]);

  useEffect(() => {
    let cancelled = false;
    void callRpc("video_comments", { p_video: clip.id, p_limit: 50 }).then((res) => {
      if (cancelled) return;
      if (res.ok) setItems(readComments(res.data));
      else {
        setItems([]);
        setError(socialErrorText(res.code));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [clip.id]);

  async function post(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    const res = await callRpc("add_comment", { p_video: clip.id, p_body: body });
    setBusy(false);
    if (!res.ok) return setError(socialErrorText(res.code));
    const [made] = readComments([res.data]);
    if (made) setItems((list) => [made, ...(list ?? [])]);
    setText("");
    patch(clip.id, { commentCount: clip.commentCount + 1 });
  }

  async function remove(id: string) {
    const res = await callRpc("delete_comment", { p_comment: id });
    if (!res.ok) return setError(socialErrorText(res.code));
    setItems((list) => (list ?? []).filter((c) => c.id !== id));
    patch(clip.id, { commentCount: Math.max(0, clip.commentCount - 1) });
  }

  if (reporting) return <ReportSheet target={{ type: "comment", id: reporting }} onClose={() => setReporting(null)} />;

  return (
    <Sheet title={`Comments (${clip.commentCount})`} onClose={close} tall>
      <ul className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-3" data-comments>
        {items === null && <li className="text-[14px] text-text-2">Loading comments</li>}
        {items?.length === 0 && !error && <li className="py-8 text-center text-[14px] text-text-2">No comments yet. Say something nice.</li>}
        {items?.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Avatar name={c.author.displayName} url={c.author.avatarUrl} size={32} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[13px] text-text-2">
                <Link href={`/@${c.author.username}`} className="font-medium hover:underline">
                  @{c.author.username}
                </Link>
                {c.author.verified && <VerifiedIcon className="h-3.5 w-3.5" />}
                <span>· {timeAgo(c.createdAt)}</span>
              </p>
              <p className="mt-0.5 break-words text-[14px] leading-5 text-text">{c.body}</p>
            </div>
            {c.mine || clip.mine ? (
              <button type="button" aria-label="Delete comment" onClick={() => void remove(c.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-icon hover:bg-hover">
                <TrashIcon className="h-4 w-4" />
              </button>
            ) : (
              reports &&
              signedIn && (
                <button type="button" aria-label="Report comment" onClick={() => setReporting(c.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-icon hover:bg-hover">
                  <FlagIcon className="h-4 w-4" />
                </button>
              )
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="px-4 pb-1 text-[13px] text-error">
          {error}
        </p>
      )}
      <div className="shrink-0 border-t border-divider p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {!enabled ? (
          <p className="py-2 text-center text-[14px] text-text-2" data-comments-paused>
            Comments are paused right now.
          </p>
        ) : !signedIn ? (
          <Link href={loginUrl(`/v/${clip.id}`)} className="btn-primary w-full">
            Sign in to comment
          </Link>
        ) : (
          <form onSubmit={post} className="flex items-center gap-2">
            <input
              aria-label="Add a comment"
              placeholder="Add a comment"
              className="field !h-10 !rounded-full text-[14px]"
              maxLength={COMMENT_MAX}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" disabled={busy || !text.trim()} className="btn-primary shrink-0">
              Post
            </button>
          </form>
        )}
      </div>
    </Sheet>
  );
}
