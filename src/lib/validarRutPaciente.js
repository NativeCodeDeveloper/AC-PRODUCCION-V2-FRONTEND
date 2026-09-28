import { fetchConCarga } from "./fetchConCarga.js";
import { cleanRut, formatRut } from "./designTokens.js";

export async function rutPerteneceAOtroPaciente({ api, rut, idPaciente, consultar = fetchConCarga }) {
  const rutLimpio = cleanRut(rut);
  const mensajeError = "No se pudo verificar el RUT. Intenta nuevamente antes de guardar.";

  if (!rutLimpio || !idPaciente) throw new Error(mensajeError);

  const variantes = [...new Set([
    String(rut).trim(),
    rutLimpio,
    formatRut(rutLimpio),
    formatRut(rutLimpio).replaceAll(".", ""),
  ])];

  for (const variante of variantes) {
    let pacientes;
    try {
      const respuesta = await consultar(`${api}/pacientes/buscarRutEspecifico`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        mode: "cors",
        cache: "no-store",
        body: JSON.stringify({ rut: variante }),
      });
      if (!respuesta.ok) throw new Error(mensajeError);
      pacientes = await respuesta.json();
    } catch {
      throw new Error(mensajeError);
    }

    if (!Array.isArray(pacientes) || pacientes.some((paciente) => !paciente?.id_paciente || !paciente?.rut)) {
      throw new Error(mensajeError);
    }

    if (pacientes.some((paciente) => (
      cleanRut(paciente.rut) === rutLimpio && String(paciente.id_paciente) !== String(idPaciente)
    ))) {
      return true;
    }
  }

  return false;
}
