import { useState, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function Campo({ label, ajuda, children }: { label: string; ajuda?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {ajuda && <p className="text-xs text-muted-foreground">{ajuda}</p>}
    </div>
  );
}

export function CampoTexto({ label, valor, onChange, longo, disabled, placeholder, ajuda, tipo }: {
  label: string; valor: string | number | null | undefined; onChange: (v: string) => void; longo?: boolean | undefined;
  disabled?: boolean | undefined; placeholder?: string | undefined; ajuda?: string | undefined; tipo?: string | undefined;
}) {
  return (
    <Campo label={label} ajuda={ajuda}>
      {longo ? (
        <Textarea rows={4} value={valor ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} />
      ) : (
        <Input type={tipo} value={valor ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} />
      )}
    </Campo>
  );
}

export function Cartao({ titulo, texto, children, acao }: { titulo?: string; texto?: string; children?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4 md:p-5">
      {(titulo || acao) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {titulo && <p className="font-display font-semibold">{titulo}</p>}
            {texto && <p className="mt-1 text-sm text-muted-foreground">{texto}</p>}
          </div>
          {acao}
        </div>
      )}
      {children}
    </div>
  );
}

export function SoLeitura() {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      Modo de leitura: só os administradores podem editar.
    </div>
  );
}

export function ListaVazia({ texto }: { texto: string }) {
  return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{texto}</p>;
}

export function AcoesLinha({ podeEditar, onEditar, onApagar, titulo }: { podeEditar: boolean; onEditar?: () => void; onApagar: () => void; titulo: string }) {
  if (!podeEditar) return null;
  return (
    <div className="flex shrink-0 items-center gap-1">
      {onEditar && (
        <Button size="icon" variant="ghost" onClick={onEditar} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
      )}
      <Confirmar titulo={`Apagar "${titulo}"?`} texto="Esta ação não pode ser desfeita." onConfirmar={onApagar}>
        <Button size="icon" variant="ghost" aria-label="Apagar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </Confirmar>
    </div>
  );
}

export function Confirmar({ titulo, texto, onConfirmar, children, botao = "Apagar" }: { titulo: string; texto: string; onConfirmar: () => void; children: ReactNode; botao?: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{texto}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar}>{botao}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useRascunho<T>(inicial: T) {
  const [r, setR] = useState<T>(inicial);
  const set = <K extends keyof T>(k: K, v: T[K]) => setR((x) => ({ ...x, [k]: v }));
  return [r, set, setR] as const;
}
