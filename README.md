# golflessonnearme.com

John Hughes Golf landing page for golfers anywhere who search for golf lessons near them. Same build as the other John Hughes Golf pages (static page served by a Cloudflare Worker, which also handles the form and sends it to the ActiveCampaign API), with its own list and tag and one extra form question.

## What's in this folder

| File | What it does |
| --- | --- |
| `index.html` | The page: copy, form, thank-you message, search markup (local business and FAQ) |
| `styles.css` | All styling. Brand colors: deep purple, orange, light lavender |
| `app.js` | Form behavior: fills hidden tracking fields, checks required fields, sends the form, shows the thank-you message |
| `wrangler.jsonc` | Cloudflare Worker settings: account, custom domains, and the ActiveCampaign IDs (nothing secret) |
| `worker.js` | Worker entry: sends www to the bare domain, routes `/api/request-call` to the form handler, serves everything else from the folder |
| `functions/api/request-call.js` | Form handler at `/api/request-call`. Checks Turnstile, validates, sends the lead to ActiveCampaign |
| `.assetsignore` | Files in the repo that are never served to visitors |
| `thank-you.html` | Shown only if a visitor has JavaScript turned off and the form posts normally |
| `_redirects` | Forwards /privacy.html to the John Hughes Golf Privacy Policy and Terms of Service on johnhughesgolf.com |
| `_headers` | Security headers, including a content security policy that allows Turnstile, Google Fonts and Cloudflare Web Analytics |
| `robots.txt`, `sitemap.xml` | Search engine files |
| `favicon.svg` | Placeholder icon. Replace with the John Hughes Golf mark |
| `images/` | `hero.jpg` (900 x 1100, portrait) and `john-headshot.jpg` (480 x 560) |
| `redirects.csv` | The 4 "near me" domains that 301-redirect here, plus www to the bare domain |

No build step. No dependencies.

## Before launch: placeholders to replace

1. `favicon.svg`, if you want the real logo mark.

## 1. Deploy on Cloudflare Workers

The site is a Cloudflare Worker named `golflessonnearme-com`, set up the same way as orlandovipgolf.com.

1. Push this folder to the GitHub repository.
2. First deploy: `npx wrangler deploy` from this folder. The custom domains in `wrangler.jsonc` are attached and their DNS records are created automatically. The domain must be on Cloudflare in the same account.
3. Automatic deploys: Cloudflare dashboard > Workers & Pages > `golflessonnearme-com` > Settings > Builds > Connect, pick the repository and branch `main`. Leave the build command empty; the deploy command is `npx wrangler deploy`.

## 2. Turnstile (spam protection)

1. Cloudflare dashboard > Turnstile > Add widget.
2. Hostnames: `golflessonnearme.com` (and the `*.workers.dev` hostname, if you want to test there).
3. Widget mode: Managed. The page uses `data-appearance="interaction-only"`, so most visitors never see it.
4. Put the **site key** in `index.html`. Put the **secret key** in the Worker secret `TURNSTILE_SECRET_KEY` (below).

## 3. ActiveCampaign setup

No ActiveCampaign form is needed. The page has its own form and talks to ActiveCampaign through its API. The list, tag and fields below already exist; only the API URL and key still need to come from ActiveCampaign > Settings > Developer.

**List:** GolfLessonNearMe.com Lead List (already created, list ID **16**)

**Tag:** `LP-golflessonnearme` (already created, tag ID **155**). Adding this tag is what starts the automation, so the function adds it last, after every field and the note are saved.

**Custom contact fields** (already created as text fields and available on all lists; IDs are in section 4):

| Field name | Values the form sends |
| --- | --- |
| Best Time to Call | Morning, Afternoon, Evening |
| Lesson Interest | Hourly golf coaching session, Custom Coaching Membership, One-to-one golf school, Not sure yet |
| Coaching Format | In person in Orlando, Virtually from home, Have John travel to me (field ID 59, already created) |
| Start Timing | This week, This month, Just exploring |
| Typical Score | Under 80, 80 to 89, 90 to 99, 100 or more, New to golf |
| Golf Goal | Free text, up to 300 characters |
| Lead Source Domain | The domain the golfer was on, for example golflessonnearme.com |
| UTM Campaign | Campaign codes from the link, for example utm_source=facebook&utm_campaign=fall |
| Contact Consent | "Yes", the date and time, and the domain |

The function also adds a **note** to the contact with every answer, so John sees everything even if a field ID is missing.

**Automation:** trigger "Tag is added: LP-golflessonnearme". Steps:
1. Send the golfer the confirmation email (copy is in the content doc).
2. Notify John by email (and by text, through ActiveCampaign SMS or an email-to-text address), including Best Time to Call, Lesson Interest and Start Timing.
3. Optional: create a deal in the John Hughes Golf pipeline at the "Call requested" stage.

**Finding IDs:**
- API URL and key: ActiveCampaign > Settings > Developer.
- List ID: open the list; the number is in the address bar.
- Tag ID and field IDs: with the API key, `GET {API_URL}/api/3/tags?search=LP-golflessonnearme` and `GET {API_URL}/api/3/fields`, or look in the address bar when editing them.

## 4. Worker variables and secrets

The IDs below are in `wrangler.jsonc` under `vars`. The two keys are Worker secrets (dashboard > the Worker > Settings > Variables and Secrets, or `npx wrangler secret put NAME`) and must never go in the repo. `keep_vars` stops a deploy from wiping anything set in the dashboard.

| Variable | Value | Required |
| --- | --- | --- |
| `TURNSTILE_SECRET_KEY` | from Turnstile | Yes, secret |
| `AC_API_URL` | `https://johnhughesgolf.api-us1.com` | Yes |
| `AC_API_KEY` | from ActiveCampaign | Yes, secret |
| `AC_LIST_ID` | `16` | Yes |
| `AC_TAG_ID` | `155` | Yes |
| `AC_FIELD_BEST_TIME` | `48` | Recommended |
| `AC_FIELD_INTEREST` | `49` | Recommended |
| `AC_FIELD_START_TIMING` | `50` | Recommended |
| `AC_FIELD_COACHING_FORMAT` | `59` | Recommended |
| `AC_FIELD_SCORE` | `51` | Optional |
| `AC_FIELD_GOAL` | `52` | Optional |
| `AC_FIELD_SOURCE_DOMAIN` | `53` | Recommended |
| `AC_FIELD_UTM` | `54` | Optional |
| `AC_FIELD_CONSENT` | `55` | Recommended |

Any field variable left blank is skipped. Redeploy after changing `wrangler.jsonc`.

## 5. Test end to end

1. Submit the form on the live site with your own details.
2. Check: contact in ActiveCampaign with fields filled in, on the GolfLessonNearMe.com Lead List, tagged, with a note.
3. Check: confirmation email arrived, and John's alert arrived.
4. Check a bad submission (wrong email) shows a clear message on the page.
5. If something fails, Cloudflare > the Worker > Logs (or `npx wrangler tail`) shows the reason.

## 6. Redirects

www.golflessonnearme.com already redirects to the bare domain inside `worker.js`, so the www row in `redirects.csv` is optional.

1. Add each domain in `redirects.csv` to Cloudflare and switch its nameservers at GoDaddy.
2. In each zone, add a proxied DNS record so traffic reaches Cloudflare: type `AAAA`, name `@`, value `100::`, proxied. Add the same for `www`.
3. Account Home > Bulk Redirects > create a list from `redirects.csv` (delete the header row if the import rejects it), then create a Bulk Redirect rule that uses the list.
4. Settings in the file: 301, keep query strings (so campaign codes survive), include subdomains (covers www), send every path to the home page.

## 7. Analytics

Turn on Cloudflare Web Analytics for the Worker (no code change; the content security policy already allows it). If you add Google Analytics later, add its domains to `_headers`. The page already fires a `call_requested` event into `dataLayer` and `gtag` when a request goes through.
