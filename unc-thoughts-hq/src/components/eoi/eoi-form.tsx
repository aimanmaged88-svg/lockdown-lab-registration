"use client";
import { useState } from "react";
import { submitInterest } from "@/lib/eoi-actions";
import {
  LEVELS, POSITIONS, INTERESTS, FOCUS, TIMES,
  checkInterest, isMinor, type InterestInput,
} from "@/lib/eoi-shared";

const EMPTY: InterestInput = {
  fullName: "", age: "", guardianName: "", guardianPhone: "",
  mobile: "", email: "", instagram: "", suburb: "",
  level: "", position: "", interest: [], focus: [], focusOther: "",
  bestTime: "", notes: "",
};

function Choice({
  type, name, label, checked, onChange,
}: {
  type: "radio" | "checkbox"; name: string; label: string;
  checked: boolean; onChange: () => void;
}) {
  return (
    <label className={`eoi-choice${checked ? " on" : ""}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} />
      <span className={`eoi-box${type === "radio" ? " round" : ""}`} aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export function EoiForm() {
  const [f, setF] = useState<InterestInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof InterestInput>(k: K, v: InterestInput[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((p) => (p[k as string] ? { ...p, [k as string]: "" } : p));
  };
  const toggle = (k: "interest" | "focus", v: string) =>
    setF((p) => ({
      ...p,
      [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v],
    }));

  const age = Number(f.age);
  const minor = /^\d{1,2}$/.test(f.age.trim()) && isMinor(age);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const local = checkInterest(f);
    if (Object.keys(local).length) {
      setErrors(local);
      const first = document.querySelector<HTMLElement>("[data-bad='1']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    try {
      const res = await submitInterest(f);
      if (res.ok) {
        setDone(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      else setErrors(res.errors);
    } catch {
      setErrors({ form: "That didn't send. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="eoi-done">
        <h2>You&apos;re on the list.</h2>
        <p>All information drops very soon.</p>
        <p className="eoi-sign" style={{ marginTop: "1.6rem" }}>— UNC</p>
      </div>
    );
  }

  const err = (k: string) =>
    errors[k] ? <p className="eoi-err" data-bad="1">{errors[k]}</p> : null;
  const bad = (k: string) => (errors[k] ? " bad" : "");

  return (
    <form onSubmit={send} noValidate>
      <fieldset style={{ border: 0, padding: 0, margin: "0 0 2rem" }}>
        <legend className="eoi-legend">About you</legend>

        <div className="eoi-field">
          <label className="eoi-label" htmlFor="fullName">Full name</label>
          <input id="fullName" className={`eoi-input${bad("fullName")}`} value={f.fullName}
            autoComplete="name" maxLength={80}
            onChange={(e) => set("fullName", e.target.value)} />
          {err("fullName")}
        </div>

        <div className="eoi-field">
          <label className="eoi-label" htmlFor="age">Age</label>
          <input id="age" className={`eoi-input${bad("age")}`} value={f.age}
            inputMode="numeric" maxLength={2} style={{ maxWidth: "7rem" }}
            onChange={(e) => set("age", e.target.value.replace(/\D/g, ""))} />
          {err("age")}
        </div>

        {minor && (
          <>
            <div className="eoi-field">
              <label className="eoi-label" htmlFor="guardianName">Parent or guardian name</label>
              <input id="guardianName" className={`eoi-input${bad("guardianName")}`} value={f.guardianName}
                maxLength={80} onChange={(e) => set("guardianName", e.target.value)} />
              {err("guardianName")}
            </div>
            <div className="eoi-field">
              <label className="eoi-label" htmlFor="guardianPhone">Parent or guardian phone</label>
              <input id="guardianPhone" className={`eoi-input${bad("guardianPhone")}`} value={f.guardianPhone}
                type="tel" inputMode="tel" maxLength={30}
                onChange={(e) => set("guardianPhone", e.target.value)} />
              {err("guardianPhone")}
            </div>
          </>
        )}

        <div className="eoi-field">
          <label className="eoi-label" htmlFor="mobile">Mobile number</label>
          <input id="mobile" className={`eoi-input${bad("mobile")}`} value={f.mobile}
            type="tel" inputMode="tel" autoComplete="tel" maxLength={30}
            onChange={(e) => set("mobile", e.target.value)} />
          {err("mobile")}
        </div>

        <div className="eoi-field">
          <label className="eoi-label" htmlFor="email">Email</label>
          <input id="email" className={`eoi-input${bad("email")}`} value={f.email}
            type="email" inputMode="email" autoComplete="email" maxLength={120}
            onChange={(e) => set("email", e.target.value)} />
          {err("email")}
        </div>

        <div className="eoi-field">
          <label className="eoi-label" htmlFor="instagram">
            Instagram handle <span className="eoi-opt">(optional)</span>
          </label>
          <input id="instagram" className="eoi-input" value={f.instagram}
            maxLength={40} placeholder="@yourhandle"
            onChange={(e) => set("instagram", e.target.value)} />
        </div>

        <div className="eoi-field">
          <label className="eoi-label" htmlFor="suburb">
            Suburb <span className="eoi-opt">(optional)</span>
          </label>
          <input id="suburb" className="eoi-input" value={f.suburb}
            maxLength={60} onChange={(e) => set("suburb", e.target.value)} />
        </div>
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, margin: "0 0 2rem" }}>
        <legend className="eoi-legend">Your game</legend>

        <div className="eoi-field">
          <span className="eoi-label">Playing level</span>
          <div className="eoi-choices two">
            {LEVELS.map((l) => (
              <Choice key={l} type="radio" name="level" label={l}
                checked={f.level === l} onChange={() => set("level", l)} />
            ))}
          </div>
          {err("level")}
        </div>

        <div className="eoi-field">
          <span className="eoi-label">Position</span>
          <div className="eoi-choices two">
            {POSITIONS.map((p) => (
              <Choice key={p} type="radio" name="position" label={p}
                checked={f.position === p} onChange={() => set("position", p)} />
            ))}
          </div>
          {err("position")}
        </div>
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, margin: "0 0 2rem" }}>
        <legend className="eoi-legend">What you&apos;re after</legend>

        <div className="eoi-field">
          <span className="eoi-label">
            What are you interested in? <span className="eoi-opt">(tick any)</span>
          </span>
          <div className="eoi-choices">
            {INTERESTS.map((i) => (
              <Choice key={i} type="checkbox" name="interest" label={i}
                checked={f.interest.includes(i)} onChange={() => toggle("interest", i)} />
            ))}
          </div>
        </div>

        <div className="eoi-field">
          <span className="eoi-label">
            What do you want to work on? <span className="eoi-opt">(tick any)</span>
          </span>
          <div className="eoi-choices two">
            {FOCUS.map((c) => (
              <Choice key={c} type="checkbox" name="focus" label={c}
                checked={f.focus.includes(c)} onChange={() => toggle("focus", c)} />
            ))}
          </div>
          {f.focus.includes("Other") && (
            <input className="eoi-input" style={{ marginTop: "0.5rem" }} value={f.focusOther}
              maxLength={120} placeholder="Tell him what"
              aria-label="What else do you want to work on"
              onChange={(e) => set("focusOther", e.target.value)} />
          )}
        </div>

        <div className="eoi-field">
          <span className="eoi-label">Best time for sessions</span>
          <div className="eoi-choices">
            {TIMES.map((t) => (
              <Choice key={t} type="radio" name="bestTime" label={t}
                checked={f.bestTime === t} onChange={() => set("bestTime", t)} />
            ))}
          </div>
          {err("bestTime")}
        </div>

        <div className="eoi-field">
          <label className="eoi-label" htmlFor="notes">
            Anything else you want me to know? <span className="eoi-opt">(optional)</span>
          </label>
          <textarea id="notes" className="eoi-area" value={f.notes} maxLength={1000}
            onChange={(e) => set("notes", e.target.value)} />
        </div>
      </fieldset>

      {errors.form && <p className="eoi-err" data-bad="1">{errors.form}</p>}

      <button className="eoi-btn" type="submit" disabled={busy}>
        {busy ? "Sending" : "Register my interest"}
      </button>

      <p className="eoi-note">
        Registering holds nothing and costs nothing. Your details go to UNC only, so he can
        reach you when spots open — they are never sold, shared or posted.
      </p>
    </form>
  );
}
