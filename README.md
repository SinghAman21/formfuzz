# FormFuzz

FormFuzz is a lightweight internal tool to **generate automated test submissions for Google Forms** and **watch execution live** in a console-style UI.

It’s intended for **QA, demos, and internal tooling** (not for bypassing Google permissions).

## Key features

- Automated Google Form submissions (small scale)
- Optional Gemini-powered text answers
- Live logs (polling-based console)
- Simple architecture: Next.js frontend + Google Apps Script backend

## Repo structure

- `app/`, `components/`, `lib/`: Next.js frontend (UI)
- `app_script.js`: **Google Apps Script backend file** (paste this into Google Apps Script and deploy as a Web App)

## Prerequisites

- Add **`formfuzz@gmail.com` as an Editor** to the target Google Form
- Use the **Form Edit URL** (must end in `/edit`)

Correct:

`https://docs.google.com/forms/d/FORM_ID/edit`

Incorrect:

- `https://docs.google.com/forms/d/FORM_ID/viewform`
- `https://docs.google.com/forms/d/FORM_ID/d/e`

## How to find the Form Edit URL

1. Go to `https://docs.google.com/forms/u/0/`
2. Choose a form you own
3. On the **Questions** tab, copy the active URL in your address bar:
   `https://docs.google.com/forms/d/FORM_ID/edit`
4. Paste it into the FormFuzz input

## Environment variables (frontend)

The frontend calls the Apps Script Web App URL from the browser, so the env var must be prefixed with `NEXT_PUBLIC_`.

1. Copy `env.example` to `.env.local`
2. Restart `npm run dev` after changing env vars

```bash
cp env.example .env.local
```

## Local development

```bash
npm install
npm run dev
```

## Backend deployment (Google Apps Script)

1. Create a new Apps Script project
2. Paste the contents of `app_script.js`
3. Deploy as a Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the deployed URL (must end with `/exec`) into `NEXT_PUBLIC_WEB_APP_URL`

Note: redeploy after backend code changes.

## Supported question types

| Question type        | Status |
|----------------------|--------|
| Short answer (text)  | ✅ |
| Paragraph            | ✅ |
| Multiple choice      | ✅ |
| Checkboxes           | ✅ |
| Dropdown             | ✅ |
| Linear scale         | ✅ |
| Multiple choice grid | ✅ |
| Checkbox grid        | ✅ |
| Date                 | ✅ |
| Time                 | ✅ |
| Rating               | ⚠️ Skipped (Google limitation) |
| File upload          | ❌ Not supported |

## Gemini integration (optional)

- If you provide a Gemini API key, text + paragraph answers can be generated via Gemini
- If not, fallback random text is used
- Each run generates different answers (seeded per request)

Common model strings (you can also type a custom model in the UI):

- `gemini-2.5-flash`
- `gemini-1.5-pro-latest`
- `gemini-2.0-flash-exp`

## Job lifecycle (frontend behavior)

1. Click **Generate Submissions**
2. Frontend generates a `jobId`
3. Frontend triggers a POST to start the job (fire-and-forget)
4. Frontend immediately starts polling logs
5. Job ends when logs contain:
   - `Job finished` or `Job completed successfully`
   - or `ERROR`

## Backend API contract

Base URL: `NEXT_PUBLIC_WEB_APP_URL`

### Start job

**POST** `{NEXT_PUBLIC_WEB_APP_URL}`

```json
{
  "jobId": "uuid-generated-on-frontend",
  "formUrl": "https://docs.google.com/forms/d/FORM_ID/edit",
  "submissionCount": 10,
  "geminiApiKey": "optional",
  "geminiModel": "optional"
}
```

### Poll logs

**GET** `{NEXT_PUBLIC_WEB_APP_URL}?jobId={jobId}`

```json
{
  "success": true,
  "logs": [
    { "time": "2026-01-01T12:00:00Z", "message": "Job started" },
    { "time": "2026-01-01T12:00:02Z", "message": "Response 1 submitted" }
  ]
}
```

## Limitations

- Apps Script POST responses can be unreliable for long jobs; logs are the source of truth
- No WebSockets (polling only)
- Rating + file upload are not supported (Google limitations)
- Not designed for abuse or large-scale scraping

## Security note

FormFuzz does not bypass Google permissions. It works only if `formfuzz@gmail.com` has editor access to the target form.
