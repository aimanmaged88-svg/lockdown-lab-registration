/**
 * The signed-in family for the demo Parent experience.
 *
 * In production this mapping comes from authenticated guardianship records;
 * a parent sees exactly the children linked to their account — nothing else.
 */
export const demoFamily = {
  parentName: "Faraz Normani",
  parentFirstName: "Faraz",
  childrenIds: ["zayd", "idris"] as const,
};

/**
 * Everyone in the boys' family circle has their own private login to the same
 * truth. Parents — together or living apart — never depend on each other (or
 * on the child) to stay informed; grandparents can be given view-only windows.
 * Access is consent-managed by the guardians and every view is audit-logged.
 */
export const familyCircle = [
  { name: "Faraz", relation: "Dad", initials: "FN", access: "Full access", note: "His own login — sees everything shared with family." },
  { name: "Mum", relation: "Mum", initials: "M", access: "Full access", note: "Her own login — the same truth, independently. No middleman." },
  { name: "Grandma", relation: "Grandmother", initials: "G", access: "View-only", note: "Wins and photos only — set by the parents." },
];
