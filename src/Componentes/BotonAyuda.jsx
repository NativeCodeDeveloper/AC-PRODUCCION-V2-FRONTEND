"use client";

// Boton "Ayuda" — reune en un solo control el video tutorial y el tutorial
// guiado de la pantalla.
//
// Antes cada ruta ponia los dos botones uno al lado del otro en la cabecera.
// En las pantallas que ya traen sus propias acciones (Volver, Ver Fichas,
// Nueva reserva, contadores) eso dejaba una hilera larga de botones del mismo
// peso visual, donde lo importante y la ayuda competian por atencion.
//
// Acá la ayuda ocupa UN boton y sus dos formas quedan adentro. No se toca la
// entrada "Tutorial Guiado" del sidebar: esa lanza el recorrido grande de todo
// el dashboard (TourContext), no el de la pantalla actual.
//
// Los items del menu son los MISMOS componentes de siempre
// (BotonVideoTutorial y el TutorialGuiado* de cada ruta): los dos aceptan
// `className`/`claseIcono`/`claseEtiqueta`, así que basta con vestirlos de fila
// de menu. Por eso esto no duplica la logica del visor de video ni la de
// driver.js, y cualquier arreglo en ellos sigue llegando solo.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import BotonVideoTutorial from "@/Componentes/VideoTutorial";

// Vestido de los items. Vive acá y no en cada ruta a proposito: el boton de
// afuera si cambia de una pantalla a otra (alturas y radios distintos), pero el
// menu debe verse igual en todas.
const CLASE_ITEM =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none";
const CLASE_ITEM_ICONO =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F3F0FF] text-[#6E56CF]";

export default function BotonAyuda({
    // { videoId, inicio, titulo, ariaLabel } — omitir si la ruta no tiene video.
    video,
    // El componente TutorialGuiado* de la ruta — omitir si no tiene tour.
    tutorial: Tutorial,
    tutorialProps = {},
    etiqueta = "Ayuda",
    ariaLabel = "Abrir las opciones de ayuda de esta pantalla",
    className = "",
    claseIcono = "flex h-4 w-4 shrink-0 items-center justify-center",
    claseEtiqueta = "",
    // El menu necesita un contenedor `relative` propio, asi que la ruta no
    // puede darle ancho solo con `className` (eso viste al boton, no al
    // contenedor). Esto deja pasar ese ajuste — p.ej. ancho completo en movil.
    claseContenedor = "",
}) {
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef(null);
    const botonRef = useRef(null);
    const menuId = useId();

    const cerrar = useCallback(() => setAbierto(false), []);

    useEffect(() => {
        if (!abierto) return;

        // Se escucha en fase de captura: los items abren un visor en portal o
        // arrancan driver.js, y sin capturar, un handler que detenga la
        // propagacion dejaria el menu abierto detras del overlay del tour.
        const alClicFuera = (e) => {
            if (!contenedorRef.current?.contains(e.target)) cerrar();
        };
        const alPresionarTecla = (e) => {
            if (e.key !== "Escape") return;
            cerrar();
            botonRef.current?.focus();
        };

        document.addEventListener("pointerdown", alClicFuera, true);
        document.addEventListener("keydown", alPresionarTecla);
        return () => {
            document.removeEventListener("pointerdown", alClicFuera, true);
            document.removeEventListener("keydown", alPresionarTecla);
        };
    }, [abierto, cerrar]);

    const opciones = [];

    if (video) {
        opciones.push(
            <BotonVideoTutorial
                key="video"
                {...video}
                etiqueta="Video tutorial"
                className={CLASE_ITEM}
                claseIcono={CLASE_ITEM_ICONO}
            />,
        );
    }

    if (Tutorial) {
        opciones.push(
            <Tutorial
                key="tutorial"
                {...tutorialProps}
                etiqueta="Tutorial guiado"
                className={CLASE_ITEM}
                claseIcono={CLASE_ITEM_ICONO}
            />,
        );
    }

    // Con una sola forma de ayuda no se arma menu: seria un clic de mas para
    // llegar a lo unico que hay. Se devuelve esa opcion con el aspecto del
    // boton de la ruta.
    if (opciones.length <= 1) {
        const unica = opciones[0];
        if (!unica) return null;

        return (
            <unica.type
                {...unica.props}
                etiqueta={etiqueta}
                className={className}
                claseIcono={claseIcono}
                claseEtiqueta={claseEtiqueta}
            />
        );
    }

    return (
        <div ref={contenedorRef} className={`relative ${claseContenedor}`}>
            <button
                ref={botonRef}
                type="button"
                onClick={() => setAbierto((v) => !v)}
                aria-label={ariaLabel}
                aria-haspopup="menu"
                aria-expanded={abierto}
                aria-controls={abierto ? menuId : undefined}
                className={className}
            >
                <span className={claseIcono}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.25-1 .8-1 1.45v.45" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.8h.01" />
                    </svg>
                </span>
                <span className={claseEtiqueta}>{etiqueta}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {/* El menu se OCULTA, no se desmonta.
                Las dos opciones son componentes con estado propio: el visor de
                video guarda en su estado si la ventana esta abierta, y el
                tutorial guiado destruye su instancia de driver.js al
                desmontarse. Con `{abierto && ...}` pasaba esto: al pulsar una
                opcion su handler corria, el clic burbujeaba hasta este
                contenedor, `cerrar()` ponia `abierto` en false y React
                desmontaba las dos — borrando el estado que el visor acababa de
                poner y destruyendo el tour recien arrancado. Resultado: las dos
                opciones parecian no hacer nada.

                `hidden` (display:none) tambien las saca del orden de tabulacion,
                y ni la ventana de video ni el overlay de driver.js se ven
                afectados por el ancestro oculto: los dos se dibujan en
                document.body por portal. */}
            <div
                id={menuId}
                role="menu"
                hidden={!abierto}
                onClick={cerrar}
                // `right-0` y no `left-0`: este boton vive en el extremo derecho
                // de la cabecera en las cinco rutas, y abriendo hacia la
                // izquierda el menu se salia de la pantalla en movil.
                className="absolute right-0 z-50 mt-2 w-[232px] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/5"
            >
                {opciones}
            </div>
        </div>
    );
}
