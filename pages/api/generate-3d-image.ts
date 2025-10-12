import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReplicatePrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | string;
  output?: any;
  error?: string;
  urls?: { get: string };
};

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN!;
const MODEL = process.env.REPLICATE_MODEL!;
const MODEL_VERSION = process.env.REPLICATE_MODEL_VERSION; // poate lipsi

async function createPrediction(input: Record<string, any>): Promise<ReplicatePrediction> {
  const body: any = {
    // fie pui "model" direct, fie "version"
    ...(MODEL_VERSION ? { version: MODEL_VERSION } : { model: MODEL }),
    input,
  };

  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Replicate create failed: ${res.status} ${res.statusText} — ${txt}`);
  }
  return res.json();
}

async function getPrediction(url: string): Promise<ReplicatePrediction> {
  const res = await fetch(url, {
    headers: { Authorization: `Token ${REPLICATE_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Replicate get failed: ${res.status} ${res.statusText} — ${txt}`);
  }
  return res.json();
}

/**
 * Acceptă:
 * - multipart/form-data: file=image, prompt, negative_prompt etc.
 * - application/json: { imageUrl, prompt, ... }
 */
export async function POST(req: NextRequest) {
  try {
    let prompt = "";
    let negativePrompt = "";
    let imageB64: string | undefined;
    let imageUrl: string | undefined;

    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData();
      prompt = (form.get("prompt") as string) || "";
      negativePrompt = (form.get("negative_prompt") as string) || "";

      const file = form.get("image") as File | null;
      if (file && file.size > 0) {
        const buf = Buffer.from(await file.arrayBuffer());
        const b64 = buf.toString("base64");
        imageB64 = `data:${file.type};base64,${b64}`;
      }
      const imgUrlFromForm = form.get("imageUrl") as string | null;
      if (imgUrlFromForm) imageUrl = imgUrlFromForm;
    } else {
      const body = await req.json().catch(() => ({}));
      prompt = body.prompt || "";
      negativePrompt = body.negative_prompt || "";
      imageUrl = body.imageUrl;
      imageB64 = body.imageB64;
    }

    // ========= 🛠 Parametri model (ADAPTEAZĂ FIX CA ÎN FIȘIERUL TĂU) =========
    // Pentru "kling-v2.1": de regulă se folosește { prompt, image } (dacă e img2video) sau { prompt } (txt2video)
    // Pentru "flux-kontext-pro": { prompt, image } sau doar { prompt } și alți parametri.
    // Adaugă aici parametrii identici cu generate-3d-image.ts.
    const input: Record<string, any> = {
      prompt,
    };

    // atașează imagine dacă există (preferă URL dacă îl ai deja public)
    if (imageUrl) input.image = imageUrl;
    else if (imageB64) input.image = imageB64;

    // exemple de parametri comuni — șterge/înlocuiește cu ce folosește fișierul tău:
    if (negativePrompt) input.negative_prompt = negativePrompt;
    // input.guidance = 3.5;
    // input.steps = 30;
    // input.aspect_ratio = "3:2";
    // =======================================================================

    const prediction = await createPrediction(input);

    // poll până se termină
    let status = prediction.status;
    let last = prediction as ReplicatePrediction;
    let attempts = 0;

    while (!["succeeded", "failed", "canceled"].includes(status) && attempts < 120) {
      await new Promise((r) => setTimeout(r, 2500));
      last = await getPrediction(last.urls!.get);
      status = last.status;
      attempts++;
    }

    if (status !== "succeeded") {
      throw new Error(last.error || `Prediction did not succeed. Status: ${status}`);
    }

    // Normalizează output (poate fi string, array, obiect) => extragem ce ne trebuie:
    // - image_url (png/jpg), video_url (mp4), model_url (.glb) după caz
    const out = last.output;

    // încercăm să ghicim tipul (tu păstrezi ce câmpuri oferă modelul tău)
    let image_url: string | null = null;
    let video_url: string | null = null;
    let model_url: string | null = null;

    const flatten = (x: any): string[] => {
      if (!x) return [];
      if (typeof x === "string") return [x];
      if (Array.isArray(x)) return x.flatMap(flatten);
      if (typeof x === "object") return Object.values(x).flatMap(flatten);
      return [];
    };

    const candidates = flatten(out);
    for (const url of candidates) {
      if (typeof url !== "string") continue;
      if (url.match(/\.(mp4|webm)(\?|$)/i)) video_url = url;
      else if (url.match(/\.(glb|usdz|fbx|obj)(\?|$)/i)) model_url = url;
      else if (url.match(/\.(png|jpg|jpeg|webp)(\?|$)/i)) image_url = url;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        status,
        output: out,
        image_url,
        video_url,
        model_url,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message || "Eroare necunoscută" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

