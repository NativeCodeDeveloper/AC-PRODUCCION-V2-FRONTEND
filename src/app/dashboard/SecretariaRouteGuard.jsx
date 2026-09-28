"use client";

import { useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { PantallaCarga } from "@/components/ui/pantalla-anillos";
import { canAccessDashboardPath, getDashboardRoleFromUser } from "@/lib/dashboard-access";

export default function SecretariaRouteGuard({ children }) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const role = getDashboardRoleFromUser(user);
  const accesoDenegado = isLoaded && role === "secretaria" && !canAccessDashboardPath(role, pathname);

  useEffect(() => {
    if (accesoDenegado) {
      void signOut({ redirectUrl: "/sign-in" });
    }
  }, [accesoDenegado, signOut]);

  if (accesoDenegado) {
    return <PantallaCarga />;
  }

  return children;
}
