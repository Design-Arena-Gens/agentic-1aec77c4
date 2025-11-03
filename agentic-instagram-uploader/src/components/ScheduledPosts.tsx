"use client";

import { format, formatDistanceToNow } from "date-fns";
import type { ScheduledPost } from "@/lib/instagram";

type Props = {
  posts: ScheduledPost[];
};

function formatDate(
  value?: string | number | null,
) {
  if (value === undefined || value === null || value === "") return null;
  const date =
    typeof value === "number"
      ? new Date(value * 1000)
      : new Date(isNaN(Number(value)) ? value : Number(value) * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return {
    absolute: format(date, "PPpp"),
    relative: formatDistanceToNow(date, { addSuffix: true }),
  };
}

export default function ScheduledPosts({ posts }: Props) {
  if (!posts.length) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-6 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-400">
        No scheduled posts yet. When you schedule content, it will appear here
        with status and preview details.
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => {
        const scheduledTime =
          formatDate(post.scheduled_publish_time ?? post.timestamp) ?? null;
        const statusLabel =
          post.status_code ??
          post.status ??
          (post.is_published ? "PUBLISHED" : "SCHEDULED");

        return (
          <article
            key={post.id}
            className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/80"
          >
            {post.media_url || post.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.media_url ?? post.thumbnail_url ?? ""}
                alt={post.caption ?? "Scheduled Instagram post preview"}
                className="h-56 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-56 items-center justify-center bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                No preview available
              </div>
            )}

            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                <span className="rounded-full bg-indigo-100 px-2 py-1 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                  {statusLabel}
                </span>
                {scheduledTime && (
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {scheduledTime.relative}
                  </span>
                )}
              </div>

              {post.caption && (
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {post.caption}
                </p>
              )}

              {scheduledTime && (
                <div className="rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  <p className="font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Scheduled For
                  </p>
                  <p className="mt-1">{scheduledTime.absolute}</p>
                </div>
              )}

              {post.permalink && (
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  View on Instagram ↗
                </a>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
