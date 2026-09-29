# AgendaClínica — notas para trabajar en este repo

## Fechas: la regla más importante del proyecto

Esta plataforma opera en **Chile (America/Santiago, UTC−3 en verano, UTC−4 en invierno)**.
Casi todos los bugs de fechas que han llegado a producción salieron de confundir
dos cosas que el backend entrega con la misma pinta.

### Las dos clases de campo

Mirar **la hora** que trae el valor:

| Valor | Qué es | Cómo leerlo |
|---|---|---|
| `"2026-10-01T00:00:00.000Z"` | **fecha civil** — un día del calendario (columna `DATE`) | del texto, sin convertir zona |
| `"2026-04-25T10:55:21.000Z"` | **instante** — un momento exacto (`created_at`, `fecha_subida`) | `new Date()` está bien |

Medianoche exacta en UTC ⇒ es una fecha civil. Interpretarla con `new Date()`
la corre **un día hacia atrás** en Chile: el 1 de octubre pasa a ser el 30 de
septiembre a las 21:00.

### Qué usar

Todo vive en **`src/lib/fechas.js`**. Nunca escribir aritmética de fechas a mano.

```js
import {
  partesFechaCivil,     // {anio, mes, dia}
  formatearFechaCivil,  // "15-09-2026"
  claveFechaCivil,      // "2026-09-15"  (ordenable y comparable como texto)
  mesYAnioCivil,        // "Septiembre de 2026"
  formatearFechaAuto,   // cuando no se sabe si el campo es civil o instante

  hoyCivil,             // "2026-09-29" EN LA ZONA DE LA CLÍNICA
  claveMesCivil,        // "2026-09"
  desplazarMesCivil,    // mover N meses
  rangoMesCivil,        // { desde, hasta } del mes
  dentroDelRangoCivil,  // filtrar por período

  edadCivil,            // edad del paciente
} from "@/lib/fechas";
```

**Para "hoy" usar `hoyCivil()`, nunca `new Date()`.** `hoyCivil()` lee el día en
`America/Santiago`; `new Date()` lee el reloj del equipo, que puede estar mal
configurado o pertenecer a alguien conectándose desde otro país.

Las claves `"AAAA-MM-DD"` se comparan **como texto** (`<`, `>`), y eso equivale a
compararlas cronológicamente. No hace falta construir ningún `Date` para saber si
una fecha cae dentro de un rango.

### Qué está prohibido

```js
new Date().toISOString().slice(0, 10)   // el día en UTC, no en Chile
new Date(reserva.fechaInicio)           // corre el día
dayjs(reserva.fechaInicio)              // idem
```

`dayjs` solo puede usarse para **formatear etiquetas** a partir de una clave
civil ya construida (`dayjs("2026-09-01").format("MMM YYYY")`), nunca sobre el
valor crudo del backend.

Sí es correcto `new Date(\`${fecha}T${hora}\`)`: **sin la `Z` final**, eso se
interpreta en hora local, que es lo que se quiere para juntar un día con una hora.

### El guardián

```bash
npm run fechas
```

Recorre `src/` y falla (código 1) si encuentra alguno de los patrones
prohibidos. Sirve para CI o para un hook de pre-commit.

Cuando un uso es legítimo —porque el valor es un instante real, o porque dos
fechas solo se comparan entre sí y el desfase se cancela— se marca con la razón:

```js
// fecha-ok: solo se comparan entre sí; ambas cargan el mismo desfase.
const inicio = new Date(fechaInicio);
const fin = new Date(fechaFinalizacion);
```

La marca cubre desde donde aparece hasta la próxima línea en blanco.

### Cómo probar un cambio de fechas

El error **no se ve de día**: antes de las 21:00 los dos caminos dan el mismo
resultado. Hay que forzarlo.

1. Correr la prueba con el proceso en varios husos y exigir el mismo resultado:
   `TZ=America/Santiago`, `TZ=UTC`, `TZ=Asia/Tokyo`, `TZ=Pacific/Niue`.
2. Simular el reloj a las **20:00, 21:00 y 23:59** hora de Chile.
3. Probar **enero** (UTC−3) **y julio** (UTC−4): con horario de invierno la
   ventana del fallo empieza una hora antes.
4. Probar los bordes: primer y último día del mes, cambio de año, 29 de febrero.

## Otras notas

- **PDF:** el pie de firma se dibuja siempre con `dibujarBloqueFirma` de
  `src/lib/pdfFirma.js`. No dibujarlo a mano.
- **Responsive:** cada pantalla debe funcionar en celular. Verificar con captura
  real, no solo con que el build compile.
- **`.env`:** `NEXT_PUBLIC_API_URL` debe llevar las dos barras
  (`https://back...`). Sin ellas el navegador lo tolera, pero cualquier parser
  estricto falla.
