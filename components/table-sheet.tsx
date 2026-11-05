"use client";

import { useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import type { Limiares, Mesa } from "@/lib/types";
import type { Perfil } from "@/lib/exibicao";
import { AMBIENTES, posicoesHabilitadas, PRACAS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { DetalheMesa, type IdAba } from "./detalhe/detalhe-mesa";

interface TableSheetProps {
  mesa: Mesa;
  limiares: Limiares;
  onClose: () => void;
  /** `sheet` é a folha fixa do celular; `cartao` preenche o painel de mesas do desktop. */
  variante?: "sheet" | "cartao";
  perfil?: Perfil;
  /** Estado compartilhado com a cena 3D; sem eles o painel guarda a própria aba. */
  aba?: IdAba;
  onAba?: (aba: IdAba) => void;
  posicaoSelecionada?: number | null;
  onSelecionarPosicao?: (posicao: number) => void;
}

/**
 * Painel de detalhe, não-bloqueante — overlay no caminho do mapa é atrito
 * medido em pesquisa de usabilidade de seleção espacial. A ordem responde
 * "o que está acontecendo nesta mesa?" em um olhar: identidade, estado e
 * alertas, depois os dados. O cartão não tem posicionamento nem fundo: quem o
 * hospeda (o painel de mesas) já é a superfície.
 */
export function TableSheet({
  mesa,
  limiares,
  onClose,
  variante = "sheet",
  perfil = "completo",
  aba: abaControlada,
  onAba,
  posicaoSelecionada,
  onSelecionarPosicao,
}: TableSheetProps) {
  const [interna, setInterna] = useState<{ id: number; aba: IdAba }>({ id: mesa.id, aba: "resumo" });
  const habilitada = perfil === "completo" && mesa.pessoas > 0 && posicoesHabilitadas(mesa.ambienteId);
  const abaEscolhida = abaControlada ?? (interna.id === mesa.id ? interna.aba : "resumo");
  const aba = abaEscolhida === "posicoes" && !habilitada ? "resumo" : abaEscolhida;
  const aoMudarAba = (nova: IdAba) => {
    setInterna({ id: mesa.id, aba: nova });
    onAba?.(nova);
  };
  const praca = PRACAS.find((p) => p.id === mesa.pracaId && p.ambienteId === mesa.ambienteId);
  const ambiente = AMBIENTES.find((a) => a.id === mesa.ambienteId);
  const cartao = variante === "cartao";

  return (
    <div
      role="dialog"
      aria-label={`Mesa ${mesa.id}`}
      className={cn(
        "animate-surgir flex min-h-0 flex-col",
        cartao
          ? "relative h-full w-full"
          : [
              "fixed inset-x-0 bottom-0 z-40 mx-auto max-h-[88dvh] w-full rounded-t-xl border-t bg-background px-4 pt-2 shadow-lg",
              "pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:max-w-[420px]",
            ],
      )}
    >
      {!cartao && <div aria-hidden className="mx-auto mb-3 h-1 w-9 flex-none rounded-full bg-border" />}

      <div className="flex flex-none items-center gap-4">
        <h4 className="m-0 min-w-14 flex-none font-mono text-4xl leading-none font-semibold">{mesa.id}</h4>

        <p className="m-0 min-w-0 flex-1 text-[13px] font-medium leading-5 text-muted-foreground">
          {[ambiente?.nome, praca && `Praça ${praca.id}`, praca?.garcom].filter(Boolean).join(" · ") || "Mesa"}
        </p>

        {cartao && (
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fechar detalhes da mesa" className="flex-none">
            <XIcon className="size-4" />
          </Button>
        )}
      </div>

      <Separator className="my-3 flex-none" />

      <div className="flex min-h-0 flex-1 flex-col">
        <DetalheMesa
          key={mesa.id}
          mesa={mesa}
          limiares={limiares}
          perfil={perfil}
          aba={aba}
          onAba={aoMudarAba}
          posicaoSelecionada={posicaoSelecionada}
          onSelecionarPosicao={onSelecionarPosicao}
        />
      </div>

      <div className="mt-3 flex flex-none items-center justify-between gap-3 border-t pt-3">
        <p className="m-0 text-xs leading-4 text-muted-foreground">
          {perfil === "completo" && aba === "posicoes" ? "Cobrança simulada — não altera o PDV" : "Somente consulta"}
        </p>
        {!cartao && (
          <Button className="min-w-28" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>
    </div>
  );
}
