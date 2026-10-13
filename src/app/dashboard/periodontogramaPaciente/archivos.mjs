import { DIENTES, SUPERIORES, INFERIORES, SUPERFICIES, INDICES, aFormatoPlano, desdeFormatoPlano, normalizarExamen, resumenExamen, nivelInsercion, formato, numeroVisible, crearExamen } from "./periodontograma.mjs";

export function descargarArchivo(contenido, nombre, tipo) {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function exportarExamenes(examenes, formatoArchivo, anonimizar = false) {
    const nombre = `periodontogramas-${new Date().toISOString().slice(0, 10)}`;
    if (formatoArchivo === "json") {
        const datos = anonimizar ? examenes.map(examen => desdeFormatoPlano(aFormatoPlano(examen, true))) : examenes;
        descargarArchivo(JSON.stringify({ formato: "agendaclinica-periodontograma", version: 1, examenes: datos }, null, 2), `${nombre}.json`, "application/json");
        return;
    }
    const XLSX = await import("xlsx");
    const filas = examenes.map(examen => aFormatoPlano(examen, anonimizar));
    const hoja = XLSX.utils.json_to_sheet(filas);
    if (formatoArchivo === "csv") {
        for (const [celda, valor] of Object.entries(hoja)) if (!celda.startsWith("!") && typeof valor.v === "string" && /^[=+@\t\r]/.test(valor.v)) valor.v = `'${valor.v}`;
        descargarArchivo(`\uFEFF${XLSX.utils.sheet_to_csv(hoja)}`, `${nombre}.csv`, "text/csv;charset=utf-8");
    } else {
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Periodontogramas");
        XLSX.writeFile(libro, `${nombre}.xlsx`);
    }
}
export async function leerArchivo(archivo, margenInvertido = false) {
    if (archivo.size > 15 * 1024 * 1024) throw new Error("El archivo supera el máximo de 15 MB.");
    const extension = archivo.name.split(".").pop().toLowerCase();
    let examenes;
    if (extension === "json") {
        const datos = JSON.parse(await archivo.text());
        const entradas = Array.isArray(datos) ? datos : datos.examenes ?? [datos];
        if (!Array.isArray(entradas) || entradas.length > 200) throw new Error("Importa como máximo 200 exámenes por archivo.");
        examenes = entradas.map(entrada => entrada.dientes ? normalizarExamen(entrada) : desdeFormatoPlano(entrada, margenInvertido));
    } else if (["csv", "xlsx", "xls"].includes(extension)) {
        const XLSX = await import("xlsx");
        const libro = XLSX.read(await archivo.arrayBuffer(), { type: "array", cellDates: false, sheetRows: 202 });
        const filas = XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { defval: "", raw: false });
        if (filas.length > 200) throw new Error("Importa como máximo 200 exámenes por archivo.");
        examenes = filas.map(fila => desdeFormatoPlano(fila, margenInvertido));
    } else if (extension === "pdf") {
        examenes = [await leerPdf(archivo, margenInvertido)];
    } else throw new Error("Formato no compatible. Selecciona JSON, CSV, Excel o PDF.");
    if (!examenes.length) throw new Error("El archivo no contiene exámenes.");
    const ids = new Set();
    for (const examen of examenes) {
        if (ids.has(examen.id)) examen.id = crypto.randomUUID();
        ids.add(examen.id);
    }
    return examenes;
}
async function leerPdf(archivo, margenInvertido) {
    const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const tarea = pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()), isEvalSupported: false });
    try {
        const pdf = await tarea.promise;
        const metadatos = await pdf.getMetadata();
        const asunto = metadatos.info?.Subject ?? "";
        if (asunto.startsWith("AGENDA_PERIO_V1:")) return normalizarExamen(JSON.parse(decodeURIComponent(escape(atob(asunto.slice(16))))));
        if (pdf.numPages > 100) throw new Error("El PDF supera el límite de 100 páginas.");
        const fila = {};
        for (let pagina = 1; pagina <= pdf.numPages; pagina++) {
            const hoja = await pdf.getPage(pagina);
            const campos = await hoja.getAnnotations();
            for (const campo of campos) if (campo.fieldName) fila[campo.fieldName] = campo.fieldValue;
            const contenido = await hoja.getTextContent();
            const texto = contenido.items.map(item => item.str ?? "").join(" ");
            for (const coincidencia of texto.matchAll(/\b((?:pd|gm|bop|pi|tooth|implant|mobility|furcation)_\d{2}(?:_[a-z]{1,2})?)\s*[:=]\s*(-?\d+)/g)) fila[coincidencia[1]] = coincidencia[2];
        }
        if (!Object.keys(fila).some(clave => /^pd_\d{2}_/.test(clave))) throw new Error("No se detectaron mediciones estructuradas en este PDF. Se admiten los PDF de esta pantalla y formularios con campos pd_16_mb, gm_16_mb, etc. Los PDF escaneados requieren transcripción.");
        return desdeFormatoPlano(fila, margenInvertido);
    } finally { await tarea.destroy(); }
}

function textoPdf(valor) { return String(valor ?? "").replaceAll("—", "-").replaceAll("≥", ">=").replaceAll("→", ">"); }
function valorPdf(sitio, indice, ajustes) {
    let valor = indice.clave === "insercion" ? nivelInsercion(sitio) : sitio[indice.clave];
    if (indice.clave === "margen" && ajustes.invertirMargen && valor !== null) valor = -valor;
    return valor === null ? "-" : typeof valor === "boolean" ? valor ? "+" : "0" : String(valor);
}
export async function crearPdf(examen) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3", compress: true });
    pdf.setProperties({ title: "Periodontograma", author: "Agenda Clínica", subject: `AGENDA_PERIO_V1:${btoa(unescape(encodeURIComponent(JSON.stringify(examen))))}` });
    const resumen = resumenExamen(examen);
    const indiceVisible = INDICES.filter(indice => examen.ajustes.indices.includes(indice.clave));
    for (const [arcada, numeros] of [["Arcada superior", SUPERIORES], ["Arcada inferior", INFERIORES]]) {
        if (arcada === "Arcada inferior") pdf.addPage();
        pdf.setTextColor(25, 32, 48); pdf.setFontSize(19); pdf.text("Periodontograma", 12, 16);
        pdf.setFontSize(10); pdf.text(`${examen.paciente.nombre} ${examen.paciente.apellidos} | ID: ${examen.paciente.id || "-"}`, 12, 23);
        pdf.text(`Fecha: ${examen.fecha} | ${examen.tipo} | Clínico: ${examen.clinico || "-"}`, 12, 29);
        pdf.setFontSize(8); pdf.text(`PS media: ${formato(resumen.profundidad)} mm | NI medio: ${formato(resumen.insercion)} mm | BOP: ${formato(resumen.bop)}% | Placa: ${formato(resumen.placa)}% | Sitios medidos: ${resumen.medidos}/${resumen.sitios}`, 12, 35);
        pdf.text(`Convención: recesión ${examen.ajustes.invertirMargen ? "positiva; NI = PS + MG" : "negativa; NI = PS - MG"}. Los guiones indican datos sin evaluar.`, 12, 40);
        pdf.setFontSize(12); pdf.text(arcada, 12, 48);
        const anchoEtiqueta = 48, anchoPieza = 21.5, izquierda = 12;
        let y = 53;
        function fila(nombre, valores, color = [60, 65, 75]) {
            if (y > 276) { pdf.addPage(); y = 15; }
            pdf.setDrawColor(225, 228, 235); pdf.setTextColor(80, 85, 95); pdf.setFontSize(7);
            pdf.rect(izquierda, y, anchoEtiqueta, 7); pdf.text(textoPdf(nombre), izquierda + 2, y + 4.7);
            valores.forEach((valor, i) => { const x = izquierda + anchoEtiqueta + i * anchoPieza; pdf.rect(x, y, anchoPieza, 7); pdf.setTextColor(...color); pdf.text(textoPdf(valor), x + anchoPieza / 2, y + 4.7, { align: "center" }); });
            y += 7;
        }
        fila("Pieza dental", numeros.map(numero => `${numeroVisible(numero, examen.ajustes.numeracion)}${examen.dientes[numero].presente ? "" : " X"}`));
        fila("Movilidad / Implante", numeros.map(numero => `${examen.dientes[numero].movilidad ?? "-"} / ${examen.dientes[numero].implante}`));
        for (const superficie of SUPERFICIES) {
            if (y + 28 + indiceVisible.length * 7 + 53 > 280) { pdf.addPage(); y = 15; }
            pdf.setFillColor(244, 240, 255); pdf.rect(izquierda, y, anchoEtiqueta + anchoPieza * 16, 7, "F");
            pdf.setFontSize(8); pdf.setTextColor(90, 65, 140); pdf.text(superficie === "vestibular" ? "Vestibular" : numeros[0] < 30 ? "Palatino" : "Lingual", izquierda + 2, y + 4.7); y += 7;
            fila("Furcación", numeros.map(numero => examen.dientes[numero].implante ? "-" : examen.dientes[numero].furcacion[superficie].map(valor => valor ?? "-").join("   ")));
            for (const indice of indiceVisible) fila(`${indice.nombre}${indice.unidad ? " (mm)" : ""}`, numeros.map(numero => !examen.dientes[numero].presente ? "X" : (indice.porSuperficie ? [examen.dientes[numero][superficie][1]] : examen.dientes[numero][superficie]).map(sitio => valorPdf(sitio, indice, examen.ajustes)).join("   ")), indice.clave === "margen" ? [200, 55, 75] : indice.clave === "insercion" ? [40, 90, 195] : [60, 65, 75]);
            numeros.forEach((numero, i) => {
                const diente = examen.dientes[numero];
                const x = izquierda + anchoEtiqueta + i * anchoPieza;
                pdf.setDrawColor(230, 230, 235); pdf.rect(x, y, anchoPieza, 46);
                if (!diente.presente) { pdf.line(x + 3, y + 5, x + 18, y + 41); pdf.line(x + 18, y + 5, x + 3, y + 41); return; }
                pdf.setDrawColor(170, 175, 185); pdf.setFillColor(253, 251, 243); pdf.roundedRect(x + 4, y + 5, 13, 16, 3, 3, "FD"); pdf.line(x + 5, y + 21, x + 9, y + 40); pdf.line(x + 16, y + 21, x + 12, y + 40);
                const puntos = diente[superficie];
                for (let sitio = 0; sitio < 2; sitio++) {
                    const a = puntos[sitio], b = puntos[sitio + 1];
                    if (a.margen !== null && b.margen !== null) { pdf.setDrawColor(225, 65, 85); pdf.setLineWidth(0.4); pdf.line(x + 3 + sitio * 7, y + 20 - a.margen, x + 10 + sitio * 7, y + 20 - b.margen); }
                    if (nivelInsercion(a) !== null && nivelInsercion(b) !== null) { pdf.setDrawColor(35, 95, 220); pdf.line(x + 3 + sitio * 7, y + 20 + nivelInsercion(a), x + 10 + sitio * 7, y + 20 + nivelInsercion(b)); }
                }
                pdf.setLineWidth(0.2);
            });
            pdf.setFontSize(7); pdf.setTextColor(80, 85, 95); pdf.text(["Rojo: margen", "Azul: inserción", "Esquema orientativo"], izquierda + 2, y + 12); y += 48;
        }
        const notas = numeros.filter(numero => examen.dientes[numero].nota).map(numero => `${numero}: ${examen.dientes[numero].nota}`).join(" | ");
        if (notas) { pdf.addPage(); pdf.setFontSize(11); pdf.text(`Notas por pieza - ${arcada}`, 12, 15); pdf.setFontSize(9); pdf.text(pdf.splitTextToSize(notas, 390), 12, 23); }
    }
    pdf.addPage(); pdf.setTextColor(30, 35, 45); pdf.setFontSize(14); pdf.text("Observaciones y antecedentes", 12, 16);
    pdf.setFontSize(9);
    let y = 25;
    const lineas = [examen.observaciones || "Sin observaciones.", "", "SALUD GENERAL", ...examen.preguntas.map(pregunta => `${pregunta.etiqueta}: ${examen.salud[pregunta.id] || "Sin registrar"}`), "", "MICROBIOLOGÍA", ...Object.entries(examen.microbiologia).map(([bacteria, valor]) => `${bacteria}: ${valor === 0 ? "No detectado" : `10^${valor}`}`), "", `Clasificación registrada: ${examen.clasificacion.estadio || "-"} / ${examen.clasificacion.grado || "-"}`, `Intervalo elegido por el clínico: ${examen.intervalo || "-"} meses`];
    for (const linea of lineas) for (const fragmento of pdf.splitTextToSize(textoPdf(linea), 390)) { if (y > 279) { pdf.addPage(); y = 15; } pdf.text(fragmento, 12, y); y += 5; }
    for (let pagina = 1; pagina <= pdf.getNumberOfPages(); pagina++) { pdf.setPage(pagina); pdf.setFontSize(7); pdf.setTextColor(120, 125, 135); pdf.text(`Agenda Clínica · ${pagina}/${pdf.getNumberOfPages()}`, 12, 289); }
    return pdf;
}

export async function crearEnlaceAnonimo(examen) {
    if (!globalThis.CompressionStream) throw new Error("Este navegador no admite enlaces comprimidos. Utiliza la exportación JSON anónima.");
    const anonimo = { v: 1, d: DIENTES.map(numero => {
        const diente = examen.dientes[numero];
        return [Number(diente.presente), diente.implante, diente.movilidad, ...SUPERFICIES.flatMap(superficie => diente[superficie].flatMap(sitio => [sitio.margen, sitio.profundidad, sitio.sangrado, sitio.placa])), ...SUPERFICIES.flatMap(superficie => diente.furcacion[superficie])];
    }) };
    const flujo = new Blob([JSON.stringify(anonimo)]).stream().pipeThrough(new CompressionStream("deflate"));
    const bytes = new Uint8Array(await new Response(flujo).arrayBuffer());
    const codificado = btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    return `${window.location.origin}/dashboard/periodontogramaPaciente#perio=${codificado}`;
}
export async function leerEnlaceAnonimo(fragmento) {
    const valor = fragmento.replace(/^#perio=/, "");
    if (!valor || valor.length > 20000) throw new Error("Enlace de periodontograma inválido.");
    const bytes = Uint8Array.from(atob(valor.replaceAll("-", "+").replaceAll("_", "/")), caracter => caracter.charCodeAt(0));
    const lector = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate")).getReader();
    const fragmentos = []; let longitud = 0;
    while (true) { const { value, done } = await lector.read(); if (done) break; longitud += value.length; if (longitud > 100000) { await lector.cancel(); throw new Error("El enlace supera el límite de datos."); } fragmentos.push(value); }
    const datos = JSON.parse(await new Blob(fragmentos).text());
    if (datos.v !== 1 || !Array.isArray(datos.d) || datos.d.length !== 32) throw new Error("Enlace incompatible.");
    const examen = crearExamen();
    DIENTES.forEach((numero, i) => {
        const fila = datos.d[i];
        if (!Array.isArray(fila) || fila.length !== 33) throw new Error("Datos dentales incompletos.");
        const diente = examen.dientes[numero];
        diente.presente = fila[0] === 1; diente.implante = fila[1]; diente.movilidad = fila[2];
        let posicion = 3;
        for (const superficie of SUPERFICIES) for (const sitio of diente[superficie]) for (const clave of ["margen", "profundidad", "sangrado", "placa"]) sitio[clave] = fila[posicion++];
        for (const superficie of SUPERFICIES) for (let sitio = 0; sitio < 3; sitio++) diente.furcacion[superficie][sitio] = fila[posicion++];
    });
    return normalizarExamen(examen);
}
