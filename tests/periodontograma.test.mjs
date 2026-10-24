import test from "node:test";
import assert from "node:assert/strict";
import {
    DIENTES, SUPERFICIES, aFormatoPlano, admiteFurcacion, cambiarSitio, compararExamenes,
    copiarExamen, crearExamen, desdeFormatoPlano, interpretarComando, intervaloPorBolsas,
    nivelInsercion, normalizarExamen, numeroVisible, resumenExamen, secuenciaSitios,
    sitiosDe, validarValor, valorVisible, sugerirClasificacion, riesgoPeriodontal, edadEnFecha,
} from "../src/app/dashboard/periodontogramaPaciente/periodontograma.mjs";
import { crearEnlaceAnonimo, crearPdf, leerEnlaceAnonimo } from "../src/app/dashboard/periodontogramaPaciente/archivos.mjs";
import { DASHBOARD_ROLES, canAccessDashboardPath, getVisibleDashboardSections } from "../src/lib/dashboard-access.js";

test("nuevo examen: 32 piezas, 192 sitios independientes y datos sin evaluar", () => {
    const examen = crearExamen();
    assert.equal(DIENTES.length, 32);
    assert.equal(resumenExamen(examen).sitios, 192);
    assert.equal(resumenExamen(examen).bop, null);
    assert.equal(resumenExamen(examen).profundidad, null);
    examen.dientes[18].vestibular[0].margen = -2;
    assert.equal(examen.dientes[18].vestibular[1].margen, null);
    assert.equal(examen.dientes[17].vestibular[0].margen, null);
});
test("nivel de inserción y recesión: ambas convenciones conservan la anatomía", () => {
    const sitio = { profundidad: 5, margen: -2 };
    assert.equal(nivelInsercion(sitio), 7);
    assert.equal(valorVisible(sitio, "margen", { invertirMargen: true }), 2);
    assert.equal(validarValor("margen", "2", { invertirMargen: true }), -2);
    assert.equal(nivelInsercion({ profundidad: 2, margen: 2 }), 0);
    assert.equal(nivelInsercion({ profundidad: 0, margen: -2 }), 2);
    assert.equal(nivelInsercion({ profundidad: 5, margen: null }), null);
});
test("los sitios mesiales y distales se invierten entre cuadrantes", () => {
    assert.deepEqual(sitiosDe(18, "vestibular"), ["db", "b", "mb"]);
    assert.deepEqual(sitiosDe(21, "vestibular"), ["mb", "b", "db"]);
    assert.deepEqual(sitiosDe(31, "interior"), ["ml", "l", "dl"]);
    assert.deepEqual(sitiosDe(48, "interior"), ["dl", "l", "ml"]);
});
test("numeración universal y ubicaciones anatómicas de furcación", () => {
    assert.equal(numeroVisible(18, "Universal"), 1);
    assert.equal(numeroVisible(28, "Universal"), 16);
    assert.equal(numeroVisible(38, "Universal"), 17);
    assert.equal(numeroVisible(48, "Universal"), 32);
    assert.equal(admiteFurcacion(16, "vestibular", 1), true);
    assert.equal(admiteFurcacion(16, "interior", 0), true);
    assert.equal(admiteFurcacion(14, "interior", 0), true);
    assert.equal(admiteFurcacion(14, "vestibular", 1), false);
    assert.equal(admiteFurcacion(46, "interior", 1), true);
    assert.equal(admiteFurcacion(11, "interior", 0), false);
});
test("validación rechaza valores fuera de rango, no finitos y fracciones", () => {
    for (const valor of [-1, 21, "NaN", Infinity, 2.5, "abc"]) assert.throws(() => validarValor("profundidad", valor));
    assert.throws(() => validarValor("indicePlaca", 4));
    assert.throws(() => validarValor("sangrado", "false"));
    assert.equal(validarValor("profundidad", "0"), 0);
    assert.equal(validarValor("margen", ""), null);
    assert.equal(validarValor("sangrado", "0"), false);
});
test("cambio inmutable y parámetros por superficie", () => {
    const inicial = crearExamen();
    const siguiente = cambiarSitio(inicial, 16, "vestibular", 1, "profundidad", 5);
    assert.equal(inicial.dientes[16].vestibular[1].profundidad, null);
    assert.equal(siguiente.dientes[16].vestibular[1].profundidad, 5);
    assert.equal(siguiente.dientes[17], inicial.dientes[17]);
    const encia = cambiarSitio(siguiente, 16, "vestibular", 1, "encia", 3);
    assert.deepEqual(encia.dientes[16].vestibular.map(sitio => sitio.encia), [3, 3, 3]);
});
test("ausentes se excluyen de índices, pero sus valores se conservan", () => {
    let examen = crearExamen();
    examen = cambiarSitio(examen, 18, "vestibular", 0, "profundidad", 10);
    examen = cambiarSitio(examen, 17, "vestibular", 0, "profundidad", 2);
    examen.dientes[18].presente = false;
    assert.equal(resumenExamen(examen).profundidad, 2);
    assert.equal(resumenExamen(examen).sitios, 186);
    assert.equal(examen.dientes[18].vestibular[0].profundidad, 10);
    assert.equal(cambiarSitio(examen, 18, "vestibular", 0, "profundidad", 4), examen);
});
test("cero se incluye en promedios; sitios no evaluados se excluyen", () => {
    const examen = crearExamen();
    Object.assign(examen.dientes[16].vestibular[0], { profundidad: 0, sangrado: false, placa: true });
    Object.assign(examen.dientes[16].vestibular[1], { profundidad: 6, sangrado: true, placa: false });
    const resumen = resumenExamen(examen);
    assert.equal(resumen.profundidad, 3);
    assert.equal(resumen.bop, 50);
    assert.equal(resumen.placa, 50);
    assert.equal(resumen.medidos, 2);
    assert.equal(resumen.desde6, 50);
});
test("recorridos visitan cada sitio una sola vez y omiten ausentes", () => {
    const examen = crearExamen(); examen.dientes[18].presente = false;
    for (const variante of ["clinica", "horizontal", "papel"]) {
        examen.ajustes.secuencia = variante;
        const secuencia = secuenciaSitios(examen);
        assert.equal(secuencia.length, 186);
        assert.equal(new Set(secuencia.map(item => `${item.numero}-${item.superficie}-${item.posicion}`)).size, 186);
        assert.equal(secuencia.some(item => item.numero === 18), false);
    }
});
test("copiar parámetros no sobrescribe los grupos no seleccionados", () => {
    const origen = crearExamen(), destino = crearExamen();
    origen.dientes[16].vestibular[0].profundidad = 7;
    origen.dientes[16].vestibular[0].sangrado = true;
    destino.dientes[16].vestibular[0].sangrado = false;
    const copia = copiarExamen(origen, destino, ["profundidad"]);
    assert.equal(copia.dientes[16].vestibular[0].profundidad, 7);
    assert.equal(copia.dientes[16].vestibular[0].sangrado, false);
    assert.equal(destino.dientes[16].vestibular[0].profundidad, null);
    assert.equal(copia.id, destino.id);
});
test("comparación solo empareja sitios medidos presentes en ambos exámenes", () => {
    const previo = crearExamen(), actual = crearExamen();
    previo.dientes[16].vestibular[0].profundidad = 6;
    actual.dientes[16].vestibular[0].profundidad = 3;
    previo.dientes[17].vestibular[0].profundidad = 4;
    actual.dientes[17].presente = false;
    const comparacion = compararExamenes(previo, actual);
    assert.equal(comparacion.pares.length, 1);
    assert.equal(comparacion.mejoran, 1);
    assert.equal(comparacion.sesgo, -3);
    assert.equal(comparacion.inferior, null);
});
test("no se propone intervalo para un registro incompleto", () => {
    const examen = crearExamen(); assert.equal(intervaloPorBolsas(examen), null);
    for (const numero of DIENTES) for (const superficie of SUPERFICIES) for (const sitio of examen.dientes[numero][superficie]) sitio.profundidad = 2;
    assert.equal(intervaloPorBolsas(examen), 12);
});
test("JSON y formato plano preservan todos los datos y convenciones", () => {
    const examen = crearExamen({ id: "PAC-1", nombre: "María", apellidos: "Prueba" });
    Object.assign(examen.dientes[21].vestibular[0], { profundidad: 7, margen: -2, sangrado: true, placa: false, grosor: "Fino" });
    examen.ajustes.invertirMargen = true;
    examen.microbiologia["P.g."] = 5;
    examen.salud.diabetes = "No";
    const normalizado = normalizarExamen(JSON.parse(JSON.stringify(examen)));
    assert.deepEqual(normalizado, examen);
    const plano = aFormatoPlano(examen);
    assert.equal(plano.pd_21_mb, "7");
    assert.equal(plano.gm_21_mb, "-2");
    assert.deepEqual(desdeFormatoPlano(plano), examen);
});
test("importación externa respeta el signo elegido y rechaza datos inválidos", () => {
    const examen = desdeFormatoPlano({ tooth_16: "1", pd_16_mb: "4", gm_16_mb: "2", date: "05.10.2026" }, true);
    assert.equal(examen.dientes[16].vestibular[2].margen, -2);
    assert.equal(examen.fecha, "2026-10-05");
    assert.throws(() => desdeFormatoPlano({ pd_16_mb: "100" }));
    assert.throws(() => normalizarExamen({ version: 1, dientes: {} }));
});
test("exportación anónima omite identidad, notas, clínico y antecedentes", () => {
    const examen = crearExamen({ id: "SECRETO", nombre: "Privado" });
    examen.clinico = "Clínico privado"; examen.salud.otros = "Antecedente privado";
    examen.dientes[16].nota = "Nota privada"; examen.observaciones = "Observación privada";
    const plano = aFormatoPlano(examen, true);
    const cadena = JSON.stringify(plano);
    for (const texto of ["SECRETO", "Privado", "Clínico privado", "Antecedente privado", "Nota privada", "Observación privada"]) assert.equal(cadena.includes(texto), false);
});
test("comandos de voz reconocen estados, sitios y secuencias negativas", () => {
    assert.deepEqual(interpretarComando("Diente 18 falta"), { tipo: "diente", numero: 18, campo: "presente", valor: false });
    assert.equal(interpretarComando("Diente 16 movilidad grado dos").valor, 2);
    assert.equal(interpretarComando("Iniciar 21 mesiobucal").posicion, 0);
    assert.deepEqual(interpretarComando("menos dos tres cuatro"), { tipo: "valores", valores: [-2, 3, 4] });
    assert.equal(interpretarComando("stop").tipo, "detener");
    assert.equal(interpretarComando("texto sin comando").tipo, "desconocido");
});
test("enlace comprimido recupera el registro dental sin datos de identidad", async () => {
    const original = globalThis.window;
    globalThis.window = { location: { origin: "https://clinica.example" } };
    try {
        const examen = crearExamen({ nombre: "Privado", id: "ID-privado" });
        examen.dientes[16].vestibular[0].profundidad = 6;
        examen.dientes[16].vestibular[0].margen = -2;
        const enlace = await crearEnlaceAnonimo(examen);
        const importado = await leerEnlaceAnonimo(enlace.slice(enlace.indexOf("#")));
        assert.equal(importado.dientes[16].vestibular[0].profundidad, 6);
        assert.equal(importado.dientes[16].vestibular[0].margen, -2);
        assert.equal(importado.paciente.nombre, "");
        assert.equal(importado.paciente.id, "");
    } finally { globalThis.window = original; }
});
test("PDF contiene páginas legibles y datos recuperables", async () => {
    const examen = crearExamen({ nombre: "María", id: "PRUEBA" });
    examen.dientes[16].vestibular[0].profundidad = 5;
    const pdf = await crearPdf(examen);
    assert.ok(pdf.getNumberOfPages() >= 3);
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const tarea = pdfjs.getDocument({ data: new Uint8Array(pdf.output("arraybuffer")), isEvalSupported: false });
    try {
        const documento = await tarea.promise;
        const { info } = await documento.getMetadata();
        const recuperado = JSON.parse(decodeURIComponent(escape(atob(info.Subject.slice("AGENDA_PERIO_V1:".length)))));
        assert.deepEqual(recuperado, examen);
        const pagina = await documento.getPage(1);
        const contenido = await pagina.getTextContent();
        assert.ok(contenido.items.some(item => item.str === "Periodontograma"));
    } finally { await tarea.destroy(); }
});

test("edad clínica respeta fecha de cumpleaños sin desfase de zona horaria", () => {
    assert.equal(edadEnFecha("1986-10-06", "2026-10-05"), 39);
    assert.equal(edadEnFecha("1986-10-05", "2026-10-05"), 40);
    assert.equal(edadEnFecha("", "2026-10-05"), null);
});
test("clasificación exige confirmación clínica y aplica modificadores documentados", () => {
    const examen = crearExamen({ nacimiento: "1986-01-01" });
    examen.fecha = "2026-10-05";
    assert.equal(sugerirClasificacion(examen).estadio, null);
    examen.clasificacion = { casoConfirmado: "Sí", calInterdental: "3", perdidos: "0", complejidad: "No", perdidaOsea: "20" };
    examen.salud = { tabaco: "Nunca", diabetes: "No" };
    assert.equal(sugerirClasificacion(examen).estadio, "Estadio II");
    assert.equal(sugerirClasificacion(examen).grado, "Grado B");
    assert.equal(sugerirClasificacion(examen).pendientes.length, 0);
    examen.salud = { tabaco: "Fumador", cigarrillos: "10", diabetes: "No" };
    assert.equal(sugerirClasificacion(examen).grado, "Grado C");
    examen.clasificacion.perdidos = "5";
    assert.equal(sugerirClasificacion(examen).estadio, "Estadio IV");
});
test("PRA no asigna riesgo bajo a un examen incompleto", () => {
    const examen = crearExamen({ nacimiento: "1986-01-01" });
    examen.fecha = "2026-10-05";
    assert.equal(riesgoPeriodontal(examen).categoria, null);
    for (const numero of DIENTES) for (const superficie of SUPERFICIES) for (const sitio of examen.dientes[numero][superficie]) { sitio.profundidad = 2; sitio.sangrado = false; }
    examen.clasificacion = { perdidaOsea: "10", sistemicoPRA: "No", tabacoPRA: "Nunca" };
    assert.equal(riesgoPeriodontal(examen).categoria, "Bajo");
    examen.clasificacion.sistemicoPRA = "Sí";
    examen.clasificacion.tabacoPRA = ">20/día";
    assert.equal(riesgoPeriodontal(examen).categoria, "Alto");
});
test("periodontograma mantiene la misma política de acceso que odontograma", () => {
    for (const rol of [...DASHBOARD_ROLES.filter((valor) => valor !== "administrador-odontologico"), null, "", "desconocido", " ODONTOLOGICO "]) {
        assert.equal(canAccessDashboardPath(rol, "/dashboard/periodontogramaPaciente"), canAccessDashboardPath(rol, "/dashboard/odontogramasPaciente/123"), `Paridad para rol ${rol}`);
    }
    assert.equal(canAccessDashboardPath("secretaria", "/dashboard/periodontogramaPaciente"), false);
    assert.equal(canAccessDashboardPath("operador-medico", "/dashboard/periodontogramaPaciente"), false);
    assert.equal(canAccessDashboardPath("administrador-odontologico", "/dashboard/periodontogramaPaciente"), false);
    assert.equal(canAccessDashboardPath("administrador-odontologico", "/dashboard/odontogramasPaciente/123"), true);
    assert.equal(canAccessDashboardPath("operador-odontologico", "/dashboard/periodontogramaPaciente"), true);
    assert.ok(getVisibleDashboardSections("operador-odontologico").some(seccion => seccion.items.some(item => item.href === "/dashboard/periodontogramaPaciente")));
});
