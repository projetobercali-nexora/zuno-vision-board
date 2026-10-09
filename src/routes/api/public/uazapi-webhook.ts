import { createFileRoute } from "@tanstack/react-router";
import type { Json } from "@/integrations/supabase/types";

function seguroIgual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Entrada do WhatsApp (UazAPI): só recebe e guarda. Não interpreta nem responde.
export const Route = createFileRoute("/api/public/uazapi-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const esperado = process.env["WEBHOOK_SEGREDO"] ?? "";
        const segredo = new URL(request.url).searchParams.get("segredo") ?? "";
        if (!esperado || !seguroIgual(segredo, esperado)) {
          return new Response("Não autorizado", { status: 401 });
        }

        const cabecalhos: Record<string, string> = {};
        request.headers.forEach((v, k) => {
          if (!["authorization", "cookie"].includes(k.toLowerCase())) cabecalhos[k] = v;
        });

        const texto = await request.text();
        let corpo: Json = null;
        let erro: string | null = null;
        try {
          corpo = texto ? (JSON.parse(texto) as Json) : null;
        } catch {
          corpo = { bruto: texto };
          erro = "Corpo não é JSON válido";
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("webhook_logs").insert({ cabecalhos, corpo, erro });
        if (error) console.error("Falha ao gravar webhook_logs:", error.message);

        return Response.json({ ok: true });
      },
    },
  },
});
