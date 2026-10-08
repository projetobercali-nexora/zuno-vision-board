import { Loader2 } from "lucide-react";

export function Carregando({ texto = "A carregar..." }: { texto?: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {texto}
    </div>
  );
}

export function Vazio({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <p className="font-display font-semibold text-foreground">{titulo}</p>
      {texto && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{texto}</p>}
    </div>
  );
}

export function Erro({ erro }: { erro: unknown }) {
  return (
    <div className="m-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      Erro: {erro instanceof Error ? erro.message : "não foi possível carregar os dados."}
    </div>
  );
}

export function Cabecalho({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="font-display text-xl font-extrabold text-brand md:hidden">Zuno</span>
        <h1 className="truncate font-display text-lg font-semibold">{titulo}</h1>
      </div>
      {children}
    </header>
  );
}
