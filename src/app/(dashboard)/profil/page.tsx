import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users, cabang, jabatan } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProfileForm from "./ProfileForm";

export const metadata = {
  title: "Profil Saya",
  description: "Kelola informasi profil pribadi dan kontak kepegawaian Anda.",
};

export default async function ProfilPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch full user profile details by joining with cabang and jabatan
  const user = await db
    .select({
      id: users.id,
      kode_user: users.kode_user,
      nama_user: users.nama_user,
      tempat_lahir: users.tempat_lahir,
      tanggal_lahir: users.tanggal_lahir,
      no_ktp: users.no_ktp,
      pendidikan_terakhir: users.pendidikan_terakhir,
      riwayat_lembaga: users.riwayat_lembaga,
      riwayat_pekerjaan: users.riwayat_pekerjaan,
      status: users.status,
      no_hp: users.no_hp,
      foto: users.foto,
      tanggal_masuk: users.tanggal_masuk,
      nama_cabang: cabang.nama_cabang,
      jabatan: jabatan.jabatan,
    })
    .from(users)
    .leftJoin(cabang, eq(users.id_cabang, cabang.id_cabang))
    .leftJoin(jabatan, eq(users.id_jabatan, jabatan.id_jabatan))
    .where(eq(users.id, session.id))
    .then((res) => res[0]);

  if (!user) {
    redirect("/login");
  }

  return <ProfileForm user={user} />;
}
