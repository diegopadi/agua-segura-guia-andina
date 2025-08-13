// deno-lint-ignore-file no-explicit-any
// Adapt AC4 strategies using IA based on user profundization responses
// CORS enabled

import { serve } from "https://deno.land/std@0.213.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function adaptWithOpenAI(strategies: any[], responses: any, contexto: any) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const system = `Eres un especialista pedagógico del MINEDU. Vas a ADAPTAR hasta 5 estrategias existentes, manteniendo su esencia y momento pedagógico, incorporando las respuestas de profundización globales del docente (pertinencia/contexto, viabilidad/recursos -incluye TIC y no TIC-, riesgos/mitigación, evaluación/evidencias e inclusión/participación). Devuelve JSON con { strategies: Array<{title, description, reference, momento, tags?: string[]}> }`;

  const user = {
    strategies,
    responses,
    contexto,
    instrucciones: "Rescribe cada estrategia en 120-180 palabras, integra recursos TIC concretos cuando aplique, usa lenguaje claro para docentes en Perú. No inventes estrategias nuevas, solo reescribe las existentes.",
  };

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(user) }
    ],
    response_format: { type: "json_object" }
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Respuesta vacía de OpenAI");
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error("No se pudo parsear la respuesta de IA");
  }
  return parsed?.strategies || strategies;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { strategies = [], responses = {}, contexto = {}, session_id } = await req.json();
    console.log("[adapt-ac4-strategies] session:", session_id, "items:", strategies.length);

    let adapted = strategies;
    try {
      adapted = await adaptWithOpenAI(strategies, responses, contexto);
    } catch (e) {
      console.error("IA fallback:", e);
    }

    const resp = { success: true, strategies: adapted };
    return new Response(JSON.stringify(resp), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (e) {
    console.error("adapt-ac4-strategies error:", e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 400,
    });
  }
});
