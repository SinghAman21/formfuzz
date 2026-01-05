# FormFuzz 🧪  
**Automated Google Forms Submission & Testing Tool**

FormFuzz is a lightweight developer utility that helps you **generate automated test submissions for Google Forms** and **observe execution live via a console-style UI**.  
It is designed for **QA, testing, demos, and internal tooling** — not for bypassing Google security.

---

## ✨ Key Features

- 🚀 **Automated form submissions**
- 🧠 **Optional AI-generated answers** (Gemini)
- 📺 **Live execution logs** (terminal-style)
- 🔁 **Supports most Google Form question types**
- 🔒 **No OAuth flow for end users**
- 🧩 **Simple frontend + Apps Script backend**

---

## 🏗️ Architecture Overview

FormFuzz follows a **fire-and-forget execution model**:

Frontend (React)
   │
   │ POST → start job (no blocking)
   ▼
Apps Script Web App (runs as formfuzz@gmail.com)
   │
   ├─ Submits responses to Google Form
   └─ Writes logs to cache (jobId-based)
   ▲
   │ GET → poll logs
Frontend Live Console


### Important Design Choice

- **POST responses are unreliable** in Apps Script when Forms/Drive APIs are involved.
- **Logs are the single source of truth** for execution status.

---

## ⚠️ Prerequisites (Very Important)

Before running FormFuzz:

1. **Add `formfuzz@gmail.com` as an Editor** to the target Google Form
2. Use the **Form Edit URL**, not the public `/viewform` link

### ✅ Correct

https://docs.google.com/forms/d/FORM_ID/edit

### ❌ Incorrect

https://docs.google.com/forms/d/FORM_ID/viewform

https://docs.google.com/forms/d/FORM_ID/d/e


---

## 🧩 Supported Question Types

| Question Type            | Status |
|--------------------------|--------|
| Short Answer (Text)      | ✅ |
| Paragraph                | ✅ |
| Multiple Choice          | ✅ |
| Checkboxes               | ✅ |
| Dropdown                 | ✅ |
| Linear Scale             | ✅ |
| Multiple Choice Grid     | ✅ |
| Checkbox Grid            | ✅ |
| Date                     | ✅ |
| Time                     | ✅ |
| Rating                   | ⚠️ Skipped (Google limitation) |
| File Upload              | ❌ Not supported |

---

## 🧠 Gemini AI Integration (Optional)

FormFuzz can generate **unique, human-like answers** for text questions using Gemini.

### How it works

- If a Gemini API key is provided:
  - Text & paragraph answers are AI-generated
- If not provided:
  - Fallback random text is used
- **Every run generates different answers**

### Supported Models

- `gemini-1.5-flash` (default)
- `gemini-1.5-pro`

---

## 🖥️ Frontend Behavior (Expected)

### Job Lifecycle

1. User clicks **Generate Submissions**
2. Frontend generates a `jobId`
3. POST request starts backend job
4. Frontend **immediately starts polling logs**
5. Live logs appear in terminal
6. Job ends when logs contain:
   - `Job finished`
   - or `ERROR`

> ✅ The UI should **never block waiting for POST response**

---

## 🔌 Backend API Contract

### Start Job

**POST** `{WEB_APP_URL}`

```json
{
  "jobId": "uuid-generated-on-frontend",
  "formUrl": "https://docs.google.com/forms/d/FORM_ID/edit",
  "submissionCount": 10,
  "geminiApiKey": "optional",
  "geminiModel": "optional"
}

- Response body may be ignored  
- Job starts asynchronously

GET {WEB_APP_URL}?jobId={jobId}

{
  "success": true,
  "logs": [
    { "time": "2026-01-01T12:00:00Z", "message": "Job started" },
    { "time": "2026-01-01T12:00:02Z", "message": "Response 1 submitted" }
  ]
}

📺 Live Console UI Guidelines

Recommended console behavior:

Dark background

Monospace font

Auto-scroll

Color-coded logs:

Green → normal

Yellow → warnings

Red → errors

Log format:

[HH:MM:SS] Message

🚨 Known Limitations

Apps Script does not guarantee reliable POST responses

No true async / background threads

No WebSockets (polling only)

Rating & File Upload questions are skipped

Not designed for large-scale abuse or scraping

🔒 Security & Transparency

FormFuzz does not bypass Google security

Access works only if formfuzz@gmail.com
 is added as editor

Gemini API key is:

Optional

Used only at runtime

Not stored permanently

🛠️ Deployment Notes (Backend)

Apps Script Web App settings must be:

Setting	Value
Execute as	Me (formfuzz@gmail.com
)
Who has access	Anyone
URL	Must end with /exec

Redeploy after every code change.

📌 Intended Use Cases

QA testing

Form demos

Internal tooling

Load testing (small scale)

Educational projects

❌ Not intended for:

Spamming

Bypassing permissions

Production survey manipulation

🧠 Key Takeaway

POST starts the job.
Logs confirm the job.
Never trust the POST response body.

This design aligns with real-world Apps Script constraints and ensures reliability.

🚀 Future Enhancements

Progress percentage

Cancel job

Multiple concurrent job views

Download logs

OAuth-based execution (run-as-user)


---

If you want, I can now:
- Optimize this README for **GitHub discoverability**
- Add **badges** (stars, license, build)
- Create a **CONTRIBUTING.md**
- Add **architecture diagrams**

Just tell me 👍
