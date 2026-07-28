import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PlansClient from "./PlansClient";

export default async function PlansPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  return <PlansClient />;
}
