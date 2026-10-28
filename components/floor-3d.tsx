"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { EstadoMesa, Limiares, Mesa } from "@/lib/types";
import { posicoesHabilitadas } from "@/lib/data";
import { aplicarCobrancas, useCobrancas } from "@/hooks/use-cobrancas";
import { derivarAlertas, derivarEstado, ROTULO_ESTADO, textoAlerta } from "@/lib/state";
import { cn } from "@/lib/utils";
import { useTemaEscuro } from "@/hooks/use-tema";
import { CenarioEventos, CenarioHotBeach, CenarioSalao, CenarioTerraco, CenarioVaranda, type PropsCena } from "./three/ambientes";
import { CenarioMezanino } from "./three/mezanino";
import { Camera } from "./three/camera";
import { ChaoToque } from "./three/chao";
import { marcosDe, obterCenario, ms, mx, mz } from "./three/cenarios";
import { corBrilho, corHover, corTopo, coresDoTema, TAMPO } from "./three/materiais";
import type { ArmazemHover } from "@/hooks/use-hover-mesa";
import type { Exibicao } from "@/lib/exibicao";
import { Luzes } from "./three/foco";
import { BrilhoHover } from "./three/brilho-hover";
import { Manchas } from "./three/manchas";
import { Mesas } from "./three/mesas";
import { Assentos, cadeirasDa, type FocoAssentos, type ItemAssento } from "./three/assentos";
import { Mesa3D } from "./three/mesa-3d";
import { CamadaRotulos, CamadaTags, ProjetorRotulos, ProjetorTags, type ItemRotulo, type MapaRotulos, type TagPosicao } from "./three/rotulos";
import { useReduzMovimento } from "./three/util";

export type VistaCamera = "aerea" | "perspectiva" | "nivel";

export interface Floor3DProps {
  mesas: Mesa[];
  limiares: Limiares;
  ambienteId: string;
  /** Mesas fora do filtro esmaecem a ~25%, rótulos inclusive. */
  filtro: EstadoMesa | null;
  /** Quando presente, tem precedência sobre `filtro` para esmaecer. */
  destacar?: (mesa: Mesa) => boolean;
  selecionada: number | null;
  onSelect: (id: number | null) => void;
  vistaCamera: VistaCamera;
  /** Muda a cada clique em "recentralizar": re-enquadra mesmo se a vista não mudou. */
  sinalReset: number;
  zoom: { direcao: 1 | -1; n: number } | null;
  /** Desloca até a mesa sob demanda (lista/busca), sem zoom nem giro. */
  foco: { id: number; n: number } | null;
  /** Anima o azimute de volta ao do preset. */
  sinalNorte: number;
  /** Grava a vista atual como padrão do ambiente. */
  sinalSalvarVista: number;
  /** Apaga a vista salva do ambiente e volta ao enquadramento de fábrica. */
  sinalLimparVista: number;
  /** Azimute em radianos, ~10 Hz, para a bússola do shell. */
  onCameraChange?: (azimuteRad: number) => void;
  /** Folga em px que a interface flutuante ocupa sobre o canvas. */
  folga: { topo: number; base: number; esquerda: number; direita: number };
  /** Nível dos assentos, sombras de contato e o modo dos rótulos. */
  exibicao: Exibicao;
  /** Mesa sob o ponteiro, compartilhada com as listas do shell. */
  hover: ArmazemHover;
  /** Posição escolhida da mesa em foco; destaca a cadeira e a etiqueta. */
  posicaoSelecionada?: number | null;
  /** Cadeira clicada na cena (só com a mesa em foco e posições ligadas). */
  onSelecionarPosicao?: (numero: number) => void;
  className?: string;
}

/** Antialias com até 2x de densidade no desktop; no toque a GPU é o gargalo. Sob demanda, parado não custa nada. */
function useDpr(): [number, number] {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5]);
  useEffect(() => {
    const grosso = window.matchMedia("(pointer: coarse)").matches;
    setDpr([1, grosso ? 1.5 : Math.min(window.devicePixelRatio || 1, 2)]);
  }, []);
  return dpr;
}

/**
 * Troca de ambiente: a cena some em 120 ms (opacidade no compositor), troca e volta em 180 ms
 * enquanto a câmera assenta. Até o fim do fade-out continua desenhando o ambiente antigo com as
 * mesas dele; trocar de novo no meio só redireciona, sem fila. Com movimento reduzido, 150 ms.
 */
function useTrocaAmbiente(alvo: string, mesasAlvo: Mesa[], reduz: boolean) {
  const [vigente, setVigente] = useState(alvo);
  const ultimas = useRef(mesasAlvo);
  const raiz = useRef<HTMLDivElement>(null);
  if (alvo === vigente) ultimas.current = mesasAlvo;

  useEffect(() => {
    const el = raiz.current;
    if (alvo === vigente) {
      // Voltou ao ambiente vigente no meio do fade-out: só reaparece.
      if (el?.style.opacity === "0") {
        el.style.transition = `opacity ${reduz ? 75 : 180}ms ease-out`;
        el.style.opacity = "1";
      }
      return;
    }
    const saida = reduz ? 75 : 120;
    if (el) {
      el.style.transition = `opacity ${saida}ms ease-out`;
      el.style.opacity = "0";
    }
    const t = setTimeout(() => setVigente(alvo), saida);
    return () => clearTimeout(t);
  }, [alvo, vigente, reduz]);

  return {
    ambienteId: vigente,
    mesas: alvo === vigente ? mesasAlvo : ultimas.current,
    raiz,
  };
}

const CENAS: Record<string, (p: PropsCena) => React.ReactNode> = {
  varanda: CenarioVaranda,
  mezanino: CenarioMezanino,
  eventos: CenarioEventos,
  terraco: CenarioTerraco,
  hotbeach: CenarioHotBeach,
};

export function Floor3D({
  mesas: mesasAlvo,
  limiares,
  ambienteId: ambienteAlvo,
  filtro,
  destacar,
  selecionada,
  onSelect,
  vistaCamera,
  sinalReset,
  zoom,
  foco: foco3d,
  sinalNorte,
  sinalSalvarVista,
  sinalLimparVista,
  onCameraChange,
  folga,
  exibicao,
  hover,
  posicaoSelecionada = null,
  onSelecionarPosicao,
  className,
}: Floor3DProps) {
  const reduz = useReduzMovimento();
  const { ambienteId, mesas, raiz } = useTrocaAmbiente(ambienteAlvo, mesasAlvo, reduz);
  const cenario = obterCenario(ambienteId);
  const escuro = useTemaEscuro();
  const cores = coresDoTema(escuro);
  const tampo = TAMPO[escuro ? "escuro" : "claro"];
  const els = useRef<MapaRotulos>(new Map());
  const elsTags = useRef(new Map<number, HTMLDivElement>());
  const elsMarcos = useRef<(HTMLDivElement | null)[]>([]);
  const marcos = useMemo(() => marcosDe(ambienteId), [ambienteId]);
  const dpr = useDpr();
  // Ref para o callback seguir estável: o memo das mesas não pode invalidar a cada seleção.
  const atual = useRef({ selecionada, onSelect });
  atual.current = { selecionada, onSelect };
  const aoSelecionar = useCallback((id: number) => atual.current.onSelect(id === atual.current.selecionada ? null : id), []);
  const aoVazio = useCallback(() => onSelect(null), [onSelect]);

  // Esc devolve a sala inteira; campos de texto e diálogos tratam o seu próprio Esc.
  useEffect(() => {
    if (selecionada === null) return;
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (e.key !== "Escape" || e.defaultPrevented || alvo?.closest("input, textarea, [role=dialog]")) return;
      onSelect(null);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [selecionada, onSelect]);

  const posicoes = useMemo(
    () => new Map(mesas.map((m) => [m.id, [mx(m.x, cenario), mz(m.y, cenario), Math.max(ms(m.largura), ms(m.altura)) / 2] as [number, number, number]])),
    [mesas, cenario],
  );

  // Posições incluídas ou retiradas no painel aparecem na cena na hora; o pagamento não entra aqui para não refazer as malhas.
  const cobranca = useCobrancas(selecionada ?? -1);
  const mesasCena = useMemo(
    () => mesas.map((m) => (m.id === selecionada && m.posicoes ? aplicarCobrancas(m, { ...cobranca, pagas: {} }) : m)),
    [mesas, selecionada, cobranca],
  );
  const mesaFoco = mesasCena.find((m) => m.id === selecionada);
  const comPosicoes = Boolean(exibicao.perfil === "completo" && exibicao.assentos !== "nenhum" && mesaFoco?.posicoes && mesaFoco.pessoas > 0 && posicoesHabilitadas(ambienteId));
  const pagas = useMemo(() => Object.keys(cobranca.pagas).map(Number), [cobranca.pagas]);

  const focoAssentos = useMemo<FocoAssentos | null>(
    () =>
      comPosicoes && mesaFoco
        ? { mesaId: mesaFoco.id, pagas, selecionada: posicaoSelecionada, onSelecionar: onSelecionarPosicao ?? (() => {}) }
        : null,
    [comPosicoes, mesaFoco, pagas, posicaoSelecionada, onSelecionarPosicao],
  );

  const tags = useMemo<TagPosicao[]>(() => {
    if (!comPosicoes || !mesaFoco) return [];
    return cadeirasDa(mesaFoco, cenario).map((c) => ({
      numero: c.numero,
      x: c.x + Math.sin(c.rot) * 0.3,
      z: c.z + Math.cos(c.rot) * 0.3,
      ocupada: c.ocupada,
      paga: pagas.includes(c.numero),
      selecionada: posicaoSelecionada === c.numero,
    }));
  }, [comPosicoes, mesaFoco, cenario, pagas, posicaoSelecionada]);

  const situacoes = useMemo<ItemAssento[]>(
    () =>
      mesasCena.map((mesa) => ({
        mesa,
        estado: derivarEstado(mesa, limiares),
        alertas: derivarAlertas(mesa, limiares),
      })),
    [mesasCena, limiares],
  );

  // Foco e filtro falam a mesma língua: o que não está em foco recua para ~1/4.
  const esmaecidas = useMemo(
    () =>
      new Map(
        situacoes.map(({ mesa, estado }) => [
          mesa.id,
          selecionada !== null ? mesa.id !== selecionada : destacar ? !destacar(mesa) : filtro !== null && filtro !== estado,
        ]),
      ),
    [situacoes, selecionada, destacar, filtro],
  );

  const itensRotulo = useMemo<ItemRotulo[]>(
    () =>
      situacoes.map(({ mesa, estado, alertas }) => {
        const [x, z, raio] = posicoes.get(mesa.id)!;
        return {
          mesa,
          estado,
          alertas,
          x,
          z,
          raio,
          esmaecida: esmaecidas.get(mesa.id) ?? false,
          selecionada: selecionada === mesa.id,
        };
      }),
    [situacoes, posicoes, esmaecidas, selecionada],
  );

  const sinais = useMemo(() => {
    const m = new Map<number, string>();
    for (const { mesa, estado, alertas } of situacoes) {
      if (exibicao.destaque === "tampo") {
        const topo = corTopo(estado, alertas[0]?.tipo, escuro);
        if (topo) m.set(mesa.id, topo);
        continue;
      }
      const b = corBrilho(estado, alertas[0]?.tipo, escuro, "tampo");
      if (b) m.set(mesa.id, b.cor);
    }
    return m;
  }, [situacoes, escuro, exibicao.destaque]);

  const coresHover = useMemo(() => new Map(situacoes.map(({ mesa, estado, alertas }) => [mesa.id, corHover(estado, alertas[0]?.tipo, escuro)])), [situacoes, escuro]);

  const ocupadas = useMemo(() => new Set(situacoes.filter((x) => x.estado === "ocupada").map((x) => x.mesa.id)), [situacoes]);

  const foco = selecionada === null ? null : posicoes.get(selecionada);
  const alvoLuz = useMemo(() => (foco ? { x: foco[0], z: foco[1], raio: foco[2] } : null), [foco]);

  const raio = Math.max(cenario.salaL, cenario.salaP) / 2 + 2;
  const Cena = CENAS[ambienteId] ?? CenarioSalao;

  return (
    <div ref={raiz} className={cn("absolute inset-0", className)}>
      <div aria-hidden className="h-full w-full">
        <Canvas
          flat
          frameloop="demand"
          dpr={dpr}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          camera={{ fov: 34, near: 0.1, far: 600, position: [12, 14, 16] }}
          onPointerMissed={aoVazio}
        >
          <color attach="background" args={[cores.fundo]} />

          <Suspense fallback={null}>
            <Luzes escuro={escuro} raio={raio} alvo={alvoLuz} instantaneo={reduz} />
            <Cena cores={cores} c={cenario} sombras={exibicao.sombras} />
            <ChaoToque cenario={cenario} onVazio={aoVazio} />

            <Manchas
              itens={situacoes}
              cenario={cenario}
              cores={cores}
              escuro={escuro}
              sombras={exibicao.sombras}
              brilho={exibicao.destaque === "brilho"}
              selecionada={selecionada}
              esmaecidas={esmaecidas}
              instantaneo={reduz}
            />
            <Mesas
              mesas={mesas}
              cenario={cenario}
              par={tampo}
              piso={cores.piso}
              sinais={sinais}
              ocupadas={ocupadas}
              escuro={escuro}
              destaque={exibicao.destaque}
              selecionada={selecionada}
              esmaecidas={esmaecidas}
              instantaneo={reduz}
            />
            <BrilhoHover cores={coresHover} mesas={mesas} cenario={cenario} escuro={escuro} hover={hover} selecionada={selecionada} esmaecidas={esmaecidas} instantaneo={reduz} />
            {exibicao.assentos !== "nenhum" && (
              <Assentos
                itens={situacoes}
                cenario={cenario}
                cores={cores}
                escuro={escuro}
                modo={exibicao.assentos}
                esmaecidas={esmaecidas}
                instantaneo={reduz}
                foco={focoAssentos}
                selecionada={selecionada}
              />
            )}
            {mesas.map((mesa) => (
              <Mesa3D key={mesa.id} mesa={mesa} hover={hover} cenario={cenario} onSelect={aoSelecionar} cadeirasAtivas={comPosicoes && mesa.id === selecionada} />
            ))}

            <Camera
              cenario={cenario}
              ambienteId={ambienteId}
              vistaCamera={vistaCamera}
              sinalReset={sinalReset}
              zoom={zoom}
              foco={foco3d}
              sinalNorte={sinalNorte}
              sinalSalvarVista={sinalSalvarVista}
              sinalLimparVista={sinalLimparVista}
              onCameraChange={onCameraChange}
              folga={folga}
              posicoes={posicoes}
              selecionada={selecionada}
              reduzMovimento={reduz}
            />
            <ProjetorTags tags={tags} els={elsTags} />
            <ProjetorRotulos
              itens={itensRotulo}
              els={els}
              marcos={marcos}
              elsMarcos={elsMarcos}
              foco={selecionada !== null}
              modo={exibicao.rotulos}
              folga={folga}
            />
          </Suspense>
        </Canvas>
      </div>

      <CamadaTags tags={tags} els={elsTags} />
      <CamadaRotulos itens={itensRotulo} marcos={marcos} corHaste={cores.anel} els={els} elsMarcos={elsMarcos} />

      {/* A cena não é operável por teclado; esta é a via equivalente. */}
      {/* sr-only numa div: a tabela ignora a altura de 1px e esticava o contêiner, que rolava ao focar algo. */}
      <div className="sr-only">
        <table>
          <caption>Mesas do ambiente</caption>
          <thead>
            <tr>
              <th>Mesa</th>
              <th>Situação</th>
              <th>Pessoas</th>
              <th>Lugares</th>
            </tr>
          </thead>
          <tbody>
            {mesas.map((m) => (
              <tr key={m.id}>
                <td>Mesa {m.id}</td>
                <td>{[ROTULO_ESTADO[derivarEstado(m, limiares)], ...derivarAlertas(m, limiares).map(textoAlerta)].join(". ")}</td>
                <td>{m.pessoas}</td>
                <td>{m.lugares}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
