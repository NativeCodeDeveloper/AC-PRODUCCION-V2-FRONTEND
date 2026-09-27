"use client";

import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import { toast } from "react-hot-toast";

/* ═══════════════════════════════════════════════════════════════
   ODONTOGRAMA INTERACTIVO COMPLETO — InnovaDent
   - Dentición permanente + temporal (numeración FDI)
   - 5 caras clickeables por diente (V, L/P, M, D, O/I)
   - Estados por cara: caries, amalgama, resina, amalgamaAntigua, resinaAntigua, amalgamaDefectuosa, null
   - Estados por diente: absent, restoRadicular, protesisFija, prosthesisExisting
   - Toolbar, leyenda, tooltip, reset, export/import JSON
   ═══════════════════════════════════════════════════════════════ */

// ── Numeración FDI por cuadrante ──
const PERMANENT = {
    upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
    upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
    lowerLeft: [38, 37, 36, 35, 34, 33, 32, 31],
    lowerRight: [41, 42, 43, 44, 45, 46, 47, 48],
};

const TEMPORARY = {
    upperRight: [55, 54, 53, 52, 51],
    upperLeft: [61, 62, 63, 64, 65],
    lowerLeft: [75, 74, 73, 72, 71],
    lowerRight: [81, 82, 83, 84, 85],
};

const ALL_TEETH = [
    ...PERMANENT.upperRight, ...PERMANENT.upperLeft,
    ...PERMANENT.lowerLeft, ...PERMANENT.lowerRight,
    ...TEMPORARY.upperRight, ...TEMPORARY.upperLeft,
    ...TEMPORARY.lowerLeft, ...TEMPORARY.lowerRight,
];

const SURFACES = ["V", "L", "M", "D", "O"];

// ── Herramientas / modos ──
const TOOLS = [
    { id: "caries", label: "Caries", color: "bg-red-500", type: "surface" },
    { id: "amalgama", label: "Amalgama", color: "bg-gray-400", type: "surface" },
    { id: "resina", label: "Resina", color: "bg-cyan-400", type: "surface" },
    { id: "amalgamaAntigua", label: "Amalgama antigua", color: "bg-gray-600", type: "surface" },
    { id: "resinaAntigua", label: "Resina antigua", color: "bg-cyan-700", type: "surface" },
    { id: "amalgamaDefectuosa", label: "Amalgama defect.", color: "bg-orange-500", type: "surface" },
    { id: "fractura", label: "Fractura", color: "bg-orange-400", type: "surface" },
    { id: "selladas", label: "Selladas", color: "bg-emerald-500", type: "surface" },
    { id: "vidrioIonomero", label: "Vidrio Ionómero", color: "bg-blue-800", type: "surface" },
    { id: "abfraccion", label: "Abfracción", color: "bg-amber-900", type: "surface" },
    { id: "eraser", label: "Borrar", color: "bg-slate-400", type: "any" },
    { id: "absent", label: "Ausente", color: "bg-gray-900", type: "whole" },
    { id: "restoRadicular", label: "Resto radicular", color: "bg-red-600", type: "whole" },
    { id: "protesisFija", label: "Prótesis fija", color: "bg-green-500", type: "whole" },
    { id: "prosthesisExisting", label: "Prótesis exist.", color: "bg-blue-400", type: "whole" },
    { id: "corona", label: "Corona", color: "bg-blue-500", type: "whole" },
    { id: "piezaExtraida", label: "Pieza Extraída", color: "bg-gray-700", type: "whole" },
    { id: "extraccionIndicada", label: "Extracción indicada", color: "bg-red-500", type: "whole" },
    { id: "extraidaOrtodoncia", label: "Extraída Ortodoncia", color: "bg-blue-600", type: "whole" },
    { id: "indicadaOrtodoncia", label: "Indicada Ortodoncia", color: "bg-rose-500", type: "whole" },
    { id: "indicadaSellante", label: "Indicada Sellante", color: "bg-green-600", type: "whole" },
    { id: "piezaFaltante", label: "Pieza faltante", color: "bg-cyan-500", type: "whole" },
    { id: "piezaSana", label: "Pieza Sana", color: "bg-blue-200", type: "whole" },
];

// ── Colores de estado para las caras ──
const SURFACE_COLORS = {
    caries: "#ef4444",
    amalgama: "#9ca3af",
    resina: "#22d3ee",
    amalgamaAntigua: "#4b5563",
    resinaAntigua: "#0e7490",
    amalgamaDefectuosa: "#f97316",
    fractura: "#fb923c",
    selladas: "#10b981",
    vidrioIonomero: "#1e40af",
    abfraccion: "#78350f",
};

// ── Estado inicial de un diente ──
function emptyTooth() {
    return {
        surfaces: { V: null, L: null, M: null, D: null, O: null },
        wholeTooth: {
            absent: false,
            restoRadicular: false,
            protesisFija: false,
            prosthesisExisting: false,
            corona: false,
            piezaExtraida: false,
            extraccionIndicada: false,
            extraidaOrtodoncia: false,
            indicadaOrtodoncia: false,
            indicadaSellante: false,
            piezaFaltante: false,
            piezaSana: false,
        },
    };
}

function buildInitialState() {
    const teeth = {};
    ALL_TEETH.forEach((n) => { teeth[String(n)] = emptyTooth(); });
    return teeth;
}

/* ─────────────────────────────────────────────
   SVG de un diente con 5 caras clickeables
   Tamaño viewBox 60x60, centro en 30,30
   ───────────────────────────────────────────── */
function ToothSVG({ number, data, tool, onClickSurface, onClickWhole, isTemporary }) {
    const size = isTemporary ? 48 : 56;
    const half = size / 2;
    const inner = half * 0.42;
    const outer = half * 0.92;

    const surfaceFill = (s) => {
        const val = data.surfaces[s];
        return val ? SURFACE_COLORS[val] : "#e2e8f0";
    };

    // Determinar borde del diente completo
    let borderColor = "none";
    let borderWidth = 0;
    if (data.wholeTooth.prosthesisExisting) { borderColor = "#3b82f6"; borderWidth = 3; }
    if (data.wholeTooth.protesisFija) { borderColor = "#22c55e"; borderWidth = 3; }

    const showBlackOverlay = data.wholeTooth.absent;
    const showRedX = data.wholeTooth.restoRadicular;

    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className={`${isTemporary ? "text-[9px]" : "text-[10px]"} font-semibold text-slate-600 select-none`}>{number}</span>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="cursor-pointer"
            >
                {/* Borde prótesis */}
                {borderWidth > 0 && (
                    <rect x={1} y={1} width={size - 2} height={size - 2} rx={6} fill="none" stroke={borderColor} strokeWidth={borderWidth} />
                )}

                {/* ── Oclusal / Incisal (centro) ── */}
                <rect
                    x={half - inner} y={half - inner}
                    width={inner * 2} height={inner * 2}
                    rx={2}
                    fill={surfaceFill("O")}
                    stroke="#94a3b8" strokeWidth={0.8}
                    onClick={(e) => { e.stopPropagation(); onClickSurface(number, "O"); }}
                >
                    <title>O/I (oclusal/incisal)</title>
                </rect>

                {/* ── Vestibular (arriba) ── */}
                <polygon
                    points={`${half - outer},${half - outer} ${half + outer},${half - outer} ${half + inner},${half - inner} ${half - inner},${half - inner}`}
                    fill={surfaceFill("V")}
                    stroke="#94a3b8" strokeWidth={0.8}
                    onClick={(e) => { e.stopPropagation(); onClickSurface(number, "V"); }}
                >
                    <title>V (vestibular)</title>
                </polygon>

                {/* ── Lingual/Palatina (abajo) ── */}
                <polygon
                    points={`${half - inner},${half + inner} ${half + inner},${half + inner} ${half + outer},${half + outer} ${half - outer},${half + outer}`}
                    fill={surfaceFill("L")}
                    stroke="#94a3b8" strokeWidth={0.8}
                    onClick={(e) => { e.stopPropagation(); onClickSurface(number, "L"); }}
                >
                    <title>L/P (lingual/palatina)</title>
                </polygon>

                {/* ── Mesial (izquierda) ── */}
                <polygon
                    points={`${half - outer},${half - outer} ${half - inner},${half - inner} ${half - inner},${half + inner} ${half - outer},${half + outer}`}
                    fill={surfaceFill("M")}
                    stroke="#94a3b8" strokeWidth={0.8}
                    onClick={(e) => { e.stopPropagation(); onClickSurface(number, "M"); }}
                >
                    <title>M (mesial)</title>
                </polygon>

                {/* ── Distal (derecha) ── */}
                <polygon
                    points={`${half + inner},${half - inner} ${half + outer},${half - outer} ${half + outer},${half + outer} ${half + inner},${half + inner}`}
                    fill={surfaceFill("D")}
                    stroke="#94a3b8" strokeWidth={0.8}
                    onClick={(e) => { e.stopPropagation(); onClickSurface(number, "D"); }}
                >
                    <title>D (distal)</title>
                </polygon>

                {/* ── Oscurecido (ausente) ── */}
                {showBlackOverlay && (
                    <rect x={half - outer} y={half - outer} width={outer * 2} height={outer * 2} rx={4} fill="rgba(0,0,0,0.75)" pointerEvents="none" />
                )}

                {/* ── X roja (resto radicular) ── */}
                {showRedX && (
                    <g stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" pointerEvents="none">
                        <line x1={half - inner + 2} y1={half - inner + 2} x2={half + inner - 2} y2={half + inner - 2} />
                        <line x1={half + inner - 2} y1={half - inner + 2} x2={half - inner + 2} y2={half + inner - 2} />
                    </g>
                )}

                {/* ── Corona (círculo azul) ── */}
                {data.wholeTooth.corona && (
                    <circle cx={half} cy={half} r={outer - 2} fill="none" stroke="#3b82f6" strokeWidth={2.5} pointerEvents="none" />
                )}

                {/* ── Pieza Extraída (X gris oscuro) ── */}
                {data.wholeTooth.piezaExtraida && (
                    <g stroke="#374151" strokeWidth={3} strokeLinecap="round" pointerEvents="none">
                        <line x1={half - outer + 4} y1={half - outer + 4} x2={half + outer - 4} y2={half + outer - 4} />
                        <line x1={half + outer - 4} y1={half - outer + 4} x2={half - outer + 4} y2={half + outer - 4} />
                    </g>
                )}

                {/* ── Extracción indicada (X roja) ── */}
                {data.wholeTooth.extraccionIndicada && (
                    <g stroke="#ef4444" strokeWidth={3.5} strokeLinecap="round" pointerEvents="none">
                        <line x1={half - outer + 4} y1={half - outer + 4} x2={half + outer - 4} y2={half + outer - 4} />
                        <line x1={half + outer - 4} y1={half - outer + 4} x2={half - outer + 4} y2={half + outer - 4} />
                    </g>
                )}

                {/* ── Extraída por Ortodoncia (+ azul) ── */}
                {data.wholeTooth.extraidaOrtodoncia && (
                    <g stroke="#2563eb" strokeWidth={3} strokeLinecap="round" pointerEvents="none">
                        <line x1={half} y1={half - outer + 4} x2={half} y2={half + outer - 4} />
                        <line x1={half - outer + 4} y1={half} x2={half + outer - 4} y2={half} />
                    </g>
                )}

                {/* ── Indicada por Ortodoncia (+ rojo/rosa) ── */}
                {data.wholeTooth.indicadaOrtodoncia && (
                    <g stroke="#f43f5e" strokeWidth={3} strokeLinecap="round" pointerEvents="none">
                        <line x1={half} y1={half - outer + 4} x2={half} y2={half + outer - 4} />
                        <line x1={half - outer + 4} y1={half} x2={half + outer - 4} y2={half} />
                    </g>
                )}

                {/* ── Indicada por Sellante (x verde, más pequeña) ── */}
                {data.wholeTooth.indicadaSellante && (
                    <g stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" pointerEvents="none">
                        <line x1={half - inner} y1={half - inner} x2={half + inner} y2={half + inner} />
                        <line x1={half + inner} y1={half - inner} x2={half - inner} y2={half + inner} />
                    </g>
                )}

                {/* ── Pieza faltante (x cyan, más pequeña) ── */}
                {data.wholeTooth.piezaFaltante && (
                    <g stroke="#06b6d4" strokeWidth={2.5} strokeLinecap="round" pointerEvents="none">
                        <line x1={half - inner} y1={half - inner} x2={half + inner} y2={half + inner} />
                        <line x1={half + inner} y1={half - inner} x2={half - inner} y2={half + inner} />
                    </g>
                )}

                {/* ── Pieza Sana (cuadrado con cruz punteada) ── */}
                {data.wholeTooth.piezaSana && (
                    <g stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3,2" pointerEvents="none">
                        <rect x={half - inner} y={half - inner} width={inner * 2} height={inner * 2} fill="none" />
                        <line x1={half} y1={half - inner} x2={half} y2={half + inner} />
                        <line x1={half - inner} y1={half} x2={half + inner} y2={half} />
                    </g>
                )}

                {/* ── Zona clickeable central para estados de diente completo ── */}
                <rect
                    x={half - inner} y={half - inner}
                    width={inner * 2} height={inner * 2}
                    fill="transparent"
                    onClick={(e) => { e.stopPropagation(); onClickWhole(number); }}
                    style={{
                        pointerEvents: (() => {
                            const toolType = tool && TOOLS.find(t => t.id === tool)?.type;
                            if (toolType === "whole") return "auto";
                            if (tool === "eraser" && Object.values(data.wholeTooth).some(Boolean)) return "auto";
                            return "none";
                        })(),
                        cursor: (() => {
                            const toolType = tool && TOOLS.find(t => t.id === tool)?.type;
                            if (toolType === "whole") return "pointer";
                            if (tool === "eraser" && Object.values(data.wholeTooth).some(Boolean)) return "pointer";
                            return "default";
                        })(),
                    }}
                />
            </svg>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Fila de dientes (un cuadrante)
   ───────────────────────────────────────────── */
function QuadrantRow({ teeth, teethData, tool, onClickSurface, onClickWhole, isTemporary }) {
    return (
        <div className="flex items-center gap-0.5 sm:gap-1">
            {teeth.map((n) => (
                <ToothSVG
                    key={n}
                    number={n}
                    data={teethData[String(n)]}
                    tool={tool}
                    onClickSurface={onClickSurface}
                    onClickWhole={onClickWhole}
                    isTemporary={isTemporary}
                />
            ))}
        </div>
    );
}

/* ═════════════════════════════════════════════
   COMPONENTE PRINCIPAL: Odontograma
   ═════════════════════════════════════════════ */
const Odontograma = forwardRef(function Odontograma({ patientId, idOdontograma, initialData, onChange }, ref) {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const [teeth, setTeeth] = useState(() => {
        if (initialData?.teeth) return initialData.teeth;
        return buildInitialState();
    });
    const [activeTool, setActiveTool] = useState("caries");
    const [tooltip, setTooltip] = useState(null); // { number, surface, state }
    const [dirtyTeeth, setDirtyTeeth] = useState(new Set()); // dientes modificados

    // ── Exponer funciones al padre via ref ──
    useImperativeHandle(ref, () => ({
        exportOdontograma: () => ({
            patientId: patientId || null,
            updatedAt: new Date().toISOString(),
            teeth,
        }),
        importOdontograma: (json) => {
            if (json?.teeth) {
                setTeeth(json.teeth);
            }
        },
        resetOdontograma: () => setTeeth(buildInitialState()),
    }));

    // ── Notificar cambios ──
    useEffect(() => {
        if (onChange) {
            onChange({
                patientId: patientId || null,
                updatedAt: new Date().toISOString(),
                teeth,
            });
        }
    }, [teeth]);

    // ── Click en una cara ──
    const handleSurfaceClick = useCallback((number, surface) => {
        const key = String(number);
        const toolDef = TOOLS.find((t) => t.id === activeTool);
        if (!toolDef) return;

        setTeeth((prev) => {
            const tooth = { ...prev[key] };
            const surfaces = { ...tooth.surfaces };

            if (activeTool === "eraser") {
                surfaces[surface] = null;
                setTooltip({ number, surface, state: "borrado" });
            } else if (toolDef.type === "surface") {
                surfaces[surface] = activeTool;
                setTooltip({ number, surface, state: activeTool });
            } else {
                // Es herramienta de diente completo, no aplica a cara
                return prev;
            }

            setDirtyTeeth((prev) => new Set(prev).add(key));
            return { ...prev, [key]: { ...tooth, surfaces } };
        });
    }, [activeTool]);

    // ── Click en diente completo (centro) ──
    const handleWholeClick = useCallback((number) => {
        const key = String(number);
        const toolDef = TOOLS.find((t) => t.id === activeTool);
        if (!toolDef) return;

        setTeeth((prev) => {
            const tooth = { ...prev[key] };

            if (activeTool === "eraser") {
                // Borrar solo estados de diente completo, conservar caras
                const clearedWt = {};
                for (const k of Object.keys(tooth.wholeTooth)) clearedWt[k] = false;
                setTooltip({ number, surface: "diente", state: "overlays borrados" });
                setDirtyTeeth((prev) => new Set(prev).add(key));
                return { ...prev, [key]: { ...tooth, wholeTooth: clearedWt } };
            }

            if (toolDef.type !== "whole") return prev;

            const wt = { ...tooth.wholeTooth };
            // Toggle
            wt[activeTool] = !wt[activeTool];
            setTooltip({ number, surface: "diente", state: `${toolDef.label}: ${wt[activeTool] ? "Sí" : "No"}` });

            setDirtyTeeth((prev) => new Set(prev).add(key));
            return { ...prev, [key]: { ...tooth, wholeTooth: wt } };
        });
    }, [activeTool]);

    // ── Actualizar odontograma ──
    const [guardando, setGuardando] = useState(false);

    const handleActualizar = async () => {
        if (!idOdontograma) {
            return toast.error("No se puede actualizar: falta el id del odontograma");
        }

        setGuardando(true);
        try {
            for (const [numeroDiente, datosDiente] of Object.entries(teeth)) {
                const { surfaces, wholeTooth } = datosDiente;

                // Enviar dientes que tengan algo marcado O que fueron modificados (borrados)
                const tieneAlgo =
                    surfaces.V || surfaces.L || surfaces.M || surfaces.D || surfaces.O ||
                    Object.values(wholeTooth).some(Boolean);

                if (!tieneAlgo && !dirtyTeeth.has(numeroDiente)) continue;

                const res = await fetch(`${API}/odontograma/actualizarDiente`, {
                    method: "POST",
                    headers: { Accept: "application/json", "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id_odontograma: idOdontograma,
                        numero_diente: parseInt(numeroDiente),
                        datos: {
                            ausente: wholeTooth.absent,
                            resto_radicular: wholeTooth.restoRadicular,
                            protesis_fija: wholeTooth.protesisFija,
                            protesis_existente: wholeTooth.prosthesisExisting,
                            corona: wholeTooth.corona,
                            pieza_extraida: wholeTooth.piezaExtraida,
                            extraccion_indicada: wholeTooth.extraccionIndicada,
                            extraida_ortodoncia: wholeTooth.extraidaOrtodoncia,
                            indicada_ortodoncia: wholeTooth.indicadaOrtodoncia,
                            indicada_sellante: wholeTooth.indicadaSellante,
                            pieza_faltante: wholeTooth.piezaFaltante,
                            pieza_sana: wholeTooth.piezaSana,
                            cara_V: surfaces.V || null,
                            cara_L: surfaces.L || null,
                            cara_M: surfaces.M || null,
                            cara_D: surfaces.D || null,
                            cara_O: surfaces.O || null,
                        },
                    }),
                    mode: "cors",
                });

                if (!res.ok) {
                    toast.error(`Error al actualizar diente ${numeroDiente}`);
                    setGuardando(false);
                    return;
                }
            }

            setDirtyTeeth(new Set());
            toast.success("Odontograma actualizado correctamente");
        } catch (error) {
            toast.error("Error al actualizar el odontograma");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">

            {/* ── Toolbar ── */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 mr-2">Herramienta:</span>
                    {TOOLS.filter((t) => t.id !== "eraser").map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTool(t.id)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 border ${
                                activeTool === t.id
                                    ? "border-slate-900 bg-slate-900 text-white shadow-md"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            <span className={`h-2.5 w-2.5 rounded-full ${t.color}`} />
                            {t.label}
                        </button>
                    ))}

                    <div className="ml-auto flex items-center gap-2">
                        {/* ── Borrador separado ── */}
                        <button
                            onClick={() => setActiveTool("eraser")}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-150 border ${
                                activeTool === "eraser"
                                    ? "border-red-500 bg-red-500 text-white shadow-md"
                                    : "border-red-200 bg-white text-red-600 hover:bg-red-50"
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Borrar
                        </button>
                        <div className="w-px h-6 bg-slate-300 shrink-0" />
                        <button
                            onClick={handleActualizar}
                            disabled={guardando}
                            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {guardando ? "Guardando..." : "Actualizar odontograma"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tooltip / Info ── */}
            <div className="mb-4 h-8 flex items-center">
                {tooltip && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                        <span className="font-semibold">Diente {tooltip.number}</span>
                        <span className="text-slate-400">|</span>
                        <span>Cara: {tooltip.surface}</span>
                        <span className="text-slate-400">|</span>
                        <span>Estado: <span className="font-semibold">{tooltip.state || "ninguno"}</span></span>
                    </div>
                )}
            </div>

            {/* ── Odontograma ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm overflow-x-auto">

                {/* PERMANENTES SUPERIORES */}
                <div className="flex items-end justify-center gap-1 sm:gap-2 mb-1">
                    <QuadrantRow teeth={PERMANENT.upperRight} teethData={teeth} tool={activeTool} onClickSurface={handleSurfaceClick} onClickWhole={handleWholeClick} />
                    <div className="w-px h-14 bg-slate-300 mx-1 sm:mx-2 shrink-0" />
                    <QuadrantRow teeth={PERMANENT.upperLeft} teethData={teeth} tool={activeTool} onClickSurface={handleSurfaceClick} onClickWhole={handleWholeClick} />
                </div>

                {/* TEMPORALES SUPERIORES */}
                <div className="flex items-end justify-center gap-0.5 sm:gap-1 mb-2">
                    <div className="w-[88px] sm:w-[112px]" /> {/* Spacer para alinear con permanentes */}
                    <QuadrantRow teeth={TEMPORARY.upperRight} teethData={teeth} tool={activeTool} onClickSurface={handleSurfaceClick} onClickWhole={handleWholeClick} isTemporary />
                    <div className="w-px h-10 bg-slate-200 mx-1 shrink-0" />
                    <QuadrantRow teeth={TEMPORARY.upperLeft} teethData={teeth} tool={activeTool} onClickSurface={handleSurfaceClick} onClickWhole={handleWholeClick} isTemporary />
                    <div className="w-[88px] sm:w-[112px]" />
                </div>

                {/* ── Línea horizontal central ── */}
                <div className="w-full h-px bg-slate-300 my-2" />

                {/* TEMPORALES INFERIORES */}
                <div className="flex items-start justify-center gap-0.5 sm:gap-1 mt-2 mb-1">
                    <div className="w-[88px] sm:w-[112px]" />
                    <QuadrantRow teeth={TEMPORARY.lowerLeft} teethData={teeth} tool={activeTool} onClickSurface={handleSurfaceClick} onClickWhole={handleWholeClick} isTemporary />
                    <div className="w-px h-10 bg-slate-200 mx-1 shrink-0" />
                    <QuadrantRow teeth={TEMPORARY.lowerRight} teethData={teeth} tool={activeTool} onClickSurface={handleSurfaceClick} onClickWhole={handleWholeClick} isTemporary />
                    <div className="w-[88px] sm:w-[112px]" />
                </div>

                {/* PERMANENTES INFERIORES */}
                <div className="flex items-start justify-center gap-1 sm:gap-2 mt-1">
                    <QuadrantRow teeth={PERMANENT.lowerLeft} teethData={teeth} tool={activeTool} onClickSurface={handleSurfaceClick} onClickWhole={handleWholeClick} />
                    <div className="w-px h-14 bg-slate-300 mx-1 sm:mx-2 shrink-0" />
                    <QuadrantRow teeth={PERMANENT.lowerRight} teethData={teeth} tool={activeTool} onClickSurface={handleSurfaceClick} onClickWhole={handleWholeClick} />
                </div>
            </div>

            {/* ── Leyenda ── */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Leyenda</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-2">
                    {/* ── Estados de superficie ── */}
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm border border-slate-300 bg-slate-100" />
                        <span className="text-xs text-slate-600">Sano</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-gray-400" />
                        <span className="text-xs text-slate-600">Amalgama</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-red-500" />
                        <span className="text-xs text-slate-600">Caries</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-orange-400" />
                        <span className="text-xs text-slate-600">Fractura</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                        <span className="text-xs text-slate-600">Selladas</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-cyan-400" />
                        <span className="text-xs text-slate-600">Resina</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#1e40af" }} />
                        <span className="text-xs text-slate-600">Vidrio Ionómero</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#78350f" }} />
                        <span className="text-xs text-slate-600">Abfracción</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-gray-600" />
                        <span className="text-xs text-slate-600">Amalgama antigua</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-cyan-700" />
                        <span className="text-xs text-slate-600">Resina antigua</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-orange-500" />
                        <span className="text-xs text-slate-600">Amalgama defectuosa</span>
                    </div>

                    {/* ── Estados de diente completo ── */}
                    <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" fill="none" stroke="#3b82f6" strokeWidth="2"/></svg>
                        <span className="text-xs text-slate-600">Corona</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14"><g stroke="#374151" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></g></svg>
                        <span className="text-xs text-slate-600">Pieza Extraída</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14"><g stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></g></svg>
                        <span className="text-xs text-slate-600">Extracción indicada</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14"><g stroke="#2563eb" strokeWidth="2" strokeLinecap="round"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></g></svg>
                        <span className="text-xs text-slate-600">Extraída por Ortodoncia</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14"><g stroke="#f43f5e" strokeWidth="2" strokeLinecap="round"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></g></svg>
                        <span className="text-xs text-slate-600">Indicada por Ortodoncia</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14"><g stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></g></svg>
                        <span className="text-xs text-slate-600">Indicada por Sellante</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14"><g stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></g></svg>
                        <span className="text-xs text-slate-600">Pieza faltante</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14"><g stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2,1.5"><rect x="2" y="2" width="10" height="10" fill="none"/><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></g></svg>
                        <span className="text-xs text-slate-600">Pieza Sana</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-gray-900" />
                        <span className="text-xs text-slate-600">Ausente (oscurecido)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14"><g stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></g></svg>
                        <span className="text-xs text-slate-600">Resto radicular</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm border-2 border-green-500 bg-transparent" />
                        <span className="text-xs text-slate-600">Prótesis fija</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm border-2 border-blue-400 bg-transparent" />
                        <span className="text-xs text-slate-600">Prótesis existente</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default Odontograma;

/* ═══════════════════════════════════════════════════════════════
   NOTAS DE USO, API Y BASE DE DATOS
   ═══════════════════════════════════════════════════════════════

   ── Cómo usar el componente ──

   import { useRef } from "react";
   import Odontograma from "@/Componentes/Odontograma";

   function FichaClinica() {
     const odRef = useRef();

     const guardar = async () => {
       const json = odRef.current.exportOdontograma();
       await fetch(`/api/patients/${id}/odontograma`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(json),
       });
     };

     const cargar = async () => {
       const res = await fetch(`/api/patients/${id}/odontograma`);
       const json = await res.json();
       odRef.current.importOdontograma(json);
     };

     return (
       <Odontograma
         ref={odRef}
         patientId="123"
         onChange={(data) => console.log("auto-save:", data)}
       />
     );
   }

   ── MySQL: Opción A (columna JSON) — RECOMENDADA ──

   CREATE TABLE odontogramas (
     id            INT AUTO_INCREMENT PRIMARY KEY,
     patient_id    INT NOT NULL,
     data          JSON NOT NULL,
     updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     FOREIGN KEY (patient_id) REFERENCES patients(id)
   );

   Pros: Simple, flexible, el JSON se guarda/lee tal cual.
   Contras: No se puede indexar caras individuales fácilmente.

   ── MySQL: Opción B (normalizada) ──

   CREATE TABLE odontograma_surfaces (
     id            INT AUTO_INCREMENT PRIMARY KEY,
     patient_id    INT NOT NULL,
     tooth_number  VARCHAR(3) NOT NULL,
     surface       ENUM('V','L','M','D','O'),
     state         ENUM('caries','amalgama','resina','amalgamaAntigua','resinaAntigua','amalgamaDefectuosa') DEFAULT NULL,
     absent        BOOLEAN DEFAULT FALSE,
     resto_radicular BOOLEAN DEFAULT FALSE,
     protesis_fija BOOLEAN DEFAULT FALSE,
     prosthesis_existing BOOLEAN DEFAULT FALSE,
     updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

   Pros: Queries granulares (ej: "todos los dientes con caries").
   Contras: Más complejo, muchas filas por paciente.

   ── Endpoints REST ──

   GET  /api/patients/:id/odontograma
   Response: { patientId, updatedAt, teeth: {...} }

   POST /api/patients/:id/odontograma
   Body:    { patientId, updatedAt, teeth: {...} }
   Response: { success: true }

   ═══════════════════════════════════════════════════════════════ */
