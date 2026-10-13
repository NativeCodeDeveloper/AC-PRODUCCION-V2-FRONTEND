"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import {
    Save as Guardar, Download as Descargar, Upload as Importar, Plus as Agregar,
    Settings2 as Configurar, Copy as Copiar, Printer as Imprimir, Mic as Microfono,
    MicOff as MicrofonoApagado, HelpCircle as AyudaIcono, Search as Buscar,
    Trash2 as Eliminar, Undo2 as Deshacer, Redo2 as Rehacer, Star as Estrella,
    QrCode as CodigoQr, Box as Cubo, ClipboardList as Ficha, Check as Verificado,
} from "lucide-react";
import {
    INDICES, admiteFurcacion, crearExamen, cambiarSitio, copiarExamen,
    etiquetaSitio, fechaLocal, formato, interpretarComando, normalizarExamen,
    resumenExamen, secuenciaSitios, validarValor,
} from "./periodontograma.mjs";
import GraficoPeriodontal, { CLASE_BOTON, CLASE_CAMPO } from "./GraficoPeriodontal";
import { Ajustes, Analisis, Ayuda, Campo, Clasificacion, Intervalo, Microbiologia, Opcion, RiesgoPeriodontal, SaludGeneral, Ventana } from "./PanelesPeriodontales";
import { crearEnlaceAnonimo, crearPdf, descargarArchivo, exportarExamenes, leerArchivo, leerEnlaceAnonimo } from "./archivos.mjs";

const VistaTridimensional = dynamic(() => import("./VistaTridimensional"), { ssr: false, loading: () => <p className="p-8 text-sm text-slate-500">Preparando vista tridimensional…</p> });
const TITULOS = { riesgo: "Evaluación del riesgo periodontal", ajustes: "Ajustes e índices", exportar: "Exportar e importar", copiar: "Copiar datos de otro examen", analisis: "Análisis y comparación", calibracion: "Calibración entre examinadores", intervalo: "Intervalo de mantenimiento", clasificacion: "Clasificación periodontal", ayuda: "Cómo usar el periodontograma", voz: "Dictado y comandos", qr: "Compartir registro dental", tresd: "Superficie periodontal · Vista 3D", importar: "Revisar importación" };
const GRUPOS_COPIA = [["estado", "Piezas, implantes y movilidad"], ["furcacion", "Furcaciones"], ["margen", "Margen gingival"], ["profundidad", "Profundidad de sondaje"], ["sangrado", "Sangrado"], ["placa", "Placa"]];

export default function PeriodontogramaPaciente() {
    const { user, isLoaded } = useUser();
    if (!isLoaded || !user) return <div className="p-8 text-sm text-slate-500" role="status">Cargando sesión del periodontograma…</div>;
    return <EditorPeriodontal key={user.id} claveAlmacen={`agenda:periodontograma:v1:${user.id}`} />;
}

export function EditorPeriodontal({ claveAlmacen }) {
    const [examen, setExamen] = useState(() => crearExamen());
    const [historial, setHistorial] = useState([]);
    const [listo, setListo] = useState(false);
    const [almacenSeguro, setAlmacenSeguro] = useState(true);
    const [estadoGuardado, setEstadoGuardado] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [pestana, setPestana] = useState("periodontograma");
    const [ventana, setVentana] = useState("");
    const [compacto, setCompacto] = useState(false);
    const [resaltar, setResaltar] = useState("");
    const [compararId, setCompararId] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [orden, setOrden] = useState("reciente");
    const [ocupado, setOcupado] = useState(false);
    const [importados, setImportados] = useState([]);
    const [importarInvertido, setImportarInvertido] = useState(false);
    const [anonimizar, setAnonimizar] = useState(false);
    const [exportarTodos, setExportarTodos] = useState(false);
    const [origenCopia, setOrigenCopia] = useState("");
    const [gruposCopia, setGruposCopia] = useState(["estado", "furcacion"]);
    const [correcciones, setCorrecciones] = useState([]);
    const [escuchado, setEscuchado] = useState("");
    const [correcto, setCorrecto] = useState("");
    const [comando, setComando] = useState("");
    const [dictando, setDictando] = useState(false);
    const [vozDisponible, setVozDisponible] = useState(false);
    const [enlaceQr, setEnlaceQr] = useState("");
    const [imagenQr, setImagenQr] = useState("");
    const [destino, setDestino] = useState({ numero: 18, superficie: "vestibular", posicion: 0, clave: "margen" });
    const [pasados, setPasados] = useState([]);
    const [futuros, setFuturos] = useState([]);
    const entradaArchivo = useRef(null);
    const entradaDiccionario = useRef(null);
    const reconocimiento = useRef(null);
    const referenciaExamen = useRef(examen);
    const referenciaDestino = useRef(destino);
    const procesarVoz = useRef(null);
    const revisionAccion = useRef(null);

    useEffect(() => { referenciaExamen.current = examen; }, [examen]);
    useEffect(() => { referenciaDestino.current = destino; }, [destino]);
    useEffect(() => {
        try {
            const guardado = localStorage.getItem(claveAlmacen);
            if (guardado) {
                const datos = JSON.parse(guardado);
                if (!Array.isArray(datos.historial)) throw new Error("Estructura de historial inválida.");
                setHistorial(datos.historial.map(normalizarExamen));
                if (datos.borrador) setExamen(normalizarExamen(datos.borrador));
                if (Array.isArray(datos.correcciones)) setCorrecciones(datos.correcciones.filter(item => typeof item.escuchado === "string" && typeof item.correcto === "string").slice(0, 100));
            }
        } catch { setAlmacenSeguro(false); setError("No se pudo leer el almacenamiento anterior. Se ha protegido para evitar sobrescribirlo. Puedes seguir trabajando y exportar el examen a un archivo."); }
        setVozDisponible(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
        setListo(true);
        if (window.location.hash.startsWith("#perio=")) {
            leerEnlaceAnonimo(window.location.hash).then(datos => { setImportados([datos]); setVentana("importar"); }).catch(fallo => setError(fallo.message));
        }
        return () => { reconocimiento.current?.abort(); };
    }, [claveAlmacen]);

    useEffect(() => {
        if (!listo || !almacenSeguro) return;
        setEstadoGuardado("Guardando borrador…");
        const temporizador = setTimeout(() => {
            try {
                localStorage.setItem(claveAlmacen, JSON.stringify({ version: 1, historial, borrador: examen, correcciones }));
                setEstadoGuardado("Borrador guardado en este navegador");
            } catch { setEstadoGuardado("No se pudo guardar: exporta una copia"); }
        }, 500);
        return () => clearTimeout(temporizador);
    }, [listo, almacenSeguro, examen, historial, correcciones, claveAlmacen]);

    useEffect(() => {
        if (!listo || !almacenSeguro) return;
        const conservar = () => {
            try { localStorage.setItem(claveAlmacen, JSON.stringify({ version: 1, historial, borrador: referenciaExamen.current, correcciones })); }
            catch { setEstadoGuardado("No se pudo guardar: exporta una copia"); }
        };
        window.addEventListener("pagehide", conservar);
        return () => window.removeEventListener("pagehide", conservar);
    }, [listo, almacenSeguro, claveAlmacen, historial, correcciones]);

    const resumen = useMemo(() => resumenExamen(examen), [examen]);
    const delPaciente = useMemo(() => historial.filter(item => examen.paciente.id && item.paciente.id === examen.paciente.id && item.id !== examen.id).sort((a, b) => b.fecha.localeCompare(a.fecha)), [historial, examen.paciente.id, examen.id]);
    const comparado = delPaciente.find(item => item.id === compararId) ?? null;
    const anterior = delPaciente.find(item => item.fecha <= examen.fecha) ?? null;
    const guardado = historial.find(item => item.id === examen.id);
    const modificado = !guardado || JSON.stringify(guardado) !== JSON.stringify(examen);
    const registrosVisibles = useMemo(() => {
        const filtro = busqueda.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return historial.filter(item => `${item.paciente.nombre} ${item.paciente.apellidos} ${item.paciente.id}`.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(filtro)).sort((a, b) => orden === "nombre" ? `${a.paciente.apellidos} ${a.paciente.nombre}`.localeCompare(`${b.paciente.apellidos} ${b.paciente.nombre}`, "es") : orden === "favoritos" ? Number(b.favorito) - Number(a.favorito) || b.fecha.localeCompare(a.fecha) : b.fecha.localeCompare(a.fecha));
    }, [historial, busqueda, orden]);

    function informar(texto) { setError(texto); setMensaje(""); }
    function avisar(texto) { setMensaje(texto); setError(""); }
    function modificar(transformar, grupo = "") {
        const actual = referenciaExamen.current;
        const siguiente = typeof transformar === "function" ? transformar(actual) : transformar;
        if (siguiente === actual || JSON.stringify(siguiente) === JSON.stringify(actual)) return;
        if (!grupo || revisionAccion.current !== grupo) {
            setPasados(lista => [...lista.slice(-29), actual]);
            setFuturos([]);
            revisionAccion.current = grupo;
        }
        referenciaExamen.current = siguiente;
        setExamen(siguiente);
    }
    function cambiar(campo, valor) { modificar(actual => ({ ...actual, [campo]: valor }), `campo:${campo}`); }
    function cambiarPaciente(campo, valor) { modificar(actual => ({ ...actual, paciente: { ...actual.paciente, [campo]: valor } }), `paciente:${campo}`); if (campo === "id") setCompararId(""); }
    const enfocar = useCallback(direccion => { setDestino(direccion); }, []);
    function actualizar(numero, superficie, posicion, clave, valor) { modificar(actual => cambiarSitio(actual, numero, superficie, posicion, clave, valor), `${numero}-${superficie}-${posicion}-${clave}`); }
    function modificarDiente(numero, campo, valor) { modificar(actual => ({ ...actual, dientes: { ...actual.dientes, [numero]: { ...actual.dientes[numero], [campo]: valor } } })); }
    function modificarFurcacion(numero, superficie, posicion, valor) {
        modificar(actual => {
            const diente = actual.dientes[numero];
            if (!diente.presente || diente.implante || !admiteFurcacion(numero, superficie, posicion)) return actual;
            const previo = diente.furcacion[superficie][posicion];
            return { ...actual, dientes: { ...actual.dientes, [numero]: { ...diente, furcacion: { ...diente.furcacion, [superficie]: diente.furcacion[superficie].map((grado, i) => i === posicion ? valor !== undefined ? valor : previo === null ? 0 : previo === 3 ? null : previo + 1 : grado) } } } };
        });
    }
    function foco(direccion) {
        referenciaDestino.current = direccion;
        setDestino(direccion);
        requestAnimationFrame(() => { const elemento = document.querySelector(`[data-celda="${direccion.numero}-${direccion.superficie}-${direccion.posicion}-${direccion.clave}"]`); elemento?.focus(); });
    }
    function siguienteDireccion(direccion, paso, actual = referenciaExamen.current) {
        const secuencia = secuenciaSitios(actual);
        const indice = secuencia.findIndex(item => item.numero === direccion.numero && item.superficie === direccion.superficie && item.posicion === direccion.posicion);
        if (indice < 0) return null;
        if (actual.ajustes.pares && !compacto && ["margen", "profundidad"].includes(direccion.clave)) {
            if (paso > 0 && direccion.clave === "margen") return { ...direccion, clave: "profundidad" };
            if (paso < 0 && direccion.clave === "profundidad") return { ...direccion, clave: "margen" };
            const proximo = secuencia[indice + paso];
            return proximo ? { ...proximo, clave: paso > 0 ? "margen" : "profundidad" } : null;
        }
        let siguiente = indice + paso;
        const esSuperficie = INDICES.find(item => item.clave === direccion.clave)?.porSuperficie;
        if (esSuperficie) while (secuencia[siguiente] && secuencia[siguiente].posicion !== 1) siguiente += paso;
        return secuencia[siguiente] ? { ...secuencia[siguiente], clave: direccion.clave } : null;
    }
    function navegar(direccion, paso) {
        const siguiente = siguienteDireccion(direccion, paso);
        if (siguiente) { foco(siguiente); return true; }
        avisar("Llegaste al final del recorrido de registro.");
        return false;
    }
    function aplicarValores(direccion, entradas) {
        try {
            let actual = referenciaExamen.current;
            let cursor = direccion;
            for (const valor of entradas) {
                if (!cursor) throw new Error("La secuencia contiene más valores que sitios disponibles.");
                const validado = validarValor(cursor.clave, valor, actual.ajustes);
                actual = cambiarSitio(actual, cursor.numero, cursor.superficie, cursor.posicion, cursor.clave, validado);
                cursor = siguienteDireccion(cursor, 1, actual);
            }
            modificar(actual); referenciaExamen.current = actual;
            if (cursor) foco(cursor);
            avisar(`${entradas.length} valores registrados.`);
        } catch (fallo) { informar(fallo.message); }
    }
    function completar(numeros, superficie, clave) {
        modificar(actual => {
            let resultado = actual;
            for (const numero of numeros) for (let posicion = 0; posicion < 3; posicion++) resultado = cambiarSitio(resultado, numero, superficie, posicion, clave, false);
            return resultado;
        });
    }
    const acciones = { actualizar, diente: modificarDiente, furcacion: modificarFurcacion, navegar, enfocar, informar, completar, pegar: (direccion, texto) => aplicarValores(direccion, texto.split(/[\s,;]+/).filter(Boolean)) };
    function restaurar(paso) {
        revisionAccion.current = null;
        if (paso === -1 && pasados.length) { setFuturos(lista => [...lista, examen]); setExamen(pasados[pasados.length - 1]); setPasados(lista => lista.slice(0, -1)); }
        if (paso === 1 && futuros.length) { setPasados(lista => [...lista, examen]); setExamen(futuros[futuros.length - 1]); setFuturos(lista => lista.slice(0, -1)); }
    }
    function confirmarCambio() { return !modificado || (!examen.paciente.id && !examen.paciente.nombre && !resumen.medidos && !resumen.bopEvaluados && !resumen.placaEvaluados) || window.confirm("Este examen tiene cambios fuera del historial. ¿Continuar sin guardar estos cambios en el historial?"); }
    function abrirExamen(item) { if (!confirmarCambio()) return; setExamen(structuredClone(item)); setCompararId(""); setPasados([]); setFuturos([]); revisionAccion.current = null; setPestana("periodontograma"); }
    function nuevo(mismoPaciente = false) {
        if (!confirmarCambio()) return;
        const nuevoExamen = crearExamen(mismoPaciente ? examen.paciente : {});
        if (mismoPaciente) { nuevoExamen.tipo = "Reevaluación"; nuevoExamen.clinico = examen.clinico; nuevoExamen.ajustes = structuredClone(examen.ajustes); nuevoExamen.preguntas = structuredClone(examen.preguntas); }
        setExamen(nuevoExamen); setPasados([]); setFuturos([]); setCompararId(""); setPestana("periodontograma"); revisionAccion.current = null;
    }
    function guardar() {
        if (!examen.paciente.id.trim() || !examen.paciente.nombre.trim() || !examen.fecha) { informar("Completa ID, nombre del paciente y fecha del examen antes de guardar."); return; }
        if (!almacenSeguro) { informar("El almacenamiento está protegido por un error de lectura. Exporta el examen para conservarlo."); return; }
        const validado = normalizarExamen(examen);
        const lista = [validado, ...historial.filter(item => item.id !== examen.id)];
        try { localStorage.setItem(claveAlmacen, JSON.stringify({ version: 1, historial: lista, borrador: validado, correcciones })); setHistorial(lista); setExamen(validado); avisar("Examen guardado en el historial de este navegador."); }
        catch { informar("No fue posible guardar. El almacenamiento puede estar lleno; exporta los registros a un archivo."); }
    }
    function eliminarExamen(item) {
        if (!window.confirm(`¿Eliminar del historial el examen de ${item.paciente.nombre} del ${item.fecha}? Exporta antes una copia si deseas conservarlo.`)) return;
        setHistorial(lista => lista.filter(registro => registro.id !== item.id));
        if (compararId === item.id) setCompararId("");
        avisar("Examen eliminado del historial. El examen abierto se conserva como borrador.");
    }
    async function tarea(operacion) { setOcupado(true); setError(""); try { await operacion(); } catch (fallo) { informar(fallo.message || "No fue posible completar la operación."); } finally { setOcupado(false); } }
    function exportar(tipo) { return tarea(async () => { const lista = exportarTodos ? [examen, ...historial.filter(item => item.id !== examen.id)] : [examen]; await exportarExamenes(lista, tipo, anonimizar); avisar("Archivo exportado."); }); }
    function pdf(imprimir = false) { return tarea(async () => {
        const documento = await crearPdf(examen);
        if (imprimir) { documento.autoPrint(); const url = URL.createObjectURL(documento.output("blob")); const nueva = window.open(url, "_blank", "noopener,noreferrer"); if (!nueva) avisar("Si el navegador bloqueó la ventana, usa «Descargar PDF» para abrir e imprimir el documento."); setTimeout(() => URL.revokeObjectURL(url), 120000); }
        else documento.save(`periodontograma-${examen.fecha}.pdf`);
    }); }
    function importarArchivo(evento) { const archivo = evento.target.files?.[0]; evento.target.value = ""; if (archivo) tarea(async () => { const lista = await leerArchivo(archivo, importarInvertido); setImportados(lista); setVentana("importar"); }); }
    function confirmarImportacion() {
        if (!confirmarCambio()) return;
        const lista = importados.map(item => ({ ...item, id: crypto.randomUUID() }));
        setExamen(lista[0]); setHistorial(actual => [...lista.slice(1), ...actual]); setImportados([]); setVentana(""); setPestana("periodontograma"); setCompararId(""); setPasados([]); setFuturos([]); revisionAccion.current = null;
        avisar(`${lista.length} examen(es) importado(s) como nuevos registros. Revisa los datos y guarda el examen abierto.`);
        if (window.location.hash.startsWith("#perio=")) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    function copiarDatos() {
        const origen = delPaciente.find(item => item.id === origenCopia);
        if (!origen) return;
        if (!window.confirm("¿Reemplazar los parámetros seleccionados con los del examen de origen? Puedes deshacer esta operación.")) return;
        modificar(actual => copiarExamen(origen, actual, gruposCopia)); setVentana(""); avisar("Parámetros copiados. Revisa el registro antes de guardarlo.");
    }
    function procesarComando(texto) {
        const ordenVoz = interpretarComando(texto, correcciones);
        const direccion = referenciaDestino.current;
        if (ordenVoz.tipo === "detener") { reconocimiento.current?.stop(); return; }
        if (ordenVoz.tipo === "juicio") { modificar(actual => ({ ...actual, dientes: { ...actual.dientes, ...Object.fromEntries([18, 28, 38, 48].map(numero => [numero, { ...actual.dientes[numero], presente: ordenVoz.valor }])) } })); avisar("Estado de las muelas del juicio actualizado."); return; }
        if (ordenVoz.tipo === "diente") { modificarDiente(ordenVoz.numero, ordenVoz.campo, ordenVoz.valor); avisar(`Pieza ${ordenVoz.numero} actualizada.`); return; }
        if (ordenVoz.tipo === "furcacion") { if (!admiteFurcacion(ordenVoz.numero, ordenVoz.superficie, ordenVoz.posicion)) { informar("La ubicación indicada no corresponde a una furcación disponible."); return; } modificarFurcacion(ordenVoz.numero, ordenVoz.superficie, ordenVoz.posicion, ordenVoz.valor); return; }
        if (ordenVoz.tipo === "enfocar") {
            if (!referenciaExamen.current.dientes[ordenVoz.numero].presente) { informar("La pieza indicada está ausente."); return; }
            setVentana(""); setPestana("periodontograma"); setCompacto(false);
            if (!examen.ajustes.indices.includes(ordenVoz.clave)) cambiar("ajustes", { ...examen.ajustes, indices: [...examen.ajustes.indices, ordenVoz.clave] });
            foco(ordenVoz); return;
        }
        if (ordenVoz.tipo === "siguiente") { navegar(direccion, 1); return; }
        if (ordenVoz.tipo === "valores") { aplicarValores(direccion, ordenVoz.valores); return; }
        if (ordenVoz.tipo === "indicador") {
            if (INDICES.find(indice => indice.clave === direccion.clave)?.tipo !== "booleano") { informar("Selecciona primero una celda de sangrado, placa u otro indicador."); return; }
            actualizar(direccion.numero, direccion.superficie, direccion.posicion, direccion.clave, ordenVoz.valor); navegar(direccion, 1); return;
        }
        informar(`No se reconoció el comando: «${texto}».`);
    }
    useEffect(() => { procesarVoz.current = procesarComando; });
    function alternarDictado() {
        if (dictando) { reconocimiento.current?.stop(); return; }
        const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Reconocimiento) { informar("El navegador no admite dictado. Puedes introducir comandos de texto o usar las celdas."); return; }
        const instancia = new Reconocimiento(); reconocimiento.current = instancia;
        instancia.lang = "es-ES"; instancia.continuous = true; instancia.interimResults = false;
        instancia.onresult = evento => { for (let i = evento.resultIndex; i < evento.results.length; i++) if (evento.results[i].isFinal) { const texto = evento.results[i][0].transcript.trim(); setComando(texto); procesarVoz.current?.(texto); } };
        instancia.onstart = () => setDictando(true); instancia.onend = () => setDictando(false);
        instancia.onerror = evento => { if (evento.error !== "no-speech" && evento.error !== "aborted") informar(evento.error === "not-allowed" ? "El micrófono no tiene permiso. Habilítalo para este sitio o utiliza comandos de texto." : `El dictado se interrumpió: ${evento.error}.`); setDictando(false); };
        try { instancia.start(); } catch { informar("No fue posible iniciar el micrófono."); }
    }
    function generarQr() { setVentana("qr"); setImagenQr(""); setEnlaceQr(""); tarea(async () => { const enlace = await crearEnlaceAnonimo(examen); setEnlaceQr(enlace); const QR = await import("qrcode"); setImagenQr(await QR.toDataURL(enlace, { width: 340, margin: 2, errorCorrectionLevel: "L" })); }); }

    if (!listo) return <div className="p-8 text-sm text-slate-500">Cargando registros locales…</div>;
    return <div className="min-h-screen min-w-0 bg-[#FAFAFB] px-3 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-5">
            <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-600">Ficha clínica · Periodoncia</p><h1 className="text-2xl font-semibold tracking-tight text-slate-900">Periodontograma</h1><p className="mt-1 text-xs text-slate-500">Registro periodontal y periimplantario · Seis sitios por pieza</p></div><div className="flex flex-wrap gap-2"><button type="button" className={CLASE_BOTON} onClick={() => setVentana("ayuda")}><AyudaIcono className="size-4" /> Ayuda</button><button type="button" className={CLASE_BOTON} onClick={() => nuevo(false)}><Agregar className="size-4" /> Nuevo paciente</button><button type="button" disabled={!examen.paciente.id} className={CLASE_BOTON} onClick={() => nuevo(true)}>Nuevo examen</button><button type="button" onClick={guardar} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-violet-500"><Guardar className="size-4" /> Guardar examen</button></div></header>
            <div aria-live="polite" className="flex flex-col gap-2">{error && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Cerrar error">×</button></div>}{mensaje && <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"><span>{mensaje}</span><button type="button" onClick={() => setMensaje("")} aria-label="Cerrar mensaje">×</button></div>}</div>
            <section aria-label="Paciente y examen" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                <Campo etiqueta="ID paciente *"><input className={CLASE_CAMPO} maxLength={100} value={examen.paciente.id} onChange={evento => cambiarPaciente("id", evento.target.value)} placeholder="Identificador" /></Campo>
                <Campo etiqueta="Nombre *"><input className={CLASE_CAMPO} maxLength={100} value={examen.paciente.nombre} onChange={evento => cambiarPaciente("nombre", evento.target.value)} autoComplete="off" /></Campo>
                <Campo etiqueta="Apellidos"><input className={CLASE_CAMPO} maxLength={100} value={examen.paciente.apellidos} onChange={evento => cambiarPaciente("apellidos", evento.target.value)} autoComplete="off" /></Campo>
                <Campo etiqueta="Nacimiento"><input type="date" className={CLASE_CAMPO} max={fechaLocal()} value={examen.paciente.nacimiento} onChange={evento => cambiarPaciente("nacimiento", evento.target.value)} /></Campo>
                <Campo etiqueta="Fecha del examen *"><input type="date" className={CLASE_CAMPO} value={examen.fecha} onChange={evento => cambiar("fecha", evento.target.value)} /></Campo>
                <Campo etiqueta="Evaluación"><select className={CLASE_CAMPO} value={examen.tipo} onChange={evento => cambiar("tipo", evento.target.value)}>{[...new Set(["Inicial", "Reevaluación", "Mantenimiento", "Calibración", examen.tipo])].map(tipo => <option key={tipo}>{tipo}</option>)}</select></Campo>
                <Campo etiqueta="Clínico"><input className={CLASE_CAMPO} maxLength={150} value={examen.clinico} onChange={evento => cambiar("clinico", evento.target.value)} /></Campo>
            </div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500"><span className="flex items-center gap-1.5"><Verificado className="size-3" />{estadoGuardado || "Almacenamiento local por usuario"}</span><span>{modificado ? "Cambios pendientes de guardar en el historial" : "Examen guardado en el historial"} · Sin sincronización con el servidor</span></div></section>
            <nav aria-label="Secciones del registro" className="flex gap-1 overflow-x-auto border-b border-slate-200">{[["historial", `Historial (${historial.length})`], ["periodontograma", "Periodontograma"], ["salud", "Salud general"], ["microbiologia", "Microbiología"]].map(([clave, titulo]) => <button type="button" key={clave} aria-current={pestana === clave ? "page" : undefined} onClick={() => setPestana(clave)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-medium transition ${pestana === clave ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{titulo}</button>)}</nav>
            <div className="flex flex-wrap items-center gap-2"><button type="button" className={CLASE_BOTON} disabled={ocupado} onClick={() => pdf()}><Descargar className="size-3.5" /> Descargar PDF</button><button type="button" className={CLASE_BOTON} disabled={ocupado} onClick={() => pdf(true)}><Imprimir className="size-3.5" /> Imprimir</button><button type="button" className={CLASE_BOTON} onClick={() => setVentana("exportar")}><Importar className="size-3.5" /> Exportar / importar</button><button type="button" className={CLASE_BOTON} onClick={() => setVentana("ajustes")}><Configurar className="size-3.5" /> Ajustes e índices</button><button type="button" className={CLASE_BOTON} disabled={!delPaciente.length} onClick={() => { setOrigenCopia(anterior?.id ?? delPaciente[0]?.id ?? ""); setVentana("copiar"); }}><Copiar className="size-3.5" /> Copiar valores</button><button type="button" className={CLASE_BOTON} onClick={() => setVentana("voz")}><Microfono className="size-3.5" /> Dictado</button><span className="mx-1 h-5 w-px bg-slate-200" /><button type="button" className={CLASE_BOTON} disabled={!pasados.length} onClick={() => restaurar(-1)} aria-label="Deshacer"><Deshacer className="size-3.5" /></button><button type="button" className={CLASE_BOTON} disabled={!futuros.length} onClick={() => restaurar(1)} aria-label="Rehacer"><Rehacer className="size-3.5" /></button>{ocupado && <span role="status" className="text-xs text-violet-700">Procesando…</span>}</div>
            {pestana === "periodontograma" && <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[["Sondaje medio", `${formato(resumen.profundidad)} mm`, `${resumen.medidos}/${resumen.sitios} sitios`], ["Inserción media", `${formato(resumen.insercion)} mm`, `${resumen.pares} pares completos`], ["Sangrado · BOP", `${formato(resumen.bop)} %`, `${resumen.bopEvaluados} sitios evaluados`], ["Placa", `${formato(resumen.placa)} %`, `${resumen.placaEvaluados} sitios evaluados`], ["Piezas presentes", resumen.piezas, `${resumen.implantes} implantes`]].map(([titulo, valor, detalle]) => <div key={titulo} className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-[10px] font-medium text-slate-500">{titulo}</p><p className="mt-1 font-mono text-xl font-semibold tracking-tight text-slate-800">{valor}</p><p className="mt-1 text-[10px] text-slate-400">{detalle}</p></div>)}</div>
                <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><button type="button" aria-pressed={compacto} className={CLASE_BOTON} onClick={() => setCompacto(!compacto)}>{compacto ? "Ver registro completo" : "Vista PS / BOP"}</button><select aria-label="Resaltar sitios" className={`${CLASE_CAMPO} text-xs`} value={resaltar} onChange={evento => setResaltar(evento.target.value)}><option value="">Sin resaltado</option><option value="placa">Resaltar placa</option><option value="sangrado">Resaltar sangrado</option><option value="5">Sondajes ≥ 5 mm</option><option value="6">Sondajes ≥ 6 mm</option></select><select aria-label="Comparar examen" className={`${CLASE_CAMPO} max-w-60 text-xs`} value={compararId} onChange={evento => setCompararId(evento.target.value)}><option value="">Sin comparación</option>{delPaciente.map(item => <option key={item.id} value={item.id}>{item.fecha} · {item.tipo} · {item.clinico || "Sin clínico"}</option>)}</select></div><p className="text-[10px] text-slate-500">Recesión {examen.ajustes.invertirMargen ? "positiva · NI = PS + MG" : "negativa · NI = PS − MG"}</p></div>
                <div className="flex flex-wrap gap-2">{[["analisis", "Resumen y análisis"], ["clasificacion", "Clasificación"], ["intervalo", "Intervalo"], ["calibracion", "Calibración"]].map(([clave, titulo]) => <button type="button" key={clave} className={CLASE_BOTON} onClick={() => setVentana(clave)}>{titulo}</button>)}<button type="button" className={CLASE_BOTON} onClick={() => setVentana("riesgo")}>PRA · Riesgo periodontal</button><button type="button" className={CLASE_BOTON} onClick={() => setVentana("tresd")}><Cubo className="size-3.5" /> 3D</button><button type="button" className={CLASE_BOTON} onClick={generarQr}><CodigoQr className="size-3.5" /> QR</button></div>
                <p className="text-[10px] text-slate-500">Las tablas se desplazan horizontalmente. Celda vacía: sin evaluar · Clic en indicador: sí / no / sin evaluar · Enter: siguiente sitio.</p>
                {dictando && <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-800"><Microfono className="size-4" /> Dictado activo · {destino.numero} {etiquetaSitio(destino.numero, destino.superficie, destino.posicion)} · {destino.clave}<button type="button" onClick={alternarDictado} className={CLASE_BOTON}><MicrofonoApagado className="size-3.5" /> Detener</button><span>{comando}</span></div>}
                <GraficoPeriodontal examen={examen} comparar={comparado} acciones={acciones} compacto={compacto} resaltar={resaltar} />
                <section className="rounded-2xl border border-slate-200 bg-white p-5"><Campo etiqueta="Observaciones de la evaluación"><textarea className={`${CLASE_CAMPO} resize-y`} rows={3} maxLength={5000} value={examen.observaciones} onChange={evento => cambiar("observaciones", evento.target.value)} placeholder="Hallazgos, evolución y observaciones clínicas" /></Campo></section>
            </>}
            {pestana === "salud" && <SaludGeneral examen={examen} cambiar={cambiar} anterior={anterior} />}
            {pestana === "microbiologia" && <Microbiologia examen={examen} cambiar={cambiar} anterior={anterior} />}
            {pestana === "historial" && <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Historial de exámenes</h2><p className="mt-1 text-xs text-slate-500">Registros locales de tu usuario en este navegador.</p></div><div className="flex gap-2"><label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3"><Buscar className="size-4 text-slate-400" /><input aria-label="Buscar paciente en historial" value={busqueda} onChange={evento => setBusqueda(evento.target.value)} placeholder="Nombre o ID" className="w-36 py-2 text-xs outline-none" /></label><select className={CLASE_CAMPO} aria-label="Orden del historial" value={orden} onChange={evento => setOrden(evento.target.value)}><option value="reciente">Más recientes</option><option value="nombre">Apellidos A–Z</option><option value="favoritos">Favoritos</option></select></div></div>
                {!registrosVisibles.length ? <div className="py-12 text-center text-sm text-slate-500"><Ficha className="mx-auto mb-3 size-8 text-slate-300" />{historial.length ? "No hay coincidencias." : "Guarda el primer examen para crear el historial."}</div> : <div className="flex flex-col gap-3">{registrosVisibles.map(item => { const datos = resumenExamen(item); return <article key={item.id} className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 ${item.id === examen.id ? "border-violet-200 bg-violet-50/30" : "border-slate-200"}`}><div className="flex items-center gap-3"><button type="button" aria-label={item.favorito ? "Quitar favorito" : "Marcar favorito"} aria-pressed={item.favorito} onClick={() => { setHistorial(lista => lista.map(registro => registro.id === item.id ? { ...registro, favorito: !registro.favorito } : registro)); if (item.id === examen.id) cambiar("favorito", !item.favorito); }} className="rounded p-2 text-amber-500"><Estrella className={`size-4 ${item.favorito ? "fill-amber-400" : ""}`} /></button><div><p className="text-sm font-semibold">{item.paciente.nombre} {item.paciente.apellidos}</p><p className="mt-1 text-xs text-slate-500">{item.paciente.id} · {item.fecha} · {item.tipo}</p><p className="mt-1 text-[10px] text-slate-500">PS {formato(datos.profundidad)} mm · BOP {formato(datos.bop)}% · Placa {formato(datos.placa)}%</p></div></div><div className="flex gap-2"><button type="button" className={CLASE_BOTON} onClick={() => abrirExamen(item)}>Abrir</button><button type="button" disabled={item.id === examen.id || !examen.paciente.id || item.paciente.id !== examen.paciente.id} className={CLASE_BOTON} onClick={() => { setCompararId(item.id); setPestana("periodontograma"); }}>Comparar</button><button type="button" className={CLASE_BOTON} aria-label={`Eliminar examen ${item.fecha}`} onClick={() => eliminarExamen(item)}><Eliminar className="size-3.5" /></button></div></article>; })}</div>}
            </section>}
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-4 text-[10px] text-slate-500"><span>Datos locales · Exporta una copia para conservarlos fuera del navegador.</span><span>{resumen.medidos}/{resumen.sitios} sitios con sondaje registrado</span></footer>
        </div>
        <input ref={entradaArchivo} type="file" accept=".json,.csv,.xlsx,.xls,.pdf" onChange={importarArchivo} className="hidden" />
        <input ref={entradaDiccionario} type="file" accept=".json" className="hidden" onChange={evento => { const archivo = evento.target.files?.[0]; evento.target.value = ""; if (archivo) tarea(async () => { if (archivo.size > 100000) throw new Error("Diccionario demasiado grande."); const lista = JSON.parse(await archivo.text()); if (!Array.isArray(lista) || lista.length > 100 || lista.some(item => typeof item.escuchado !== "string" || typeof item.correcto !== "string")) throw new Error("Diccionario de voz inválido."); setCorrecciones(lista); avisar("Diccionario importado."); }); }} />
        {ventana && <Ventana titulo={TITULOS[ventana]} cerrar={() => setVentana("")} amplia={["analisis", "calibracion", "tresd"].includes(ventana)}>
            {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
            {ocupado && <p role="status" className="mb-4 text-xs text-violet-700">Procesando archivo…</p>}
            {ventana === "ajustes" && <Ajustes examen={examen} cambiar={(clave, valor) => cambiar("ajustes", { ...examen.ajustes, [clave]: valor })} />}
            {ventana === "ayuda" && <Ayuda />}
            {ventana === "analisis" && <Analisis examen={examen} anterior={comparado} />}
            {ventana === "calibracion" && <Analisis examen={examen} anterior={comparado} calibracion />}
            {ventana === "intervalo" && <Intervalo examen={examen} cambiar={cambiar} />}
            {ventana === "riesgo" && <RiesgoPeriodontal examen={examen} cambiar={cambiar} />}
            {ventana === "clasificacion" && <Clasificacion examen={examen} cambiar={cambiar} />}
            {ventana === "tresd" && <VistaTridimensional examen={examen} anterior={comparado} />}
            {ventana === "exportar" && <div className="flex flex-col gap-4"><h3 className="text-sm font-semibold">Exportar registros</h3><Opcion etiqueta="Incluir todos los exámenes del historial" checked={exportarTodos} onChange={evento => setExportarTodos(evento.target.checked)} /><Opcion etiqueta="Anonimizar: excluir identidad, clínico, notas y salud" checked={anonimizar} onChange={evento => setAnonimizar(evento.target.checked)} /><div className="flex gap-2">{["json", "csv", "xlsx"].map(tipo => <button key={tipo} type="button" className={CLASE_BOTON} disabled={ocupado} onClick={() => exportar(tipo)}>{tipo.toUpperCase()}</button>)}</div><p className="text-xs text-slate-500">JSON conserva todos los datos. CSV y Excel usan columnas como pd_16_mb y gm_16_mb.</p><hr className="my-2 border-slate-200" /><h3 className="text-sm font-semibold">Importar un archivo</h3><Opcion etiqueta="El archivo externo usa recesión con signo positivo" checked={importarInvertido} onChange={evento => setImportarInvertido(evento.target.checked)} /><button type="button" disabled={ocupado} onClick={() => entradaArchivo.current.click()} className={CLASE_BOTON}><Importar className="size-4" /> Seleccionar JSON, CSV, Excel o PDF</button><p className="text-xs leading-relaxed text-slate-500">Máximo 15 MB / 200 exámenes. PDF: admite los de esta pantalla y formularios con mediciones identificadas por pieza y sitio; no realiza OCR de imágenes. La importación se revisa antes de incorporarla.</p></div>}
            {ventana === "importar" && <div className="flex flex-col gap-4"><p className="text-sm text-slate-600">Se encontraron {importados.length} exámenes. Se incorporarán como registros nuevos, sin reemplazar el historial existente.</p><div className="max-h-72 overflow-auto rounded-xl border border-slate-200">{importados.map(item => <div key={item.id} className="border-b border-slate-100 p-3 text-xs"><p className="font-semibold">{item.paciente.nombre || "Sin identidad"} {item.paciente.apellidos}</p><p className="mt-1 text-slate-500">{item.fecha} · {resumenExamen(item).medidos} sitios con sondaje · ID {item.paciente.id || "pendiente"}</p></div>)}</div><button type="button" className={CLASE_BOTON} onClick={confirmarImportacion}>Incorporar y revisar</button></div>}
            {ventana === "copiar" && <div className="flex flex-col gap-4"><Campo etiqueta="Examen de origen del mismo paciente"><select className={CLASE_CAMPO} value={origenCopia} onChange={evento => setOrigenCopia(evento.target.value)}>{delPaciente.map(item => <option key={item.id} value={item.id}>{item.fecha} · {item.tipo}</option>)}</select></Campo>{GRUPOS_COPIA.map(([clave, titulo]) => <Opcion key={clave} etiqueta={titulo} checked={gruposCopia.includes(clave)} onChange={evento => setGruposCopia(evento.target.checked ? [...gruposCopia, clave] : gruposCopia.filter(grupo => grupo !== clave))} />)}<button type="button" className={CLASE_BOTON} disabled={!gruposCopia.length} onClick={copiarDatos}>Copiar parámetros seleccionados</button></div>}
            {ventana === "qr" && <div className="flex flex-col items-center gap-4"><p className="text-sm text-slate-600">El enlace incluye sondaje, margen, placa, sangrado y estado dental. Excluye identidad, notas y salud. Requiere acceso al dashboard en el dispositivo receptor.</p>{imagenQr && <img src={imagenQr} width={300} height={300} alt="Código QR del registro dental anonimizado" className="max-w-full" />}<textarea aria-label="Enlace del registro anónimo" readOnly rows={3} value={enlaceQr} className={`${CLASE_CAMPO} w-full text-xs`} /><button type="button" className={CLASE_BOTON} disabled={!enlaceQr} onClick={() => tarea(async () => { await navigator.clipboard.writeText(enlaceQr); avisar("Enlace copiado."); })}>Copiar enlace</button></div>}
            {ventana === "voz" && <div className="flex flex-col gap-4"><p className="text-xs leading-relaxed text-slate-600">El dictado depende del navegador y del permiso de micrófono. Su proveedor de reconocimiento puede procesar audio en línea. Inícialo cuando estés listo.</p><button type="button" className={CLASE_BOTON} disabled={!vozDisponible} onClick={() => { alternarDictado(); setVentana(""); }}>{dictando ? "Detener dictado" : "Iniciar dictado"}</button>{!vozDisponible && <p className="text-xs text-amber-700">Dictado de voz no disponible en este navegador. Usa comandos escritos.</p>}<p className="rounded-lg bg-slate-50 p-3 text-xs leading-6">Ejemplos: «Diente 18 falta», «Implante 14», «Diente 16 movilidad grado 2», «16 furcación grado 2 bucal», «Iniciar 17 distobucal», «BOP 17 distobucal», «3 2 4», «menos 2», «siguiente», «stop».</p><Campo etiqueta="Comando escrito o último dictado"><input className={CLASE_CAMPO} value={comando} onChange={evento => setComando(evento.target.value)} onKeyDown={evento => { if (evento.key === "Enter") { evento.preventDefault(); procesarComando(comando); } }} /></Campo><button type="button" className={CLASE_BOTON} onClick={() => procesarComando(comando)}>Aplicar comando</button><h3 className="mt-2 text-sm font-semibold">Correcciones de reconocimiento</h3><div className="grid gap-3 sm:grid-cols-2"><Campo etiqueta="Escuchado incorrectamente"><input className={CLASE_CAMPO} value={escuchado} onChange={evento => setEscuchado(evento.target.value)} /></Campo><Campo etiqueta="Reemplazar por"><input className={CLASE_CAMPO} value={correcto} onChange={evento => setCorrecto(evento.target.value)} /></Campo></div><button type="button" className={CLASE_BOTON} disabled={!escuchado.trim() || !correcto.trim()} onClick={() => { setCorrecciones(lista => [...lista.filter(item => item.escuchado !== escuchado.trim()), { escuchado: escuchado.trim(), correcto: correcto.trim() }].slice(-100)); setEscuchado(""); setCorrecto(""); }}>Aprender corrección</button>{correcciones.map((item, i) => <div key={i} className="flex justify-between text-xs"><span>{item.escuchado} → {item.correcto}</span><button type="button" aria-label={`Quitar corrección ${item.escuchado}`} onClick={() => setCorrecciones(lista => lista.filter((_, posicion) => posicion !== i))}>Quitar</button></div>)}<div className="flex gap-2"><button type="button" className={CLASE_BOTON} onClick={() => descargarArchivo(JSON.stringify(correcciones), "diccionario-periodontal.json", "application/json")}>Exportar diccionario</button><button type="button" className={CLASE_BOTON} onClick={() => entradaDiccionario.current.click()}>Importar diccionario</button></div></div>}
        </Ventana>}
    </div>;
}
