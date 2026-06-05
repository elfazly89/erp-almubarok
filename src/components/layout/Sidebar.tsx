"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import { usePermissions } from "@/components/providers/PermissionProvider";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  ShoppingBag,
  BookOpen,
  Building2,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Clock,
  CalendarDays,
  FileText,
  Wallet,
  CalendarOff,
  UserCheck,
  Layers,
  Plus,
  ArrowLeftRight,
  Send,
  Inbox,
  AlertTriangle,
  Tags,
  CreditCard,
} from "lucide-react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string; icon: React.ReactNode }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "HRD & Abdi",
    icon: <Users className="w-5 h-5" />,
    children: [
      { label: "Daftar Abdi", href: "/hrd/users", icon: <Users className="w-4 h-4" /> },
      { label: "Absensi", href: "/hrd/absensi", icon: <UserCheck className="w-4 h-4" /> },
      { label: "Jabatan", href: "/hrd/jabatan", icon: <FileText className="w-4 h-4" /> },
      { label: "Jam Kerja", href: "/hrd/jam-kerja", icon: <Clock className="w-4 h-4" /> },
      { label: "Hari Libur", href: "/hrd/hari-libur", icon: <CalendarOff className="w-4 h-4" /> },
      { label: "Izin & Cuti", href: "/hrd/izin-cuti", icon: <CalendarDays className="w-4 h-4" /> },
      { label: "Hutang Abdi", href: "/hrd/hutang", icon: <CreditCard className="w-4 h-4" /> },
      { label: "Bisyaroh", href: "/hrd/bisyaroh", icon: <Wallet className="w-4 h-4" /> },
    ],
  },
  {
    label: "Barang",
    icon: <Package className="w-5 h-5" />,
    children: [
      { label: "Data Barang", href: "/barang", icon: <Package className="w-4 h-4" /> },
      { label: "Kategori", href: "/kategori", icon: <FileText className="w-4 h-4" /> },
      { label: "Supplier", href: "/supplier", icon: <Users className="w-4 h-4" /> },
      { label: "Stok Barang", href: "/stok", icon: <Layers className="w-4 h-4" /> },
    ],
  },
  {
    label: "Penjualan",
    icon: <ShoppingCart className="w-5 h-5" />,
    children: [
      { label: "Kasir POS", href: "/penjualan/pos", icon: <ShoppingCart className="w-4 h-4" /> },
      { label: "Riwayat Nota", href: "/penjualan/history", icon: <FileText className="w-4 h-4" /> },
      { label: "Manajemen Promo", href: "/penjualan/promo", icon: <Tags className="w-4 h-4" /> },
    ],
  },
  {
    label: "Pelanggan",
    icon: <Users className="w-5 h-5" />,
    children: [
      { label: "Daftar Pelanggan", href: "/pelanggan", icon: <Users className="w-4 h-4" /> },
      { label: "Riwayat Poin", href: "/pelanggan/poin", icon: <Clock className="w-4 h-4" /> },
    ],
  },
  {
    label: "Pembelian",
    icon: <ShoppingBag className="w-5 h-5" />,
    children: [
      { label: "Purchase Order (PO)", href: "/pembelian/po", icon: <FileText className="w-4 h-4" /> },
      { label: "Faktur Beli", href: "/pembelian/invoice", icon: <Plus className="w-4 h-4" /> },
      { label: "Riwayat Faktur", href: "/pembelian/history", icon: <ShoppingBag className="w-4 h-4" /> },
      { label: "Hutang Supplier", href: "/pembelian/hutang", icon: <Wallet className="w-4 h-4" /> },
    ],
  },
  {
    label: "Mutasi Stok",
    icon: <ArrowLeftRight className="w-5 h-5" />,
    children: [
      { label: "Permintaan Barang", href: "/mutasi/request", icon: <FileText className="w-4 h-4" /> },
      { label: "Kirim Barang", href: "/mutasi/kirim", icon: <Send className="w-4 h-4" /> },
      { label: "Terima Barang", href: "/mutasi/terima", icon: <Inbox className="w-4 h-4" /> },
      { label: "Selisih Kiriman", href: "/mutasi/selisih", icon: <AlertTriangle className="w-4 h-4" /> },
    ],
  },
  {
    label: "Akuntansi",
    icon: <BookOpen className="w-5 h-5" />,
    children: [
      { label: "Jurnal Umum", href: "/akuntansi/jurnal", icon: <BookOpen className="w-4 h-4" /> },
      { label: "Daftar Akun (CoA)", href: "/akuntansi/coa", icon: <FileText className="w-4 h-4" /> },
      { label: "Tipe Akun", href: "/akuntansi/tipe", icon: <Tags className="w-4 h-4" /> },
      { label: "Buku Besar & Laporan", href: "/akuntansi/laporan", icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    label: "Cabang",
    href: "/cabang",
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    label: "Pengaturan",
    icon: <Settings className="w-5 h-5" />,
    children: [
      { label: "Role Menu", href: "/pengaturan/role-menu", icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

interface SidebarProps {
  userName: string;
  jabatan: string;
}

interface SidebarContentProps {
  userName: string;
  jabatan: string;
  pathname: string;
  openMenus: string[];
  toggleMenu: (label: string) => void;
  onLinkClick: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

function checkActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

function SidebarContent({
  userName,
  jabatan,
  pathname,
  openMenus,
  toggleMenu,
  onLinkClick,
  isCollapsed,
  toggleCollapse,
}: SidebarContentProps) {
  const { hasAccess, loading } = usePermissions();

  const filteredItems = NAV_ITEMS.map((item) => {
    if (item.href) {
      return hasAccess(item.href) ? item : null;
    }

    const visibleChildren = item.children?.filter((child) => hasAccess(child.href)) || [];
    if (visibleChildren.length > 0) {
      return {
        ...item,
        children: visibleChildren,
      };
    }

    return null;
  }).filter((item): item is NavItem => item !== null);

  return (
    <div className="flex flex-col h-full bg-surface-container-low transition-all duration-300">
      {/* Logo */}
      <div className={cn(
        "py-3 border-b border-outline-variant/40 flex items-center transition-all duration-300",
        isCollapsed ? "px-4 justify-center" : "px-5"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <Logo size="sm" className="transition-transform duration-300 hover:scale-105" />
          <div className={cn(
            "transition-all duration-300 origin-left flex flex-col",
            isCollapsed ? "opacity-0 w-0 scale-0 pointer-events-none hidden" : "opacity-100 w-auto scale-100"
          )}>
            <p className="font-bold text-on-surface text-sm leading-tight truncate">ERP Al-Mubarok</p>
            <p className="text-on-surface-variant text-[10px] tracking-wider font-semibold">Sistem Manajemen</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1 scrollbar-none">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs text-on-surface-variant/60">
            Memuat menu...
          </div>
        ) : (
          filteredItems.map((item) => {
          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onLinkClick}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isCollapsed ? "justify-center" : "",
                  checkActive(pathname, item.href)
                    ? "bg-primary/10 text-primary border border-primary/25 font-semibold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                )}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                <span className={cn(
                  "transition-all duration-300 origin-left truncate",
                  isCollapsed ? "opacity-0 w-0 scale-0 pointer-events-none hidden" : "opacity-100 w-auto scale-100"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          }

          const isOpen = openMenus.includes(item.label);
          const hasActive = item.children?.some((c) => checkActive(pathname, c.href));

          return (
            <div key={item.label}>
              <button
                onClick={() => {
                  if (isCollapsed) {
                    toggleCollapse();
                    if (!isOpen) toggleMenu(item.label);
                  } else {
                    toggleMenu(item.label);
                  }
                }}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isCollapsed ? "justify-center" : "",
                  hasActive
                    ? "text-primary font-bold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                )}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                <span className={cn(
                  "flex-1 text-left transition-all duration-300 origin-left truncate",
                  isCollapsed ? "opacity-0 w-0 scale-0 pointer-events-none hidden" : "opacity-100 w-auto scale-100"
                )}>
                  {item.label}
                </span>
                {!isCollapsed && (
                  <div className="flex-shrink-0">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                )}
              </button>

              {!isCollapsed && isOpen && item.children && (
                <div className="ml-3 mt-1 space-y-1 border-l border-outline-variant/40 pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onLinkClick}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                        checkActive(pathname, child.href)
                          ? "bg-primary/15 text-primary font-semibold"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60"
                      )}
                    >
                      <div className="flex-shrink-0">{child.icon}</div>
                      <span className="truncate">{child.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })
       )}
      </nav>
    </div>
  );
}

export default function Sidebar({ userName, jabatan }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<string[]>(["HRD & Abdi"]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const visualCollapsed = isCollapsed && !isHovered;

  // Initialize and persist state from localStorage on client side
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed") === "true";
    setIsCollapsed(saved);
    document.documentElement.style.setProperty(
      "--sidebar-width",
      saved ? "5rem" : "16rem"
    );
    document.documentElement.style.setProperty(
      "--visual-sidebar-width",
      saved ? "5rem" : "16rem"
    );
  }, []);

  // Update CSS variables when manual collapse or hover state changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "5rem" : "16rem"
    );
    document.documentElement.style.setProperty(
      "--visual-sidebar-width",
      visualCollapsed ? "5rem" : "16rem"
    );
  }, [isCollapsed, visualCollapsed]);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  // Auto-open the parent menu when navigating directly to a sub-menu
  useEffect(() => {
    const activeItem = NAV_ITEMS.find((item) =>
      item.children?.some((child) => checkActive(pathname, child.href))
    );
    if (activeItem) {
      setOpenMenus([activeItem.label]);
    }
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? [] : [label]
    );
  };

  const sharedProps = {
    userName,
    jabatan,
    pathname,
    openMenus,
    toggleMenu,
    onLinkClick: () => setMobileOpen(false),
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-surface border border-outline-variant p-2 rounded-lg text-on-surface-variant hover:text-on-surface"
        onClick={() => setMobileOpen((s) => !s)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop sidebar with dynamic width and hover expand/collapse */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "hidden lg:flex flex-col w-[var(--visual-sidebar-width,16rem)] min-h-screen bg-surface-container-low border-r border-outline-variant/40 fixed top-0 left-0 z-30 transition-all duration-300 ease-in-out",
          isCollapsed && isHovered ? "shadow-2xl border-r border-primary/20 z-40" : "shadow-none"
        )}
      >
        <SidebarContent 
          {...sharedProps} 
          isCollapsed={visualCollapsed} 
          toggleCollapse={toggleCollapse} 
        />
      </aside>

      {/* Desktop Floating Toggle Button */}
      <button
        onClick={toggleCollapse}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="hidden lg:flex fixed top-6 left-[calc(var(--visual-sidebar-width,16rem)-12px)] z-40 w-6 h-6 bg-surface/85 backdrop-blur-md border border-outline-variant rounded-full items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-surface-container-high transition-all duration-300 ease-in-out shadow-md cursor-pointer hover:scale-105"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Mobile sidebar (always expanded in drawer overlay) */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex flex-col w-72 h-full bg-surface-container-low border-r border-outline-variant/40 transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent 
          {...sharedProps} 
          isCollapsed={false} 
          toggleCollapse={() => {}} 
        />
      </aside>
    </>
  );
}
