# Callback

Missed-call text-back for home-service businesses. A plumber misses a call on a roof →
the caller gets a text in ~8 seconds → the AI qualifies the job → a booked slot lands on the calendar.

## Why this one

- The buyer already spends $2–10k/mo on ads and *knows* leads are leaking.
- The ROI math is one sentence: "one recovered job pays for the year."
- No app to install, no behaviour change. You forward a number and it works.
- Price is $149–499/mo, so ~10 customers ≈ $3k MRR, ~100 ≈ $30k MRR with near-zero COGS.

## Files

| File | What it is |
|---|---|
| `index.html` | Landing page + interactive demo + ROI calculator. Deploy anywhere static. |
| `server.js` | Twilio voice-status webhook → SMS, inbound SMS → AI qualification. |
| `demo.mjs` | Runs the whole flow end-to-end offline. `node demo.mjs`. |
| `MONEY.md` | The plan, the unit economics, the first 90 days. |
| `.env.example` | Config. |

## See it work (no keys, no network)

```bash
node demo.mjs
```

Runs a simulated ring-out on a fake plumbing line, the 8-second text-back, and a full
qualification conversation. Same handlers as production; only the Twilio client is mocked.

> **Before your first customer:** register a US A2P 10DLC campaign in Twilio. Carriers
> will silently drop unregistered business SMS. It takes a few days and ~$4/mo.
> Use the shop's trade name in the message, never "AI assistant".

## Run it for real

```bash
cd callback
cp .env.example .env      # fill in keys
npm install
npm start
open index.html           # or: npx serve .
```

Point Twilio at it while developing:

```bash
ngrok http 3000
```

Then in the Twilio console, on your number:

- **Voice → "Call status changes"** → `https://<ngrok>/voice/status`
- **Messaging → "A message comes in"** → `https://<ngrok>/sms/inbound`

Call your number, let it ring out, and you'll get the text-back.

## Deploy

Any Node host works (Render, Fly, Railway, a $5 VPS). Static page → Vercel/Netlify/Cloudflare Pages.
Cost at 100 customers: one small instance + Twilio SMS (~$0.008/msg) + gpt-4o-mini. COGS is single-digit dollars per customer.

## What's not done yet (deliberately)

- Billing — use Stripe Payment Links; no code needed for the first 20 customers.
- Calendar write-back — the AI sends a booking link (Cal.com) instead of writing to Google Calendar. Do that after someone pays for it.
- Auth/dashboard — not needed until you have ~10 customers asking for it.

Ship the ugly version. The bottleneck is the first paying customer, not the code.
