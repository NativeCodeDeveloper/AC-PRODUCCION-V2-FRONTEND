'use client';
import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
import { useState, useEffect } from 'react';

// Caché de módulo — solo una petición por sesión de navegador
let _cache = null;
// La caché anterior solo se llenaba al RESOLVER, así que dos componentes que
// montan a la vez (p. ej. sidebar y menú móvil) disparaban dos peticiones en
// paralelo. Guardando también la promesa en vuelo, la segunda se cuelga de la
// primera en vez de abrir otra.
let _enVuelo = null;

function pedirEmpresaNombre() {
    if (_cache) return Promise.resolve(_cache);
    if (_enVuelo) return _enVuelo;

    const API = process.env.NEXT_PUBLIC_API_URL;
    if (!API) return Promise.resolve('AgendaClínica');

    _enVuelo = fetch(`${API}/datosempresa/seleccionartodos`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        mode: 'cors',
    })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
            const d = Array.isArray(data) ? data[0] : data;
            const n = d?.empresaNombre || 'AgendaClínica';
            _cache = n;
            return n;
        })
        .catch(() => 'AgendaClínica')
        // Se suelta pase lo que pase: si falló, un montaje posterior puede
        // reintentar en vez de quedarse pegado a la promesa fallida.
        .finally(() => { _enVuelo = null; });

    return _enVuelo;
}

export function useEmpresaNombre() {
    const [nombre, setNombre] = useState(_cache || '');

    useEffect(() => {
        if (_cache) return;

        let vivo = true;
        pedirEmpresaNombre().then(n => { if (vivo) setNombre(n); });

        return () => { vivo = false; };
    }, []);

    return nombre || 'AgendaClínica';
}
