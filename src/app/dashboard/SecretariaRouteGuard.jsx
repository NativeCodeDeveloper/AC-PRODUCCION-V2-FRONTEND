"use client";

import { useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { PantallaCarga } from "@/components/ui/pantalla-anillos";
import { canAccessDashboardPath, getDashboardRoleFromUser } from "@/lib/dashboard-access";

const BLOQUEO_ACCESO_RESTRINGIDO = "dashboard_acceso_restringido_denegado";

export default function SecretariaRouteGuard({ children }) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const role = getDashboardRoleFromUser(user);
  const sesionAusente = isLoaded && !user;
  const inicioCancelado = isLoaded && Boolean(user) && role === "cancelado" && pathname === "/dashboard";
  const accesoDenegado = isLoaded && Boolean(user) && ["secretaria", "cancelado"].includes(role) && !inicioCancelado && !canAccessDashboardPath(role, pathname);

  useEffect(() => {
    const bloquearRutaRestaurada = () => {
      if (window.sessionStorage.getItem(BLOQUEO_ACCESO_RESTRINGIDO) === "1") {
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

    if (inicioCancelado) {
      window.location.replace("/dashboard/suscripcion-cancelada");
      return;
    }

    if (!accesoDenegado) return;

    window.sessionStorage.setItem(BLOQUEO_ACCESO_RESTRINGIDO, "1");
    const irALogin = () => window.location.replace("/sign-in");

    void signOut().finally(irALogin);
  }, [accesoDenegado, inicioCancelado, sesionAusente, signOut]);

  if (sesionAusente || inicioCancelado || accesoDenegado) {
    return <PantallaCarga />;
  }

  return children;
}
