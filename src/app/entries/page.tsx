import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { EntriesClient } from "./EntriesClient";

export const metadata = {
  title: "Entries | Data Entry Management",
  description: "Manage data entries",
};

export default async function EntriesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <EntriesClient
      user={{
        id: session.user.id,
        name: session.user.name || session.user.fullName,
        email: session.user.email,
        role: session.user.roleName,
      }}
    />
  );
}
