import { Feed } from "@/components/feed/Feed";
import { FeedNotice } from "@/components/feed/FeedNotice";
import { getCurrentUser } from "@/lib/auth";
import { feedState } from "@/lib/feed/server";
import { flagOn } from "@/lib/flags";

/** The feed, or the notice that says why there is none. `first` puts one clip at the top (/v/<id>). */
export async function HomeFeed({ first }: { first?: string }) {
  const state = await feedState(first);
  if (state.kind === "no-db") {
    return (
      <FeedNotice state="no-db" title="database not connected">
        YapTok needs a Supabase project to show clips. Add its address and publishable key to <code>.env.local</code> (see{" "}
        <code>.env.example</code>) and restart.
      </FeedNotice>
    );
  }
  if (state.kind === "off") {
    return (
      <FeedNotice state="off" title="The feed is switched off right now.">
        Check back soon.
      </FeedNotice>
    );
  }
  if (state.kind === "not-set-up") {
    return (
      <FeedNotice state="not-set-up" title="Almost there.">
        The database is connected but the feed could not be read. Run the files in <code>supabase/migrations</code> and reload.
      </FeedNotice>
    );
  }
  if (state.clips.length === 0) {
    const user = await getCurrentUser();
    const canUpload = await flagOn("upload", user?.id ?? null);
    return (
      <FeedNotice
        state="empty"
        title="No clips yet."
        action={canUpload ? { href: user ? "/upload" : "/login?next=/upload", label: "Post the first clip" } : undefined}
      >
        When someone posts a clip it shows up here. Swipe up for the next one.
      </FeedNotice>
    );
  }
  return <Feed initial={state.clips} mediaBase={state.mediaBase} signedIn={state.signedIn} />;
}
