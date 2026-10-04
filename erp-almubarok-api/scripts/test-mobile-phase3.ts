/**
 * Script test manual untuk semua endpoint Mobile Phase 3
 * Jalankan: npx tsx scripts/test-mobile-phase3.ts
 *
 * Pastikan backend sudah berjalan di port 3001 sebelum menjalankan ini.
 */

const BASE_URL = "http://localhost:3001/api";

// ──────────────────────────────────────────────
// Konfigurasi — sesuaikan dengan data di DB Anda
// ──────────────────────────────────────────────
const TEST_USER = {
  kode_user: "admin",   // Ganti dengan kode_user yang valid
  password: "admin123", // Ganti dengan password yang sesuai
};

// Koordinat dummy (sesuaikan dengan koordinat cabang di DB Anda)
const KOORDINAT_VALID = { latitude: "-6.9175", longitude: "107.6191" };

async function request(
  method: string,
  path: string,
  body?: object,
  token?: string
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function log(label: string, result: { status: number; data: any }) {
  const ok = result.status >= 200 && result.status < 300;
  const icon = ok ? "✅" : "❌";
  console.log(`\n${icon} [${result.status}] ${label}`);
  console.log(JSON.stringify(result.data, null, 2));
}

async function main() {
  console.log("=".repeat(60));
  console.log("  TEST MOBILE ENDPOINTS — ERP Al Mubarok Phase 3");
  console.log("=".repeat(60));

  // ── 1. Mobile Login
  console.log("\n📱 1. MOBILE LOGIN");
  const loginRes = await request("POST", "/auth/mobile-login", TEST_USER);
  log("POST /auth/mobile-login", loginRes);

  if (loginRes.status !== 200) {
    console.error("\n⛔ Login gagal. Periksa kode_user dan password di konfigurasi script ini.");
    process.exit(1);
  }

  const { access_token: token, refresh_token: refreshToken } = loginRes.data;
  console.log("\n  🔑 access_token :", token?.substring(0, 40) + "...");
  console.log("  🔄 refresh_token:", refreshToken?.substring(0, 20) + "...");

  // ── 2. Status Absensi
  console.log("\n\n📋 2. STATUS ABSENSI HARI INI");
  log("GET /mobile/absensi/status", await request("GET", "/mobile/absensi/status", undefined, token));

  // ── 3. Check-In GPS
  console.log("\n\n📍 3. CHECK-IN GPS");
  const checkinRes = await request("POST", "/mobile/absensi/check-in", {
    ...KOORDINAT_VALID,
    shift_id: 1,
  }, token);
  log("POST /mobile/absensi/check-in", checkinRes);

  // ── 4. Check-Out GPS
  console.log("\n\n🚪 4. CHECK-OUT GPS");
  log("POST /mobile/absensi/check-out", await request("POST", "/mobile/absensi/check-out", KOORDINAT_VALID, token));

  // ── 5. Riwayat Absensi
  console.log("\n\n📅 5. RIWAYAT ABSENSI BULAN INI");
  const bulan = new Date().getMonth() + 1;
  const tahun = new Date().getFullYear();
  log(`GET /mobile/absensi/riwayat`, await request("GET", `/mobile/absensi/riwayat?bulan=${bulan}&tahun=${tahun}`, undefined, token));

  // ── 6. Ajukan Izin Cuti
  console.log("\n\n📝 6. AJUKAN IZIN CUTI");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  log("POST /mobile/izin-cuti/ajukan", await request("POST", "/mobile/izin-cuti/ajukan", {
    jenis: "Sakit",
    tanggal_mulai: tomorrowStr,
    tanggal_selesai: tomorrowStr,
    keterangan: "Test pengajuan izin dari script",
  }, token));

  // ── 7. Riwayat Izin
  console.log("\n\n📋 7. RIWAYAT IZIN CUTI");
  log("GET /mobile/izin-cuti", await request("GET", "/mobile/izin-cuti", undefined, token));

  // ── 8. Slip Gaji
  console.log("\n\n💰 8. SLIP GAJI");
  log(`GET /mobile/slip-gaji`, await request("GET", `/mobile/slip-gaji?bulan=${bulan}&tahun=${tahun}`, undefined, token));

  // ── 9. Jadwal Shift
  console.log("\n\n⏰ 9. JADWAL SHIFT");
  log("GET /mobile/jadwal-shift", await request("GET", "/mobile/jadwal-shift", undefined, token));

  // ── 10. Profil
  console.log("\n\n👤 10. PROFIL PERSONAL");
  log("GET /mobile/profil", await request("GET", "/mobile/profil", undefined, token));

  // ── 11. Refresh Token
  console.log("\n\n🔄 11. REFRESH TOKEN — Issue access token baru");
  const refreshRes = await request("POST", "/auth/refresh", { refresh_token: refreshToken });
  log("POST /auth/refresh", refreshRes);
  const newRefreshToken = refreshRes.data?.refresh_token;

  // ── 12. Token lama harus ditolak (rotasi)
  console.log("\n\n🔒 12. KEAMANAN — Refresh token LAMA harus ditolak (expect 401)");
  log("POST /auth/refresh (token lama)", await request("POST", "/auth/refresh", { refresh_token: refreshToken }));

  // ── 13. Logout
  console.log("\n\n🚪 13. LOGOUT");
  log("POST /auth/logout", await request("POST", "/auth/logout", { refresh_token: newRefreshToken }));

  // ── 14. Setelah logout harus ditolak
  console.log("\n\n🔒 14. KEAMANAN — Token setelah logout harus ditolak (expect 401)");
  log("POST /auth/refresh (setelah logout)", await request("POST", "/auth/refresh", { refresh_token: newRefreshToken }));

  console.log("\n" + "=".repeat(60));
  console.log("  ✅ SELESAI — Semua endpoint mobile telah diuji");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("\n❌ Test gagal:", err.message);
  process.exit(1);
});
