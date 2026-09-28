"use client";

// Tutorial Guiado Fichas — recorrido breve y de solo lectura por la Carpeta
// Clínica del paciente (llenar fichas, información de ingreso y su edición,
// filtros e historial de citas).
//
// Es independiente del tour principal de TourContext: no navega a otras rutas
// ni exige condiciones de éxito (`esperar`), así que no justifica meter otra
// configuración de pasos ahí. Comparte en cambio la misma librería (driver.js)
// y las mismas clases .ac-tour-* de globals.css, para que el popover se vea
// idéntico al del tutorial grande.

import { useCallback, useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_FICHAS_STEPS } from "@/lib/tourFichasSteps";
import { useTour } from "@/ContextosGlobales/TourContext";

// Mismo ícono de brújula que usa "Tutorial Guiado" en el sidebar.
const TOUR_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 9l-2 5-4 1 2-5 4-1z" />
</svg>`;

const GRUPO_LABEL = "Ficha del paciente";

/**
 * Ancla del paso. Los pasos con `abrirDetalles` apuntan al <summary> del panel,
 * NO al <details> completo.
 *
 * Por qué: al abrirse, el panel mide lo que mida su contenido. El "Historial de
 * Citas" de un paciente con 30 citas pasa de 120px a ~1300px, contra un viewport
 * de ~700px. Con un ancla más alta que la pantalla driver.js no encuentra hueco
 * ni arriba ni abajo, así que no puede honrar el `side: "top"` configurado:
 * termina clavando el popover en el borde superior — encima del mismo encabezado
 * que está explicando — y el recorte del overlay se sale por arriba y por abajo,
 * de modo que no se ve ningún recuadro enmarcando nada. Eso es el "desfase".
 *
 * El <summary> mide ~120px siempre, tenga el paciente 3 citas o 300, así que el
 * popover queda pegado al encabezado y el contenido recién abierto se ve justo
 * debajo. driver.js acepta una función como `element` y la resuelve en cada
 * medición, así que el ancla se calcula al vuelo.
 */
function anclaDelPaso(step) {
    if (!step.selector) return undefined;
    if (!step.abrirDetalles) return step.selector;
    return () => {
        const panel = document.querySelector(step.selector);
        if (!panel) return null;
        return panel.querySelector(":scope > summary") || panel;
    };
}

// Puntos de progreso del popover: uno por paso (el tour principal agrupa por
// sección; acá el recorrido es tan corto que cada paso merece el suyo). El
// estado "pending" no tiene clase propia: es el gris base de .ac-dot.
function buildMeta(indiceActivo, total) {
    const dots = TOUR_FICHAS_STEPS
        .map((_, index) => {
            const state = index < indiceActivo ? "done" : index === indiceActivo ? "active" : "pending";
            return `<span class="ac-dot ac-dot--${state}"></span>`;
        })
        .join("");

    return `<div class="ac-tour-meta"><div class="ac-tour-dots">${dots}</div><span class="ac-tour-group-label">${GRUPO_LABEL}</span></div>`;
}

/**
 * Botón "Tutorial Guiado Fichas". Recibe las mismas clases que BotonVideoTutorial
 * (`className`, `claseIcono`, `claseEtiqueta`) para quedar visualmente idéntico
 * al botón de video que tiene al lado en la carpeta del paciente.
 */
export default function TutorialGuiadoFichas({
    etiqueta = "Tutorial Guiado Fichas",
    ariaLabel,
    className = "",
    claseIcono = "flex h-4 w-4 shrink-0 items-center justify-center",
    claseEtiqueta = "",
}) {
    const { setTourExternoActivo } = useTour();
    const driverRef = useRef(null);
    const scrollPrevioRef = useRef(null);

    useEffect(() => () => {
        // Si el componente se desmonta con el tour vivo (navegación a otra
        // ruta), driver.js hay que destruirlo sí o sí: su overlay y sus
        // listeners de window sobreviven al render de React.
        driverRef.current?.destroy();
        driverRef.current = null;
        setTourExternoActivo(false);
    }, [setTourExternoActivo]);

    const iniciarTour = useCallback(() => {
        if (driverRef.current?.isActive()) return;

        const instancia = driver({
            allowClose: true,
            // Mismo criterio que el tour principal: la capa oscura no mueve el
            // recorrido; se avanza solo con "Siguiente"/"Atrás" o Escape.
            overlayClickBehavior: () => {},
            overlayOpacity: 0.55,
            stagePadding: 6,
            stageRadius: 12,
            popoverClass: "ac-tour-popover",
            smoothScroll: false,
            // Recorrido de solo lectura: el recuadro resaltado no deja hacer
            // clic sobre el elemento (abrir el modal de ficha a mitad del tour
            // dejaría el formulario bajo la capa oscura, visto como un fondo
            // gris imposible de usar).
            disableActiveInteraction: true,
            // Si un ancla no está en el DOM (p. ej. el paciente todavía está
            // cargando y las secciones aún no se renderizan), el paso se salta
            // solo en vez de dejar el tour congelado.
            skipMissingElement: true,
            steps: TOUR_FICHAS_STEPS.map((step, index) => ({
                element: anclaDelPaso(step),
                popover: {
                    side: step.side || "top",
                    align: step.align || "start",
                    title: `<span class="ac-tour-icon-badge">${TOUR_ICON_SVG}</span><span class="ac-tour-title-text">${step.title}</span>`,
                    description: `${buildMeta(index, TOUR_FICHAS_STEPS.length)}<p class="ac-tour-text">${step.description}</p>`,
                    showButtons: index === 0 ? ["next", "close"] : ["next", "previous", "close"],
                    nextBtnText: index === TOUR_FICHAS_STEPS.length - 1 ? "Finalizar" : "Siguiente",
                    prevBtnText: "Atrás",
                },
                abrirDetalles: step.abrirDetalles === true,
            })),
            onHighlightStarted: (element, step) => {
                // Los <details> se abren ANTES de que driver.js mida el elemento
                // y posicione el popover: abrirlos después dejaría el recuadro
                // con la altura del panel cerrado. La apertura es sincrónica
                // (los <details> de esta página no animan su altura), así que
                // la medición que driver hace a continuación ya es la final.
                // `element` es el <summary> (ver anclaDelPaso), así que el panel
                // a abrir es su <details> contenedor.
                if (!step.abrirDetalles) return;
                const panel = element?.closest?.("details");
                if (panel && !panel.open) panel.open = true;
            },
            onHighlighted: (element, step) => {
                // Red de seguridad: re-medir una vez que el layout se asentó,
                // por si el contenido recién abierto empujó la fila.
                //
                // Va en `onHighlighted` y NO en un setTimeout dentro de
                // `onHighlightStarted`: driver.js anima el salto entre pasos
                // durante 400ms y recién al terminar registra el elemento nuevo
                // como activo. Un `refresh()` a los 320ms cae en plena animación
                // y reposiciona el popover contra el elemento ANTERIOR — dejaba
                // el globo flotando ~240px más arriba, apuntando al panel de
                // "Filtros" en vez de al encabezado del historial.
                if (step.abrirDetalles) driverRef.current?.refresh();
            },
            onCloseClick: () => instancia.destroy(),
            onDestroyed: () => {
                driverRef.current = null;
                document.documentElement.style.scrollBehavior = scrollPrevioRef.current || "";
                setTourExternoActivo(false);
            },
        });

        driverRef.current = instancia;
        scrollPrevioRef.current = document.documentElement.style.scrollBehavior;
        // Mismo motivo que en TourContext: un scroll-behavior suave en <html>
        // desincroniza la medición del popover durante los saltos entre pasos.
        document.documentElement.style.scrollBehavior = "auto";
        // Oculta Cortex y el banner de notificaciones mientras corre, igual que
        // en el tour principal (quedarían como manchas grises bajo el overlay).
        setTourExternoActivo(true);
        instancia.drive(0);
    }, [setTourExternoActivo]);

    return (
        <button
            type="button"
            onClick={iniciarTour}
            aria-label={ariaLabel || "Iniciar el tutorial guiado de la ficha del paciente"}
            className={className}
        >
            <span className={claseIcono}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-2 5-4 1 2-5 4-1z" />
                </svg>
            </span>
            <span className={claseEtiqueta}>{etiqueta}</span>
        </button>
    );
}
