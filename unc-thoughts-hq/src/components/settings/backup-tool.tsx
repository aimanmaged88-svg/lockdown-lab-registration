"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";

export function BackupTool() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function restore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("Restore will REPLACE current content, analytics, questions, talks and research with the backup. Continue?")) { e.target.value = ""; return; }
    setBusy(true); setMsg(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: text });
      const data = await res.json();
      setMsg(res.ok ? "Restored from backup." : data.error ?? "Restore failed");
      if (res.ok) router.refresh();
    } catch {
      setMsg("Could not read the file.");
    }
    setBusy(false);
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <a className="btn" href="/api/backup" download><Download size={15} /> Download full backup (JSON)</a>
        <label className="btn cursor-pointer">
          <Upload size={15} /> Restore from backup
          <input type="file" accept="application/json,.json" className="hidden" onChange={restore} disabled={busy} />
        </label>
      </div>
      {msg && <p className="text-sm text-grey">{msg}</p>}
    </div>
  );
}
