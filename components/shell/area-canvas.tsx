"use client";

import { useMemo } from "react";
import type { Salao } from "@/hooks/use-salao";
import { useMedida } from "@/hooks/use-medida";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { BarraFerramentas } from "./barra-ferramentas";
import { Cena } from "./cena";
import { exibicaoDe } from "./menu-exibicao";
import { PainelVista } from "./painel-vista";

interface AreaCanvasProps {
  salao: Salao;
  dispositivo: "desktop" | "movel";
  /** Altura da base que outra camada cobre (a gaveta no celular), em px. */
  baseCoberta?: number;
  className?: string;
}

// Respiro em volta do salão; embaixo cabe também a barra da câmera, que pousa ali por padrão.
const RESPIRO = 16;
const BARRA = 64;

/**
 * O cartão da cena: 3D, planta ou linha do tempo preenchem o cartão inteiro, e só a barra da câmera, o selo de layout
 * ilustrativo e o aviso da planta ficam por cima. O enquadramento usa o tamanho do próprio cartão.
 */
export function AreaCanvas({ salao, dispositivo, baseCoberta = 0, className }: AreaCanvasProps) {
  const [medir, cartao] = useMedida();
  const ambiente = salao.ambientes.find((a) => a.id === salao.ambienteId);
  const ilustrativo = Boolean(ambiente?.ilustrativo);

  const folga = useMemo(
    () => ({ topo: RESPIRO, base: RESPIRO + BARRA + baseCoberta, esquerda: RESPIRO, direita: RESPIRO }),
    [baseCoberta],
  );
  const area = useMemo(
    () => ({ esq: 8, topo: 8, dir: Math.max(8, cartao.w - 8), base: Math.max(8, cartao.h - 8 - baseCoberta) }),
    [cartao.w, cartao.h, baseCoberta],
  );

  return (
    <section
      ref={medir}
      aria-label={`Salão ${ambiente?.nome ?? ""}`}
      className={cn("relative min-h-0 flex-1 rounded-xl border bg-card", className)}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
        {salao.vista === "3d" ? (
          <div className="absolute inset-0">
            <Cena
              mesas={salao.mesas}
              limiares={salao.limiares}
              ambienteId={salao.ambienteId}
              filtro={salao.filtro}
              destacar={salao.destacar}
              selecionada={salao.selecionada}
              onSelect={salao.selecionar}
              vistaCamera={salao.camera.vistaCamera}
              sinalReset={salao.camera.sinalReset}
              sinalNorte={salao.camera.sinalNorte}
              sinalSalvarVista={salao.camera.sinalSalvarVista}
              sinalLimparVista={salao.camera.sinalLimparVista}
              zoom={salao.camera.zoom}
              folga={folga}
              exibicao={salao.exibicao}
              hover={salao.hover}
              foco={salao.foco}
              onCameraChange={salao.camera.aoMudarCamera}
              posicaoSelecionada={salao.posicaoSelecionada}
              onSelecionarPosicao={salao.selecionarPosicao}
            />
          </div>
        ) : (
          <PainelVista salao={salao} ilustrativo={ilustrativo} />
        )}
      </div>

      {ilustrativo && (
        <Badge
          variant="secondary"
          title="Mesas conforme o cliente; planta fictícia até recebermos a real"
          className="absolute top-3 left-3 z-20 h-6 border bg-background/90 px-2.5 text-muted-foreground"
        >
          Layout ilustrativo
        </Badge>
      )}

      <BarraFerramentas
        camera={salao.camera}
        exibicao={exibicaoDe(salao)}
        dispositivo={dispositivo}
        aberto={salao.vista === "3d"}
        area={area}
      />
    </section>
  );
}
