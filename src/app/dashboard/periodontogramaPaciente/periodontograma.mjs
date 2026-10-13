export const SUPERIORES = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const INFERIORES = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
export const DIENTES = [...SUPERIORES, ...INFERIORES];
export const SUPERFICIES = ["vestibular", "interior"];
export const INDICES = [
    { clave: "margen", nombre: "Margen gingival", abreviatura: "MG", tipo: "numero", min: -20, max: 20, unidad: "mm" },
    { clave: "profundidad", nombre: "Profundidad de sondaje", abreviatura: "PS", tipo: "numero", min: 0, max: 20, unidad: "mm" },
    { clave: "insercion", nombre: "Nivel de inserción", abreviatura: "NI", tipo: "calculado", unidad: "mm" },
    { clave: "sangrado", nombre: "Sangrado al sondaje", abreviatura: "BOP", tipo: "booleano" },
    { clave: "placa", nombre: "Placa", abreviatura: "PI", tipo: "booleano" },
    { clave: "supuracion", nombre: "Supuración", abreviatura: "SUP", tipo: "booleano" },
    { clave: "indiceGingival", nombre: "Índice gingival", abreviatura: "GI", tipo: "numero", min: 0, max: 3 },
    { clave: "indiceGingivalModificado", nombre: "Índice gingival modificado", abreviatura: "mGI", tipo: "numero", min: 0, max: 3 },
    { clave: "indicePlaca", nombre: "Índice de placa", abreviatura: "Silness–Löe", tipo: "numero", min: 0, max: 3 },
    { clave: "indicePlacaModificado", nombre: "Índice de placa modificado", abreviatura: "mPI", tipo: "numero", min: 0, max: 3 },
    { clave: "miller", nombre: "Recesión Miller", abreviatura: "REC Mi", tipo: "numero", min: 0, max: 4, porSuperficie: true },
    { clave: "cairo", nombre: "Recesión Cairo", abreviatura: "REC Ca", tipo: "numero", min: 0, max: 3, porSuperficie: true },
    { clave: "recesionX", nombre: "Recesión personalizada X", abreviatura: "REC X", tipo: "numero", min: -20, max: 20, porSuperficie: true },
    { clave: "recesionY", nombre: "Recesión personalizada Y", abreviatura: "REC Y", tipo: "numero", min: -20, max: 20 },
    { clave: "encia", nombre: "Encía queratinizada", abreviatura: "MGJ", tipo: "numero", min: 0, max: 20, unidad: "mm", porSuperficie: true },
    { clave: "grosor", nombre: "Grosor gingival", abreviatura: "GT", tipo: "opciones", opciones: ["Fino", "Grueso"], porSuperficie: true },
    { clave: "anchura", nombre: "Anchura de recesión", abreviatura: "W", tipo: "numero", min: 0, max: 20, unidad: "mm", porSuperficie: true },
    { clave: "union", nombre: "Unión amelocementaria visible", abreviatura: "CEJ", tipo: "booleano", porSuperficie: true },
    { clave: "escalon", nombre: "Defecto en cuña", abreviatura: "Escalón", tipo: "booleano", porSuperficie: true },
];
export const AJUSTES_INICIALES = {
    numeracion: "FDI", invertirMargen: false, espejar: false, pares: false, secuencia: "clinica",
    indices: ["margen", "profundidad", "insercion", "sangrado", "placa"],
};
export const BACTERIAS = ["A.a.", "P.g.", "T.f.", "T.d.", "P.i.", "F.a.", "P.m.", "F.n.", "C.r.", "E.n.", "E.c.", "C.sp."];
export const PREGUNTAS_SALUD = [
    { id: "diabetes", seccion: "Antecedentes sistémicos", etiqueta: "Diabetes", tipo: "opciones", opciones: ["No", "Sí", "No sabe"] },
    { id: "hba1c", seccion: "Antecedentes sistémicos", etiqueta: "HbA1c (%)", tipo: "texto" },
    { id: "tabaco", seccion: "Hábitos", etiqueta: "Tabaquismo", tipo: "opciones", opciones: ["Nunca", "Exfumador", "Fumador"] },
    { id: "cigarrillos", seccion: "Hábitos", etiqueta: "Cigarrillos al día", tipo: "texto" },
    { id: "anticoagulantes", seccion: "Antecedentes cardiovasculares", etiqueta: "Uso de anticoagulantes", tipo: "opciones", opciones: ["No", "Sí", "No sabe"] },
    { id: "valvulas", seccion: "Antecedentes cardiovasculares", etiqueta: "Valvulopatías, válvula protésica o trasplante cardíaco", tipo: "opciones", opciones: ["No", "Sí", "No sabe"] },
    { id: "hipertension", seccion: "Antecedentes cardiovasculares", etiqueta: "Hipertensión arterial", tipo: "opciones", opciones: ["No", "Sí", "No sabe"] },
    { id: "cardiopatia", seccion: "Antecedentes cardiovasculares", etiqueta: "Cardiopatía coronaria, infarto o stent", tipo: "opciones", opciones: ["No", "Sí", "No sabe"] },
    { id: "alergias", seccion: "Otros antecedentes", etiqueta: "Alergias", tipo: "texto" },
    { id: "medicacion", seccion: "Otros antecedentes", etiqueta: "Medicación habitual", tipo: "texto" },
    { id: "embarazo", seccion: "Otros antecedentes", etiqueta: "Embarazo", tipo: "opciones", opciones: ["No", "Sí", "No aplica"] },
    { id: "otros", seccion: "Otros antecedentes", etiqueta: "Otros antecedentes relevantes", tipo: "texto" },
];

export function fechaLocal(fecha = new Date()) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}
export function identificador() { return globalThis.crypto.randomUUID(); }
export function crearSitio() {
    return Object.fromEntries(INDICES.filter(indice => indice.tipo !== "calculado").map(indice => [indice.clave, null]));
}
export function crearExamen(paciente = {}) {
    return {
        version: 1, id: identificador(), fecha: fechaLocal(), tipo: "Inicial", clinico: "", observaciones: "",
        paciente: { id: "", nombre: "", apellidos: "", nacimiento: "", ...paciente },
        dientes: Object.fromEntries(DIENTES.map(numero => [numero, {
            presente: true, implante: 0, movilidad: null, nota: "",
            furcacion: { vestibular: [null, null, null], interior: [null, null, null] },
            vestibular: Array.from({ length: 3 }, crearSitio), interior: Array.from({ length: 3 }, crearSitio),
        }])),
        salud: {}, preguntas: PREGUNTAS_SALUD.map(pregunta => ({ ...structuredClone(pregunta), opciones: [...(pregunta.opciones ?? [])] })), microbiologia: {},
        ajustes: structuredClone(AJUSTES_INICIALES), clasificacion: {}, intervalo: "", favorito: false,
    };
}
export function sitiosDe(numero, superficie) {
    const central = superficie === "vestibular" ? "b" : numero < 30 ? "p" : "l";
    const sitios = [`d${central}`, central, `m${central}`];
    return [2, 3].includes(Math.floor(numero / 10)) ? sitios.reverse() : sitios;
}
export function etiquetaSitio(numero, superficie, posicion) {
    const codigo = sitiosDe(numero, superficie)[posicion];
    const cara = superficie === "vestibular" ? "vestibular" : numero < 30 ? "palatino" : "lingual";
    return `${codigo.length === 1 ? "" : codigo[0] === "d" ? "disto" : "mesio"}${cara}`;
}
export function numeroVisible(numero, sistema) {
    if (sistema !== "Universal") return numero;
    return numero < 30 ? SUPERIORES.indexOf(numero) + 1 : 32 - INFERIORES.indexOf(numero);
}
export function admiteFurcacion(numero, superficie, posicion) {
    const unidad = numero % 10;
    if (numero < 30) return unidad >= 6 ? (superficie === "vestibular" ? posicion === 1 : posicion !== 1) : unidad === 4 && superficie === "interior" && posicion !== 1;
    return unidad >= 6 && posicion === 1;
}
export function nivelInsercion(sitio) {
    return sitio.profundidad === null || sitio.margen === null ? null : sitio.profundidad - sitio.margen;
}
export function valorVisible(sitio, clave, ajustes) {
    if (clave === "insercion") return nivelInsercion(sitio);
    return clave === "margen" && ajustes.invertirMargen && sitio.margen !== null ? -sitio.margen : sitio[clave];
}
export function validarValor(clave, entrada, ajustes = AJUSTES_INICIALES) {
    const indice = INDICES.find(item => item.clave === clave);
    if (!indice || indice.tipo === "calculado") throw new Error("Parámetro no editable.");
    if (entrada === "" || entrada === null) return null;
    if (indice.tipo === "booleano") {
        if (![true, false, 0, 1, "0", "1"].includes(entrada)) throw new Error("El indicador debe ser sí, no o sin evaluar.");
        return [true, 1, "1"].includes(entrada);
    }
    if (indice.tipo === "opciones") {
        if (!indice.opciones.includes(entrada)) throw new Error("Opción no válida.");
        return entrada;
    }
    const numero = Number(entrada);
    if (!Number.isFinite(numero) || !Number.isInteger(numero) || numero < indice.min || numero > indice.max) throw new Error(`${indice.nombre}: introduce un entero entre ${indice.min} y ${indice.max}.`);
    return clave === "margen" && ajustes.invertirMargen ? -numero : numero;
}
export function cambiarSitio(examen, numero, superficie, posicion, clave, valor) {
    const diente = examen.dientes[numero];
    if (!diente?.presente) return examen;
    const indice = INDICES.find(item => item.clave === clave);
    if (!indice) return examen;
    return { ...examen, dientes: { ...examen.dientes, [numero]: { ...diente,
        [superficie]: diente[superficie].map((sitio, i) => i === posicion || indice.porSuperficie ? { ...sitio, [clave]: valor } : sitio),
    } } };
}
const promedio = valores => valores.length ? valores.reduce((suma, valor) => suma + valor, 0) / valores.length : null;
export const porcentaje = (cantidad, total) => total ? cantidad / total * 100 : null;
export function resumenExamen(examen) {
    const presentes = DIENTES.filter(numero => examen.dientes[numero].presente);
    const sitios = presentes.flatMap(numero => SUPERFICIES.flatMap(superficie => examen.dientes[numero][superficie]));
    const sondajes = sitios.map(sitio => sitio.profundidad).filter(valor => valor !== null);
    const inserciones = sitios.map(nivelInsercion).filter(valor => valor !== null);
    const sangrados = sitios.filter(sitio => sitio.sangrado !== null);
    const placas = sitios.filter(sitio => sitio.placa !== null);
    return {
        piezas: presentes.length, implantes: presentes.filter(numero => examen.dientes[numero].implante > 0).length,
        sitios: sitios.length, medidos: sondajes.length, pares: inserciones.length,
        profundidad: promedio(sondajes), insercion: promedio(inserciones),
        margen: promedio(sitios.map(sitio => sitio.margen).filter(valor => valor !== null)),
        bop: porcentaje(sangrados.filter(sitio => sitio.sangrado).length, sangrados.length), bopEvaluados: sangrados.length,
        placa: porcentaje(placas.filter(sitio => sitio.placa).length, placas.length), placaEvaluados: placas.length,
        bolsas4: sondajes.filter(valor => valor === 4).length, bolsas5: sondajes.filter(valor => valor === 5).length,
        bolsas6: sondajes.filter(valor => valor >= 6).length,
        desde4: porcentaje(sondajes.filter(valor => valor >= 4).length, sondajes.length),
        desde5: porcentaje(sondajes.filter(valor => valor >= 5).length, sondajes.length),
        desde6: porcentaje(sondajes.filter(valor => valor >= 6).length, sondajes.length),
    };
}
export function formato(valor, decimales = 1) { return valor === null || !Number.isFinite(valor) ? "—" : valor.toFixed(decimales); }
export function secuenciaSitios(examen) {
    const configuracion = examen.ajustes.secuencia;
    const bloques = configuracion === "papel" ? [[SUPERIORES.slice(0, 8), "vestibular"], [SUPERIORES.slice(0, 8), "interior"], [SUPERIORES.slice(8), "vestibular"], [SUPERIORES.slice(8), "interior"], [INFERIORES.slice(0, 8), "vestibular"], [INFERIORES.slice(0, 8), "interior"], [INFERIORES.slice(8), "vestibular"], [INFERIORES.slice(8), "interior"]]
        : [[SUPERIORES, "vestibular"], [configuracion === "clinica" ? [...SUPERIORES].reverse() : SUPERIORES, "interior"], [INFERIORES, "vestibular"], [configuracion === "clinica" ? [...INFERIORES].reverse() : INFERIORES, "interior"]];
    return bloques.flatMap(([numeros, superficie]) => numeros.filter(numero => examen.dientes[numero].presente).flatMap(numero => {
        const posiciones = configuracion === "clinica" && superficie === "interior" ? [2, 1, 0] : [0, 1, 2];
        return posiciones.map(posicion => ({ numero, superficie, posicion }));
    }));
}
export function copiarExamen(origen, destino, grupos) {
    const copia = structuredClone(destino);
    for (const numero of DIENTES) {
        const previo = origen.dientes[numero];
        const nuevo = copia.dientes[numero];
        if (grupos.includes("estado")) { nuevo.presente = previo.presente; nuevo.implante = previo.implante; nuevo.movilidad = previo.movilidad; }
        if (grupos.includes("furcacion")) nuevo.furcacion = structuredClone(previo.furcacion);
        for (const superficie of SUPERFICIES) for (let posicion = 0; posicion < 3; posicion++) for (const clave of grupos) {
            if (clave in nuevo[superficie][posicion]) nuevo[superficie][posicion][clave] = previo[superficie][posicion][clave];
        }
    }
    return copia;
}
export function compararExamenes(anterior, actual) {
    const pares = [];
    for (const numero of DIENTES) {
        if (!anterior.dientes[numero].presente || !actual.dientes[numero].presente) continue;
        for (const superficie of SUPERFICIES) for (let posicion = 0; posicion < 3; posicion++) {
            const a = anterior.dientes[numero][superficie][posicion];
            const b = actual.dientes[numero][superficie][posicion];
            if (a.profundidad !== null && b.profundidad !== null) pares.push({ numero, superficie, posicion, anterior: a.profundidad, actual: b.profundidad, diferencia: b.profundidad - a.profundidad });
        }
    }
    const sesgo = promedio(pares.map(par => par.diferencia));
    const desviacion = pares.length > 1 ? Math.sqrt(pares.reduce((suma, par) => suma + (par.diferencia - sesgo) ** 2, 0) / (pares.length - 1)) : null;
    return { pares, sesgo, inferior: desviacion === null ? null : sesgo - 1.96 * desviacion, superior: desviacion === null ? null : sesgo + 1.96 * desviacion,
        mejoran: pares.filter(par => par.diferencia < 0).length, iguales: pares.filter(par => par.diferencia === 0).length, aumentan: pares.filter(par => par.diferencia > 0).length,
        acuerdo: porcentaje(pares.filter(par => Math.abs(par.diferencia) <= 1).length, pares.length) };
}
export function intervaloPorBolsas(examen) {
    const resumen = resumenExamen(examen);
    if (!resumen.sitios || resumen.medidos !== resumen.sitios) return null;
    const limites = [[12, 10, 2, 1], [9, 10, 4, 1], [6, 20, 6, 2], [4, 20, 10, 3], [3, 30, 20, 4]];
    return limites.find(([, a, b, c]) => resumen.desde4 <= a && resumen.desde5 <= b && resumen.desde6 <= c)?.[0] ?? 3;
}

export function edadEnFecha(nacimiento, fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nacimiento ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(fecha ?? "")) return null;
    const [anio, mes, dia] = nacimiento.split("-").map(Number);
    const [anioExamen, mesExamen, diaExamen] = fecha.split("-").map(Number);
    const edad = anioExamen - anio - Number(mesExamen < mes || (mesExamen === mes && diaExamen < dia));
    return edad > 0 && edad < 130 ? edad : null;
}
function numeroOpcional(valor, minimo, maximo) {
    if (valor === undefined || valor === null || valor === "") return null;
    const numero = Number(valor);
    return Number.isFinite(numero) && numero >= minimo && numero <= maximo ? numero : null;
}
export function sugerirClasificacion(examen) {
    const datos = examen.clasificacion;
    if (datos.casoConfirmado !== "Sí") return { estadio: null, grado: null, pendientes: ["Confirmar clínicamente el caso de periodontitis y excluir otras causas de pérdida de inserción."] };
    const cal = numeroOpcional(datos.calInterdental, 0, 40);
    const perdidos = numeroOpcional(datos.perdidos, 0, 32);
    const pendientes = [];
    if (cal === null || cal < 1) pendientes.push("Registrar la máxima pérdida de inserción interdental atribuible a periodontitis.");
    if (perdidos === null) pendientes.push("Registrar los dientes perdidos por periodontitis, incluido cero.");
    if (!["No", "III", "IV"].includes(datos.complejidad)) pendientes.push("Evaluar los factores de complejidad.");
    let estadio = cal === null || cal < 1 ? null : cal >= 5 ? 3 : cal >= 3 ? 2 : 1;
    const naturales = DIENTES.map(numero => examen.dientes[numero]).filter(diente => diente.presente && !diente.implante);
    const profundidadMaxima = Math.max(0, ...naturales.flatMap(diente => SUPERFICIES.flatMap(superficie => diente[superficie].map(sitio => sitio.profundidad ?? 0))));
    const furcacionAlta = naturales.some(diente => SUPERFICIES.some(superficie => diente.furcacion[superficie].some(grado => grado >= 2)));
    if (estadio !== null) {
        if (profundidadMaxima === 5) estadio = Math.max(estadio, 2);
        if (profundidadMaxima >= 6 || furcacionAlta || perdidos > 0 || datos.complejidad === "III") estadio = Math.max(estadio, 3);
        if (perdidos >= 5 || datos.complejidad === "IV") estadio = 4;
    }
    const progresion = numeroOpcional(datos.progresion, 0, 40);
    const perdidaOsea = numeroOpcional(datos.perdidaOsea, 0, 100);
    const edad = edadEnFecha(examen.paciente.nacimiento, examen.fecha);
    const razon = perdidaOsea !== null && edad ? perdidaOsea / edad : null;
    let grado = progresion !== null ? progresion === 0 ? 0 : progresion < 2 ? 1 : 2 : razon !== null ? razon < 0.25 ? 0 : razon <= 1 ? 1 : 2 : 1;
    if (progresion === null && razon === null) pendientes.push("Grado B provisional: falta progresión a cinco años o pérdida ósea radiográfica/edad.");
    if (!examen.salud.tabaco) pendientes.push("Registrar el tabaquismo en Salud general.");
    if (examen.salud.tabaco === "Fumador") {
        const cigarrillos = numeroOpcional(examen.salud.cigarrillos, 0, 200);
        if (cigarrillos === null) pendientes.push("Registrar cigarrillos diarios.");
        else grado = Math.max(grado, cigarrillos >= 10 ? 2 : 1);
    }
    if (!["No", "Sí"].includes(examen.salud.diabetes)) pendientes.push("Registrar el estado de diabetes en Salud general.");
    if (examen.salud.diabetes === "Sí") {
        const hba1c = numeroOpcional(examen.salud.hba1c, 1, 30);
        if (hba1c === null) pendientes.push("Registrar HbA1c para valorar el modificador diabético.");
        else grado = Math.max(grado, hba1c >= 7 ? 2 : 1);
    }
    return { estadio: estadio === null ? null : `Estadio ${["I", "II", "III", "IV"][estadio - 1]}`, grado: `Grado ${["A", "B", "C"][grado]}`, razon, pendientes };
}
export function riesgoPeriodontal(examen) {
    const resumen = resumenExamen(examen);
    const datos = examen.clasificacion;
    const edad = edadEnFecha(examen.paciente.nacimiento, examen.fecha);
    const hueso = numeroOpcional(datos.perdidaOsea, 0, 100);
    const razon = edad && hueso !== null ? hueso / edad : null;
    const perdidos = DIENTES.filter(numero => numero % 10 !== 8 && (!examen.dientes[numero].presente || examen.dientes[numero].implante > 0)).length;
    const bolsas = resumen.bolsas5 + resumen.bolsas6;
    const sist = datos.sistemicoPRA === "Sí" ? 3 : datos.sistemicoPRA === "No" ? 1 : null;
    const tabaco = datos.tabacoPRA;
    const tabacoRiesgo = ["Nunca", "Exfumador ≥5 años"].includes(tabaco) ? 1 : ["1–9/día", "10–20/día", "Exfumador <5 años"].includes(tabaco) ? 2 : tabaco === ">20/día" ? 3 : null;
    const ejes = [
        { nombre: "Sangrado", valor: resumen.bop, unidad: "%", riesgo: resumen.bopEvaluados === resumen.sitios && resumen.sitios ? resumen.bop < 10 ? 1 : resumen.bop > 25 ? 3 : 2 : null },
        { nombre: "Bolsas ≥5 mm", valor: bolsas, unidad: "sitios", riesgo: resumen.medidos === resumen.sitios && resumen.sitios ? bolsas <= 4 ? 1 : bolsas > 8 ? 3 : 2 : null },
        { nombre: "Dientes perdidos", valor: perdidos, unidad: "/28", riesgo: perdidos <= 4 ? 1 : perdidos > 8 ? 3 : 2 },
        { nombre: "Hueso / edad", valor: razon, unidad: "", riesgo: razon === null ? null : razon <= 0.5 ? 1 : razon > 1 ? 3 : 2 },
        { nombre: "Sistémico / genético", valor: datos.sistemicoPRA || "Sin evaluar", unidad: "", riesgo: sist },
        { nombre: "Tabaco", valor: tabaco || "Sin evaluar", unidad: "", riesgo: tabacoRiesgo },
    ];
    const altos = ejes.filter(eje => eje.riesgo === 3).length;
    const moderados = ejes.filter(eje => eje.riesgo === 2).length;
    const categoria = ejes.some(eje => eje.riesgo === null) ? null : altos >= 2 ? "Alto" : altos === 1 || moderados >= 2 ? "Moderado" : "Bajo";
    return { ejes, categoria };
}

const CAMPOS_EXTERNOS = { margen: "gm", profundidad: "pd", sangrado: "bop", placa: "pi", supuracion: "sup", indiceGingival: "gi", indiceGingivalModificado: "mgi", indicePlaca: "pli", indicePlacaModificado: "mpi", miller: "recm", cairo: "recc", recesionX: "recx", recesionY: "recy", encia: "kg", grosor: "gt", anchura: "w", union: "cej", escalon: "step" };
export function aFormatoPlano(examen, anonimizar = false) {
    const fila = {
        schema: "agendaclinica-periodontograma-v1", exam_id: anonimizar ? "" : examen.id, date: examen.fecha,
        patient_number: anonimizar ? "" : examen.paciente.id, first_name: anonimizar ? "" : examen.paciente.nombre,
        last_name: anonimizar ? "" : examen.paciente.apellidos, birth_date: anonimizar ? "" : examen.paciente.nacimiento,
        clinician: anonimizar ? "" : examen.clinico, exam_type: examen.tipo, gm_convention: "coronal-positive",
        notes: anonimizar ? "" : examen.observaciones,
        extra: anonimizar ? "" : JSON.stringify({ salud: examen.salud, preguntas: examen.preguntas, microbiologia: examen.microbiologia, ajustes: examen.ajustes, clasificacion: examen.clasificacion, intervalo: examen.intervalo, favorito: examen.favorito }),
    };
    for (const numero of DIENTES) {
        const diente = examen.dientes[numero];
        fila[`tooth_${numero}`] = diente.presente ? "1" : "0";
        fila[`implant_${numero}`] = String(diente.implante);
        fila[`mobility_${numero}`] = diente.movilidad ?? "";
        fila[`note_${numero}`] = anonimizar ? "" : diente.nota;
        for (const superficie of SUPERFICIES) sitiosDe(numero, superficie).forEach((sitio, posicion) => {
            fila[`furcation_${numero}_${sitio}`] = diente.furcacion[superficie][posicion] ?? "";
            for (const [clave, prefijo] of Object.entries(CAMPOS_EXTERNOS)) {
                const valor = diente[superficie][posicion][clave];
                fila[`${prefijo}_${numero}_${sitio}`] = valor === null ? "" : typeof valor === "boolean" ? String(Number(valor)) : String(valor);
            }
        });
    }
    return fila;
}
function texto(valor, maximo = 5000) { return typeof valor === "string" || typeof valor === "number" ? String(valor).slice(0, maximo) : ""; }
function fechaImportada(valor) {
    const cadena = texto(valor, 20);
    if (/^\d{4}-\d{2}-\d{2}$/.test(cadena)) return cadena;
    const partes = cadena.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    return partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : "";
}
export function desdeFormatoPlano(fila, margenInvertido = false) {
    if (!fila || typeof fila !== "object" || !Object.keys(fila).some(clave => /^(pd|gm|tooth)_\d{2}/.test(clave))) throw new Error("No se reconocen columnas periodontales. Usa JSON de esta aplicación o columnas como pd_16_mb.");
    const examen = crearExamen({ id: texto(fila.patient_number, 100), nombre: texto(fila.first_name ?? fila.firstname, 100), apellidos: texto(fila.last_name ?? fila.lastname, 100), nacimiento: fechaImportada(fila.birth_date ?? fila.birthdate) });
    examen.id = texto(fila.exam_id, 100) || examen.id;
    examen.fecha = fechaImportada(fila.date) || examen.fecha;
    examen.tipo = texto(fila.exam_type, 80) || (String(fila.reevaluation) === "1" ? "Reevaluación" : "Inicial");
    examen.clinico = texto(fila.clinician, 150);
    examen.observaciones = texto(fila.notes);
    const negativo = fila.gm_convention === "coronal-positive" ? false : margenInvertido;
    for (const numero of DIENTES) {
        const diente = examen.dientes[numero];
        diente.presente = String(fila[`tooth_${numero}`] ?? "1") !== "0";
        diente.implante = grado(fila[`implant_${numero}`], 3, 0);
        diente.movilidad = grado(fila[`mobility_${numero}`], 3);
        diente.nota = texto(fila[`note_${numero}`]);
        for (const superficie of SUPERFICIES) sitiosDe(numero, superficie).forEach((sitio, posicion) => {
            diente.furcacion[superficie][posicion] = grado(fila[`furcation_${numero}_${sitio}`], 3);
            for (const [clave, prefijo] of Object.entries(CAMPOS_EXTERNOS)) {
                const valor = fila[`${prefijo}_${numero}_${sitio}`];
                if (valor !== undefined && valor !== "" && valor !== null) diente[superficie][posicion][clave] = validarValor(clave, valor, { invertirMargen: negativo });
            }
        });
    }
    if (fila.extra) {
        let extra;
        try { extra = JSON.parse(fila.extra); } catch { throw new Error("Los datos adicionales del archivo no son válidos."); }
        return normalizarExamen({ ...examen, ...Object.fromEntries(["salud", "preguntas", "microbiologia", "ajustes", "clasificacion", "intervalo", "favorito"].map(clave => [clave, extra[clave] ?? examen[clave]])) });
    }
    return examen;
}
function grado(valor, maximo, defecto = null) {
    if (valor === undefined || valor === null || valor === "") return defecto;
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 0 || numero > maximo) throw new Error(`Grado no válido: ${texto(valor, 30)}.`);
    return numero;
}
export function normalizarExamen(dato) {
    if (!dato || dato.version !== 1 || !dato.dientes || !DIENTES.every(numero => dato.dientes[numero])) throw new Error("El archivo no contiene un examen válido de versión 1.");
    const examen = crearExamen();
    examen.id = texto(dato.id, 100) || examen.id;
    examen.fecha = fechaImportada(dato.fecha) || examen.fecha;
    for (const campo of ["id", "nombre", "apellidos", "nacimiento"]) examen.paciente[campo] = texto(dato.paciente?.[campo], 150);
    for (const campo of ["tipo", "clinico", "observaciones", "intervalo"]) examen[campo] = texto(dato[campo]);
    examen.favorito = dato.favorito === true;
    for (const numero of DIENTES) {
        const entrada = dato.dientes[numero];
        const destino = examen.dientes[numero];
        if (typeof entrada.presente !== "boolean") throw new Error("Estado dental inválido.");
        destino.presente = entrada.presente;
        destino.implante = grado(entrada.implante, 3, 0);
        destino.movilidad = grado(entrada.movilidad, 3);
        destino.nota = texto(entrada.nota);
        for (const superficie of SUPERFICIES) {
            if (!Array.isArray(entrada[superficie]) || entrada[superficie].length !== 3) throw new Error("Cada superficie debe contener tres sitios.");
            destino.furcacion[superficie] = [0, 1, 2].map(posicion => grado(entrada.furcacion?.[superficie]?.[posicion], 3));
            destino[superficie] = entrada[superficie].map(sitio => {
                const nuevo = crearSitio();
                for (const clave of Object.keys(nuevo)) nuevo[clave] = validarValor(clave, sitio?.[clave] ?? null);
                return nuevo;
            });
        }
    }
    const ajustes = dato.ajustes ?? {};
    for (const clave of ["invertirMargen", "espejar", "pares"]) examen.ajustes[clave] = ajustes[clave] === true;
    examen.ajustes.numeracion = ajustes.numeracion === "Universal" ? "Universal" : "FDI";
    examen.ajustes.secuencia = ["clinica", "horizontal", "papel"].includes(ajustes.secuencia) ? ajustes.secuencia : "clinica";
    if (Array.isArray(ajustes.indices)) examen.ajustes.indices = INDICES.filter(indice => ajustes.indices.includes(indice.clave)).map(indice => indice.clave);
    for (const clave of ["salud", "clasificacion"]) if (dato[clave] && typeof dato[clave] === "object" && !Array.isArray(dato[clave])) examen[clave] = Object.fromEntries(Object.entries(dato[clave]).filter(([campo]) => /^[a-zA-Z0-9_-]{1,100}$/.test(campo)).slice(0, 200).map(([campo, valor]) => [campo, texto(valor)]));
    for (const bacteria of BACTERIAS) if (dato.microbiologia?.[bacteria] !== undefined && dato.microbiologia[bacteria] !== null) {
        const valor = Number(dato.microbiologia[bacteria]);
        if (![0, 4, 5, 6].includes(valor)) throw new Error("Valor microbiológico inválido.");
        examen.microbiologia[bacteria] = valor;
    }
    if (Array.isArray(dato.preguntas)) examen.preguntas = dato.preguntas.slice(0, 100).map((pregunta, posicion) => ({ id: /^[a-zA-Z0-9_-]{1,100}$/.test(pregunta.id) ? pregunta.id : `pregunta_${posicion}`, seccion: texto(pregunta.seccion, 100), etiqueta: texto(pregunta.etiqueta, 300), tipo: pregunta.tipo === "opciones" ? "opciones" : "texto", opciones: Array.isArray(pregunta.opciones) ? pregunta.opciones.slice(0, 30).map(opcion => texto(opcion, 100)) : [] }));
    return examen;
}

export function interpretarComando(textoEntrada, correcciones = []) {
    let textoNormal = textoEntrada.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    for (const correccion of correcciones) if (correccion.escuchado && correccion.correcto) textoNormal = textoNormal.replaceAll(correccion.escuchado.toLowerCase(), correccion.correcto.toLowerCase());
    textoNormal = textoNormal.replace(/\b(treinta|cuarenta) y (uno|dos|tres|cuatro|cinco|seis|siete|ocho)\b/g, (_, decena, unidad) => (decena === "treinta" ? 30 : 40) + ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho"].indexOf(unidad));
    const dientesHablados = { trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28 };
    textoNormal = textoNormal.replace(/\b(trece|catorce|quince|dieciseis|diecisiete|dieciocho|veintiuno|veintidos|veintitres|veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho)\b/g, palabra => dientesHablados[palabra]);
    const nombres = { cero: 0, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12 };
    textoNormal = textoNormal.replace(/\b(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\b/g, palabra => nombres[palabra]);
    if (/^(stop|parar|detener)$/.test(textoNormal)) return { tipo: "detener" };
    if (/muelas? del juicio/.test(textoNormal) && /falt|ausente|presente/.test(textoNormal)) return { tipo: "juicio", valor: /presente/.test(textoNormal) };
    const numero = Number(textoNormal.match(/\b([1-4][1-8])\b/)?.[1]);
    if (DIENTES.includes(numero)) {
        if (/falta|ausente/.test(textoNormal)) return { tipo: "diente", numero, campo: "presente", valor: false };
        if (/presente/.test(textoNormal)) return { tipo: "diente", numero, campo: "presente", valor: true };
        if (/implante/.test(textoNormal)) return { tipo: "diente", numero, campo: "implante", valor: 1 };
        const movilidad = textoNormal.replace(new RegExp(`\\b${numero}\\b`), "").match(/movilidad(?: grado)?\s*([0-3])\b/);
        if (movilidad) return { tipo: "diente", numero, campo: "movilidad", valor: Number(movilidad[1]) };
        const superficie = /palatin|lingual/.test(textoNormal) ? "interior" : "vestibular";
        const prefijo = /disto/.test(textoNormal) ? "d" : /mesio/.test(textoNormal) ? "m" : "";
        const codigo = `${prefijo}${superficie === "vestibular" ? "b" : numero < 30 ? "p" : "l"}`;
        const posicion = sitiosDe(numero, superficie).indexOf(codigo);
        const furcacion = textoNormal.match(/furcacion(?: grado)?\s*([0-3])\b/);
        if (furcacion) return { tipo: "furcacion", numero, superficie, posicion, valor: Number(furcacion[1]) };
        if (/iniciar|start|sondaje|margen|bop|sangrado|placa/.test(textoNormal)) return { tipo: "enfocar", numero, superficie, posicion, clave: /placa/.test(textoNormal) ? "placa" : /bop|sangrado/.test(textoNormal) ? "sangrado" : /sondaje/.test(textoNormal) ? "profundidad" : "margen" };
    }
    if (/^(mas|positivo|sangrado|bop|placa|si)$/.test(textoNormal)) return { tipo: "indicador", valor: true };
    if (/^(no|menos|negativo)$/.test(textoNormal)) return { tipo: "indicador", valor: false };
    if (/^(siguiente|next)$/.test(textoNormal)) return { tipo: "siguiente" };
    const cadena = textoNormal.replace(/menos\s+(\d+)/g, "-$1").replace(/[;,]/g, " ");
    if (/^-?\d+(\s+-?\d+)*$/.test(cadena)) return { tipo: "valores", valores: cadena.split(/\s+/).map(Number) };
    return { tipo: "desconocido" };
}
