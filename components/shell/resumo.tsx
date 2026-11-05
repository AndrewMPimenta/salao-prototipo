"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Resumo } from "./estatisticas";
import "./shell.css";

function useSegundos() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setS((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return s;
}

/** Os dados são de exemplo; o contador existe para a interface já nascer com o ritmo de um painel ao vivo. */
export function Atualizado({ className }: { className?: string }) {
  const s = useSegundos();
  const texto = s < 60 ? `${s}s` : `${Math.floor(s / 60)} min`;
  return (
    <p className={cn("m-0 flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span aria-hidden className="ponto-vivo size-1.5 rounded-full bg-current" />
      <span className="tnum">Atualizado há {texto}</span>
    </p>
  );
}

/** "13 comandas abertas em 5 mesas": a mesa é onde se senta, a comanda é o que se cobra. */
export function textoComandas(r: Resumo) {
  const c = `${r.comandas} ${r.comandas === 1 ? "comanda aberta" : "comandas abertas"}`;
  return `${c} em ${r.ocupadas} ${r.ocupadas === 1 ? "mesa" : "mesas"}`;
}
