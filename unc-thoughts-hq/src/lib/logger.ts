// Minimal structured logger. JSON lines in production, readable in dev.
type Level = "debug" | "info" | "warn" | "error";

function log(level: Level, msg: string, meta?: Record<string, unknown>) {
  const rec = { t: new Date().toISOString(), level, msg, ...meta };
  if (process.env.NODE_ENV === "production") {
    console[level === "debug" ? "log" : level](JSON.stringify(rec));
  } else {
    const tag = { debug: "·", info: "→", warn: "!", error: "✗" }[level];
    console[level === "debug" ? "log" : level](`${tag} ${msg}`, meta ?? "");
  }
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => log("debug", m, meta),
  info: (m: string, meta?: Record<string, unknown>) => log("info", m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => log("warn", m, meta),
  error: (m: string, meta?: Record<string, unknown>) => log("error", m, meta),
};
