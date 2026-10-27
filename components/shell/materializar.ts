import { cn } from "@/lib/utils";

/**
 * Aparecer/sumir de painel: deslocamento, opacidade e desfoque juntos, com o
 * mesmo caminho na ida e na volta. Vai direto no elemento de vidro, nunca num
 * ancestral: opacidade ou filter num pai tira o backdrop-filter do filho.
 * `translate` e `scale` são propriedades próprias no Tailwind v4, então
 * `transform` na lista de transição não as cobriria.
 */
export function materializar(aberto: boolean, de: "baixo" | "cima" = "baixo") {
  return cn(
    "transition-[opacity,translate,scale,filter,visibility] duration-[320ms] ease-(--ease-out-soft)",
    aberto
      ? "visible opacity-100"
      : [
          "pointer-events-none invisible scale-[0.98] opacity-0 blur-[6px]",
          de === "baixo" ? "translate-y-2" : "-translate-y-2",
        ],
  );
}
