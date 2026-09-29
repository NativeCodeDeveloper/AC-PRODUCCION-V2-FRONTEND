"use client";

// ── Quantum Cloud Loader ─────────────────────────────────────────────────────
// Partículas en órbitas horizontales suaves (sin gradientes ni cambios de
// dirección bruscos; curvas largas y velocidades distintas que interactúan
// entre sí). Va bajo el logo en la pantalla de carga
// (src/components/ui/pantalla-anillos.jsx).
//
// Los cuatro tonos son una escalera derivada del morado de marca (#6E56CF):
// una esfera lo lleva exacto y las otras tres se separan hacia claro y oscuro.
// Antes el tono oscuro era #5B21B6, que tira a indigo y rompia la familia.
// El contenedor NO pinta fondo: se dibuja sobre lo que haya detras.

export default function CloudLoader() {
  return (
    <div className="flex min-h-24 items-center justify-center overflow-hidden pl-8">
      <div className="relative isolate flex h-24 w-44 items-center justify-center">

        {/* MORADO CLARO — Partícula rápida interior */}
        <div className="absolute z-30 h-5 w-5 animate-quantum-violeta">
          <div className="h-full w-full rounded-full bg-[#9E8CE8] shadow-[0_0_12px_rgba(158,140,232,0.75),0_0_24px_rgba(158,140,232,0.3)]" />
        </div>

        {/* MORADO OSCURO — Partícula exterior grande */}
        <div className="absolute z-10 h-7 w-7 animate-quantum-morado-oscuro">
          <div className="h-full w-full rounded-full bg-[#4634A6] shadow-[0_0_16px_rgba(70,52,166,0.7),0_0_30px_rgba(70,52,166,0.25)]" />
        </div>

        {/* MORADO — Partícula central */}
        <div className="absolute z-40 h-6 w-6 animate-quantum-morado">
          <div className="h-full w-full rounded-full bg-[#6E56CF] shadow-[0_0_14px_rgba(110,86,207,0.75),0_0_26px_rgba(110,86,207,0.3)]" />
        </div>

        {/* LAVANDA — Partícula orbital lenta */}
        <div className="absolute z-0 h-4 w-4 animate-quantum-lavanda">
          <div className="h-full w-full rounded-full bg-[#CFC7F2] shadow-[0_0_12px_rgba(207,199,242,0.75),0_0_24px_rgba(207,199,242,0.3)]" />
        </div>

      </div>

      <style>{`
        /*
         * Quantum Cloud Loader
         *
         * Principios de diseño:
         * - Sin gradientes
         * - Sin cambios de dirección bruscos
         * - Curvas de animación largas y suaves
         * - Profundidad sutil con escala + opacidad
         * - Velocidades orbitales distintas crean interacción natural
         */

        /* --------------------------------
           MORADO CLARO
           Órbita horizontal rápida pero suave
        --------------------------------- */

        @keyframes quantum-violeta {
          0% {
            transform: translate3d(-46px, 7px, 0) scale(0.72);
            opacity: 0.45;
          }

          25% {
            transform: translate3d(-23px, -7px, 0) scale(0.95);
            opacity: 0.78;
          }

          50% {
            transform: translate3d(46px, 0, 0) scale(1.18);
            opacity: 1;
          }

          75% {
            transform: translate3d(23px, 7px, 0) scale(0.95);
            opacity: 0.78;
          }

          100% {
            transform: translate3d(-46px, 7px, 0) scale(0.72);
            opacity: 0.45;
          }
        }

        .animate-quantum-violeta {
          animation:
            quantum-violeta
            3.8s
            cubic-bezier(0.37, 0, 0.63, 1)
            infinite;
          will-change: transform, opacity;
        }


        /* --------------------------------
           MORADO OSCURO
           Movimiento orbital lento y pesado
        --------------------------------- */

        @keyframes quantum-morado-oscuro {
          0% {
            transform: translate3d(38px, -4px, 0) scale(1);
            opacity: 0.95;
          }

          25% {
            transform: translate3d(19px, 7px, 0) scale(0.88);
            opacity: 0.72;
          }

          50% {
            transform: translate3d(-38px, 3px, 0) scale(0.68);
            opacity: 0.42;
          }

          75% {
            transform: translate3d(-19px, -7px, 0) scale(0.88);
            opacity: 0.72;
          }

          100% {
            transform: translate3d(38px, -4px, 0) scale(1);
            opacity: 0.95;
          }
        }

        .animate-quantum-morado-oscuro {
          animation:
            quantum-morado-oscuro
            5.6s
            cubic-bezier(0.37, 0, 0.63, 1)
            infinite;
          will-change: transform, opacity;
        }


        /* --------------------------------
           MORADO
           Oscilador central suave
        --------------------------------- */

        @keyframes quantum-morado {
          0% {
            transform: translate3d(-27px, 2px, 0) scale(0.82);
            opacity: 0.65;
          }

          20% {
            transform: translate3d(-17px, -5px, 0) scale(0.94);
            opacity: 0.82;
          }

          50% {
            transform: translate3d(27px, 0, 0) scale(1.08);
            opacity: 1;
          }

          80% {
            transform: translate3d(17px, 5px, 0) scale(0.94);
            opacity: 0.82;
          }

          100% {
            transform: translate3d(-27px, 2px, 0) scale(0.82);
            opacity: 0.65;
          }
        }

        .animate-quantum-morado {
          animation:
            quantum-morado
            3.1s
            cubic-bezier(0.37, 0, 0.63, 1)
            infinite;
          will-change: transform, opacity;
        }


        /* --------------------------------
           LAVANDA
           Barrido orbital lento y amplio
        --------------------------------- */

        @keyframes quantum-lavanda {
          0% {
            transform: translate3d(64px, 6px, 0) scale(0.52);
            opacity: 0.25;
          }

          20% {
            transform: translate3d(43px, -5px, 0) scale(0.68);
            opacity: 0.45;
          }

          50% {
            transform: translate3d(0, 3px, 0) scale(1);
            opacity: 0.9;
          }

          80% {
            transform: translate3d(-43px, -5px, 0) scale(0.68);
            opacity: 0.45;
          }

          100% {
            transform: translate3d(-64px, 6px, 0) scale(0.52);
            opacity: 0.25;
          }
        }

        .animate-quantum-lavanda {
          animation:
            quantum-lavanda
            6.4s
            cubic-bezier(0.37, 0, 0.63, 1)
            infinite alternate;
          will-change: transform, opacity;
        }


        /* --------------------------------
           Accesibilidad
        --------------------------------- */

        @media (prefers-reduced-motion: reduce) {
          .animate-quantum-violeta,
          .animate-quantum-morado-oscuro,
          .animate-quantum-morado,
          .animate-quantum-lavanda {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
