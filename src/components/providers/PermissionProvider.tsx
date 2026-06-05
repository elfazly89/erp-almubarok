"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

interface MenuPermission {
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface MainMenuPermission extends MenuPermission {
  id_menu_main: number;
  link: string;
}

interface SubMenuPermission extends MenuPermission {
  id_menu_sub: number;
  link: string;
}

interface PermissionData {
  main: MainMenuPermission[];
  sub: SubMenuPermission[];
}

interface PermissionContextType {
  permissions: PermissionData | null;
  loading: boolean;
  hasAccess: (path: string) => boolean;
  getCrud: (path: string) => MenuPermission;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

const normalizePath = (path: string): string => {
  if (!path) return "";
  return path.split("?")[0].split("#")[0].replace(/\/$/, "").toLowerCase();
};

export function PermissionProvider({
  children,
  idJabatan,
}: {
  children: React.ReactNode;
  idJabatan: number | null;
}) {
  const [permissions, setPermissions] = useState<PermissionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!idJabatan) {
      setPermissions({ main: [], sub: [] });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/pengaturan/role-menu/${idJabatan}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setPermissions(result.data);
        }
      }
    } catch (e) {
      console.error("Gagal mengambil permissions:", e);
    } finally {
      setLoading(false);
    }
  }, [idJabatan]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const getCrud = useCallback(
    (path: string): MenuPermission => {
      // Default permissions while loading or if not authenticated
      const isDashboard = path === "/dashboard" || path === "/";
      
      if (!permissions) {
        return {
          can_read: isDashboard,
          can_create: isDashboard,
          can_update: isDashboard,
          can_delete: isDashboard,
        };
      }

      const normPath = normalizePath(path);

      // 1. Match sub-menus first (more specific routes)
      const sortedSubs = [...permissions.sub].sort((a, b) => b.link.length - a.link.length);
      const matchedSub = sortedSubs.find((s) => {
        const normLink = normalizePath(s.link);
        if (normLink === "#" || !normLink) return false;
        return normPath === normLink || normPath.startsWith(normLink + "/");
      });

      if (matchedSub) {
        return {
          can_read: matchedSub.can_read,
          can_create: matchedSub.can_create,
          can_update: matchedSub.can_update,
          can_delete: matchedSub.can_delete,
        };
      }

      // 2. Match main menus
      const matchedMain = permissions.main.find((m) => {
        const normLink = normalizePath(m.link);
        if (normLink === "#" || !normLink) return false;
        return normPath === normLink || normPath.startsWith(normLink + "/");
      });

      if (matchedMain) {
        return {
          can_read: matchedMain.can_read,
          can_create: matchedMain.can_create,
          can_update: matchedMain.can_update,
          can_delete: matchedMain.can_delete,
        };
      }

      // Fallback for Dashboard/Index if no specific permission is stored
      if (isDashboard) {
        return {
          can_read: true,
          can_create: true,
          can_update: true,
          can_delete: true,
        };
      }

      // Default: no permissions for unspecified routes
      return {
        can_read: false,
        can_create: false,
        can_update: false,
        can_delete: false,
      };
    },
    [permissions]
  );

  const hasAccess = useCallback(
    (path: string): boolean => {
      return getCrud(path).can_read;
    },
    [getCrud]
  );

  return (
    <PermissionContext.Provider value={{ permissions, loading, hasAccess, getCrud }}>
      {children}
    </PermissionContext.Provider>
  );
}

// Hook to check permissions of any arbitrary route
export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
};

// Hook to check permissions of the current page
export const useMenuPermissions = () => {
  const context = useContext(PermissionContext);
  const pathname = usePathname();
  if (!context) {
    throw new Error("useMenuPermissions must be used within a PermissionProvider");
  }
  return {
    ...context.getCrud(pathname),
    loading: context.loading,
  };
};
