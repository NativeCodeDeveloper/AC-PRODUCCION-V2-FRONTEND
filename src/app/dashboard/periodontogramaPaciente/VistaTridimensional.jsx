"use client";

import { useEffect, useRef, useState } from "react";
import { SUPERIORES, INFERIORES, SUPERFICIES } from "./periodontograma.mjs";
import { descargarArchivo } from "./archivos.mjs";
import { CLASE_BOTON } from "./GraficoPeriodontal";

export default function VistaTridimensional({ examen, anterior }) {
    const contenedor = useRef(null);
    const escenaActual = useRef(null);
    const [error, setError] = useState("");
    const [listo, setListo] = useState(false);
    const [exportando, setExportando] = useState(false);
    useEffect(() => {
        let cancelado = false;
        let limpiar = () => {};
        async function iniciar() {
            const [THREE, { OrbitControls }] = await Promise.all([import("three"), import("three/examples/jsm/controls/OrbitControls.js")]);
            if (cancelado || !contenedor.current) return;
            const caja = contenedor.current;
            const escena = new THREE.Scene();
            escena.background = new THREE.Color(0xf8fafc);
            const camara = new THREE.PerspectiveCamera(45, caja.clientWidth / 440, 0.1, 1000);
            camara.position.set(0, 55, 130);
            const renderizador = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
            renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderizador.domElement.className = "block h-full w-full touch-none rounded-xl";
            renderizador.domElement.setAttribute("aria-label", "Modelo de superficies periodontales. Arrastra para girar; rueda para acercar.");
            caja.appendChild(renderizador.domElement);
            const controles = new OrbitControls(camara, renderizador.domElement);
            controles.enableDamping = true; controles.target.set(0, 5, 0); controles.minDistance = 45; controles.maxDistance = 240;
            escena.add(new THREE.HemisphereLight(0xffffff, 0x8c93a3, 2.5));
            const luz = new THREE.DirectionalLight(0xffffff, 2); luz.position.set(20, 70, 50); escena.add(luz);
            const grupo = new THREE.Group(); grupo.name = "Periodontograma_esquematico"; escena.add(grupo);
            const disposables = [];
            function agregarRegistro(registro, previo = false) {
                for (const [arcada, numeros] of [[0, SUPERIORES], [1, INFERIORES]]) {
                    const alturaBase = arcada === 0 ? 18 : -18;
                    const direccion = arcada === 0 ? 1 : -1;
                    const arco = [];
                    numeros.forEach((numero, indice) => {
                        const anguloBase = Math.PI * (0.08 + indice / 15 * 0.84);
                        arco.push(new THREE.Vector3(Math.cos(anguloBase) * 34, alturaBase, Math.sin(anguloBase) * 25));
                        const diente = registro.dientes[numero];
                        if (!diente.presente) return;
                        for (const superficie of SUPERFICIES) {
                            const radio = superficie === "vestibular" ? 36 : 29;
                            diente[superficie].forEach((sitio, posicion) => {
                                if (sitio.profundidad === null) return;
                                const angulo = anguloBase + (posicion - 1) * 0.032;
                                const base = alturaBase - direccion * (sitio.margen ?? 0);
                                const fondo = base + direccion * sitio.profundidad;
                                const anchoAngular = 0.03;
                                const coordenadas = [
                                    Math.cos(angulo - anchoAngular / 2) * radio, base, Math.sin(angulo - anchoAngular / 2) * radio * 0.73,
                                    Math.cos(angulo + anchoAngular / 2) * radio, base, Math.sin(angulo + anchoAngular / 2) * radio * 0.73,
                                    Math.cos(angulo + anchoAngular / 2) * radio, fondo, Math.sin(angulo + anchoAngular / 2) * radio * 0.73,
                                    Math.cos(angulo - anchoAngular / 2) * radio, fondo, Math.sin(angulo - anchoAngular / 2) * radio * 0.73,
                                ];
                                const geometria = new THREE.BufferGeometry();
                                geometria.setAttribute("position", new THREE.Float32BufferAttribute(coordenadas, 3));
                                geometria.setIndex([0, 1, 2, 0, 2, 3]); geometria.computeVertexNormals();
                                const material = new THREE.MeshStandardMaterial({ color: previo ? 0x10b981 : sitio.sangrado ? 0xef4444 : 0x3b82f6, transparent: true, opacity: previo ? 0.35 : 0.85, side: THREE.DoubleSide, roughness: 0.6 });
                                const malla = new THREE.Mesh(geometria, material); malla.name = `Pieza_${numero}_${superficie}_${posicion}_${previo ? "anterior" : "actual"}`; grupo.add(malla);
                                disposables.push(geometria, material);
                            });
                        }
                    });
                    if (!previo) {
                        const geometria = new THREE.BufferGeometry().setFromPoints(arco);
                        const material = new THREE.LineBasicMaterial({ color: 0x64748b }); grupo.add(new THREE.Line(geometria, material)); disposables.push(geometria, material);
                    }
                }
            }
            if (anterior) agregarRegistro(anterior, true);
            agregarRegistro(examen);
            const ajustar = () => { const ancho = caja.clientWidth; camara.aspect = ancho / 440; camara.updateProjectionMatrix(); renderizador.setSize(ancho, 440, false); };
            const observador = new ResizeObserver(ajustar); observador.observe(caja); ajustar();
            renderizador.setAnimationLoop(() => { controles.update(); renderizador.render(escena, camara); });
            escenaActual.current = { escena: grupo, renderizador, restablecer: () => { camara.position.set(0, 55, 130); controles.target.set(0, 5, 0); controles.update(); } };
            setListo(true);
            limpiar = () => { observador.disconnect(); renderizador.setAnimationLoop(null); controles.dispose(); disposables.forEach(elemento => elemento.dispose()); renderizador.dispose(); renderizador.domElement.remove(); escenaActual.current = null; };
        }
        iniciar().catch(fallo => { if (!cancelado) setError(`No se pudo abrir WebGL: ${fallo.message}`); });
        return () => { cancelado = true; limpiar(); };
    }, [examen, anterior]);
    async function exportar() {
        setExportando(true);
        try {
            const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
            const resultado = await new GLTFExporter().parseAsync(escenaActual.current.escena, { binary: false });
            descargarArchivo(JSON.stringify(resultado), "periodontograma-3d.gltf", "model/gltf+json");
        } catch (fallo) { setError(fallo.message); } finally { setExportando(false); }
    }
    return <div className="flex flex-col gap-4"><p className="text-xs leading-relaxed text-slate-600">Altura: profundidad de sondaje. Rojo: sangrado positivo; azul: resto de sitios con sondaje. Verde: examen de comparación. Modelo esquemático, sin estimación clínica de superficie radicular o TPSA.</p>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}<div ref={contenedor} className="h-[440px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50" /><div className="flex flex-wrap gap-2"><button type="button" className={CLASE_BOTON} disabled={!listo} onClick={() => escenaActual.current?.restablecer()}>Restablecer cámara</button><button type="button" className={CLASE_BOTON} disabled={!listo || exportando} onClick={exportar}>{exportando ? "Exportando…" : "Descargar GLTF"}</button><button type="button" className={CLASE_BOTON} disabled={!listo} onClick={() => escenaActual.current.renderizador.domElement.toBlob(blob => { if (blob) descargarArchivo(blob, "periodontograma-3d.png", "image/png"); })}>Descargar imagen</button></div><p className="text-[11px] text-slate-500">Arrastra para girar. Usa la rueda o el gesto de pinza para acercar.</p></div>;
}
