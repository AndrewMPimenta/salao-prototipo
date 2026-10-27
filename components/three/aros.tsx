"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { EstadoMesa, Mesa } from "@/lib/types";
import type { ArmazemHover } from "@/hooks/use-hover-mesa";
import { ALTURA_TAMPO, ESPESSURA_TAMPO, ms, mx, mz, type Cenario } from "./cenarios";
import { aroCircular, corAro, matBasico, TIPO_ARO, type Cores, type TipoAro } from "./materiais";

export const LEVANTE_HOVER = 0.03;
const TIPOS: TipoAro[] = ["solido", "tracejado", "fino"];
const MATERIAL = matBasico("#ffffff");
const MUDO_FILTRO = 0.8;
// Meio afundado no tampo: o tubo aparece como um friso baixo, sem virar degrau.
const Y_BASE = ALTURA_TAMPO + ESPESSURA_TAMPO / 2 - 0.016;

interface ItemAro {
  mesa: Mesa;
  estado: EstadoMesa;
  esmaecida: boolean;
}

interface Aro {
  id: number;
  x: number;
  z: number;
  raio: number;
  estado: EstadoMesa;
  esmaecida: boolean;
}

const um = new THREE.Vector3();
const escala = new THREE.Vector3();
const quat = new THREE.Quaternion();
const matriz = new THREE.Matrix4();

/**
 * Aros das mesas redondas em três malhas instanciadas (sólido, tracejado, fio), uma
 * por tipo: o custo de desenho não cresce com o número de mesas. Cor e levante do
 * hover são escritos só na instância afetada, sem re-renderizar a lista.
 */
export function Aros({
  itens,
  cenario,
  cores,
  escuro,
  hover,
}: {
  itens: ItemAro[];
  cenario: Cenario;
  cores: Cores;
  escuro: boolean;
  hover: ArmazemHover;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const refs = useRef<Partial<Record<TipoAro, THREE.InstancedMesh | null>>>({});
  const levantes = useRef(new Map<number, number>());

  const { grupos, posicao } = useMemo(() => {
    const grupos: Record<TipoAro, Aro[]> = { solido: [], tracejado: [], fino: [] };
    const posicao = new Map<number, { tipo: TipoAro; idx: number }>();

    for (const { mesa, estado, esmaecida } of itens) {
      if (mesa.forma !== "redonda") continue;
      const tipo = TIPO_ARO[estado];
      posicao.set(mesa.id, { tipo, idx: grupos[tipo].length });
      grupos[tipo].push({ id: mesa.id, x: mx(mesa.x, cenario), z: mz(mesa.y, cenario), raio: ms(mesa.largura) / 2 - 0.03, estado, esmaecida });
    }

    return { grupos, posicao };
  }, [itens, cenario]);

  const cor = (a: Aro, realce: boolean) => {
    const c = new THREE.Color(corAro(a.estado, escuro, realce && !a.esmaecida));
    return a.esmaecida ? c.lerp(new THREE.Color(cores.piso), MUDO_FILTRO) : c;
  };

  const escreve = (a: Aro, tipo: TipoAro, idx: number, levante: number) => {
    const m = refs.current[tipo];
    if (!m) return;
    matriz.compose(um.set(a.x, Y_BASE + levante, a.z), quat, escala.setScalar(a.raio));
    m.setMatrixAt(idx, matriz);
    m.instanceMatrix.needsUpdate = true;
  };

  const aplicaCor = (id: number | null, realce: boolean) => {
    const p = id === null ? undefined : posicao.get(id);
    if (!p) return;
    const m = refs.current[p.tipo];
    if (!m) return;
    m.setColorAt(p.idx, cor(grupos[p.tipo][p.idx], realce));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  };

  useLayoutEffect(() => {
    const atual = hover.ler();
    for (const tipo of TIPOS) {
      const m = refs.current[tipo];
      if (!m) continue;
      grupos[tipo].forEach((a, i) => {
        escreve(a, tipo, i, atual === a.id && !a.esmaecida ? LEVANTE_HOVER : 0);
        m.setColorAt(i, cor(a, atual === a.id));
      });
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    levantes.current.clear();
    invalidate();
    // As funções acima só dependem de grupos, escuro e cores, que já estão na lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupos, escuro, cores, hover, invalidate]);

  // Hover: troca a cor e põe a mesa na fila do levante, que o useFrame anima junto com o tampo.
  useLayoutEffect(() => {
    let anterior = hover.ler();
    return hover.assinar(() => {
      const novo = hover.ler();
      aplicaCor(anterior, false);
      aplicaCor(novo, true);
      for (const id of [anterior, novo]) if (id !== null && posicao.has(id)) levantes.current.set(id, levantes.current.get(id) ?? 0);
      anterior = novo;
      invalidate();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, posicao, grupos, escuro, cores, invalidate]);

  useFrame(({ invalidate: pedir }, delta) => {
    if (levantes.current.size === 0) return;
    const atual = hover.ler();
    let movendo = false;

    for (const [id, y] of levantes.current) {
      const p = posicao.get(id)!;
      const a = grupos[p.tipo][p.idx];
      const alvo = atual === id && !a.esmaecida ? LEVANTE_HOVER : 0;
      const novo = Math.abs(y - alvo) < 0.0004 ? alvo : THREE.MathUtils.damp(y, alvo, 14, delta);

      escreve(a, p.tipo, p.idx, novo);
      if (novo === alvo && alvo === 0) levantes.current.delete(id);
      else {
        levantes.current.set(id, novo);
        if (novo !== alvo) movendo = true;
      }
    }

    if (movendo) pedir();
  });

  return (
    <>
      {TIPOS.map((tipo) =>
        grupos[tipo].length === 0 ? null : (
          <instancedMesh
            key={`${tipo}${grupos[tipo].length}`}
            ref={(m) => {
              refs.current[tipo] = m;
            }}
            args={[aroCircular(tipo), MATERIAL, grupos[tipo].length]}
            frustumCulled={false}
          />
        ),
      )}
    </>
  );
}
