import { fetchConCarga as fetch } from "@/lib/fetchConCarga";
const API = process.env.NEXT_PUBLIC_API_URL;

export async function subirImagenCloudflare(file) {
    if (!API) throw new Error("Falta NEXT_PUBLIC_API_URL");
    if (!file) return null;

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${API}/cloudflare/subirimagenes`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        throw new Error("Error subiendo imagen a Cloudflare");
    }

    const data = await res.json();
    return data.imageId ?? null;
}