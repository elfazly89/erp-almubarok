import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users, absensi, jabatan } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import {
  Users,
  UserCheck,
  Building2,
  TrendingUp,
  Clock,
  CalendarDays,
} from "lucide-react";

async function getDashboardStats() {
  const today = new Date().toISOString().split("T")[0];

  const [totalUsers] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(sql`status != 'Non-Aktif'`);

  const [absensiHariIni] = await db
    .select({ count: sql<number>`count(distinct user_id)` })
    .from(absensi)
    .where(and(eq(absensi.tanggal, today), eq(absensi.jenis, "masuk")));

  const jabatanList = await db
    .select({
      jabatan: jabatan.jabatan,
      count: sql<number>`count(${users.id})`,
    })
    .from(jabatan)
    .leftJoin(users, eq(jabatan.id_jabatan, users.id_jabatan))
    .groupBy(jabatan.id_jabatan);

  return { totalUsers, absensiHariIni, jabatanList };
}

export default async function DashboardPage() {
  const session = await getServerSession();
  const { totalUsers, absensiHariIni, jabatanList } = await getDashboardStats();

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 text-on-background">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          Dashboard
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Selamat datang, <span className="text-primary font-bold">{session?.nama_user}</span> — {today}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Abdi Aktif"
          value={String(totalUsers?.count ?? 0)}
          subtitle="abdi terdaftar"
          icon={<Users className="w-6 h-6" />}
          color="emerald"
        />
        <StatCard
          title="Hadir Hari Ini"
          value={String(absensiHariIni?.count ?? 0)}
          subtitle={`dari ${totalUsers?.count ?? 0} abdi`}
          icon={<UserCheck className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Cabang Aktif"
          value="2"
          subtitle="cabang beroperasi"
          icon={<Building2 className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Tingkat Kehadiran"
          value={
            totalUsers?.count
              ? `${Math.round(((absensiHariIni?.count ?? 0) / totalUsers.count) * 100)}%`
              : "0%"
          }
          subtitle="hari ini"
          icon={<TrendingUp className="w-6 h-6" />}
          color="amber"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Jabatan Distribution */}
        <div className="xl:col-span-2 bg-surface border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-on-surface">Distribusi Jabatan</h2>
          </div>
          <div className="space-y-3">
            {jabatanList.filter(j => (j.count ?? 0) > 0).map((j) => (
              <div key={j.jabatan} className="flex items-center gap-3">
                <span className="text-on-surface text-sm w-36 truncate font-medium">{j.jabatan}</span>
                <div className="flex-1 bg-surface-container rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((j.count ?? 0) / Math.max(1, totalUsers?.count ?? 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-on-surface-variant text-sm w-8 text-right font-semibold font-mono">{j.count}</span>
              </div>
            ))}
            {jabatanList.filter(j => (j.count ?? 0) > 0).length === 0 && (
              <p className="text-on-surface-variant text-sm text-center py-4">Belum ada data jabatan</p>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-on-surface">Akses Cepat</h2>
          </div>
          <div className="space-y-2">
            {[
              { label: "Absensi Hari Ini", href: "/hrd/absensi", desc: "Lihat & kelola absensi" },
              { label: "Daftar Abdi", href: "/hrd/users", desc: "Manajemen abdi" },
              { label: "Izin & Cuti", href: "/hrd/izin-cuti", desc: "Approval pengajuan" },
              { label: "Bisyaroh", href: "/hrd/bisyaroh", desc: "Data penggajian" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-container-high/50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5 group-hover:bg-primary/20 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-on-surface text-sm font-semibold group-hover:text-primary transition-colors">
                    {link.label}
                  </p>
                  <p className="text-on-surface-variant/70 text-xs">{link.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "purple" | "amber";
}) {
  const colors = {
    emerald: "from-primary/15 to-primary/5 border-primary/20 text-primary",
    blue: "from-secondary/15 to-secondary/5 border-secondary/20 text-secondary",
    purple: "from-tertiary/15 to-tertiary/5 border-tertiary/20 text-tertiary",
    amber: "from-primary/25 to-primary/10 border-primary/30 text-primary",
  };

  return (
    <div
      className={`bg-gradient-to-br bg-surface ${colors[color]} border rounded-2xl p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-on-surface mt-2 font-mono">{value}</p>
          <p className="text-on-surface-variant/70 text-xs mt-1">{subtitle}</p>
        </div>
        <div className={`${colors[color].split(" ")[2]}`}>{icon}</div>
      </div>
    </div>
  );
}
