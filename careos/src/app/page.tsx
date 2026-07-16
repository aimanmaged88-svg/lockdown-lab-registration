import { redirect } from "next/navigation";

/** The root route always lands on the welcome experience. */
export default function RootPage() {
  redirect("/welcome");
}
