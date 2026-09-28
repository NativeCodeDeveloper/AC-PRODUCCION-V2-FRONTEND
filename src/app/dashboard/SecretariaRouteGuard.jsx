"use client";

import { useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { PantallaCarga } from "@/components/ui/pantalla-anillos";
import { canAccessDashboardPath, getDashboardRoleFromUser } from "@/lib/dashboard-access";

const BLOQUEO_ACCESO_SECRETARIA = "dashboard_secretaria_acceso_denegado";

export default function SecretariaRouteGuard({ children }) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const role = getDashboardRoleFromUser(user);
  const sesionAusente = isLoaded && !user;
  const accesoDenegado = isLoaded && Boolean(user) && role === "secretaria" && !canAccessDashboardPath(role, pathname);

  useEffect(() => {
    const bloquearRutaRestaurada = () => {
      if (window.sessionStorage.getItem(BLOQUEO_ACCESO_SECRETARIA) === "1") {
        window.location.replace("/sign-in");
      }
    };

    window.addEventListener("pageshow", bloquearRutaRestaurada);
  }, []);

  useEffect(() => {
    if (sesionAusente) {
      window.location.replace("/sign-in");
      return;
    }

    if (!accesoDenegado) return;

    window.sessionStorage.setItem(BLOQUEO_ACCESO_SECRETARIA, "1");
    const irALogin = () => window.location.replace("/sign-in");

    void signOut().finally(irALogin);
  }, [accesoDenegado, sesionAusente, signOut]);

  if (sesionAusente || accesoDenegado) {
    return <PantallaCarga />;
  }

  return children;
}
