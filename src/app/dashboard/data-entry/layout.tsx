import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DataEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const role = (session.user as any)?.role;
  if (role !== "DATA_ENTRY" && role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
