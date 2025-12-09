import { redirect } from "next/navigation";

export default async function AuthIndex({
  searchParams,
}: { searchParams?: { from?: string } }) {
  const from = searchParams?.from || "/";
  redirect(`/auth/signin?from=${encodeURIComponent(from)}`);
}
