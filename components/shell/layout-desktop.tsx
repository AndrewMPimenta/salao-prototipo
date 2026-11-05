"use client";

import type { Ref } from "react";
import { cn } from "@/lib/utils";
import { AreaCanvas } from "./area-canvas";
import { Cabecalho } from "./cabecalho";
import { PilulaImersivo } from "./controles-janela";
import { Kpis } from "./kpis";
import { PainelMesas } from "./painel-mesas";
import type { PropsLayout } from "./tipos";

/**
 * Conteúdo do SidebarInset no desktop: cabeçalho, a faixa de números e, abaixo, a cena ao lado do painel de mesas.
 * O cabeçalho e a sidebar são colunas independentes; nada de uma cobre a outra.
 */
export function LayoutDesktop({ salao, imersivo, telaCheia, buscaRef }: PropsLayout & { buscaRef: Ref<HTMLInputElement> }) {
  return (
    <>
      <div hidden={imersivo} className="contents">
        <Cabecalho salao={salao} buscaRef={buscaRef} />
      </div>

      <div className={cn("flex min-h-0 flex-1 flex-col gap-4", imersivo ? "p-0" : "p-4 pt-0")}>
        {!imersivo && (
          <Kpis
            resumo={salao.resumo}
            perfil={salao.exibicao.perfil}
            livresAtivo={salao.filtroRapido === "livres"}
            onLivres={() => salao.definirRapido(salao.filtroRapido === "livres" ? "todas" : "livres")}
          />
        )}

        <div className="flex min-h-0 flex-1 gap-4">
          <AreaCanvas salao={salao} dispositivo="desktop" className={imersivo ? "rounded-none border-0" : undefined} />
          {!imersivo && <PainelMesas salao={salao} />}
        </div>
      </div>

      <PilulaImersivo visivel={imersivo} onClick={telaCheia.alternar} />
    </>
  );
}
