"use client";

import { memo, useLayoutEffect, useState } from "react";
import { DIENTES, SUPERIORES, INFERIORES, INDICES, admiteFurcacion, etiquetaSitio, nivelInsercion, numeroVisible, valorVisible, validarValor } from "./periodontograma.mjs";

export const CLASE_CAMPO = "min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100";
export const CLASE_BOTON = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-40";

const POSICIONES_X = [13, 48, 83];
function coordenadas(sitios, clave) {
    return sitios.map((sitio, i) => {
        const valor = clave === "margen" ? sitio.margen : nivelInsercion(sitio);
        return valor === null ? null : [POSICIONES_X[i], 68 + (clave === "margen" ? -valor : valor) * 2.5];
    });
}
function tramos(puntos) {
    const segmentos = [];
    let actual = [];
    for (const punto of puntos) {
        if (punto) actual.push(punto.join(","));
        else if (actual.length) { segmentos.push(actual.join(" ")); actual = []; }
    }
    if (actual.length) segmentos.push(actual.join(" "));
    return segmentos;
}
export function IlustracionDiente({ numero, diente, superficie, anterior, espejar, resaltar }) {
    const sitios = diente[superficie];
    const margenes = coordenadas(sitios, "margen");
    const inserciones = coordenadas(sitios, "insercion");
    const molar = numero % 10 >= 6;
    const premolar = numero % 10 >= 4;
    const implantado = diente.implante > 0;
    const forma = molar ? "M17 63 C10 51 9 25 20 20 C30 14 39 20 48 20 C57 20 69 13 78 20 C88 30 85 52 79 63 L75 137 Q71 160 65 132 L54 88 Q48 76 43 90 L30 140 Q22 158 21 132 Z" : premolar ? "M26 65 C19 50 20 26 33 20 Q48 12 64 21 C77 32 75 51 69 65 L57 136 Q49 163 43 140 Z" : "M27 63 L25 27 Q47 17 70 27 L68 63 L56 139 Q49 161 42 140 Z";
    const transformacion = espejar && numero < 30 ? "translate(0 192) scale(1 -1)" : undefined;
    return (
        <svg data-grafico-diente={numero} viewBox="0 0 96 192" role="img" aria-label={`Pieza ${numero}, ${superficie}, ${diente.presente ? implantado ? "implante" : "presente" : "ausente"}. Líneas roja: margen; azul: inserción.`} className="block h-40 w-full">
            <g transform={transformacion}>
                {[18, 30.5, 43, 55.5, 68, 80.5, 93, 105.5, 118, 130.5, 143, 155.5, 168].map(y => <line key={y} x1="0" x2="96" y1={y} y2={y} className="stroke-slate-200/80" strokeWidth="0.6" />)}
                {diente.presente ? <>
                    {implantado ? <g className={diente.implante === 2 ? "stroke-rose-600 fill-rose-50" : diente.implante === 3 ? "stroke-emerald-600 fill-emerald-50" : "stroke-slate-400 fill-slate-100"} strokeWidth="1.4">
                        <path d="M27 61 L25 27 Q48 15 71 27 L69 61 Z" className="fill-white" />
                        <path d="M35 64 H61 L58 140 Q48 153 38 140 Z" />
                        {[74, 84, 94, 104, 114, 124, 134].map(y => <path key={y} d={`M33 ${y} L63 ${y - 5}`} />)}
                    </g> : <path d={forma} className="fill-amber-50/70 stroke-slate-400" strokeWidth="1.2" />}
                    <line x1="17" x2="79" y1="68" y2="68" className="stroke-slate-400" strokeDasharray="3 3" strokeWidth="1" />
                    {anterior?.presente && [0, 1].map(i => {
                        const a = anterior[superficie];
                        if ([a[i], a[i + 1]].some(sitio => sitio.margen === null || sitio.profundidad === null)) return null;
                        return <polygon key={i} points={`${POSICIONES_X[i]},${68 - a[i].margen * 2.5} ${POSICIONES_X[i + 1]},${68 - a[i + 1].margen * 2.5} ${POSICIONES_X[i + 1]},${68 + nivelInsercion(a[i + 1]) * 2.5} ${POSICIONES_X[i]},${68 + nivelInsercion(a[i]) * 2.5}`} className="fill-emerald-400/30 stroke-emerald-500" strokeWidth="0.7" />;
                    })}
                    {[0, 1].map(i => margenes[i] && margenes[i + 1] && inserciones[i] && inserciones[i + 1] ? <polygon key={i} points={[margenes[i], margenes[i + 1], inserciones[i + 1], inserciones[i]].map(punto => punto.join(",")).join(" ")} className="fill-blue-400/20" /> : null)}
                    {tramos(margenes).map((puntos, i) => <polyline key={i} points={puntos} className="fill-none stroke-rose-500" strokeWidth="2" />)}
                    {tramos(inserciones).map((puntos, i) => <polyline key={i} points={puntos} className="fill-none stroke-blue-600" strokeWidth="2" />)}
                    {margenes.map((punto, i) => punto ? <circle key={i} cx={punto[0]} cy={punto[1]} r="2" className="fill-rose-500" /> : null)}
                    {inserciones.map((punto, i) => punto ? <circle key={i} cx={punto[0]} cy={punto[1]} r="2" className="fill-blue-600" /> : null)}
                    {sitios.map((sitio, i) => {
                        const activo = resaltar === "sangrado" ? sitio.sangrado : resaltar === "placa" ? sitio.placa : resaltar === "5" ? sitio.profundidad >= 5 : resaltar === "6" ? sitio.profundidad >= 6 : false;
                        return activo ? <rect key={i} x={i * 32 + 1} y="17" width="30" height="151" rx="5" className={resaltar === "placa" ? "fill-cyan-500/25" : "fill-rose-500/20"} /> : null;
                    })}
                    {!implantado && diente.furcacion[superficie].map((grado, i) => grado > 0 && admiteFurcacion(numero, superficie, i) ? <g key={i}><circle cx={POSICIONES_X[i]} cy="101" r="7" className={grado === 3 ? "fill-slate-800 stroke-slate-800" : "fill-white stroke-slate-800"} strokeWidth="1.5" /><text x={POSICIONES_X[i]} y="104" textAnchor="middle" className={grado === 3 ? "fill-white text-[9px]" : "fill-slate-800 text-[9px]"}>{grado}</text></g> : null)}
                </> : <><path d={forma} className="fill-slate-100 stroke-slate-200" /><path d="M17 24 L79 157 M79 24 L17 157" className="stroke-slate-300" strokeWidth="2" /></>}
            </g>
        </svg>
    );
}

const CampoMedicion = memo(function CampoMedicion({ numero, superficie, posicion, indice, valor, ajustes, inhabilitado, actualizar, navegar, enfocar, pegar, informar }) {
    const [texto, setTexto] = useState(valor === null ? "" : String(valor));
    useLayoutEffect(() => { setTexto(valor === null ? "" : String(valor)); }, [valor]);
    const valido = texto === "" || (/^-?\d+$/.test(texto) && Number(texto) >= indice.min && Number(texto) <= indice.max);
    const direccion = { numero, superficie, posicion, clave: indice.clave };
    function confirmar() {
        try {
            const nuevo = validarValor(indice.clave, texto, ajustes);
            actualizar(numero, superficie, posicion, indice.clave, nuevo);
            return true;
        } catch (error) { informar(error.message); setTexto(valor === null ? "" : String(valor)); return false; }
    }
    return <input
        aria-label={`${indice.nombre} ${numero} ${etiquetaSitio(numero, superficie, posicion)}`}
        aria-invalid={!valido}
        title={`${indice.nombre}: ${indice.min} a ${indice.max}${indice.unidad ? ` ${indice.unidad}` : ""}. Enter para avanzar; Shift+Enter para retroceder.`}
        data-celda={`${numero}-${superficie}-${posicion}-${indice.clave}`}
        type="text" inputMode={indice.min < 0 ? "text" : "numeric"} autoComplete="off" value={texto} disabled={inhabilitado}
        onFocus={evento => { enfocar(direccion); evento.target.select(); }}
        onBlur={confirmar}
        onChange={evento => {
            const entrada = evento.target.value;
            if (entrada !== "" && !/^-?\d{0,2}$/.test(entrada)) return;
            setTexto(entrada);
            if (entrada === "" || (entrada !== "-" && Number(entrada) >= indice.min && Number(entrada) <= indice.max)) actualizar(numero, superficie, posicion, indice.clave, validarValor(indice.clave, entrada, ajustes));
        }}
        onPaste={evento => {
            const entrada = evento.clipboardData.getData("text").trim();
            if (/\s|;|,/.test(entrada)) { evento.preventDefault(); pegar(direccion, entrada); }
        }}
        onKeyDown={evento => {
            if (["Enter", "Tab"].includes(evento.key)) {
                if (!confirmar()) { evento.preventDefault(); return; }
                const avanzo = navegar(direccion, evento.shiftKey ? -1 : 1);
                if (avanzo || evento.key === "Enter") evento.preventDefault();
            } else if (evento.key === "Escape") { setTexto(valor === null ? "" : String(valor)); evento.currentTarget.blur(); }
        }}
        className={`h-9 w-full min-w-0 rounded-none border-0 text-center font-mono text-xs outline-none focus:relative focus:z-20 focus:bg-violet-100 focus:ring-2 focus:ring-inset focus:ring-violet-500 disabled:bg-slate-100 disabled:text-slate-300 ${!valido ? "bg-rose-100 text-rose-700" : indice.clave === "profundidad" && Number(texto) >= 4 ? "bg-rose-50 font-semibold text-rose-700" : indice.clave === "margen" ? "bg-transparent text-rose-600" : "bg-transparent text-slate-700"}`}
    />;
});

function Indicador({ numero, superficie, posicion, indice, valor, inhabilitado, actualizar, enfocar, navegar }) {
    const nombre = `${indice.nombre} ${numero} ${etiquetaSitio(numero, superficie, posicion)}`;
    return <button type="button" data-celda={`${numero}-${superficie}-${posicion}-${indice.clave}`} aria-label={`${nombre}: ${valor === null ? "sin evaluar" : valor ? "sí" : "no"}`} aria-pressed={valor === null ? "mixed" : valor} disabled={inhabilitado}
        onFocus={() => enfocar({ numero, superficie, posicion, clave: indice.clave })}
        onKeyDown={evento => { if (evento.key === "Enter" || evento.key === "Tab") { const avanzo = navegar({ numero, superficie, posicion, clave: indice.clave }, evento.shiftKey ? -1 : 1); if (avanzo || evento.key === "Enter") evento.preventDefault(); } }}
        onClick={() => actualizar(numero, superficie, posicion, indice.clave, valor === null ? true : valor ? false : null)}
        className="flex h-8 w-full items-center justify-center outline-none hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 disabled:opacity-25">
        <span aria-hidden="true" className={`flex size-3 items-center justify-center rounded-sm text-[10px] ${valor === true ? indice.clave === "placa" ? "bg-cyan-500 text-white" : "bg-rose-500 text-white" : valor === false ? "border border-slate-300 bg-slate-100 text-slate-600" : "border border-dashed border-slate-300"}`}>{valor === true ? "+" : valor === false ? "−" : ""}</span>
    </button>;
}

function FilaParametro({ indice, numeros, superficie, examen, acciones }) {
    return <tr className="border-b border-slate-100">
        <th scope="row" className="sticky left-0 z-20 border-r border-slate-200 bg-white px-3 py-1 text-left text-[10px] font-medium text-slate-600">
            <div className="flex items-center justify-between gap-1"><span>{indice.nombre} {indice.unidad && <span className="text-slate-400">({indice.unidad})</span>}</span>
                {indice.tipo === "booleano" && <button type="button" title={`Marcar ${indice.nombre} como no en todos los sitios de esta superficie`} onClick={() => acciones.completar(numeros, superficie, indice.clave)} className="rounded px-1 py-1 text-[9px] text-violet-700 hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500">Todos −</button>}
            </div>
        </th>
        {numeros.map(numero => {
            const diente = examen.dientes[numero];
            return <td key={numero} className="border-r border-slate-200 p-0">
                <div className={indice.porSuperficie ? "flex justify-center" : "grid grid-cols-3 divide-x divide-slate-100"}>
                    {(indice.porSuperficie ? [1] : [0, 1, 2]).map(posicion => {
                        const valor = valorVisible(diente[superficie][posicion], indice.clave, examen.ajustes);
                        const propiedades = { numero, superficie, posicion, indice, valor, inhabilitado: !diente.presente, ...acciones };
                        if (indice.tipo === "calculado") return <span key={posicion} className="flex h-9 items-center justify-center bg-blue-50/50 font-mono text-xs text-blue-700">{diente.presente ? valor ?? "—" : "—"}</span>;
                        if (indice.tipo === "booleano") return <Indicador key={posicion} {...propiedades} />;
                        if (indice.tipo === "opciones") return <select key={posicion} aria-label={`${indice.nombre} ${numero} ${superficie}`} value={valor ?? ""} disabled={!diente.presente} onChange={evento => acciones.actualizar(numero, superficie, posicion, indice.clave, evento.target.value || null)} className="h-9 w-full bg-transparent text-[10px] outline-violet-500"><option value="">—</option>{indice.opciones.map(opcion => <option key={opcion}>{opcion}</option>)}</select>;
                        return <CampoMedicion key={posicion} {...propiedades} ajustes={examen.ajustes} />;
                    })}
                </div>
            </td>;
        })}
    </tr>;
}

function Superficie({ numeros, superficie, examen, comparar, acciones, compacto, resaltar }) {
    const indices = INDICES.filter(indice => (compacto ? ["profundidad", "sangrado", "placa"] : examen.ajustes.indices).includes(indice.clave));
    const titulo = superficie === "vestibular" ? "Vestibular" : numeros[0] < 30 ? "Palatino" : "Lingual";
    return <tbody>
        <tr><th colSpan={17} scope="rowgroup" className="border-y border-violet-100 bg-violet-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-violet-800">{titulo} · Tres sitios por pieza</th></tr>
        <tr className="bg-slate-50/40"><th scope="row" className="sticky left-0 z-20 border-r border-slate-200 bg-slate-50 px-3 text-left text-[10px] font-normal text-slate-500">Sitio anatómico</th>{numeros.map(numero => <td key={numero} className="border-r border-slate-200 py-1"><div className="grid grid-cols-3 text-center text-[8px] text-slate-400">{[0, 1, 2].map(posicion => <abbr key={posicion} title={etiquetaSitio(numero, superficie, posicion)} className="no-underline">{etiquetaSitio(numero, superficie, posicion).startsWith("disto") ? "D" : etiquetaSitio(numero, superficie, posicion).startsWith("mesio") ? "M" : titulo[0]}</abbr>)}</div></td>)}</tr>
        <tr><th scope="row" className="sticky left-0 z-20 border-r border-slate-200 bg-white px-3 text-left text-[10px] font-medium text-slate-600">Furcación</th>{numeros.map(numero => <td key={numero} className="border-r border-slate-200"><div className="grid grid-cols-3">{[0, 1, 2].map(posicion => admiteFurcacion(numero, superficie, posicion) ? <button key={posicion} type="button" disabled={!examen.dientes[numero].presente || examen.dientes[numero].implante > 0} aria-label={`Furcación ${numero} ${etiquetaSitio(numero, superficie, posicion)}: ${examen.dientes[numero].furcacion[superficie][posicion] ?? "sin evaluar"}`} onClick={() => acciones.furcacion(numero, superficie, posicion)} className="h-8 text-xs text-slate-700 hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-20">{examen.dientes[numero].furcacion[superficie][posicion] ?? "—"}</button> : <span key={posicion} />)}</div></td>)}</tr>
        {indices.map(indice => <FilaParametro key={indice.clave} indice={indice} numeros={numeros} superficie={superficie} examen={examen} acciones={acciones} />)}
        {!compacto && <tr><th scope="row" className="sticky left-0 z-20 border-r border-slate-200 bg-slate-50/95 px-3 text-left text-[10px] font-normal text-slate-500"><span className="mb-2 block font-medium text-slate-700">Perfil periodontal</span><span className="block text-rose-600">Rojo · Margen</span><span className="mt-1 block text-blue-600">Azul · Inserción</span>{comparar && <span className="mt-1 block text-emerald-600">Verde · Examen anterior</span>}<span className="mt-3 block">Guías cada 5 mm</span></th>{numeros.map(numero => <td key={numero} className="border-r border-slate-200 bg-slate-50/30 p-0"><IlustracionDiente numero={numero} diente={examen.dientes[numero]} superficie={superficie} anterior={comparar?.dientes[numero]} espejar={examen.ajustes.espejar} resaltar={resaltar} /></td>)}</tr>}
    </tbody>;
}

export default function GraficoPeriodontal({ examen, comparar, acciones, compacto, resaltar }) {
    return <div className="flex min-w-0 flex-col gap-5">
        {[{ titulo: "Arcada superior", numeros: SUPERIORES }, { titulo: "Arcada inferior", numeros: INFERIORES }].map(({ titulo, numeros }) => <section key={titulo} aria-label={titulo} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3"><h2 className="text-sm font-semibold text-slate-800">{titulo}</h2><span className="text-[10px] text-slate-500">Derecha del paciente → Izquierda</span></div>
            <div role="region" aria-label={`Tabla ${titulo}`} tabIndex={0} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-violet-400">
                <table className="w-full min-w-[1380px] table-fixed border-collapse">
                    <caption className="sr-only">{titulo}. Haz clic en el número para marcar una pieza como ausente. Las celdas vacías no cuentan como mediciones.</caption>
                    <thead><tr className="bg-slate-50"><th scope="col" className="sticky left-0 z-20 w-48 border-r border-slate-200 bg-slate-50 px-3 text-left text-[10px] font-medium text-slate-600">Pieza · {examen.ajustes.numeracion}</th>{numeros.map(numero => <th key={numero} scope="col" className="border-r border-slate-200 p-0"><button type="button" title={`Pieza FDI ${numero}: clic para ${examen.dientes[numero].presente ? "marcar ausente" : "restaurar"}`} aria-label={`Pieza ${numero} ${examen.dientes[numero].presente ? "presente" : "ausente"}`} aria-pressed={!examen.dientes[numero].presente} onClick={() => acciones.diente(numero, "presente", !examen.dientes[numero].presente)} className={`h-10 w-full font-mono text-sm hover:bg-violet-100 focus-visible:ring-2 focus-visible:ring-violet-500 ${examen.dientes[numero].presente ? "text-slate-800" : "bg-slate-100 text-slate-400 line-through"}`}>{numeroVisible(numero, examen.ajustes.numeracion)}</button></th>)}</tr></thead>
                    <tbody>
                        <tr className="border-b border-slate-100"><th scope="row" className="sticky left-0 z-20 border-r border-slate-200 bg-white px-3 text-left text-[10px] font-medium text-slate-600">Movilidad</th>{numeros.map(numero => <td key={numero} className="border-r border-slate-200"><select aria-label={`Movilidad ${numero}`} disabled={!examen.dientes[numero].presente || examen.dientes[numero].implante > 0} value={examen.dientes[numero].movilidad ?? ""} onChange={evento => acciones.diente(numero, "movilidad", evento.target.value === "" ? null : Number(evento.target.value))} className="h-8 w-full bg-transparent text-center text-xs outline-violet-500 disabled:opacity-25"><option value="">—</option>{[0, 1, 2, 3].map(grado => <option key={grado}>{grado}</option>)}</select></td>)}</tr>
                        <tr className="border-b border-slate-100"><th scope="row" className="sticky left-0 z-20 border-r border-slate-200 bg-white px-3 text-left text-[10px] font-medium text-slate-600">Implante</th>{numeros.map(numero => <td key={numero} className="border-r border-slate-200 p-0"><button type="button" disabled={!examen.dientes[numero].presente} aria-label={`Implante ${numero}: ${["no", "presente", "marcado rojo", "marcado verde"][examen.dientes[numero].implante]}`} onClick={() => acciones.diente(numero, "implante", (examen.dientes[numero].implante + 1) % 4)} className={`h-8 w-full text-[10px] outline-violet-500 hover:bg-violet-50 disabled:opacity-20 ${examen.dientes[numero].implante === 2 ? "bg-rose-50 text-rose-700" : examen.dientes[numero].implante === 3 ? "bg-emerald-50 text-emerald-700" : "text-slate-600"}`}>{["—", "Implante", "Rojo", "Verde"][examen.dientes[numero].implante]}</button></td>)}</tr>
                    </tbody>
                    <Superficie numeros={numeros} superficie="vestibular" examen={examen} comparar={comparar} acciones={acciones} compacto={compacto} resaltar={resaltar} />
                    <Superficie numeros={numeros} superficie="interior" examen={examen} comparar={comparar} acciones={acciones} compacto={compacto} resaltar={resaltar} />
                    <tbody><tr><th scope="row" className="sticky left-0 z-20 border-r border-slate-200 bg-white px-3 text-left text-[10px] font-medium text-slate-600">Nota por pieza</th>{numeros.map(numero => <td key={numero} className="border-r border-slate-200 p-0"><input aria-label={`Nota pieza ${numero}`} value={examen.dientes[numero].nota} maxLength={1000} onChange={evento => acciones.diente(numero, "nota", evento.target.value)} placeholder="…" className="h-9 w-full min-w-0 bg-transparent px-1 text-xs outline-violet-500" /></td>)}</tr></tbody>
                </table>
            </div>
        </section>)}
    </div>;
}

export function ResumenOclusal({ examen, indicador = "placa" }) {
    return <div className="grid grid-cols-8 gap-2 sm:grid-cols-16">{DIENTES.map(numero => {
        const diente = examen.dientes[numero];
        const color = indicador === "placa" ? "fill-cyan-500" : "fill-rose-500";
        const sitios = [diente.vestibular[1], diente.vestibular[2], diente.interior[1], diente.vestibular[0]];
        return <div key={numero} className="text-center"><span className="font-mono text-[10px] text-slate-500">{numeroVisible(numero, examen.ajustes.numeracion)}</span><svg viewBox="0 0 40 40" role="img" aria-label={`Pieza ${numero}, ${indicador}`} className="mx-auto size-9"><rect x="1" y="1" width="38" height="38" rx="9" className="fill-slate-50 stroke-slate-200" />{["M5 5 L35 5 L20 20 Z", "M35 5 L35 35 L20 20 Z", "M35 35 L5 35 L20 20 Z", "M5 35 L5 5 L20 20 Z"].map((ruta, i) => <path key={ruta} d={ruta} className={!diente.presente ? "fill-slate-200" : sitios[i][indicador] ? color : "fill-white stroke-slate-200"} />)}{!diente.presente && <path d="M4 4 L36 36 M36 4 L4 36" className="stroke-slate-400" />}</svg></div>;
    })}</div>;
}
