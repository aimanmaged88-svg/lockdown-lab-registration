"use client";

import * as React from "react";

/**
 * Live "today" label for demo headers, e.g. "Monday 28 July 2026".
 * Resolved after mount so static prerender and hydration stay in sync.
 */
export function useToday(): string {
  const [label, setLabel] = React.useState("Today");
  React.useEffect(() => {
    setLabel(
      new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())
    );
  }, []);
  return label;
}
