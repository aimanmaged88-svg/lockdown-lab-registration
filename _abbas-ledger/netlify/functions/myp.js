// MYP bridge — the only place the MYP client secret lives.
// Env: MYP_CLIENT_ID, MYP_CLIENT_SECRET (from MYP → CRM → Administration → API applications),
//      LEDGER_PIN (shared PIN the ledger page sends so this endpoint isn't open to the world),
//      MYP_API (optional override, default https://api.mypcorp.com),
//      MYP_IDENTITY (optional override, default https://identity.mypcorp.com/connect/token).

const API = (process.env.MYP_API || "https://api.mypcorp.com").replace(/\/$/, "");
const IDENTITY = process.env.MYP_IDENTITY || "https://identity.mypcorp.com/connect/token";
const PAID_STATUSES = new Set(["NdiaFullyPaid", "Paid"]);

let tokenCache = { token: null, exp: 0 };

const json = (status, body) => ({
  statusCode: status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(body),
});

class MypError extends Error {
  constructor(code, message, detail) { super(message); this.code = code; this.detail = detail; }
}

async function getToken() {
  const id = process.env.MYP_CLIENT_ID, secret = process.env.MYP_CLIENT_SECRET;
  if (!id || !secret || /paste|xxx|your_/i.test(id + secret)) throw new MypError("unconfigured", "MYP credentials aren't set yet");
  if (tokenCache.token && Date.now() < tokenCache.exp - 30_000) return tokenCache.token;
  const r = await fetch(IDENTITY, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret }),
  });
  const text = await r.text();
  if (!r.ok) throw new MypError("auth", "MYP rejected the client ID / secret", text.slice(0, 300));
  const t = JSON.parse(text);
  tokenCache = { token: t.access_token, exp: Date.now() + (t.expires_in || 3600) * 1000 };
  return t.access_token;
}

async function myp(path, { method = "GET", body, query } = {}) {
  const token = await getToken();
  const url = new URL(path.startsWith("http") ? path : API + path);
  if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null) url.searchParams.set(k, v);
  const r = await fetch(url, {
    method,
    headers: {
      authorization: "Bearer " + token,
      "x-mypapi-version": "2.0",
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text.slice(0, 500) }; }
  if (r.status === 429 || r.status === 403 && r.headers.get("retry-after"))
    throw new MypError("ratelimit", "MYP rate limit hit — wait a minute and try again", data);
  if (!r.ok) throw new MypError("myp", `MYP ${method} ${url.pathname} failed (${r.status})`, data);
  return data;
}

// Follow @odata.nextLink until exhausted (MYP pages at 300).
async function list(path, query) {
  const out = [];
  let next = null, first = true, guard = 0;
  while ((first || next) && guard++ < 40) {
    const d = first ? await myp(path, { query }) : await myp(next);
    first = false;
    out.push(...(d?.value || []));
    next = d?.["@odata.nextLink"] || null;
  }
  return out;
}

const full = (p) => [p?.FirstName, p?.LastName].filter(Boolean).join(" ").trim();
const day = (d) => (d ? String(d).slice(0, 10) : "");
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

async function refs() {
  const [contacts, staff, books, centres] = await Promise.all([
    list("/contact", { "$filter": "ArchiveDate eq null", "$select": "ContactGuid,FirstName,LastName,NdisNumber,UniqueCode" }),
    list("/staff", { "$filter": "ArchiveDate eq null", "$select": "StaffGuid,FirstName,LastName,UniqueCode" }),
    list("/pricebook", { "$expand": "Products" }),
    list("/costcentre").catch(() => []),
  ]);
  return {
    contacts: contacts.map(c => ({ guid: c.ContactGuid, name: full(c), ndis: c.NdisNumber || "", code: c.UniqueCode || "" })).filter(c => c.name),
    staff: staff.map(s => ({ guid: s.StaffGuid, name: full(s), code: s.UniqueCode || "" })).filter(s => s.name),
    pricebooks: books.map(b => ({
      guid: b.PriceBookGuid, name: b.Name,
      products: (b.Products || []).map(p => ({ guid: p.ProductGuid, code: p.Code || "", name: p.Name || "", price: num(p.Price), gst: !!p.GstInclusive })),
    })),
    costcentres: centres.map(c => ({ guid: c.CostCentreGuid, name: c.Name })),
  };
}

// Pull invoices (+ line items) in a window, plus approved timesheet pay per staff in the same window.
async function pull({ from, to }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(to || "")) throw new MypError("bad", "from/to must be YYYY-MM-DD");
  const [invoices, contacts, staff] = await Promise.all([
    list("/invoice", { "$expand": "LineItems", "$filter": `ArchiveDate eq null and StartDate ge ${from} and StartDate le ${to}`, "$orderby": "StartDate desc" }),
    list("/contact", { "$select": "ContactGuid,FirstName,LastName" }),
    list("/staff", { "$select": "StaffGuid,FirstName,LastName" }),
  ]);
  const cname = Object.fromEntries(contacts.map(c => [c.ContactGuid, full(c)]));
  const sname = Object.fromEntries(staff.map(s => [s.StaffGuid, full(s)]));

  let pay = {}, payNote = "";
  try {
    const ts = await list("/timesheet", {
      "$expand": "*",
      "$filter": `StartDateTime ge ${from}T00:00:00Z and StartDateTime le ${to}T23:59:59Z`,
    });
    for (const t of ts) {
      if (t?.ApprovalStatus?.Status && t.ApprovalStatus.Status !== "Approved") continue;
      const g = t?.Staff?.StaffGuid; if (!g) continue;
      const hours = (t.CostAllocations || []).reduce((a, c) => a + num(c.Hours) * (num(c.Multiplier) || 1) * num(c.PayRatePerHour), 0);
      const allow = (t.Allowances || []).reduce((a, x) => a + num(x.Amount), 0);
      pay[g] = (pay[g] || 0) + hours + allow;
    }
  } catch (e) { payNote = "Timesheets couldn't be read (" + (e.message || e) + ") — worker pay left for you to fill in."; }

  const out = invoices.map(i => {
    const workerGuid = i.StaffGuid;
    return {
      myp: { guid: i.InvoiceGuid, number: i.InvoiceNumber, status: i.GeniusStatus || "", claimType: i.InvoiceClaimType || "", contactGuid: i.ContactGuid, staffGuid: workerGuid, paidAt: day(i.PaymentDateTime || i.PaymentDate) },
      invoiceNo: i.InvoiceNumber || "",
      client: cname[i.ContactGuid] || "",
      amount: num(i.Total) || (i.LineItems || []).reduce((a, l) => a + num(l.Total), 0),
      status: PAID_STATUSES.has(i.GeniusStatus) ? "paid" : "unpaid",
      date: day(i.CreationDate || i.StartDate),
      start: day(i.StartDate), end: day(i.EndDate),
      note: i.GeniusStatus ? "MYP: " + i.GeniusStatus.replace(/([a-z])([A-Z])/g, "$1 $2") : "",
      workers: workerGuid ? [{ name: sname[workerGuid] || "", staffGuid: workerGuid, billed: num(i.Total), paid: 0 }] : [],
      lines: (i.LineItems || []).map(l => ({ notes: l.Notes || "", from: day(l.FromDate), to: day(l.ToDate), qty: num(l.Quantity), price: num(l.Price), total: num(l.Total), product: l.Product?.Name || l.Product?.Code || "" })),
    };
  });
  const payByName = {};
  for (const [g, v] of Object.entries(pay)) if (sname[g]) payByName[sname[g]] = +v.toFixed(2);
  return { invoices: out, pay: payByName, payNote, counts: { invoices: out.length, timesheetStaff: Object.keys(pay).length } };
}

// Create one invoice in MYP. Expects a fully-mapped payload from the page.
async function push(p) {
  const need = (k) => { if (!p?.[k]) throw new MypError("bad", `Missing ${k}`); };
  ["contactGuid", "staffGuid", "start", "end", "lines"].forEach(need);
  if (!Array.isArray(p.lines) || !p.lines.length) throw new MypError("bad", "At least one line item is needed");
  const body = {
    value: [{
      ...(p.invoiceNo ? { InvoiceNumber: String(p.invoiceNo).slice(0, 47) } : {}),
      InvoiceClaimTypeId: p.claimType === "InvoiceToClient" ? 40300 : 40200,
      StartDate: p.start, EndDate: p.end,
      ...(p.due ? { DueDate: p.due } : {}),
      IsRecurring: false, RecurringStartDate: null, RecurringEndDate: null, RecurringFrequencyId: null,
      ContactGuid: p.contactGuid, StaffGuid: p.staffGuid,
      LineItems: p.lines.map(l => {
        if (!l.productGuid || !l.priceBookGuid) throw new MypError("bad", "Every line needs a product and price book");
        return {
          FromDate: l.from || p.start, ToDate: l.to || p.end,
          Quantity: num(l.qty) || 1, Price: num(l.price),
          ...(l.notes ? { Notes: String(l.notes).slice(0, 500) } : {}),
          IsCreditItem: false,
          TaxChoice: l.tax || 34700,
          ClaimType: l.claim || null, CancellationReason: null,
          PriceBook: { PriceBookGuid: l.priceBookGuid },
          Product: { ProductGuid: l.productGuid },
          ...(l.costCentreGuid ? { CostCentre: { CostCentreGuid: l.costCentreGuid } } : {}),
        };
      }),
    }],
  };
  const d = await myp("/invoice", { method: "POST", body, query: { ignoreWarnings: p.ignoreWarnings ? "true" : "false" } });
  const created = Array.isArray(d?.value) ? d.value[0] : (d?.value || d);
  return { ok: true, myp: { guid: created?.InvoiceGuid || "", number: created?.InvoiceNumber || p.invoiceNo || "", status: created?.GeniusStatus || "" }, raw: created };
}

async function status() {
  const configured = !!(process.env.MYP_CLIENT_ID && process.env.MYP_CLIENT_SECRET) && !/paste|xxx|your_/i.test(process.env.MYP_CLIENT_ID + process.env.MYP_CLIENT_SECRET);
  const pinSet = !!process.env.LEDGER_PIN;
  if (!configured) return { configured, pinSet, connected: false };
  try {
    const s = await list("/staff", { "$top": 1, "$select": "StaffGuid" });
    return { configured, pinSet, connected: true, sample: s.length };
  } catch (e) {
    return { configured, pinSet, connected: false, error: e.code || "myp", message: e.message, detail: e.detail };
  }
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204 });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { "content-type": "application/json" } });
  let body = {};
  try { body = await req.json(); } catch { body = {}; }
  const { action, pin } = body;

  const wantPin = process.env.LEDGER_PIN;
  if (wantPin && action !== "status" && String(pin || "") !== String(wantPin))
    return new Response(JSON.stringify({ error: "pin", message: "Wrong ledger PIN" }), { status: 401, headers: { "content-type": "application/json" } });

  try {
    let out;
    if (action === "status") out = await status();
    else if (action === "refs") out = await refs();
    else if (action === "pull") out = await pull(body);
    else if (action === "push") out = await push(body.invoice || {});
    else return new Response(JSON.stringify({ error: "bad", message: "Unknown action" }), { status: 400, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify(out), { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch (e) {
    const code = e.code || "server";
    const st = code === "unconfigured" ? 409 : code === "auth" ? 502 : code === "ratelimit" ? 429 : code === "bad" ? 400 : code === "myp" ? 502 : 500;
    return new Response(JSON.stringify({ error: code, message: e.message || String(e), detail: e.detail || null }), { status: st, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
};

export const config = { path: "/api/myp" };
