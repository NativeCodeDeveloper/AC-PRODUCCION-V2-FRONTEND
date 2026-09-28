"use client";

import { useSyncExternalStore } from "react";
import { VistaPantallaCarga } from "@/components/ui/pantalla-anillos";
import { obtenerCarga, suscribirCarga } from "@/lib/cargaGlobal";

const obtenerCargaInicial = () => false;

export default function CargaGlobal() {
  const cargando = useSyncExternalStore(
    suscribirCarga,
    obtenerCarga,
    obtenerCargaInicial,
  );

  return cargando ? <VistaPantallaCarga /> : null;
}
