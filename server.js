// Callback — missed-call text-back for home-service businesses.
// Minimal but functional: Twilio voice status webhook -> SMS -> AI qualification -> lead log.
//
// Required env (see .env.example):
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_NUMBER
//   OPENAI_API_KEY
//   BUSINESS_NAME, BOOKING_URL, OWNER_PHONE
//
// Run: npm install && npm start
// Expose with: ngrok http 3000   (dev)  or deploy to Render/Fly (prod)

import express from "express";
import twilio from "twilio";
import fs from "node:fs";

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_NUMBER,
  OPENAI_API_KEY,
  BUSINESS_NAME = "Our team",
  BOOKING_URL = "https://cal.com/",
  OWNER_PHONE = "",
  PORT = 3000,
} = process.env;

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const twilioClient =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

// ---- persistence (file-based; swap for Postgres/SQLite when you have customers) ----
const LEADS = "leads.jsonl";
const conversations = new Map(); // phone -> [{role, content}]

function logLead(lead) {
  fs.appendFileSync(LEADS, JSON.stringify({ ...lead, at: new Date().toISOString() }) + "\n");
}

// ---- AI qualification ----
async function aiReply(phone, incoming) {
  const history = conversations.get(phone) ?? [];
  history.push({ role: "user", content: incoming });
  conversations.set(phone, history);

  const system = `You are the after-hours assistant for ${BUSINESS_NAME}, a home-service business.
A customer called and we missed it; you texted them first. Your job: be warm, brief, and get the job booked.

Rules:
- Never say you are an AI unless directly asked.
- Ask at most one question per message.
- Find out: what the problem is, how urgent, and the address/zip.
- Once you know the problem and urgency, give them the booking link: ${BOOKING_URL}
- Keep every message under 45 words. No emojis. No markdown.
- If it is a life-threatening emergency (gas smell, sparking, flooding, no heat in freezing weather),
  tell them to call 911 or shut off the relevant valve/breaker immediately, then still offer the booking link.`;

  const messages = [{ role: "system", content: system }, ...history.slice(-12)];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.4,
      max_tokens: 120,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
  history.push({ role: "assistant", content: reply });
  conversations.set(phone, history);
  return reply;
}

// ---- 1. Twilio voice status callback: fires when a call ends ----
app.post("/voice/status", async (req, res) => {
  res.sendStatus(200); // Twilio wants a fast ack

  const { CallStatus, From, To, CallSid } = req.body;
  const missed = ["no-answer", "busy", "failed", "canceled"].includes(CallStatus);
  if (!missed || !From || !twilioClient) return;

  const opener =
    `Hi, this is ${BUSINESS_NAME} — sorry we missed your call. ` +
    `What can we help you with today?`;

  try {
    await twilioClient.messages.create({ from: TWILIO_NUMBER, to: From, body: opener });
    conversations.set(From, [{ role: "assistant", content: opener }]);
    logLead({ phone: From, to: To, callSid: CallSid, status: CallStatus, stage: "texted" });
    console.log(`[missed] ${From} -> texted back`);
  } catch (err) {
    console.error("[missed] send failed:", err.message);
  }
});

// ---- 2. Inbound SMS: qualify the lead ----
app.post("/sms/inbound", async (req, res) => {
  const from = req.body.From;
  const body = (req.body.Body || "").trim();
  if (!from || !body) return res.type("text/xml").send("<Response/>");

  let reply;
  try {
    reply = await aiReply(from, body);
  } catch (err) {
    console.error("[ai] fallback:", err.message);
    reply = `Got it — thanks. Someone from ${BUSINESS_NAME} will text you shortly. If this is an emergency, call 911.`;
  }

  logLead({ phone: from, message: body, reply, stage: "conversation" });

  // plain-text reply (Twilio accepts TwiML)
  res.type("text/xml").send(`<Response><Message>${escapeXml(reply)}</Message></Response>`);
});

// ---- 3. Optional: notify the owner of a hot lead ----
app.post("/lead/hot", express.json(), async (req, res) => {
  const { phone, summary } = req.body ?? {};
  if (twilioClient && OWNER_PHONE) {
    await twilioClient.messages.create({
      from: TWILIO_NUMBER,
      to: OWNER_PHONE,
      body: `🔥 Hot lead: ${phone}\n${summary ?? ""}`,
    });
  }
  res.json({ ok: true });
});

app.get("/health", (_req, res) => res.json({ ok: true, twilio: !!twilioClient }));

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[c]));
}

app.listen(PORT, () => console.log(`Callback listening on :${PORT}`));
