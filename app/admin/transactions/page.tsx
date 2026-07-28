import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const sp = await searchParams;
  const type = sp.type || "all";
  const page = parseInt(sp.page || "1");

  return <TransactionsClient initialType={type} initialPage={page} />;
}
