"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Alerta, EstadoMesa, Mesa } from "@/lib/types";
import { ms, mx, mz, type Cenario } from "./cenarios";
import { caixa, capsula, cilindro, esfera, mat, type Cores } from "./materiais";

export interface ItemAssento {
  mesa: Mesa;
  estado: EstadoMesa;
  alertas: Alerta[];
  esmaecida: boolean;
}

interface Parte {
  geo: THREE.BufferGeometry;
  matrizes: THREE.Matrix4[];
  cores: THREE.Color[];
}

const MATERIAL = mat("#ffffff");
const FOLGA_CADEIRA = 0.36;
const MUDO_OCUPADA = 0.28;
const MUDO_FILTRO = 0.78;

/** Posição de cada cadeira da mesa no mundo; o encosto (+z local) aponta para fora da mesa. */
function cadeirasDa(mesa: Mesa, c: Cenario) {
  const raioX = ms(mesa.largura) / 2;
  const raioZ = ms(mesa.altura) / 2;
  const redonda = mesa.forma === "redonda";
  const out: { x: number; z: number; rot: number; ocupada: boolean }[] = [];

  for (let i = 0; i < mesa.lugares; i++) {
    let cx: number;
    let cz: number;

    if (redonda) {
      const a = (i / mesa.lugares) * Math.PI * 2 - Math.PI / 2;
      cx = Math.cos(a) * (raioX + FOLGA_CADEIRA);
      cz = Math.sin(a) * (raioZ + FOLGA_CADEIRA);
    } else {
      const porLado = Math.ceil(mesa.lugares / 2);
      const lado = i < porLado ? -1 : 1;
      const idx = i < porLado ? i : i - porLado;
      const n = i < porLado ? porLado : mesa.lugares - porLado;
      const f = (idx + 1) / (n + 1) - 0.5;

      if (raioZ > raioX) {
        cx = lado * (raioX + FOLGA_CADEIRA);
        cz = f * raioZ * 2;
      } else {
        cx = f * raioX * 2;
        cz = lado * (raioZ + FOLGA_CADEIRA);
      }
    }

    out.push({ x: mx(mesa.x, c) + cx, z: mz(mesa.y, c) + cz, rot: Math.atan2(cx, cz), ocupada: i < mesa.pessoas });
  }

  return out;
}

const eixoX = new THREE.Vector3(1, 0, 0);
const um = new THREE.Vector3(1, 1, 1);

function local(x: number, y: number, z: number, rotX = 0) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromAxisAngle(eixoX, rotX),
    um,
  );
}

/** Peças da cadeira e da figura sentada, no referencial da cadeira (frente = -z). */
const PECAS_CADEIRA = [
  { geo: () => caixa(0.42, 0.055, 0.42), m: local(0, 0.44, 0) },
  { geo: () => caixa(0.42, 0.44, 0.05), m: local(0, 0.68, 0.185) },
  { geo: () => cilindro(0.03, 0.04, 0.42, 8), m: local(0, 0.21, 0) },
];

const PECAS_FIGURA = [
  { geo: () => capsula(0.12, 0.28), m: local(0, 0.8, -0.05, -0.2) },
  { geo: () => esfera(0.095, 12), m: local(0, 1.2, -0.12) },
  { geo: () => capsula(0.065, 0.2), m: local(-0.09, 0.54, -0.14, Math.PI / 2) },
  { geo: () => capsula(0.065, 0.2), m: local(0.09, 0.54, -0.14, Math.PI / 2) },
];

function Instancias({ parte }: { parte: Parte }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    parte.matrizes.forEach((x, i) => {
      m.setMatrixAt(i, x);
      m.setColorAt(i, parte.cores[i]);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    invalidate();
  }, [parte, invalidate]);

  if (parte.matrizes.length === 0) return null;
  return <instancedMesh key={parte.matrizes.length} ref={ref} args={[parte.geo, MATERIAL, parte.matrizes.length]} frustumCulled={false} />;
}

/**
 * Cadeiras e figuras de TODAS as mesas em poucas malhas instanciadas: sem
 * `<mesh>` por cadeira, o custo de desenho não cresce com o número de mesas.
 * Não projetam nem recebem sombra; a cor por instância faz o esmaecimento do
 * filtro, já que um material compartilhado não varia a opacidade por peça.
 */
export function Assentos({ itens, cenario, cores, pessoas }: { itens: ItemAssento[]; cenario: Cenario; cores: Cores; pessoas: boolean }) {
  const partes = useMemo(() => {
    const piso = new THREE.Color(cores.piso);
    const cadeira = new THREE.Color(cores.cadeira);
    const figura = new THREE.Color(cores.figura);

    const cad: Parte[] = PECAS_CADEIRA.map((p) => ({ geo: p.geo(), matrizes: [], cores: [] }));
    const fig: Parte[] = PECAS_FIGURA.map((p) => ({ geo: p.geo(), matrizes: [], cores: [] }));

    for (const { mesa, estado, esmaecida } of itens) {
      // Ocupadas recuam; livres mantêm o tom cheio para a vaga se destacar.
      const mudo = esmaecida ? MUDO_FILTRO : estado === "ocupada" ? MUDO_OCUPADA : 0;
      const corCadeira = cadeira.clone().lerp(piso, mudo);
      const corFigura = figura.clone().lerp(piso, mudo);

      for (const c of cadeirasDa(mesa, cenario)) {
        const base = new THREE.Matrix4().makeRotationY(c.rot).setPosition(c.x, 0, c.z);
        PECAS_CADEIRA.forEach((p, k) => {
          cad[k].matrizes.push(base.clone().multiply(p.m));
          cad[k].cores.push(corCadeira);
        });
        if (!pessoas || !c.ocupada) continue;
        PECAS_FIGURA.forEach((p, k) => {
          fig[k].matrizes.push(base.clone().multiply(p.m));
          fig[k].cores.push(corFigura);
        });
      }
    }

    return [...cad, ...fig];
  }, [itens, cenario, cores, pessoas]);

  return (
    <>
      {partes.map((p, i) => (
        <Instancias key={i} parte={p} />
      ))}
    </>
  );
}
