# Abbas Payments Ledger

Live: https://abbas-ledger.netlify.app — Netlify site `abbas-ledger` (id 89617109-3d55-49fa-a9a6-a50824e18a62), team Groundworks Studio.

- `index.html` — the whole app (invoices, worker pay, profit, Excel in/out, MYP sync). Data lives in the browser (localStorage).
- `netlify/functions/myp.js` — the MYP bridge, served at `/api/myp`. The only place the MYP secret is used.

## Connecting MYP (one-time)

1. MYP → **CRM → Administration → API applications** → register "Payments Ledger" → copy Client ID + Client Secret (the secret shows once).
2. Netlify → abbas-ledger → **Site configuration → Environment variables** → replace the placeholders in `MYP_CLIENT_ID` and `MYP_CLIENT_SECRET`, then **Deploys → Trigger deploy** so the function picks them up.
3. `LEDGER_PIN` is the PIN the page asks for before it talks to MYP. Change it there any time.

## Deploy

From this folder: `npx -y @netlify/mcp@latest --site-id 89617109-3d55-49fa-a9a6-a50824e18a62 --proxy-path <token from the Netlify MCP deploy-site call>`
(or drag the folder onto app.netlify.com/drop).

MYP API docs: https://developer.mypcorp.com/ — 5,000 calls/day, 100/min; invoices are create-only via the API (no edit/delete yet).
