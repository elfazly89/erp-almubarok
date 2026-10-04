import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { TOKEN_COOKIE } from "@/lib/auth/jwt";
import ProfileForm from "./ProfileForm";
import { apiFetch } from "@/lib/api-client";

export const metadata = {
  title: "Profil Saya",
  description: "Kelola informasi profil pribadi dan kontak kepegawaian Anda.",
};

export default async function ProfilPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;

  let user = null;
  try {
    const res = await apiFetch(`/api/hrd/users/${session.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      user = await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch profile:", error);
  }

  if (!user) {
    redirect("/login");
  }

  return <ProfileForm user={user} />;
}
