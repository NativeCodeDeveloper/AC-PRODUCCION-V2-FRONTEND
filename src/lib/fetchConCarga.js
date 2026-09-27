import { iniciarCarga } from "./cargaGlobal.js";

const lectores = new Set(["json", "text", "blob", "arrayBuffer", "formData", "bytes"]);

function observarRespuesta(respuesta) {
  return new Proxy(respuesta, {
    get(objetivo, propiedad) {
      const valor = Reflect.get(objetivo, propiedad, objetivo);
      if (propiedad === "clone") {
        return () => observarRespuesta(objetivo.clone());
      }
      if (lectores.has(propiedad) && typeof valor === "function") {
        return async (...argumentos) => {
          const finalizar = iniciarCarga();
          try {
            return await valor.apply(objetivo, argumentos);
          } finally {
            finalizar();
          }
        };
      }
      return typeof valor === "function" ? valor.bind(objetivo) : valor;
    },
  });
}

export async function fetchConCarga(recurso, opciones) {
  // El fetch nativo queda intacto para Next, Clerk, telemetría y sondeos.
  if (typeof window === "undefined") return globalThis.fetch(recurso, opciones);

  const finalizar = iniciarCarga();
  try {
    const respuesta = await globalThis.fetch(recurso, opciones);
    return observarRespuesta(respuesta);
  } finally {
    finalizar();
  }
}
