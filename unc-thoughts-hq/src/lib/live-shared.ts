// Plain constants + types shared by the server actions and the client
// components. Kept out of live-actions.ts because a "use server" file may only
// export async functions.

export const PAY_KEY = "live.payline";
export const PAY_DEFAULT =
  "Send $10 to PayID aimanmaged88@gmail.com with your name as the reference, then send UNC a screenshot on Instagram @uncthoughts.";

export type LiveSession = {
  id: string; title: string; topic: string | null; blurb: string | null;
  dateText: string | null; timeText: string | null; ageBand: string | null;
  pricePerSeat: number; seatsLeft: number; capacity: number; full: boolean;
};
