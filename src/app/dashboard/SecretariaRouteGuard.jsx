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
    if (!accesoDenegado) return;

    const irALogin = () => window.location.replace("/sign-in");

    void signOut().finally(irALogin);
    window.addEventListener("pageshow", irALogin);

    return () => window.removeEventListener("pageshow", irALogin);
  }, [accesoDenegado, signOut]);

  if (accesoDenegado) {
    return <PantallaCarga />;
  }

  return children;
}
