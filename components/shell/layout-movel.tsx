"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useJanela, useMedida } from "@/hooks/use-medida";
import { MobileList } from "../mobile-list";
import { OccupancyBar } from "../occupancy-bar";
import { TableSheet } from "../table-sheet";
import { ToggleGroup } from "../ui/toggle-group";
import { Drawer } from "../ui/drawer";
import { BarraMovel } from "./barra-movel";
import { BarraFerramentas } from "./barra-ferramentas";
import { exibicaoDe } from "./menu-exibicao";
import { Cena } from "./cena";
import { PilulaImersivo } from "./controles-janela";
import { FiltrosRapidos } from "./filtros-rapidos";
import { Atualizado, Estatisticas } from "./resumo";
import type { PropsLayout } from "./tipos";

// Alça do Drawer (h-6); o resto do peek é a altura medida do cabeçalho.
const ALCA = 24;

export function LayoutMovel({ salao, imersivo, telaCheia }: PropsLayout) {
  const janela = useJanela();
  const [medirBarra, barra] = useMedida();
  const [medirSheet, sheet] = useMedida();
  const [medirCabecalho, cabecalho] = useMedida();
  const [indice, setIndice] = useState(0);
  const { resumo, mesaSelecionada } = salao;
  const ui = !imersivo;
  const s = janela.seguro;

  // Com a folha aberta o painel não pode brigar com ela pelo mesmo espaço.
  useEffect(() => {
    if (mesaSelecionada) setIndice(0);
  }, [mesaSelecionada]);

  const peek = ALCA + cabecalho.h + s.base;
  const pontos = [peek, Math.max(peek + 80, Math.round(janela.h * 0.5)), Math.max(peek + 160, Math.round(janela.h * 0.88))];
  const alturaBase = mesaSelecionada ? sheet.h : pontos[Math.min(indice, 1)];

  const folga = useMemo(
    () =>
      ui
        ? { topo: s.topo + 12 + barra.h + 8, base: alturaBase + 12, esquerda: s.esquerda + 16, direita: s.direita + 12 + 44 + 12 }
        : { topo: 16, base: 16, esquerda: 16, direita: 16 },
    [ui, s.topo, s.esquerda, s.direita, barra.h, alturaBase],
  );

  // A barra só encosta nas laterais e nunca desce até a gaveta ou a folha da mesa.
  const area = useMemo(
    () => ({ esq: s.esquerda + 12, topo: s.topo + 12 + barra.h + 8, dir: janela.w - s.direita - 12, base: janela.h - alturaBase - 12 }),
    [s.esquerda, s.topo, s.direita, barra.h, janela.w, janela.h, alturaBase],
  );

  // O filho direto da folha (fixed) é quem tem altura; o wrapper `contents` não tem caixa.
  const ancora = useCallback((el: HTMLElement | null) => medirSheet(el?.firstElementChild as HTMLElement | null), [medirSheet]);

  const selecionarDaLista = (id: number) => {
    salao.irParaMesa(id);
    setIndice(0);
  };

  return (
    <>
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

      <BarraMovel salao={salao} aberto={ui} telaCheia={telaCheia} medir={medirBarra} />
      <BarraFerramentas
        camera={salao.camera}
        exibicao={exibicaoDe(salao)}
        dispositivo="movel"
        aberto={ui && indice < 2}
        area={area}
      />

      <div className={ui ? "contents" : "hidden"}>
        <Drawer
          rotulo="Mesas do salão"
          pontos={pontos}
          indice={indice}
          onIndiceChange={setIndice}
          cabecalho={
            <div ref={medirCabecalho} className="flex flex-col gap-2 px-4 pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="tnum m-0 font-[family-name:var(--font-mono)] text-[24px] font-semibold leading-8">
                    {resumo.ocupadas} de {resumo.total}
                  </p>
                  <p className="tnum m-0 truncate text-[13px] leading-4 text-(--color-ink-2)">
                    mesas ocupadas · {resumo.lotacao}%
                  </p>
                </div>
                <ToggleGroup<"3d" | "lista">
                  rotulo="Vista"
                  tamanho="sm"
                  className="flex-none"
                  valor={indice === 2 ? "lista" : "3d"}
                  onChange={(v) => setIndice(v === "lista" ? 2 : 0)}
                  opcoes={[{ valor: "3d", rotulo: "3D" }, { valor: "lista", rotulo: "Lista" }]}
                />
              </div>
              <FiltrosRapidos
                valor={salao.filtroRapido}
                atencao={resumo.atencao}
                onChange={salao.definirRapido}
                className="flex [&>button]:flex-1"
              />
            </div>
          }
        >
          <div className="flex flex-col gap-3 px-4 pt-2">
            <Estatisticas resumo={resumo} />
            <OccupancyBar
              variante="legenda"
              contagem={resumo.contagem}
              total={resumo.total}
              filtro={salao.filtro}
              onFiltrar={salao.filtrar}
              alertas={resumo.atencao}
              alertaAtivo={salao.filtroRapido === "atencao"}
              onAlertas={() => salao.definirRapido(salao.filtroRapido === "atencao" ? "todas" : "atencao")}
            />
            <Atualizado />
          </div>
          <MobileList
            mesas={salao.mesasVisiveis}
            limiares={salao.limiares}
            filtro={salao.filtro}
            onSelect={selecionarDaLista}
            hover={salao.hover}
          />
        </Drawer>
      </div>

      {mesaSelecionada && (
        <div ref={ancora} className="contents">
          <TableSheet
            mesa={mesaSelecionada}
            limiares={salao.limiares}
            onClose={() => salao.selecionar(null)}
            aba={salao.abaDetalhe}
            onAba={salao.setAbaDetalhe}
            posicaoSelecionada={salao.posicaoSelecionada}
            onSelecionarPosicao={salao.selecionarPosicao}
          />
        </div>
      )}

      <PilulaImersivo visivel={imersivo} onClick={telaCheia.alternar} />
    </>
  );
}
