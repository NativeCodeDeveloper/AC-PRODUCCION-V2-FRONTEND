'use client'
import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import CarruselOfertas from "@/Componentes/CarruselOfertas";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SeccionComuncacion() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const [listaPublicaciones, setListaPublicaciones] = useState([]);

    async function listarPublicacionesCarrusel() {
        try {
            const res = await fetch(`${API}/publicaciones/seleccionarPublicaciones`, {
                method: "GET",
                headers: { Accept: "application/json" },
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                console.error("No se han podido listar publicaciones.");
                setListaPublicaciones([])
                return []
            } else {
                const publicaciones = await res.json();
                setListaPublicaciones(publicaciones);
                return publicaciones;
            }
        } catch (err) {
            console.error("Problema al consultar backend desde la vista frontend:" + err);
            setListaPublicaciones([]);
            return [];
        }
    }

    useEffect(() => {
        listarPublicacionesCarrusel();
    }, []);

    const carrusel = listaPublicaciones.map((publicacion) =>
        `https://imagedelivery.net/aCBUhLfqUcxA2yhIBn1fNQ/${publicacion.imagenPublicaciones_primera}/full`
    )

    return (
        <main className="bg-transparent text-[#fff4ee]">
            <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-24 md:px-10 md:pt-28">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f1d8cb]/72">
                    Comunidad ESSENZA
                </p>
                <h1 className="mt-5 max-w-4xl text-4xl leading-tight text-[#fff1e9] sm:text-5xl">
                    Novedades, contenidos y recomendaciones para tu bienestar integral.
                </h1>
                <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[#f5dfd4]/82 sm:text-base">
                    Compartimos orientacion profesional en salud, mente y estetica para acompanarte tambien fuera de la consulta.
                </p>
            </section>

            <section className="mx-auto w-full max-w-7xl px-6 pb-20 md:px-10 md:pb-24">
                <div className="rounded-[2rem] border border-[#f2d4c7]/14 bg-[linear-gradient(160deg,rgba(64,38,33,0.58)_0%,rgba(24,14,12,0.9)_100%)] p-4 sm:p-6">
                    <CarruselOfertas
                        title=""
                        images={carrusel}
                        intervalMs={1800}
                    />

                    <div className="-mt-8 flex justify-center pb-4 sm:pb-6">
                        <Link
                            href="/catalogo"
                            className="rounded-full border border-[#f8dcc5]/45 bg-[linear-gradient(135deg,#f7dfcc_0%,#e7b27c_100%)] px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#2f1a12] transition hover:brightness-105"
                        >
                            Ver servicios
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
