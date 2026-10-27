import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export function useReduzMovimento(): boolean {
  const [reduz, setReduz] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduz(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduz;
}

/** Quanto uma peça fora de foco se funde ao piso: ~22% da presença original. */
export const MUDO_FOCO = 0.78;

/**
 * Esmaecimento por instância, da cor base até o piso, amortecido em ~200 ms. O fator de cada
 * mesa sobrevive à troca da lista, então focar outra mesa anima em vez de saltar; só pede
 * quadro enquanto algum fator anda (frameloop sob demanda).
 */
export function useEsmaecimento(
  ref: React.RefObject<THREE.InstancedMesh | null>,
  ids: number[],
  bases: THREE.Color[],
  esmaecidas: ReadonlyMap<number, boolean>,
  piso: string,
  instantaneo: boolean,
  /** Fusão extra de todas as instâncias com o piso (LOD de distância); em 1 a malha some. */
  lod?: React.RefObject<number>,
) {
  const invalidate = useThree((s) => s.invalidate);
  const fatores = useRef(new Map<number, number>());
  const tmp = useMemo(() => new THREE.Color(), []);
  const corPiso = useMemo(() => new THREE.Color(piso), [piso]);
  const lodEscrito = useRef(-1);

  const escreve = () => {
    const m = ref.current;
    if (!m) return;
    const l = lod?.current ?? 0;
    lodEscrito.current = l;
    m.visible = l < 0.999;
    for (let i = 0; i < ids.length; i++) m.setColorAt(i, tmp.copy(bases[i]).lerp(corPiso, Math.max((fatores.current.get(ids[i]) ?? 0) * MUDO_FOCO, l)));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  };

  useLayoutEffect(() => {
    for (const id of ids) if (!fatores.current.has(id)) fatores.current.set(id, esmaecidas.get(id) ? 1 : 0);
    escreve();
    invalidate();
    // escreve só lê o que já está na lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, bases, esmaecidas, corPiso, invalidate]);

  useFrame((_, delta) => {
    let mudou = (lod?.current ?? 0) !== lodEscrito.current;
    for (const [id, f] of fatores.current) {
      const alvo = esmaecidas.get(id) ? 1 : 0;
      if (f === alvo) continue;
      fatores.current.set(id, instantaneo || Math.abs(f - alvo) < 0.01 ? alvo : THREE.MathUtils.damp(f, alvo, 16, delta));
      mudou = true;
    }
    if (!mudou) return;
    escreve();
    invalidate();
  });
}
