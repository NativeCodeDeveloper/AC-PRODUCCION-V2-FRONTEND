# Periodontograma del paciente

Ruta: `/dashboard/periodontogramaPaciente`. Acceso desde «Pacientes y Fichas» con la misma política de rutas que el odontograma. Implementación independiente en React, JavaScript y Tailwind; ilustraciones propias.

## Funciones implementadas

- 32 piezas permanentes y seis sitios anatómicos por pieza; numeración FDI y Universal.
- Presencia/ausencia reversible, cuatro estados de implante, movilidad y furcaciones anatómicamente disponibles.
- Margen gingival, sondaje e inserción calculada; sangrado, placa, supuración e índices adicionales configurables.
- Curvas de margen e inserción, resaltados, vistas completas/reducidas y comparación con un examen anterior.
- Navegación por teclado, secuencias de registro, ingreso por pares, pegado de varios valores, deshacer y rehacer.
- Historial por paciente, favoritos, búsqueda, copia selectiva de parámetros y borrador automático.
- Cuestionario de salud editable y resultados microbiológicos por examen.
- Exportación JSON/CSV/Excel, PDF imprimible con datos recuperables, importación validada y vista previa.
- Dictado Web Speech cuando el navegador lo admite; comandos escritos y diccionario de correcciones exportable.
- Resumen, comparación por sitio y concordancia con sesgo y límites de Bland–Altman.
- Evaluación PRA por categorías; orientación de estadio/grado con datos clínicos explícitos; registro del intervalo elegido.
- Enlace/QR del registro dental sin identidad; vista 3D esquemática giratoria, exportación GLTF e imagen.

## Convenciones

El margen se conserva internamente con posición coronal positiva y recesión negativa. El nivel de inserción es `profundidad - margen`. Cambiar el signo mostrado no altera la anatomía ni la inserción. Las mediciones vacías son `null`: no equivalen a cero. Los índices excluyen piezas ausentes y sitios no evaluados y muestran sus denominadores.

El registro queda en `localStorage`, separado por el identificador de usuario Clerk. No se crearon endpoints ni tablas; no se sincroniza con la base de datos del proyecto. El nombre del paciente y su ID se introducen manualmente. Exportar permite conservar copias fuera del navegador. El permiso de micrófono solo se habilita en esta ruta; el usuario debe iniciar el dictado y conceder el permiso del navegador.

## Límites frente a la referencia

Esta implementación cubre el registro y sus herramientas principales, pero no es una reproducción exacta de todos los algoritmos de periodontalchart-online.com:

- La vista 3D utiliza geometría esquemática; no calcula TPSA ni superficie radicular clínica.
- La referencia de intervalo implementa la tabla de bolsas del manual; no reproduce el ajuste propietario completo por factores sistémicos. El intervalo final lo elige el clínico.
- La orientación de estadio/grado usa pérdida ósea radiográfica y antecedentes introducidos por el clínico; no estima pérdida ósea a partir de longitudes radiculares promedio. Requiere confirmar el caso y completar sus criterios antes de registrar la sugerencia.
- PRA muestra las categorías de los seis factores; no calcula el área del polígono del sitio original.
- La calibración incluye sesgo, acuerdo ±1 mm y límites de Bland–Altman; no incluye ICC, significación estadística ni todos los análisis del original.
- Importar PDF admite los PDF generados aquí y formularios/textos con nombres de campos dentales reconocibles. No incluye OCR ni garantiza interpretar diseños de otros proveedores.
- CSV/Excel admiten el esquema plano documentado del registro básico; los índices extendidos y datos adicionales usan el esquema propio de Agenda Clínica.
- El enlace QR usa esta ruta autenticada. No envía los datos a la API del sitio de referencia.
- No se añadieron traducciones, API pública, edición por arrastre de recorridos ni generación de informes longitudinales especializados del sitio original.

## Verificación

`node --test tests/periodontograma.test.mjs`

Pruebas de valores nulos/cero, anatomía de sitios, signos, validación, exclusión de ausencias, secuencias, copia, comparación, formatos, anonimización, voz, QR, PDF, PRA, clasificación y paridad de permisos. También se verificaron las interacciones principales mediante React y un DOM de pruebas. `npm run build` valida la compilación Next.js.

El lint general del repositorio requiere una dependencia `typescript` ausente; se revisaron los archivos nuevos con ESLint, reglas JSX y React Hooks sin cambiar esa configuración. El micrófono real, el diálogo de impresión y WebGL necesitan verificación en el navegador final.

## Fuentes consultadas

- [Aplicación en español](https://www.periodontalchart-online.com/?lang=es).
- [Manual funcional](https://www.periodontalchart-online.com/manual/).
- [Estructura de datos documentada](https://www.periodontalchart-online.com/api/documentation.php).
- [PRA: Lang y Tonetti, 2003](https://www.perio-tools.com/pra/downloads/Lang_%26_Tonetti_2003.pdf).
- [EFP: árbol de estadificación y graduación](https://www.efp.org/fileadmin/uploads/efp/Documents/Campaigns/New_Classification/Guidance_Notes/report-02b.pdf).
