# How this makes a lot of money

Blunt version: sell a **revenue outcome** to businesses that already pay for leads,
where the outcome is measurable in days and the buyer never has to learn software.

The wedge is the missed call. A plumber on a roof misses 10–20 calls a week. Each one
is a $400–$2,000 job walking to the next result on Google. The shop already believes
this — they buy ads. So the pitch is not "try our AI". It's:

> "You missed 14 calls last month. I'll text every one of them back in 8 seconds and
> book the job. If it doesn't recover at least one job in two weeks, don't pay me."

That is a one-sentence sale to someone with a credit card and a phone.

## The economics

| Customers | Price | MRR | ARR |
|---|---|---|---|
| 10 | $299 | $3.0k | $36k |
| 50 | $299 | $15k | $179k |
| 100 | $299 | $30k | $359k |
| 100 | $999 (full phone desk) | $100k | $1.2M |
| 250 | $999 | $250k | $3.0M |

COGS per customer is single-digit dollars: one small server, ~$0.008/SMS, a fraction of
a cent per qualification. Gross margin >95%. No inventory, no office, no employees until
the support load actually hurts.

This is a cash machine, not a unicorn. It will not be worth $1B. It can plausibly pay you
$30–100k/mo within 18–24 months with no funding, and it compounds because the same
customer can buy more of the phone.

## Why it can get big instead of stalling at 5 customers

1. **Land narrow, expand wide.** Missed-call text-back is the door. The same account
   will pay for: after-hours answering, review requests, rebooking past customers,
   quote follow-up. Every one is the same rails (a number + SMS + a calendar).
2. **Verticalize, don't generalize.** Pick one trade at a time — plumbers, then HVAC,
   then electricians, then garages. Same product, different script, different lead list.
   A "plumber phone guy" closes at 10x the rate of a "business automation consultant".
3. **Price on recovered revenue, not seats.** $299 is nothing against one $900 job. Move
   to $999 when you answer the phone, not just the missed calls.
4. **Distribution is boring and it works.** 20 emails/day, 5 days/week, one niche. Plus a
   40-second video of *their* number ringing out and getting texted back. That video is
   the whole sales team.

## The honest risks

- **Crowded category.** Podium, Numa, Sameday, and every answering service sell a version
  of this. You win on: local, no contract, done-for-you setup in 10 minutes, and a
  two-week free pilot. Do not win on features.
- **10DLC / A2P registration.** US carriers require business SMS registration. Twilio
  walks you through it (~$4/mo + one-time fee, a few days). Do this before your first
  customer, not after. This is the #1 thing that kills a launch.
- **Deliverability and trust.** Texts must come from a local number with the shop's name.
  Never look like a robot. The scripted qualifier exists so the product still works when
  the model is down or out of credit.
- **You are the product until ~20 customers.** Setup is a 10-minute call. That is fine.
  It is also your best discovery research.

## The 90-day plan

**Days 1–7 — first dollar.**
- Register 10DLC, buy one local number, point the webhook at the server.
- Pick one trade in one metro. Build a list of 100 shops running Google Ads with no
  online booking. Emails + phone.
- Offer: two weeks free, then $299/mo. Take payment with a Stripe Payment Link. No
  contracts, cancel by text.
- Target: 3 pilots. Not 30. Three.

**Days 8–30 — prove the number.**
- Every pilot gets a weekly text: "4 missed calls, 3 replied, 2 booked, $1,840 recovered."
- That report is the renewal and the referral. Ask every converted customer for two
  shops they know.
- Target: 5 paying. ~$1.5k MRR. Raise price to $399 for customer #5 onward.

**Days 31–90 — make it repeatable.**
- One trade, one script, one landing page, one video. Hire nothing.
- Add the $999 tier: we answer every call, not just the missed ones.
- Target: 20–30 paying, $8–12k MRR. That is the point where you decide whether to keep
  going or sell the book of business.

## Kill criteria (be honest with yourself)

If after 150 targeted emails and 30 phone calls you cannot get 3 free pilots, the offer
is wrong, not the market. Change the offer (free missed-call audit, pay-per-booked-job),
not the product. If pilots get calls but don't convert to paid, the qualification script
is wrong — fix the script, not the ads.

## What is built vs. what is not

Built and tested: missed-call → instant text-back → qualification → booking link →
lead log. Runs with zero external dependencies (`node demo.mjs`).

Not built on purpose: billing (Stripe Payment Links), calendar write-back (booking link
first), dashboard (nobody has asked), multi-tenant (one deployment per customer is fine
for the first 20).
