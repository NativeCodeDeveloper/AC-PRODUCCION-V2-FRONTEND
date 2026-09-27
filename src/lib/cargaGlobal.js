const suscriptores = new Set();
let pendientes = 0;
let visible = false;
let cierrePendiente;

function publicar(valor) {
  if (visible === valor) return;
  visible = valor;
  suscriptores.forEach((notificar) => notificar());
}

export function suscribirCarga(notificar) {
  suscriptores.add(notificar);
  return () => suscriptores.delete(notificar);
}

export function obtenerCarga() {
  return visible;
}

export function iniciarCarga() {
  if (typeof window === "undefined") return () => {};

  clearTimeout(cierrePendiente);
  pendientes += 1;
  publicar(true);
  let finalizada = false;

  return () => {
    if (finalizada) return;
    finalizada = true;
    pendientes -= 1;

    if (pendientes === 0) {
      // Une peticiones encadenadas y permite que React pinte los datos recibidos.
      cierrePendiente = setTimeout(() => publicar(false), 100);
    }
  };
}
