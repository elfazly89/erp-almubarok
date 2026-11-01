import { getServerSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ModularDashboardClient } from "@/components/dashboard/ModularDashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <ModularDashboardClient
      user={{
        id: session.id,
        nama_user: session.nama_user,
        jabatan: session.jabatan,
        id_cabang: session.id_cabang,
      }}
    />
  );
}
