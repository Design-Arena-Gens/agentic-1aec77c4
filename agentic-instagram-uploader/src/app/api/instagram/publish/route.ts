import { NextResponse } from "next/server";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import { getInstagramConfig } from "@/lib/env";
import { scheduleInstagramPost } from "@/lib/instagram";

const requestSchema = z.object({
  caption: z.string().min(1),
  publishAt: z.string().optional(),
  locationId: z.string().optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  let config;
  try {
    config = getInstagramConfig();
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Missing environment config.";
    return NextResponse.json(
      { error: reason },
      {
        status: 500,
      },
    );
  }

  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  });

  const formData = await request.formData();

  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "Image file is required." },
      {
        status: 400,
      },
    );
  }

  const rawPayload = {
    caption: typeof formData.get("caption") === "string"
      ? (formData.get("caption") as string)
      : "",
    publishAt:
      typeof formData.get("publishAt") === "string"
        ? (formData.get("publishAt") as string)
        : undefined,
    locationId:
      typeof formData.get("locationId") === "string"
        ? (formData.get("locationId") as string)
        : undefined,
  };

  const parsed = requestSchema.safeParse(rawPayload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid request payload.",
      },
      {
        status: 400,
      },
    );
  }

  const buffer = Buffer.from(await image.arrayBuffer());

  try {
    const uploadResult = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          {
            folder: config.CLOUDINARY_UPLOAD_FOLDER,
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(new Error("Unknown Cloudinary upload error."));
              return;
            }

            resolve(result);
          },
        );

        upload.end(buffer);
      },
    );

    const publishAtIso = parsed.data.publishAt
      ? new Date(parsed.data.publishAt).toISOString()
      : undefined;

    const scheduleResponse = await scheduleInstagramPost({
      caption: parsed.data.caption,
      imageUrl: uploadResult.secure_url,
      publishAt: publishAtIso,
      locationId: parsed.data.locationId ?? null,
    });

    return NextResponse.json(
      {
        success: true,
        creation: scheduleResponse,
      },
      { status: 200 },
    );
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Upload request failed.";

    return NextResponse.json(
      {
        error: reason,
      },
      {
        status: 500,
      },
    );
  }
}
