"use client";
import { useEffect, useMemo, useState } from "react";

export default function CarruselProducto({ imagenes, imagen1, imagen2, imagen3, imagen4 }) {
    // Permitir recibir hasta 4 props individuales o un array
    const imagenesFinal = useMemo(() => {
        if (Array.isArray(imagenes) && imagenes.length > 0) {
            return imagenes
                .filter((img) => !!img && typeof img === "string" && img.trim() !== "")
                .slice(0, 4);
        }

        // Si se pasan props individuales, construir el array
        return [imagen1, imagen2, imagen3, imagen4].filter(
            (img) => !!img && typeof img === "string" && img.trim() !== ""
        );
    }, [imagenes, imagen1, imagen2, imagen3, imagen4]);

    const [actual, setActual] = useState(0);

    // No renderizamos nada hasta validar; así evitamos íconos de imagen rota / "?".
    const [cargando, setCargando] = useState(true);
    const [imagenesOk, setImagenesOk] = useState([]);

    useEffect(() => {
        let cancelado = false;

        // Reinicia estado al cambiar el set de imágenes
        setCargando(true);
        setImagenesOk([]);
        setActual(0);

        async function validar() {
            if (!imagenesFinal.length) {
                if (!cancelado) {
                    setImagenesOk([]);
                    setCargando(false);
                }
                return;
            }

            const resultados = await Promise.all(
                imagenesFinal.map(
                    (src) =>
                        new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => resolve({ src, ok: true });
                            img.onerror = () => resolve({ src, ok: false });
                            img.src = src;
                        })
                )
            );

            const ok = resultados.filter((r) => r.ok).map((r) => r.src);
            if (!cancelado) {
                setImagenesOk(ok);
                setCargando(false);
                // Si el índice actual queda fuera de rango, lo ajustamos
                if (ok.length > 0 && actual >= ok.length) {
                    setActual(0);
                }
            }
        }

        validar();
        return () => {
            cancelado = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imagenesFinal]);

    const siguiente = () => {
        if (imagenesOk.length <= 1) return;
        setActual((prev) => (prev + 1) % imagenesOk.length);
    };

    const anterior = () => {
        if (imagenesOk.length <= 1) return;
        setActual((prev) => (prev - 1 + imagenesOk.length) % imagenesOk.length);
    };

    // Esperamos validación; si no hay imágenes válidas, no renderizamos
    if (cargando) return <div className="aspect-square w-full animate-pulse rounded-xl bg-slate-100" role="status" aria-label="Cargando imágenes del producto" />;
    if (!imagenesOk.length) return null;

    // Solo mostrar miniaturas disponibles
    const thumbs = imagenesOk;

    return (
        <div className="flex flex-col items-center w-full gap-2 md:gap-4 mt-0 md:mt-4">
            {/* Miniaturas: solo visibles en desktop/tablet, ocultas en mobile */}
            {thumbs.length > 1 && (
                <div className="hidden md:flex gap-3 mb-2 justify-center w-full overflow-x-auto py-2 bg-white rounded-xl">
                    {thumbs.map((img, i) => {
                        const isActive = i === actual;
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setActual(i)}
                                className={
                                    "shrink-0 rounded-xl p-1 bg-white transition flex items-center justify-center " +
                                    (isActive
                                        ? "ring-2 ring-black"
                                        : "ring-1 ring-black/10 hover:ring-black/30")
                                }
                                aria-label={`Ver imagen ${i + 1}`}
                            >
                                <div className="bg-white rounded-lg p-0.5 flex items-center justify-center">
                                    <img
                                        src={img}
                                        alt={`Miniatura ${i + 1}`}
                                        className="h-16 w-16 md:h-20 md:w-20 object-contain rounded-lg"
                                        onError={() => {
                                            setImagenesOk((prev) => {
                                                const next = prev.filter((s) => s !== img);
                                                // Ajusta índice si quedara fuera
                                                if (next.length === 0) return next;
                                                if (actual >= next.length) setActual(0);
                                                return next;
                                            });
                                        }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Imagen principal */}
            <div className="relative w-full max-w-full sm:max-w-xl">
                <div className="relative aspect-square md:aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white">
                    <img
                        src={imagenesOk[actual]}
                        alt={`Imagen principal ${actual + 1}`}
                        className="h-[80vw] max-h-[90vw] w-full object-contain md:h-full md:max-h-none"
                        style={{ minHeight: "220px" }} // asegura buen tamaño en móviles
                        onError={() => {
                            const srcFallida = imagenesOk[actual];
                            setImagenesOk((prev) => {
                                const next = prev.filter((s) => s !== srcFallida);
                                return next;
                            });
                            setActual(0);
                        }}
                    />
                    {/* Indicador */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                        {actual + 1} / {imagenesOk.length}
                    </div>
                </div>
                {/* Flechas SIEMPRE abajo de la imagen */}
                {thumbs.length > 1 && (
                    <div className="flex justify-center gap-6 mt-3">
                        <button
                            type="button"
                            onClick={anterior}
                            className="rounded-full bg-white/90 p-3 shadow hover:bg-white border border-slate-200"
                            aria-label="Imagen anterior"
                        >
                            <span className="text-2xl leading-none">‹</span>
                        </button>
                        <button
                            type="button"
                            onClick={siguiente}
                            className="rounded-full bg-white/90 p-3 shadow hover:bg-white border border-slate-200"
                            aria-label="Imagen siguiente"
                        >
                            <span className="text-2xl leading-none">›</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
