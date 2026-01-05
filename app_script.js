function doPost(e) {
const body = JSON.parse(e.postData.contents);
const jobId = body.jobId || Utilities.getUuid();

  try {
     const body = JSON.parse(e.postData.contents);
    const jobId = body.jobId || Utilities.getUuid();

    const {
      formUrl,
      submissionCount,
      geminiApiKey,
      geminiModel
    } = body;

    if (!formUrl) {
      return respond(false, "Form URL is required", jobId);
    }

    log("Job started", jobId);

    // Gemini is OPTIONAL
    if (geminiApiKey) {
      PropertiesService.getScriptProperties()
        .setProperty("GEMINI_API_KEY", geminiApiKey);

      PropertiesService.getScriptProperties()
        .setProperty(
          "GEMINI_MODEL",
          geminiModel || "gemini-2.5-flash"
        );

      log("Gemini enabled", jobId);
    } else {
      PropertiesService.getScriptProperties()
        .deleteProperty("GEMINI_API_KEY");
      PropertiesService.getScriptProperties()
        .deleteProperty("GEMINI_MODEL");

      log("Gemini disabled (fallback mode)", jobId);
    }

    const COUNT = Math.min(Number(submissionCount || 1), 50);

    // 🔒 Prevent parallel heavy jobs
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);

    try {
      submitRandomResponsesAllSupported(formUrl, COUNT, jobId);
    } finally {
      lock.releaseLock();
    }

    log("Job completed successfully", jobId);

    return respond(true, "Completed", jobId);

  } catch (err) {
    log("ERROR: " + err.message, jobId);
    return respond(false, err.message, jobId);
  }
}

function doGet(e) {
  // Health check / root
  if (!e || !e.parameter || !e.parameter.jobId) {
    return ContentService
      .createTextOutput("OK")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const jobId = e.parameter.jobId;
  const cache = CacheService.getScriptCache();
  const logs = cache.get(`logs_${jobId}`);

  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      logs: logs ? JSON.parse(logs) : []
    })
  ).setMimeType(ContentService.MimeType.JSON);
}



function submitRandomResponsesAllSupported(formUrl, COUNT, jobId) {
  log(`Opening form`, jobId);
  const form = FormApp.openByUrl(formUrl);
  const items = form.getItems();

  log(`Found ${items.length} items`, jobId);

  for (let i = 0; i < COUNT; i++) {
    log(`Creating response ${i + 1}/${COUNT}`, jobId);
    const response = form.createResponse();

    items.forEach(item => {
      const type = item.getType();
      const title = item.getTitle();

      try {
        switch (type) {

          // ───── TEXT ─────
          case FormApp.ItemType.TEXT: {
            const answer = isGeminiEnabled()
              ? generateAnswerWithGemini(title, "short", jobId)
              : randomShortText();

            response.withItemResponse(
              item.asTextItem().createResponse(answer)
            );
            log(`TEXT answered`, jobId);
            break;
          }

          case FormApp.ItemType.PARAGRAPH_TEXT: {
            const answer = isGeminiEnabled()
              ? generateAnswerWithGemini(title, "paragraph", jobId)
              : randomParagraph();

            response.withItemResponse(
              item.asParagraphTextItem().createResponse(answer)
            );
            log(`PARAGRAPH answered`, jobId);
            break;
          }

          // ───── CHOICES ─────
          case FormApp.ItemType.MULTIPLE_CHOICE: {
            const c = item.asMultipleChoiceItem().getChoices();
            response.withItemResponse(
              item.asMultipleChoiceItem()
                .createResponse(c[rand(c.length)].getValue())
            );
            break;
          }

          case FormApp.ItemType.CHECKBOX: {
            const c = item.asCheckboxItem().getChoices();
            response.withItemResponse(
              item.asCheckboxItem()
                .createResponse([c[rand(c.length)].getValue()])
            );
            break;
          }

          case FormApp.ItemType.LIST: {
            const c = item.asListItem().getChoices();
            response.withItemResponse(
              item.asListItem()
                .createResponse(c[rand(c.length)].getValue())
            );
            break;
          }

          // ───── SCALE ─────
          case FormApp.ItemType.SCALE: {
            const it = item.asScaleItem();
            response.withItemResponse(
              it.createResponse(
                randRange(it.getLowerBound(), it.getUpperBound())
              )
            );
            break;
          }

          // ───── RATING (SKIPPED) ─────
          case FormApp.ItemType.RATING:
            log(`RATING skipped: ${title}`, jobId);
            break;

          // ───── GRIDS ─────
          case FormApp.ItemType.GRID: {
            const it = item.asGridItem();
            const answers = it.getRows().map(
              () => it.getColumns()[rand(it.getColumns().length)]
            );
            response.withItemResponse(it.createResponse(answers));
            break;
          }

          case FormApp.ItemType.CHECKBOX_GRID: {
            const it = item.asCheckboxGridItem();
            const answers = it.getRows().map(
              () => [it.getColumns()[rand(it.getColumns().length)]]
            );
            response.withItemResponse(it.createResponse(answers));
            break;
          }

          // ───── DATE / TIME ─────
          case FormApp.ItemType.DATE:
            response.withItemResponse(
              item.asDateItem().createResponse(new Date())
            );
            break;

          case FormApp.ItemType.TIME:
            response.withItemResponse(
              item.asTimeItem().createResponse(10, 30)
            );
            break;

          // ───── FILE UPLOAD ─────
          case FormApp.ItemType.FILE_UPLOAD:
            log(`FILE_UPLOAD skipped`, jobId);
            break;
        }
      } catch (e) {
        log(`ERROR on "${title}": ${e.message}`, jobId);
      }
    });

    response.submit();
    log(`Response ${i + 1} submitted`, jobId);
  }
}


function isGeminiEnabled() {
  return !!PropertiesService
    .getScriptProperties()
    .getProperty("GEMINI_API_KEY");
}

function generateAnswerWithGemini(question, type, jobId) {
  const apiKey = PropertiesService
    .getScriptProperties()
    .getProperty("GEMINI_API_KEY");

  const model =
    PropertiesService
      .getScriptProperties()
      .getProperty("GEMINI_MODEL") ||
    "gemini-1.5-flash";

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const seed =
    new Date().toISOString() +
    Math.random().toString(36).slice(2);

  const payload = {
    contents: [{
      parts: [{
        text: `Answer the question uniquely.\nQuestion: ${question}\nType: ${type}\nSeed: ${seed}`
      }]
    }]
  };

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  Utilities.sleep(300);

  const json = JSON.parse(res.getContentText());
  return (
    json?.candidates?.[0]?.content?.parts?.[0]?.text ||
    randomShortText()
  );
}

function respond(success, message, jobId) {
  return ContentService.createTextOutput(
    JSON.stringify({ success, message, jobId })
  ).setMimeType(ContentService.MimeType.JSON);
}

function rand(max) {
  return Math.floor(Math.random() * max);
}

function randRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomShortText() {
  return "Auto_" + Math.random().toString(36).slice(2, 7);
}

function randomParagraph() {
  return "Auto-generated test response at " + new Date().toISOString();
}


function log(message, jobId) {
  const cache = CacheService.getScriptCache();
  const key = `logs_${jobId}`;

  const existing = cache.get(key);
  const logs = existing ? JSON.parse(existing) : [];

  logs.push({
    time: new Date().toISOString(),
    message
  });

  cache.put(key, JSON.stringify(logs), 600);
}
