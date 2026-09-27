import sharp from "sharp";

// Limpieza del wordmark de letrasLoading.png (trae grano y manchas oscuras
// dentro de las letras). Pipeline: mediana (speckle) -> keying por luminancia
// con rampa suave -> closing morfológico (rellena las manchas internas).

const sstep = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// Máximo o mínimo en ventana cuadrada (dos pasadas: filas y columnas).
function morfologia(src, w, h, rad, op) {
  const filas = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = op === "max" ? 0 : 1;
      for (let d = -rad; d <= rad; d++) {
        const xx = Math.min(w - 1, Math.max(0, x + d));
        const v = src[y * w + xx];
        m = op === "max" ? Math.max(m, v) : Math.min(m, v);
      }
      filas[y * w + x] = m;
    }
  }
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = op === "max" ? 0 : 1;
      for (let d = -rad; d <= rad; d++) {
        const yy = Math.min(h - 1, Math.max(0, y + d));
        const v = filas[yy * w + x];
        m = op === "max" ? Math.max(m, v) : Math.min(m, v);
      }
      out[y * w + x] = m;
    }
  }
  return out;
}

// Resolución nativa del original (2170px): la morfología trabaja fina y el
// reescalado final (lanczos) deja el borde nítido pero suavizado.
const { data, info } = await sharp("public/fonts/letrasLoading.png")
  .median(3)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height } = info;
const alpha = new Float32Array(width * height);
for (let i = 0; i < width * height; i++) {
  const lum = 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];
  // Rampa corta y empinada: todo lo que es letra queda opaco (tinta sólida,
  // borde duro). Una rampa ancha dejaba letras semitransparentes y "borrosas".
  alpha[i] = sstep(45, 95, lum);
}

// Closing (rellena mordidas del grano) + opening (recorte de protuberancias),
// en escala nativa: radio 7 ≈ 3.5px a 1080.
const cerrada = morfologia(morfologia(alpha, width, height, 7, "max"), width, height, 7, "min");
const limpio = morfologia(morfologia(cerrada, width, height, 3, "min"), width, height, 3, "max");

const out = Buffer.alloc(width * height * 4);
for (let i = 0; i < width * height; i++) {
  out[i * 4] = 0x16;
  out[i * 4 + 1] = 0x18;
  out[i * 4 + 2] = 0x1c;
  out[i * 4 + 3] = Math.round(255 * limpio[i]);
}

await sharp(out, { raw: { width, height, channels: 4 } })
  .resize({ width: 840 })
  .png()
  .toFile("public/fonts/letrasLoading-transparente.png");

await sharp({ create: { width, height, channels: 4, background: "#ffffff" } })
  .composite([{ input: "public/fonts/letrasLoading-transparente.png" }])
  .png()
  .toFile("/tmp/preview-final-blanco.png");

console.log("ok", `${width}x${height}`);
