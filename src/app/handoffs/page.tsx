import { redirect } from "next/navigation";

export default function HandoffsPage() {
  redirect("/inbox?tab=handoffs");
}
