import InstagramUploader from "@/components/InstagramUploader";
import ScheduledPosts from "@/components/ScheduledPosts";
import { validateInstagramConfig } from "@/lib/env";
import {
  fetchPublishingLimit,
  fetchScheduledPosts,
} from "@/lib/instagram";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function Home() {
  const envStatus = validateInstagramConfig();

  let scheduledPosts: Awaited<
    ReturnType<typeof fetchScheduledPosts>
  > = [];
  let publishingLimit: Awaited<ReturnType<typeof fetchPublishingLimit>> = null;
  let fetchError: string | null = null;

  if (envStatus.ready) {
    try {
      [scheduledPosts, publishingLimit] = await Promise.all([
        fetchScheduledPosts(),
        fetchPublishingLimit(),
      ]);
    } catch (error) {
      fetchError =
        error instanceof Error
          ? error.message
          : "Failed to load data from Instagram.";
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-sky-50 px-4 pb-16 pt-10 font-sans text-neutral-900 dark:from-neutral-950 dark:via-neutral-900 dark:to-slate-900 dark:text-neutral-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/70">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600 dark:text-sky-400">
              Automation Agent
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Instagram Auto Publisher
            </h1>
          </div>
          <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
            Upload once and let the agent handle the rest. Provide your Meta
            access token and Instagram Business Account ID as environment
            variables, then schedule images to be published automatically using
            the Instagram Graph API.
          </p>
          {publishingLimit && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-sky-100/60 px-4 py-3 text-sm text-sky-800 dark:bg-sky-500/10 dark:text-sky-200">
              <strong>
                Publishing quota: {publishingLimit.quota_usage}/
                {publishingLimit.quota_total}
              </strong>
              <span>
                Remaining slots: {publishingLimit.quota_remaining}{" "}
                {publishingLimit.reset_time &&
                  `(resets ${new Date(publishingLimit.reset_time).toLocaleString()})`}
              </span>
            </div>
          )}
          {fetchError && (
            <p className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {fetchError}
            </p>
          )}
        </header>

        <InstagramUploader
          envReady={envStatus.ready}
          missingKeys={envStatus.ready ? [] : envStatus.missing}
        />

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Scheduled posts</h2>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Synced directly from Instagram
            </span>
          </div>
          <ScheduledPosts posts={scheduledPosts} />
        </section>
      </div>
    </main>
  );
}
