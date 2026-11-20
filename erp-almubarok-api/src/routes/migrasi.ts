import { Hono } from "hono";
import { db } from "../lib/db";
import { migrasi_log, cabang, users } from "../lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";
import {
  processUploadAndGeneratePreview,
  commitMigration,
  cancelMigrationJob,
  rollbackMigration,
} from "../services/migrasi.service";

export const migrasiRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// ─── 1. UPLOAD FILE & GENERATE PREVIEW ───────────────────────────────────────
migrasiRoutes.post("/upload", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Sesi tidak valid. Silakan login kembali." }, 401);
  }

  try {
    const body = await c.req.parseBody();
    const file = body["file"];
    const idCabangParam = body["id_cabang"];

    if (!file || !(file instanceof File)) {
      return c.json({ error: "File migrasi (.sql / .csv) wajib diunggah." }, 400);
    }

    if (!idCabangParam) {
      return c.json({ error: "Pilih cabang tujuan migrasi terlebih dahulu." }, 400);
    }

    const idCabang = parseInt(String(idCabangParam));
    if (isNaN(idCabang) || idCabang <= 0) {
      return c.json({ error: "ID Cabang tidak valid." }, 400);
    }

    // Verify branch exists
    const [foundCabang] = await db
      .select()
      .from(cabang)
      .where(eq(cabang.id_cabang, idCabang))
      .limit(1);

    if (!foundCabang) {
      return c.json({ error: "Cabang yang dipilih tidak ditemukan di sistem." }, 404);
    }

    // Check size limit: 100MB
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return c.json({ error: "Ukuran file terlalu besar. Maksimal 100 MB." }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const targetTypeRaw = (body["target_type"] || "AUTO").toString().toUpperCase();
    const targetType = ["AUTO", "MASTER_STOK", "TRANSAKSI"].includes(targetTypeRaw)
      ? (targetTypeRaw as "AUTO" | "MASTER_STOK" | "TRANSAKSI")
      : "AUTO";

    const preview = await processUploadAndGeneratePreview(buffer, file.name, idCabang, targetType);

    return c.json({
      success: true,
      message: "File berhasil dianalisa. Silakan tinjau ringkasan migrasi.",
      data: preview,
    });
  } catch (error: any) {
    console.error("Error processing migration upload:", error);
    return c.json({ error: error.message || "Gagal memproses file migrasi." }, 500);
  }
});

// ─── 2. COMMIT MIGRATION ─────────────────────────────────────────────────────
migrasiRoutes.post("/commit/:job_id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Sesi tidak valid." }, 401);
  }

  const jobId = c.req.param("job_id");
  if (!jobId) {
    return c.json({ error: "Job ID tidak valid." }, 400);
  }

  try {
    const body = await c.req.json().catch(() => ({}));

    const idCabang = parseInt(String(body.id_cabang || user.id_cabang || 1));
    const importMaster = body.import_master !== undefined ? Boolean(body.import_master) : true;
    const importStok = body.import_stok !== undefined ? Boolean(body.import_stok) : true;
    const importTransaksi = body.import_transaksi !== undefined ? Boolean(body.import_transaksi) : true;
    const modeDuplikat = body.mode_duplikat === "UPDATE" ? "UPDATE" : "SKIP";

    const result = await commitMigration({
      job_id: jobId,
      id_cabang: idCabang,
      id_user: user.id,
      import_master: importMaster,
      import_stok: importStok,
      import_transaksi: importTransaksi,
      mode_duplikat: modeDuplikat,
    });

    return c.json({
      success: result.status !== "FAILED",
      message:
        result.status === "SUCCESS"
          ? "Migrasi data berhasil diselesaikan sepenuhnya!"
          : result.status === "PARTIAL"
          ? "Migrasi selesai dengan beberapa catatan atau data yang dilewati."
          : "Migrasi data gagal diproses.",
      data: result,
    });
  } catch (error: any) {
    console.error("Error committing migration:", error);
    return c.json({ error: error.message || "Gagal mengeksekusi migrasi data." }, 500);
  }
});

// ─── 3. CANCEL MIGRATION ─────────────────────────────────────────────────────
migrasiRoutes.delete("/cancel/:job_id", (c) => {
  const jobId = c.req.param("job_id");
  if (jobId) {
    cancelMigrationJob(jobId);
  }
  return c.json({ success: true, message: "Sesi migrasi dibatalkan." });
});

// ─── 4. RIWAYAT LOG MIGRASI ──────────────────────────────────────────────────
migrasiRoutes.get("/log", async (c) => {
  const queryCabang = c.req.query("id_cabang");
  const pageParam = parseInt(c.req.query("page") || "1") || 1;
  const limitParam = parseInt(c.req.query("limit") || "20") || 20;

  const conditions = [];
  if (queryCabang && queryCabang !== "all") {
    conditions.push(eq(migrasi_log.id_cabang, parseInt(queryCabang)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (pageParam - 1) * limitParam;

  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(migrasi_log)
    .where(whereClause);

  const total = Number(countRes?.count || 0);

  const list = await db
    .select({
      id: migrasi_log.id,
      id_cabang: migrasi_log.id_cabang,
      nama_cabang: cabang.nama_cabang,
      id_user: migrasi_log.id_user,
      nama_user: users.nama_user,
      nama_file: migrasi_log.nama_file,
      tipe_migrasi: migrasi_log.tipe_migrasi,
      total_baris: migrasi_log.total_baris,
      berhasil: migrasi_log.berhasil,
      gagal: migrasi_log.gagal,
      detail_summary: migrasi_log.detail_summary,
      status: migrasi_log.status,
      created_at: migrasi_log.created_at,
    })
    .from(migrasi_log)
    .leftJoin(cabang, eq(migrasi_log.id_cabang, cabang.id_cabang))
    .leftJoin(users, eq(migrasi_log.id_user, users.id))
    .where(whereClause)
    .orderBy(desc(migrasi_log.id))
    .limit(limitParam)
    .offset(offset);

  return c.json({
    data: list.map((item) => ({
      ...item,
      summary: item.detail_summary ? JSON.parse(item.detail_summary) : null,
    })),
    pagination: {
      total,
      page: pageParam,
      limit: limitParam,
      totalPages: Math.ceil(total / limitParam),
    },
  });
});

// ─── 5. DETAIL LOG MIGRASI ───────────────────────────────────────────────────
migrasiRoutes.get("/log/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "ID Log tidak valid." }, 400);
  }

  const [log] = await db
    .select({
      id: migrasi_log.id,
      id_cabang: migrasi_log.id_cabang,
      nama_cabang: cabang.nama_cabang,
      id_user: migrasi_log.id_user,
      nama_user: users.nama_user,
      nama_file: migrasi_log.nama_file,
      tipe_migrasi: migrasi_log.tipe_migrasi,
      total_baris: migrasi_log.total_baris,
      berhasil: migrasi_log.berhasil,
      gagal: migrasi_log.gagal,
      detail_error: migrasi_log.detail_error,
      detail_summary: migrasi_log.detail_summary,
      status: migrasi_log.status,
      created_at: migrasi_log.created_at,
    })
    .from(migrasi_log)
    .leftJoin(cabang, eq(migrasi_log.id_cabang, cabang.id_cabang))
    .leftJoin(users, eq(migrasi_log.id_user, users.id))
    .where(eq(migrasi_log.id, id))
    .limit(1);

  if (!log) {
    return c.json({ error: "Log migrasi tidak ditemukan." }, 404);
  }

  return c.json({
    data: {
      ...log,
      summary: log.detail_summary ? JSON.parse(log.detail_summary) : null,
      errors: log.detail_error ? JSON.parse(log.detail_error) : [],
    },
  });
});

// ─── 6. ROLLBACK MIGRATION ───────────────────────────────────────────────────
migrasiRoutes.post("/rollback/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Sesi tidak valid. Silakan login kembali." }, 401);
  }

  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "ID Log tidak valid." }, 400);
  }

  try {
    const result = await rollbackMigration(id, user.id);
    return c.json(result);
  } catch (error: any) {
    console.error("Error rolling back migration:", error);
    return c.json({ error: error.message || "Gagal membatalkan migrasi data." }, 500);
  }
});

