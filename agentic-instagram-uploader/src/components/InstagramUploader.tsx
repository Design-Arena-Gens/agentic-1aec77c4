"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const MAX_FILE_SIZE_MB = 8;

const formSchema = z.object({
  caption: z
    .string()
    .min(1, "Caption is required")
    .max(2200, "Instagram captions are limited to 2,200 characters."),
  publishAt: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  mode: z.enum(["immediate", "scheduled"]).default("immediate"),
  locationId: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

type FormFields = z.infer<typeof formSchema>;

type Props = {
  envReady: boolean;
  missingKeys: string[];
};

export default function InstagramUploader({ envReady, missingKeys }: Props) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormFields>({
    caption: "",
    publishAt: undefined,
    mode: "immediate",
    locationId: undefined,
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disabled = !envReady || isSubmitting;

  function resetForm() {
    setFormState({
      caption: "",
      publishAt: undefined,
      mode: "immediate",
      locationId: undefined,
    });
    setFile(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Please select an image to upload.");
      return;
    }

    const megabytes = file.size / (1024 * 1024);
    if (megabytes > MAX_FILE_SIZE_MB) {
      setError(`Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const parseResult = formSchema.safeParse(formState);
    if (!parseResult.success) {
      setError(parseResult.error.issues[0]?.message ?? "Invalid form input.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", parseResult.data.caption);
    if (parseResult.data.locationId) {
      formData.append("locationId", parseResult.data.locationId);
    }

    if (parseResult.data.mode === "scheduled" && parseResult.data.publishAt) {
      formData.append("publishAt", parseResult.data.publishAt);
    }

    try {
      const response = await fetch("/api/instagram/publish", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text || `Instagram upload failed with status ${response.status}.`,
        );
      }

      setMessage(
        parseResult.data.mode === "scheduled"
          ? "Post scheduled successfully!"
          : "Post published to Instagram!",
      );
      resetForm();
      router.refresh();
    } catch (uploadError) {
      const reason =
        uploadError instanceof Error
          ? uploadError.message
          : "Unknown error while uploading.";
      setError(reason);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/70">
      <header className="mb-4 flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Create Instagram Post
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Upload an image, add a caption, and choose whether to publish now or
          schedule for later.
        </p>
      </header>

      {!envReady ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="font-medium">
            Missing environment variables. Add the following to enable uploads:
          </p>
          <ul className="mt-2 list-disc pl-5">
            {missingKeys.map((key) => (
              <li key={key}>
                <code>{key}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="image"
              className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              Image
            </label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                setFile(selected ?? null);
              }}
              className="block w-full cursor-pointer rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 py-4 text-sm text-neutral-700 transition hover:border-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              JPG and PNG up to {MAX_FILE_SIZE_MB}MB.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="caption"
              className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              Caption
            </label>
            <textarea
              id="caption"
              name="caption"
              value={formState.caption}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  caption: event.target.value,
                }))
              }
              rows={4}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm transition focus:border-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="Write an engaging caption..."
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Publishing Mode
            </span>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  formState.mode === "immediate"
                    ? "border-sky-500 bg-sky-50 font-medium text-sky-800 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-200"
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
                onClick={() =>
                  setFormState((prev) => ({
                    ...prev,
                    mode: "immediate",
                    publishAt: undefined,
                  }))
                }
              >
                Publish Now
              </button>
              <button
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  formState.mode === "scheduled"
                    ? "border-indigo-500 bg-indigo-50 font-medium text-indigo-800 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200"
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
                onClick={() =>
                  setFormState((prev) => ({
                    ...prev,
                    mode: "scheduled",
                  }))
                }
              >
                Schedule
              </button>
            </div>

            {formState.mode === "scheduled" && (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="publishAt"
                  className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400"
                >
                  Publish At (minimum 10 minutes in the future)
                </label>
                <input
                  id="publishAt"
                  type="datetime-local"
                  value={formState.publishAt ?? ""}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      publishAt: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm transition focus:border-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="locationId"
              className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              Optional Location ID
            </label>
            <input
              id="locationId"
              name="locationId"
              type="text"
              value={formState.locationId ?? ""}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  locationId: event.target.value,
                }))
              }
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm transition focus:border-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="Useful for tagging business locations"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              Obtain location IDs with the Meta Graph API if you want to tag a
              place in the post.
            </p>
          </div>

          <button
            type="submit"
            disabled={disabled}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition focus-visible:ring-2 focus-visible:ring-offset-2 ${
              disabled
                ? "cursor-not-allowed bg-neutral-400 dark:bg-neutral-700"
                : "bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            }`}
          >
            {isSubmitting
              ? formState.mode === "scheduled"
                ? "Scheduling..."
                : "Publishing..."
              : formState.mode === "scheduled"
                ? "Schedule Post"
                : "Publish Now"}
          </button>

          {message && (
            <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              {message}
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
