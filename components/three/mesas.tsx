"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Mesa } from "@/lib/types";
import type { Destaque } from "@/lib/exibicao";
import { ALTURA_TAMPO, ESPESSURA_TAMPO, ms, mx, mz, type Cenario } from "./cenarios";
import { caixa, cilindro, friso, frisoGrosso, mat, moldura, OCUPADA, type Par } from "./materiais";
import { useEsmaecimento } from "./util";

export const LEVANTE_FOCO = 0.05;

const MATERIAL = mat("#ffffff", 1, 0.85);
const BRANCO = new THREE.Color("#ffffff");
const ALTURA_PE = ALTURA_TAMPO - ESPESSURA_TAMPO;
const TOPO = ALTURA_TAMPO + ESPESSURA_TAMPO / 2;

interface Instancia {
  id: number;
  x: number;
  z: number;
  y: number;
  sx: number;
  sy: number;
  sz: number;
  cor: THREE.Color;
  /** Só o tampo, o bisel e o friso sobem no foco. */
  sobe: boolean;
}

interface Grupo {
  chave: string;
  geometria: THREE.BufferGeometry;
  lista: Instancia[];
}

const pos = new THREE.Vector3();
const esc = new THREE.Vector3();
const quat = new THREE.Quaternion();
const matriz = new THREE.Matrix4();

const compoe = (i: Instancia, dy: number) => matriz.compose(pos.set(i.x, i.y + dy, i.z), quat, esc.set(i.sx, i.sy, i.sz));

function Pecas({
  grupo,
  levantes,
  esmaecidas,
  piso,
  instantaneo,
  registrar,
}: {
  grupo: Grupo;
  levantes: React.RefObject<Map<number, number>>;
  esmaecidas: ReadonlyMap<number, boolean>;
  piso: string;
  instantaneo: boolean;
  registrar: (m: THREE.InstancedMesh | null, lista: Instancia[]) => void;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const { lista, geometria } = grupo;
  const ids = useMemo(() => lista.map((i) => i.id), [lista]);
  const cores = useMemo(() => lista.map((i) => i.cor), [lista]);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    lista.forEach((i, k) => m.setMatrixAt(k, compoe(i, i.sobe ? (levantes.current.get(i.id) ?? 0) : 0)));
    m.instanceMatrix.needsUpdate = true;
    registrar(m, lista);
    invalidate();
    return () => registrar(null, lista);
  }, [lista, levantes, registrar, invalidate]);

  useEsmaecimento(ref, ids, cores, esmaecidas, piso, instantaneo);

  if (lista.length === 0) return null;
  return <instancedMesh key={lista.length} ref={ref} args={[geometria, MATERIAL, lista.length]} frustumCulled={false} raycast={() => null} />;
}

/**
 * Tampos, biséis, pés e frisos de todas as mesas em poucas malhas instanciadas: com 120 mesas,
 * uma malha por peça custava centenas de chamadas de desenho por quadro. O esmaecimento funde a
 * cor ao piso, e o levante do foco escreve só as matrizes da mesa afetada.
 * O destaque "borda" acrescenta um friso colorido na borda do tampo; "tampo" pinta o próprio tampo.
 * No "tampo" todo estado (alerta incluso) pinta o tampo inteiro e o bisel escurece a mesma cor.
 * Nos demais, a mesa ocupada pesa mais que a livre: tampo puxado para a tinta e, na "borda", aro grosso;
 * alerta e conta mantêm a cor própria no aro.
 */
export function Mesas({
  mesas,
  cenario,
  par,
  piso,
  sinais,
  ocupadas,
  escuro,
  destaque,
  selecionada,
  esmaecidas,
  instantaneo,
}: {
  mesas: Mesa[];
  cenario: Cenario;
  par: Par;
  piso: string;
  /** Cor do sinal de cada mesa (alerta vence estado); ausente = mesa neutra. */
  sinais: ReadonlyMap<number, string>;
  /** Mesas em estado "ocupada": ganham o tratamento de peso, com ou sem alerta. */
  ocupadas: ReadonlySet<number>;
  escuro: boolean;
  destaque: Destaque;
  selecionada: number | null;
  esmaecidas: ReadonlyMap<number, boolean>;
  instantaneo: boolean;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const levantes = useRef(new Map<number, number>());
  const malhas = useRef(new Map<Instancia[], THREE.InstancedMesh>());
  const foco = useRef(selecionada);
  foco.current = selecionada;

  const grupos = useMemo(() => {
    const mapa = new Map<string, Grupo>();
    const em = (chave: string, geometria: () => THREE.BufferGeometry) => {
      let g = mapa.get(chave);
      if (!g) mapa.set(chave, (g = { chave, geometria: geometria(), lista: [] }));
      return g.lista;
    };
    const corTampo = new THREE.Color(par.fill);
    const corBisel = new THREE.Color(par.stroke);
    const o = OCUPADA[escuro ? "escuro" : "claro"];
    const tinta = new THREE.Color(o.tinta);
    const tampoOcupado = corTampo.clone().lerp(tinta, 0.25);
    const biselOcupado = corBisel.clone().lerp(tinta, 0.5);

    for (const mesa of mesas) {
      const x = mx(mesa.x, cenario);
      const z = mz(mesa.y, cenario);
      const rx = ms(mesa.largura) / 2;
      const rz = ms(mesa.altura) / 2;
      const base = { id: mesa.id, x, z };
      const sinal = sinais.get(mesa.id);
      const ocupada = ocupadas.has(mesa.id);
      const rim = Math.min(rx, rz);
      const pintado = destaque === "tampo" && sinal !== undefined;
      let tampo = pintado ? new THREE.Color(sinal) : corTampo;
      // Tampo escuro sobre o piso escuro perde o contorno: o bisel dele clareia em vez de escurecer.
      const bisel = pintado ? (tampo.getHSL({ h: 0, s: 0, l: 0 }).l < 0.2 ? tampo.clone().lerp(BRANCO, 0.4) : tampo.clone().multiplyScalar(0.6)) : ocupada ? biselOcupado : corBisel;
      let corFriso: THREE.Color | null = destaque === "borda" && sinal ? new THREE.Color(sinal) : null;
      let grosso = false;

      if (ocupada && !pintado) {
        tampo = tampoOcupado;
        if (destaque === "borda") {
          corFriso = sinal ? new THREE.Color(sinal) : tinta;
          grosso = true;
        }
      }

      em("pe", () => cilindro(0.05, 0.09, ALTURA_PE, 14)).push({ ...base, y: ALTURA_PE / 2, sx: 1, sy: 1, sz: 1, cor: bisel, sobe: false });

      // O bisel fica um fio abaixo do tampo e 1,5 cm para fora, sem face coplanar com ele.
      if (mesa.forma === "redonda") {
        em("biselR", () => cilindro(1, 1, ESPESSURA_TAMPO - 0.004, 40)).push({ ...base, y: ALTURA_TAMPO - 0.002, sx: rx + 0.015, sy: 1, sz: rx + 0.015, cor: bisel, sobe: true });
        em("tampoR", () => cilindro(1, 1, ESPESSURA_TAMPO, 40)).push({ ...base, y: ALTURA_TAMPO, sx: rx, sy: 1, sz: rx, cor: tampo, sobe: true });
        if (corFriso)
          em(grosso ? "frisoGrossoR" : "frisoR", grosso ? frisoGrosso : friso).push({ ...base, y: TOPO + 0.002, sx: rx, sy: rx, sz: rx, cor: corFriso, sobe: true });
      } else {
        em("biselQ", () => caixa(1, ESPESSURA_TAMPO - 0.004, 1)).push({ ...base, y: ALTURA_TAMPO - 0.002, sx: rx * 2 + 0.03, sy: 1, sz: rz * 2 + 0.03, cor: bisel, sobe: true });
        em("tampoQ", () => caixa(1, ESPESSURA_TAMPO, 1)).push({ ...base, y: ALTURA_TAMPO, sx: rx * 2, sy: 1, sz: rz * 2, cor: tampo, sobe: true });
        // A moldura reta não escala sem deformar a espessura: uma geometria por tamanho de mesa.
        if (corFriso) {
          const e = grosso ? Math.max(0.12, rim * 0.24) : undefined;
          em(`frisoQ${rx},${rz},${e}`, () => moldura(rx * 2, rz * 2, e)).push({ ...base, y: TOPO + 0.001, sx: 1, sy: 1, sz: 1, cor: corFriso, sobe: true });
        }
      }
    }

    return [...mapa.values()];
  }, [mesas, cenario, par, sinais, ocupadas, escuro, destaque]);

  const registrar = useMemo(
    () => (m: THREE.InstancedMesh | null, lista: Instancia[]) => {
      if (m) malhas.current.set(lista, m);
      else malhas.current.delete(lista);
    },
    [],
  );

  // Onde cada mesa aparece nas listas que sobem, para escrever só as matrizes dela.
  const indices = useMemo(() => {
    const out = new Map<number, { lista: Instancia[]; k: number }[]>();
    for (const { lista } of grupos) {
      lista.forEach((i, k) => {
        if (!i.sobe) return;
        const l = out.get(i.id) ?? [];
        l.push({ lista, k });
        out.set(i.id, l);
      });
    }
    return out;
  }, [grupos]);

  useLayoutEffect(() => {
    invalidate();
  }, [selecionada, esmaecidas, invalidate]);

  useFrame((_, delta) => {
    const ativos = new Set<number>(levantes.current.keys());
    if (foco.current !== null) ativos.add(foco.current);
    let movendo = false;

    for (const id of ativos) {
      const y = levantes.current.get(id) ?? 0;
      const alvo = id === foco.current ? LEVANTE_FOCO : 0;
      if (y === alvo) {
        if (alvo === 0) levantes.current.delete(id);
        continue;
      }
      const novo = instantaneo || Math.abs(y - alvo) < 0.0004 ? alvo : THREE.MathUtils.damp(y, alvo, 14, delta);
      levantes.current.set(id, novo);
      movendo = true;

      for (const { lista, k } of indices.get(id) ?? []) {
        const m = malhas.current.get(lista);
        if (!m) continue;
        m.setMatrixAt(k, compoe(lista[k], novo));
        m.instanceMatrix.needsUpdate = true;
      }
    }

    if (movendo) invalidate();
  });

  return (
    <>
      {grupos.map((g) => (
        <Pecas key={g.chave} grupo={g} levantes={levantes} esmaecidas={esmaecidas} piso={piso} instantaneo={instantaneo} registrar={registrar} />
      ))}
    </>
  );
}
