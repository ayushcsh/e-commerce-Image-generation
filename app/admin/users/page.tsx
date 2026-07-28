import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const sp = await searchParams;
  const page = parseInt(sp.page || "1");

  return <UsersClient initialPage={page} />;
}
