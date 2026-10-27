"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Alerta, EstadoMesa, Mesa } from "@/lib/types";
import { ms, mx, mz, type Cenario } from "./cenarios";
import { corBrilho, corSelecao, matMancha, quadPiso, type Cores, type NivelBrilho } from "./materiais";
import { useEsmaecimento } from "./util";

export interface ItemMancha {
  mesa: Mesa;
  estado: EstadoMesa;
  alertas: Alerta[];
}

type Camada = "sombra" | NivelBrilho;

interface Instancia {
  id: number;
  x: number;
  z: number;
  rx: number;
  rz: number;
  cor: THREE.Color;
}

// Acima das ripas do deck e das tábuas do mezanino (topo a 8 mm), em degraus de 2 mm.
const Y: Record<Camada, number> = { sombra: 0.012, estado: 0.014, alerta: 0.016, critico: 0.018 };
const ORDEM: Record<Camada, number> = { sombra: 1, estado: 2, alerta: 3, critico: 4 };
// Folga além do tampo: a sombra cobre as cadeiras, o brilho passa delas e o alerta vai mais longe.
const ALCANCE: Record<Camada, number> = { sombra: 0.8, estado: 1.05, alerta: 1.3, critico: 1.65 };
const OPACIDADE: Record<Camada, [number, number]> = {
  sombra: [0.16, 0.4],
  estado: [0.5, 0.62],
  alerta: [0.68, 0.8],
  critico: [0.9, 1],
};
const CAMADAS: Camada[] = ["sombra", "estado", "alerta", "critico"];

const um = new THREE.Vector3();
const escala = new THREE.Vector3();
const quat = new THREE.Quaternion();
const matriz = new THREE.Matrix4();

function CamadaManchas({
  camada,
  lista,
  escuro,
  esmaecidas,
  piso,
  instantaneo,
}: {
  camada: Camada;
  lista: Instancia[];
  escuro: boolean;
  esmaecidas: ReadonlyMap<number, boolean>;
  piso: string;
  instantaneo: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const material = useMemo(() => matMancha(OPACIDADE[camada][escuro ? 1 : 0], ORDEM[camada]), [camada, escuro]);
  const ids = useMemo(() => lista.map((i) => i.id), [lista]);
  const cores = useMemo(() => lista.map((i) => i.cor), [lista]);

  useLayoutEffect(() => () => material.dispose(), [material]);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    lista.forEach((i, k) => m.setMatrixAt(k, matriz.compose(um.set(i.x, Y[camada], i.z), quat, escala.set(i.rx, 1, i.rz))));
    m.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [lista, camada, invalidate]);

  useEsmaecimento(ref, ids, cores, esmaecidas, piso, instantaneo);

  if (lista.length === 0) return null;
  return (
    <instancedMesh
      key={lista.length}
      ref={ref}
      args={[quadPiso(), material, lista.length]}
      renderOrder={ORDEM[camada]}
      frustumCulled={false}
      raycast={() => null}
    />
  );
}

/**
 * Manchas no piso em quatro malhas instanciadas: a sombra de contato (substitui o mapa de
 * sombras, que cintilava nos tampos) e o brilho do sinal da mesa em três intensidades.
 * O brilho é o estado lido de longe; o alerta é maior e mais forte para não depender só da cor.
 */
export function Manchas({
  itens,
  cenario,
  cores,
  escuro,
  sombras,
  brilho,
  selecionada,
  esmaecidas,
  instantaneo,
}: {
  itens: ItemMancha[];
  cenario: Cenario;
  cores: Cores;
  escuro: boolean;
  sombras: boolean;
  /** Só no destaque "brilho"; a sombra de contato vale para todos. */
  brilho: boolean;
  selecionada: number | null;
  esmaecidas: ReadonlyMap<number, boolean>;
  instantaneo: boolean;
}) {
  const camadas = useMemo(() => {
    const out: Record<Camada, Instancia[]> = { sombra: [], estado: [], alerta: [], critico: [] };
    const preto = new THREE.Color("#000000");

    for (const { mesa, estado, alertas } of itens) {
      const x = mx(mesa.x, cenario);
      const z = mz(mesa.y, cenario);
      const rx = ms(mesa.largura) / 2;
      const rz = ms(mesa.altura) / 2;
      const base = { id: mesa.id, x, z };

      if (sombras) out.sombra.push({ ...base, rx: rx + ALCANCE.sombra, rz: rz + ALCANCE.sombra, cor: preto });
      if (!brilho) continue;

      const foco = selecionada === mesa.id;
      const sinal = corBrilho(estado, alertas[0]?.tipo, escuro) ?? (foco ? { cor: corSelecao(escuro), nivel: "estado" as const } : null);
      if (!sinal) continue;
      // A mesa em foco sobe um degrau de intensidade.
      const nivel: NivelBrilho = foco && sinal.nivel === "estado" ? "alerta" : sinal.nivel;
      const r = ALCANCE[nivel] * (foco ? 1.12 : 1);
      out[nivel].push({ ...base, rx: rx + r, rz: rz + r, cor: new THREE.Color(sinal.cor) });
    }

    return out;
  }, [itens, cenario, escuro, sombras, brilho, selecionada]);

  return (
    <>
      {CAMADAS.map((c) => (
        <CamadaManchas
          key={c}
          camada={c}
          lista={camadas[c]}
          escuro={escuro}
          esmaecidas={esmaecidas}
          piso={cores.piso}
          instantaneo={instantaneo}
        />
      ))}
    </>
  );
}
