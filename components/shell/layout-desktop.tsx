"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Salao } from "@/hooks/use-salao";
import { useJanela, useMedida } from "@/hooks/use-medida";
import { ThemeToggle } from "../theme-toggle";
import { AjudaAtalhos } from "./ajuda-atalhos";
import { BarraDesktop } from "./barra-desktop";
import { BotaoIcone } from "./botao-icone";
import { BuscaMesa } from "./busca-mesa";
import { BarraFerramentas } from "./barra-ferramentas";
import { AsideLateral } from "./aside-lateral";
import { exibicaoDe } from "./menu-exibicao";
import { BotaoTelaCheia, PilulaImersivo } from "./controles-janela";
import { Cena } from "./cena";
import { IconeBusca } from "./icones";
import { PainelOcupacao } from "./painel-ocupacao";
import { PainelVista } from "./painel-vista";
import { useMidia } from "@/hooks/use-midia";
import type { PropsLayout } from "./tipos";

const G = 16;

export function LayoutDesktop({ salao, imersivo, telaCheia, atalhos }: PropsLayout) {
  const xl = useMidia("(min-width: 1280px)");
  const janela = useJanela();
  const [medirBarra, barra] = useMedida();
  const [medirOcup, ocup] = useMedida();
  const [larguraAside, setLarguraAside] = useState(380);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [ajudaAberta, setAjudaAberta] = useState(false);
  const buscaRef = useRef<HTMLInputElement>(null);

  const abrirBusca = useCallback(() => {
    if (xl) buscaRef.current?.focus();
    else setBuscaAberta(true);
  }, [xl]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        abrirBusca();
        return;
      }
      const alvo = e.target as HTMLElement | null;
      const digitando = ["input", "textarea", "select"].includes(alvo?.tagName.toLowerCase() ?? "");
      if (!atalhos.ligados || digitando || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        abrirBusca();
      } else if (e.key === "?") setAjudaAberta((v) => !v);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [abrirBusca, atalhos.ligados]);

  const ui = !imersivo;
  const nomeAmbiente = salao.ambientes.find((a) => a.id === salao.ambienteId)?.nome ?? "";
  const s = janela.seguro;
  const larguraNominal = xl ? 380 : 340;
  const topoAside = s.topo + G + barra.h + 12;
  const folga = useMemo(
    () =>
      ui
        ? {
            topo: topoAside,
            base: s.base + G + Math.min(ocup.h, janela.h * 0.34) + G,
            esquerda: s.esquerda + G,
            direita: s.direita + 12 + larguraAside + 12,
          }
        : { topo: G, base: G, esquerda: G, direita: G },
    [ui, topoAside, s.base, s.esquerda, s.direita, ocup.h, janela.h, larguraAside],
  );

  const area = useMemo(
    () => ({ esq: s.esquerda + G, topo: topoAside, dir: janela.w - s.direita - 12 - larguraAside - 12, base: janela.h - s.base - G }),
    [s.esquerda, s.direita, s.base, topoAside, janela.w, janela.h, larguraAside],
  );
  const evitar = useMemo(
    () => ({ esq: s.esquerda + G, topo: janela.h - s.base - G - ocup.h, dir: s.esquerda + G + ocup.w, base: janela.h - s.base - G }),
    [s.esquerda, s.base, janela.h, ocup.w, ocup.h],
  );

  const campoBusca = (
    <BuscaMesa
      mesas={salao.todas}
      ambientes={salao.ambientes}
      limiares={salao.limiares}
      onIr={salao.irParaMesa}
      inputRef={buscaRef}
      onFechar={() => setBuscaAberta(false)}
      className="w-48"
    />
  );

  return (
    <>
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
        <PainelVista salao={salao} folga={folga} />
      )}

      <BarraDesktop
        salao={salao}
        aberto={ui}
        medir={medirBarra}
        busca={xl ? campoBusca : null}
        acoes={
          <>
            <ThemeToggle />
            {!xl && (
              <BotaoIcone rotulo="Ir para mesa (/)" expandido={buscaAberta} onClick={abrirBusca}>
                <IconeBusca />
              </BotaoIcone>
            )}
            <AjudaAtalhos
              aberto={ajudaAberta}
              onAbrir={setAjudaAberta}
              atalhosLigados={atalhos.ligados}
              onAtalhos={atalhos.definir}
              exibicao={salao.exibicao}
              onExibicao={salao.definirExibicao}
              personalizada={salao.exibicaoPersonalizada}
              onRestaurar={salao.restaurarExibicao}
              camera={salao.camera}
            />
            <BotaoTelaCheia ativo={telaCheia.ativo} imersivoNoLugar={telaCheia.imersivoNoLugar} onClick={telaCheia.alternar} />
          </>
        }
      />

      {!xl && buscaAberta && (
        <div
          style={{ top: s.topo + G + barra.h + 8 }}
          className="animate-surgir absolute right-[calc(env(safe-area-inset-right)+16px)] z-30 w-[360px]"
        >
          <BuscaMesa
            autoFocus
            mesas={salao.todas}
            ambientes={salao.ambientes}
            limiares={salao.limiares}
            onIr={salao.irParaMesa}
            onFechar={() => setBuscaAberta(false)}
            className="glass rounded-full"
          />
        </div>
      )}

      <PainelOcupacao salao={salao} nomeAmbiente={nomeAmbiente} aberto={ui} medir={medirOcup} />

      <AsideLateral salao={salao} aberto={ui} largura={larguraNominal} topo={topoAside} onLargura={setLarguraAside} />

      <BarraFerramentas
        camera={salao.camera}
        exibicao={exibicaoDe(salao)}
        dispositivo="desktop"
        aberto={ui && salao.vista === "3d"}
        area={area}
        evitar={evitar}
      />

      <PilulaImersivo visivel={imersivo} onClick={telaCheia.alternar} />
    </>
  );
}
