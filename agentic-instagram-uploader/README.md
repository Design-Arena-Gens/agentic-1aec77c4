## Instagram Automation Agent

A production-ready Next.js dashboard for scheduling or instantly publishing single-image posts to Instagram using the official Graph API. Images are uploaded to Cloudinary and then queued or published directly to your connected Instagram business account.

## Getting Started

Copy `.env.local.example` to `.env.local` and fill in the required credentials:

- `INSTAGRAM_ACCESS_TOKEN`: Long-lived Instagram Graph API access token (requires a connected Facebook app and business account).
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`: The Instagram Business Account ID that should receive the uploads.
- `CLOUDINARY_*`: Credentials for the Cloudinary account that will host media before it is passed to Instagram.

Install dependencies and start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

### Features

- Upload images (JPG/PNG) and publish immediately.
- Schedule posts for a future time (minimum 10 minutes ahead per API restrictions).
- Optional support for location tagging via `location_id`.
- Displays Instagram scheduling quota and all pending posts retrieved directly from the Graph API.

### Deployment

Set the same environment variables on your hosting platform. For Vercel, use

```bash
vercel env pull .env.local
vercel deploy --prod
```

Optionally configure a Vercel Cron job to call `/api/instagram/publish` if extending this project with additional background automations.

## Instagram API Requirements

- Your Instagram account must be a Business or Creator account.
- The connected Facebook app needs the `instagram_content_publish` permission.
- Long-lived tokens should be refreshed before they expire (60 days).

## Cloudinary Configuration

- Create a folder (default `instagram-agent`) to organize uploaded assets.
- Ensure unsigned uploads are disabled; the server-side route uses authenticated uploads.
- Adjust Cloudinary upload transformations inside `src/app/api/instagram/publish/route.ts` if needed.
