import { db } from "../src/lib/db";
import { daftar_akun } from "../src/lib/db/schema";
import { ilike, or } from "drizzle-orm";

async function main() {
  const list = await db
    .select()
    .from(daftar_akun)
    .where(
      or(
        ilike(daftar_akun.nama_akun, "%persediaan%"),
        ilike(daftar_akun.nama_akun, "%selisih%"),
        ilike(daftar_akun.nama_akun, "%penyesuaian%"),
        ilike(daftar_akun.nama_akun, "%beban%")
      )
    );
  console.log("Matching CoA:", list.map(a => `${a.id} | ${a.kode_akun} | ${a.nama_akun} | ${a.tipe_akun}`));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

