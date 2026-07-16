"use client";

import { useQuery } from "@tanstack/react-query";
import { participants, getParticipant } from "@/data/participants";
import { getTimeline } from "@/data/timeline";

/**
 * Server-state hooks.
 *
 * The demo resolves from local fixtures; production swaps the queryFn for
 * Supabase queries without touching a single component. Caching, optimistic
 * updates and offline persistence all live at this layer.
 */

export function useParticipants() {
  return useQuery({
    queryKey: ["participants"],
    queryFn: async () => participants,
  });
}

export function useParticipant(id: string) {
  return useQuery({
    queryKey: ["participants", id],
    queryFn: async () => getParticipant(id) ?? null,
  });
}

export function useParticipantTimeline(id: string) {
  return useQuery({
    queryKey: ["participants", id, "timeline"],
    queryFn: async () => getTimeline(id),
  });
}
