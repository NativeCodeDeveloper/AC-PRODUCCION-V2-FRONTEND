#!/usr/bin/env node
/**
 * Guardián de fechas.
 *
 * Busca los patrones que ya causaron bugs en producción: leer una fecha del
 * calendario con `new Date(...)`, `dayjs(...)` o `toISOString()`, que en Chile
 * (UTC-3/-4) corren el día.
 *
 *   node scripts/revisar-fechas.mjs
 *
 * Sale con código 1 si encuentra algo, para poder colgarlo de CI o de un hook.
 *
 * Cuando un uso es legítimo — porque el valor es un INSTANTE real y no un día
 * del calendario — se marca con un comentario en la misma línea o en la
 * anterior, explicando por qué:
 *
 *   const creadoEn = new Date().toISOString(); // fecha-ok: instante de creación
 *
 * La marca obliga a escribir la razón, que es lo que faltaba las veces que
 * esto se coló.
 */

import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..", "src");
const MARCA = /\/\/\s*fecha-ok:/;

// Nombres que en este proyecto son fechas del calendario, no instantes.
const NOMBRE_FECHA = "(?:[A-Za-z_$]*(?:echa|acimiento|encimiento|xpiracion|misio|aducidad)[A-Za-z_$]*)";

const REGLAS = [
  {
    id: "toISOString-para-hoy",
    // El clásico: el día en UTC, que desde las 21:00 de Chile ya es el siguiente.
    patron: /new Date\(\)\s*\.toISOString\(\)\s*\.(?:slice|split)\s*\(/,
    mensaje: "toISOString() da el día en UTC. Para el día de hoy usar hoyCivil() de @/lib/fechas.",
  },
  {
    id: "toISOString-sobre-fecha",
    patron: new RegExp(`${NOMBRE_FECHA}\\s*\\.toISOString\\(\\)`),
    mensaje: "toISOString() sobre una fecha del calendario la corre un día. Usar claveFechaCivil().",
  },
  {
    id: "new-Date-sobre-fecha",
    // Se permite cualquier `new Date("...T...")` construido a mano — sea
    // `T00:00:00` o `T${hora}` —: sin la Z final, eso se interpreta en hora
    // LOCAL, que es justo lo que se quiere. Lo que se persigue es el
    // `new Date(valorDelBackend)` pelado.
    patron: new RegExp(`new Date\\(\\s*(?![^)]*T(?:\\$\\{|\\d))[^)]*${NOMBRE_FECHA}[^)]*\\)`),
    mensaje: "new Date() sobre una fecha del calendario la corre un día. Usar partesFechaCivil() o formatearFechaCivil().",
  },
  {
    id: "dayjs-sobre-fecha",
    patron: new RegExp(`dayjs\\(\\s*[^)]*${NOMBRE_FECHA}[^)]*\\)`),
    mensaje: "dayjs() convierte a la zona del equipo. Usar los helpers civiles de @/lib/fechas.",
  },
];

function* archivos(dir) {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === "node_modules" || entrada.name === ".next") continue;
      yield* archivos(completo);
    } else if (/\.(js|jsx|ts|tsx)$/.test(entrada.name)) {
      yield completo;
    }
  }
}

const hallazgos = [];

for (const archivo of archivos(RAIZ)) {
  // El propio helper es el único que puede tocar Date a mano.
  if (archivo.endsWith(path.join("lib", "fechas.js"))) continue;

  const lineas = fs.readFileSync(archivo, "utf8").split("\n");

  // Una marca cubre desde donde aparece hasta la proxima linea en blanco: asi
  // exime el bloque completo y no solo la sentencia siguiente, que es como se
  // lee al escribirla encima de dos o tres lineas relacionadas.
  let bloqueExento = false;

  lineas.forEach((linea, i) => {
    if (linea.trim() === "") bloqueExento = false;
    if (MARCA.test(linea)) bloqueExento = true;

    const sinComentario = linea.replace(/\/\/.*$/, "");
    if (/^\s*[*/]/.test(linea)) return; // bloque de comentario

    const exenta = bloqueExento;

    for (const regla of REGLAS) {
      if (!regla.patron.test(sinComentario)) continue;
      if (exenta) continue;
      hallazgos.push({
        archivo: path.relative(path.join(RAIZ, ".."), archivo),
        linea: i + 1,
        regla: regla.id,
        mensaje: regla.mensaje,
        texto: linea.trim().slice(0, 100),
      });
    }
  });
}

if (hallazgos.length === 0) {
  console.log("Fechas: sin patrones peligrosos.");
  process.exit(0);
}

console.log(`Fechas: ${hallazgos.length} uso(s) que pueden correr el día en Chile.\n`);
for (const h of hallazgos) {
  console.log(`  ${h.archivo}:${h.linea}  [${h.regla}]`);
  console.log(`    ${h.texto}`);
  console.log(`    → ${h.mensaje}\n`);
}
console.log('Si alguno es un instante real y no un día del calendario, anotarlo con  // fecha-ok: <razón>');
process.exit(1);
