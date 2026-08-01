import { NextResponse } from "next/server";
import { fullBackup } from "@/lib/exports";

export const runtime = "nodejs";

// Complete JSON backup of this org's data.
export async function GET() {
  try {
    const data = await fullBackup();
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="unc-thoughts-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Backup failed" }, { status: 500 });
  }
}
