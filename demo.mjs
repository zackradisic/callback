// End-to-end demo of the missed-call flow. No Twilio number, no API key, no network.
//   node demo.mjs
// Simulates a ring-out on a plumber's line, then the SMS conversation that follows.
// The exact same code path runs in production; only the Twilio client is mocked.

import { spawn } from "node:child_process";

const PORT = 4123;
const BASE = `http://127.0.0.1:${PORT}`;
const CUSTOMER = "+14155550123";

const child = spawn(process.execPath, ["server.js"], {
  env: { ...process.env, PORT: String(PORT), MOCK_TWILIO: "1", MOCK_AI: "1", BUSINESS_NAME: "Ridgeline Plumbing", BOOKING_URL: "https://cal.com/ridgeline/service-call" },
  stdio: ["ignore", "pipe", "pipe"],
});

child.stdout.on("data", (b) => process.stdout.write(b));
child.stderr.on("data", (b) => process.stdout.write(b));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error("server did not start");
}

async function sms(body) {
  const r = await fetch(`${BASE}/sms/inbound`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: CUSTOMER, Body: body }),
  });
  const xml = await r.text();
  return xml
    .replace(/^.*<Message>/, "")
    .replace(/<\/Message>.*$/, "")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

try {
  await waitForServer();

  console.log("\n--- 2:14pm: someone calls the shop, nobody picks up ---\n");

  // Twilio would POST this when the call ends. Same handler.
  await fetch(`${BASE}/voice/status`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ CallStatus: "no-answer", From: CUSTOMER, To: "+14155550142", CallSid: "CA_mock" }),
  });
  await sleep(400);

  const turns = [
    "water heater is leaking, there's water all over the garage floor",
    "94110, and yeah it's leaking pretty fast",
    "ok booked for 3pm, thanks",
  ];

  for (const t of turns) {
    console.log(`\n[customer] ${t}`);
    const reply = await sms(t);
    console.log(`[shop]     ${reply}`);
    await sleep(250);
  }

  console.log("\n--- lead log ---");
  const fs = await import("node:fs");
  console.log(fs.readFileSync("leads.jsonl", "utf8").trim().split("\n").slice(-5).join("\n"));
} finally {
  child.kill();
}
