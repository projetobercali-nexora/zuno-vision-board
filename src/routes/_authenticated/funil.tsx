import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/kb";
import { useConversas, useEstagios, type ConversaComContacto } from "@/lib/zuno";
import { useAgora, useLembretes, vencido } from "@/lib/lembretes";
import { Carregando, Erro, Vazio, Cabecalho } from "@/components/zuno/Estados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/funil")({
  head: () => ({ meta: [{ title: "Funil — Zuno" }, { name: "description", content: "Funil de vendas do Zuno." }] }),
  component: FunilPage,
});

const kz = (v: number) => `${v.toLocaleString("pt-AO", { maximumFractionDigits: 2 })} Kz`;

function FunilPage() {
  const qc = useQueryClient();
  const estagios = useEstagios();
  const conversas = useConversas();
  const lembretes = useLembretes();
  const agora = useAgora();
  const [sobre, setSobre] = useState<string | null>(null);
  const [brinde, setBrinde] = useState<ConversaComContacto | null>(null);
  const cfg = useQuery({
    queryKey: ["kb", "config_lembretes"],
    queryFn: async () => { const { data } = await db.from("config_lembretes").select("*").maybeSingle(); return data; },
  });

  const ultimaOrdem = Math.max(...(estagios.data?.map((e) => e.ordem) ?? [0]));
  const ultimoId = estagios.data?.find((e) => e.ordem === ultimaOrdem)?.id;

  const mover = useMutation({
    mutationFn: async ({ id, estagio_id }: { id: string; estagio_id: string }) => {
      const p: Record<string, unknown> = { estagio_id };
      if (estagio_id !== ultimoId) p["fechada_em"] = null;
      const { error } = await db.from("conversas").update(p).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, estagio_id }) => {
      await qc.cancelQueries({ queryKey: ["conversas"] });
      const antes = qc.getQueryData<ConversaComContacto[]>(["conversas"]);
      qc.setQueryData<ConversaComContacto[]>(["conversas"], (l) => l?.map((c) => (c.id === id ? { ...c, estagio_id, fechada_em: estagio_id === ultimoId ? c.fechada_em : null } : c)));
      return { antes };
    },
    onSuccess: (_d, { id, estagio_id }) => {
      if (estagio_id === ultimoId && cfg.data?.brinde_ativo) {
        const c = qc.getQueryData<ConversaComContacto[]>(["conversas"])?.find((x) => x.id === id);
        if (c) setBrinde(c);
      }
    },
    onError: (e, _v, ctx) => { qc.setQueryData(["conversas"], ctx?.antes); toast.error(e.message); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["conversas"] }),
  });

  if (estagios.isLoading || conversas.isLoading) return <Carregando />;
  if (estagios.error || conversas.error) return <Erro erro={estagios.error ?? conversas.error} />;
  if (!estagios.data?.length) return <Vazio titulo="Sem estágios" />;

  const pend = (lembretes.data ?? []).filter((l) => vencido(l, agora) && l.conversa_id);

  return (
    <div className="flex h-full flex-col">
      <Cabecalho titulo="Funil" />
      <div className="flex flex-1 snap-x gap-3 overflow-x-auto p-4">
        {estagios.data.map((e) => {
          const lista = conversas.data?.filter((c) => c.estagio_id === e.id) ?? [];
          return (
            <div
              key={e.id}
              onDragOver={(ev) => { ev.preventDefault(); setSobre(e.id); }}
              onDragLeave={() => setSobre(null)}
              onDrop={(ev) => {
                ev.preventDefault(); setSobre(null);
                const id = ev.dataTransfer.getData("text/plain");
                const c = conversas.data?.find((x) => x.id === id);
                if (c && c.estagio_id !== e.id) mover.mutate({ id, estagio_id: e.id });
              }}
              className={cn("flex w-72 shrink-0 snap-start flex-col rounded-2xl border bg-card", sobre === e.id && "border-primary")}
            >
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="flex items-center gap-2 font-display text-sm font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.cor ?? undefined }} />{e.nome}
                </span>
                <span className="rounded-full bg-secondary px-2 text-xs text-muted-foreground">{lista.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {lista.length === 0 && <p className="p-3 text-center text-xs text-muted-foreground">Arraste conversas para aqui</p>}
                {lista.map((c) => {
                  const meus = pend.filter((l) => l.conversa_id === c.id);
                  const prox = meus[0];
                  const espera = meus.some((l) => l.tipo === "cliente_espera");
                  const parada = meus.some((l) => l.tipo === "conversa_parada");
                  return (
                    <div key={c.id} draggable onDragStart={(ev) => ev.dataTransfer.setData("text/plain", c.id)}
                      className={cn("cursor-grab rounded-xl border bg-background p-3 active:cursor-grabbing", espera ? "border-2 border-destructive" : parada && "border-2 border-amber-400")}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{c.contactos?.nome ?? c.contactos?.telefone}</p>
                        {c.fechada_em && <span className="shrink-0 rounded-full bg-primary/15 px-2 text-[11px] font-semibold text-primary">Fechada</span>}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.ultima ?? "Sem mensagens"}</p>
                      {c.fechada_em && c.valor_venda != null && <p className="mt-1 text-xs font-semibold text-primary">{kz(Number(c.valor_venda))}</p>}
                      {prox && <p className="mt-2 border-t pt-1.5 text-xs"><span className="text-muted-foreground">Próxima ação:</span> {prox.titulo}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {brinde && <Brinde c={brinde} fechar={() => setBrinde(null)} />}
    </div>
  );
}

function Brinde({ c, fechar }: { c: ConversaComContacto; fechar: () => void }) {
  const qc = useQueryClient();
  const [valor, setValor] = useState("");
  const resumo = useQuery({
    queryKey: ["brinde", c.id],
    queryFn: async () => {
      const [{ count }, { data: dj }] = await Promise.all([
        supabase.from("mensagens").select("id", { count: "exact", head: true }).eq("conversa_id", c.id),
        supabase.from("decisoes_jev").select("probabilidade_conversao").eq("conversa_id", c.id).order("criado_em", { ascending: false }).limit(1),
      ]);
      return { msgs: count ?? 0, prob: dj?.[0]?.probabilidade_conversao ?? null };
    },
  });
  const dias = Math.max(0, Math.floor((Date.now() - new Date(c.criado_em).getTime()) / 86400000));
  const guardar = useMutation({
    mutationFn: async () => {
      const v = valor.trim() ? Number(valor.replace(/\s/g, "").replace(",", ".")) : null;
      if (v !== null && (isNaN(v) || v < 0)) throw new Error("Valor inválido.");
      const { error } = await db.from("conversas").update({ fechada_em: new Date().toISOString(), valor_venda: v }).eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["conversas"] }); toast.success("Venda registada."); fechar(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const nome = c.contactos?.nome || c.contactos?.telefone;
  return (
    <Dialog open onOpenChange={(o) => !o && fechar()}>
      <DialogContent className="overflow-hidden">
        <Confetti />
        <DialogHeader className="relative items-center text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary shadow-glow"><PartyPopper className="h-7 w-7" /></div>
          <DialogTitle className="font-display text-xl">Parabéns! Venda fechada com {nome}</DialogTitle>
        </DialogHeader>
        <div className="relative grid grid-cols-3 gap-2 text-center">
          {[["Dias desde o 1º contacto", String(dias)], ["Mensagens trocadas", resumo.isLoading ? "…" : String(resumo.data?.msgs ?? 0)],
            ["Probabilidade do Jev", resumo.isLoading ? "…" : resumo.data?.prob != null ? `${resumo.data.prob}%` : "—"]].map(([t, v]) => (
            <div key={t} className="rounded-xl border bg-secondary/40 p-3">
              <p className="font-display text-2xl font-bold text-primary">{v}</p>
              <p className="text-[11px] text-muted-foreground">{t}</p>
            </div>
          ))}
        </div>
        <div className="relative space-y-1.5">
          <Label>Valor da venda (Kz, opcional)</Label>
          <Input inputMode="decimal" placeholder="Ex.: 45000" value={valor} onChange={(e) => setValor(e.target.value)} />
        </div>
        <DialogFooter className="relative gap-2">
          <Button variant="outline" onClick={fechar}>Fechar</Button>
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const w = (cv.width = cv.offsetWidth), h = (cv.height = cv.offsetHeight);
    const cores = ["#22c55e", "#2dd4bf", "#facc15", "#38bdf8", "#f472b6"];
    const ps = Array.from({ length: 140 }, () => ({ x: w / 2, y: h * 0.25, vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 2, r: Math.random() * 6.28, s: Math.random() * 5 + 4, c: cores[Math.floor(Math.random() * cores.length)] }));
    let f = 0, raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ps.forEach((p) => { p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += 0.15;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - f / 180); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (++f < 180) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" />;
}
