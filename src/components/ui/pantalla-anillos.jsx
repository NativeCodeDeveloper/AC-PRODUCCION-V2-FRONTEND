import MagicRings from "@/components/ui/magic-rings";

// ── Pantallas de anillos (fondo blanco, a pantalla completa) ─────────────────
// Puesta en escena común para que la pantalla de carga (src/app/loading.jsx),
// la de 404 (src/app/not-found.jsx) y el preview de desarrollo
// (/dashboard/preview-carga) se vean exactamente igual.
//
// onClick es opcional: lo usa el preview para cerrar el overlay al hacer clic.

const PROPS_ANILLOS = {
  color: "#7C5CF0",
  colorTwo: "#C4B5FD",
  ringCount: 6,
  alphaMode: "coverage",
  noiseAmount: 0.05,
};

export function PantallaCarga({ onClick }) {
  return (
    <div
      onClick={onClick}
      // z-[90]: sobre el orbe de Cortex (z-[80], se monta en el layout del
      // dashboard y si no quedaría flotando sobre la carga) y bajo el tour (z-10000).
      className="fixed inset-0 z-[90] overflow-hidden bg-white"
      role="status"
      aria-live="polite"
      aria-label="Cargando Agenda Clínica"
    >
      <MagicRings {...PROPS_ANILLOS}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/fonts/letrasLoading.png"
          alt="Agenda Clínica"
          width={2170}
          height={725}
          className="block h-auto w-[min(56vw,280px)] object-contain"
        />
      </MagicRings>
    </div>
  );
}

export function PantallaNoEncontrada({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="fixed inset-0 z-[90] overflow-hidden bg-white"
      role="status"
      aria-live="polite"
      aria-label="Página no encontrada"
    >
      <MagicRings {...PROPS_ANILLOS}>
        <div className="flex flex-col items-center">
          <span className="text-5xl font-semibold tabular-nums tracking-tight text-[#16181C]">
            404
          </span>
          <span className="mt-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[#8B8F96]">
            Página no encontrada
          </span>
        </div>
      </MagicRings>
    </div>
  );
}
