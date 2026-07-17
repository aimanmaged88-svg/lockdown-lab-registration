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
