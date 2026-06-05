import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import Sidebar from "@/components/layout/Sidebar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import UserMenu from "@/components/layout/UserMenu";
import HelpButton from "@/components/layout/HelpButton";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PermissionProvider } from "@/components/providers/PermissionProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch latest user details (such as profile photo 'foto') from the database
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.id),
  });

  const userName = dbUser?.nama_user ?? session.nama_user;
  const jabatan = dbUser?.id_jabatan ? (session.jabatan ?? "—") : "—";
  const foto = dbUser?.foto ?? null;

  return (
    <PermissionProvider idJabatan={dbUser?.id_jabatan ?? null}>
      <div className="min-h-screen bg-background text-on-background">
        <Sidebar
          userName={userName}
          jabatan={jabatan}
        />

        {/* Main content area - offset for sidebar */}
        <div className="lg:pl-[var(--sidebar-width,16rem)] transition-all duration-300 ease-in-out">
          {/* Top bar */}
          <header className="sticky top-0 z-20 bg-surface-container/80 backdrop-blur-md border-b border-outline-variant/40 px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="pl-10 lg:pl-0">
                {/* Breadcrumb placeholder - children can override */}
              </div>
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <span className="hidden sm:inline">
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="text-outline-variant">|</span>
                <UserMenu 
                  userName={userName}
                  jabatan={jabatan}
                  foto={foto}
                />
                <span className="text-outline-variant">|</span>
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-6">{children}</main>
          
          {/* Floating Help & Guide Manual */}
          <HelpButton />
        </div>
      </div>
    </PermissionProvider>
  );
}
