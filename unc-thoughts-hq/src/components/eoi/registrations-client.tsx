"use client";
import { useMemo, useState } from "react";
import type { InterestRow } from "@/lib/eoi-shared";

type Filter = "all" | "group" | "one" | "under18";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "group", label: "Group sessions" },
  { id: "one", label: "One-on-ones" },
  { id: "under18", label: "Under 18" },
];

// "Both" counts for the group list AND the one-on-one list — that's what he
// ticked it to mean.
function wantsGroup(r: InterestRow) {
  return r.interest.includes("Group sessions") || r.interest.includes("Both");
}
function wantsOne(r: InterestRow) {
  return r.interest.includes("One-on-ones") || r.interest.includes("Both");
}

const COLUMNS = [
  "Registered", "Name", "Age", "Mobile", "Email", "Parent/guardian", "Guardian phone",
  "Instagram", "Suburb", "Level", "Position", "Interested in", "Wants to work on",
  "Best time", "Notes",
];

function cells(r: InterestRow): string[] {
  const focus = r.focus
    .map((x) => (x === "Other" && r.focusOther ? `Other: ${r.focusOther}` : x))
    .join("; ");
  return [
    new Date(r.at).toLocaleString("en-AU", { timeZone: "Australia/Sydney" }),
    r.fullName, String(r.age), r.mobile, r.email,
    r.guardianName ?? "", r.guardianPhone ?? "",
    r.instagram ? "@" + r.instagram : "", r.suburb ?? "",
    r.level, r.position, r.interest.join("; "), focus, r.bestTime, r.notes ?? "",
  ];
}

function csvCell(v: string): string {
  // A leading =, +, - or @ makes a spreadsheet treat the text as a formula.
  const safe = /^[=+\-@]/.test(v) ? "'" + v : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function RegistrationsClient({ rows }: { rows: InterestRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "group" && !wantsGroup(r)) return false;
      if (filter === "one" && !wantsOne(r)) return false;
      if (filter === "under18" && r.age >= 18) return false;
      if (needle) {
        const hay = `${r.fullName} ${r.email} ${r.mobile} ${r.suburb ?? ""} ${r.instagram ?? ""}`;
        if (!hay.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [rows, filter, q]);

  const counts = useMemo(() => ({
    all: rows.length,
    group: rows.filter(wantsGroup).length,
    one: rows.filter(wantsOne).length,
    under18: rows.filter((r) => r.age < 18).length,
  }), [rows]);

  function exportCsv() {
    const body = [COLUMNS, ...shown.map(cells)]
      .map((line) => line.map(csvCell).join(","))
      .join("\r\n");
    // The BOM is what makes Excel open the accents and the dashes correctly.
    const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `unc-coaching-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="eoi" style={{ minHeight: 0, padding: "1.25rem", border: "1px solid rgba(255,255,255,0.24)" }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="eoi-stat"><b>{counts.all}</b><span>Registered</span></div>
        <div className="eoi-stat"><b>{counts.group}</b><span>Want group</span></div>
        <div className="eoi-stat"><b>{counts.one}</b><span>Want one-on-one</span></div>
        <div className="eoi-stat"><b>{counts.under18}</b><span>Under 18</span></div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`eoi-btn${filter === f.id ? "" : " ghost"}`}
            style={{ width: "auto", padding: "0.6rem 0.9rem", fontSize: "0.75rem" }}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
          >
            {f.label} ({counts[f.id]})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mt-3 items-center">
        <input
          className="eoi-input" style={{ flex: "1 1 14rem", width: "auto" }}
          placeholder="Search name, email, mobile, suburb" value={q}
          aria-label="Search registrations"
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="eoi-btn" style={{ width: "auto", padding: "0.85rem 1.1rem", fontSize: "0.78rem" }}
          onClick={exportCsv} disabled={shown.length === 0}
        >
          Export CSV ({shown.length})
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="eoi-note" style={{ marginTop: "1.5rem" }}>
          Nobody has registered yet. Send them to /coaching and they&apos;ll land here.
        </p>
      ) : shown.length === 0 ? (
        <p className="eoi-note" style={{ marginTop: "1.5rem" }}>Nothing matches that.</p>
      ) : (
        <div className="eoi-scroll" style={{ marginTop: "1rem", maxHeight: "70vh", overflowY: "auto" }}>
          <table className="eoi-table">
            <thead>
              <tr>{COLUMNS.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const c = cells(r);
                return (
                  <tr key={r.id}>
                    {c.map((v, i) => (
                      <td key={i} className={COLUMNS[i] === "Notes" || COLUMNS[i] === "Wants to work on" ? "wrap" : undefined}>
                        {COLUMNS[i] === "Interested in" || COLUMNS[i] === "Wants to work on"
                          ? v.split("; ").filter(Boolean).map((t) => <span key={t} className="eoi-tag">{t}</span>)
                          : v || "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
