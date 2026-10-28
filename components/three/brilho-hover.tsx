"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Mesa } from "@/lib/types";
import type { ArmazemHover } from "@/hooks/use-hover-mesa";
import { ALTURA_TAMPO, ESPESSURA_TAMPO, ms, mx, mz, type Cenario } from "./cenarios";
import { discoPiso, moldura, quadPiso, texturaBrilhoHover } from "./materiais";

const TOPO = ALTURA_TAMPO + ESPESSURA_TAMPO / 2;
// Duas vagas: a mesa que entra e a que ainda está saindo, para trocar de mesa sem salto.
const VAGAS = 2;
// ~120 ms até assentar, sem ultrapassar.
const LAMBDA = 32;

const aros = new Map<string, THREE.BufferGeometry>();
const arosRedondos = new Map<number, THREE.BufferGeometry>();

/** Aro fino do tampo redondo, raio 1: tubo de `esp` do raio. */
function aroRedondo(esp: number) {
  let g = arosRedondos.get(esp);
  if (!g) arosRedondos.set(esp, (g = new THREE.TorusGeometry(1 - esp, esp, 6, 72).rotateX(Math.PI / 2)));
  return g;
}

function aroRetangular(l: number, p: number, e: number) {
  const chave = `${l},${p},${e}`;
  let g = aros.get(chave);
  if (!g) aros.set(chave, (g = moldura(l, p, e)));
  return g;
}

interface Vaga {
  id: number | null;
  nivel: number;
  grupo: THREE.Group;
  halo: THREE.Mesh;
  brilho: THREE.Mesh;
  pelicula: THREE.Mesh;
  aro: THREE.Mesh;
}

function criarVaga(materiais: Record<"halo" | "brilho" | "pelicula" | "aro", THREE.Material>): Vaga {
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, ordem: number) => {
    const o = new THREE.Mesh(g, m);
    o.renderOrder = ordem;
    o.frustumCulled = false;
    o.raycast = () => null;
    return o;
  };
  const grupo = new THREE.Group();
  const halo = mesh(quadPiso(), materiais.halo, 6);
  const brilho = mesh(quadPiso(), materiais.brilho, 7);
  const pelicula = mesh(discoPiso(), materiais.pelicula, 8);
  const aro = mesh(discoPiso(), materiais.aro, 9);
  grupo.add(halo, brilho, pelicula, aro);
  grupo.visible = false;
  return { id: null, nivel: 0, grupo, halo, brilho, pelicula, aro };
}

/**
 * Brilho da mesa sob o ponteiro (cena, planta ou lista): mancha no piso, aro na borda
 * do tampo e tampo ~12% mais claro, tudo na cor do tampo da mesa. Sobre o carvalho claro do tema escuro a mancha some, então ali
 * entra um halo escuro atrás e o aro engrossa. A mesa fixada não brilha (tem o foco); as que recuam
 * em foco ou filtro brilham pela metade. Sob demanda: só pede quadro enquanto o brilho anda.
 */
export function BrilhoHover({
  mesas,
  cores,
  cenario,
  escuro,
  hover,
  selecionada,
  esmaecidas,
  instantaneo,
}: {
  mesas: Mesa[];
  /** Cor do hover de cada mesa (a do tampo dela). */
  cores: ReadonlyMap<number, string>;
  cenario: Cenario;
  escuro: boolean;
  hover: ArmazemHover;
  selecionada: number | null;
  esmaecidas: ReadonlyMap<number, boolean>;
  instantaneo: boolean;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const dados = useRef({ mesas, cores, cenario, escuro, selecionada, esmaecidas });
  dados.current = { mesas, cores, cenario, escuro, selecionada, esmaecidas };

  const textura = useMemo(() => texturaBrilhoHover(), []);
  const vagas = useMemo(() => {
    const base = { transparent: true, depthWrite: false, toneMapped: false, opacity: 0 } as const;
    const decalque = (ordem: number) => ({ polygonOffset: true, polygonOffsetFactor: -2 - ordem, polygonOffsetUnits: -8 - ordem * 2 });
    return Array.from({ length: VAGAS }, () =>
      criarVaga({
        halo: new THREE.MeshBasicMaterial({ ...base, ...decalque(6), map: textura, color: "#2a1706" }),
        brilho: new THREE.MeshBasicMaterial({ ...base, ...decalque(7), map: textura, color: "#fff1b8" }),
        pelicula: new THREE.MeshBasicMaterial({ ...base, color: "#ffffff" }),
        aro: new THREE.MeshBasicMaterial({ ...base, color: "#ffffff" }),
      }),
    );
  }, [textura]);

  useLayoutEffect(
    () => () =>
      vagas.forEach((v) => [v.halo, v.brilho, v.pelicula, v.aro].forEach((m) => (m.material as THREE.Material).dispose())),
    [vagas],
  );

  useLayoutEffect(() => hover.assinar(invalidate), [hover, invalidate]);
  useLayoutEffect(() => {
    invalidate();
  }, [selecionada, escuro, esmaecidas, invalidate]);

  const posiciona = (v: Vaga, id: number) => {
    const { mesas: lista, cenario: c, escuro: noEscuro } = dados.current;
    const mesa = lista.find((m) => m.id === id);
    if (!mesa) return false;

    const rx = ms(mesa.largura) / 2;
    const rz = ms(mesa.altura) / 2;
    const redonda = mesa.forma === "redonda";
    v.grupo.position.set(mx(mesa.x, c), 0, mz(mesa.y, c));

    // O brilho vai a 2x o tampo (o miolo da textura fica sob ele); o halo escuro, mais longe, só tem vez onde o piso é claro.
    v.brilho.position.y = 0.02;
    v.brilho.scale.set(rx * 2 + 0.2, 1, rz * 2 + 0.2);
    v.halo.position.y = 0.019;
    v.halo.scale.set(rx * 2.6 + 0.35, 1, rz * 2.6 + 0.35);

    v.pelicula.position.y = TOPO + 0.004;
    v.pelicula.geometry = redonda ? discoPiso() : quadPiso();
    v.pelicula.scale.set(rx, 1, rz);

    const fino = Math.min(rx, rz) * (noEscuro ? 0.07 : 0.035);
    v.aro.position.y = TOPO + 0.03;
    if (redonda) {
      v.aro.geometry = aroRedondo(noEscuro ? 0.07 : 0.035);
      v.aro.scale.set(rx, rx, rx);
    } else {
      v.aro.geometry = aroRetangular(rx * 2, rz * 2, Math.max(0.02, fino));
      v.aro.scale.set(1, 1, 1);
    }
    return true;
  };

  useFrame((_, delta) => {
    const { selecionada: fixa, esmaecidas: fracas, escuro: noEscuro, cores: porMesa } = dados.current;
    const alvoId = hover.ler() === fixa ? null : hover.ler();

    if (alvoId !== null && !vagas.some((v) => v.id === alvoId)) {
      const livre = vagas.find((v) => v.id === null) ?? vagas.reduce((a, b) => (a.nivel <= b.nivel ? a : b));
      if (posiciona(livre, alvoId)) {
        livre.id = alvoId;
        livre.nivel = 0;
      }
    }

    let andando = false;
    for (const v of vagas) {
      if (v.id === null) continue;
      // A mesa que passou a ser a fixada some na hora para não brigar com o foco.
      const alvo = v.id === alvoId && v.id !== fixa ? (fracas.get(v.id) ? 0.5 : 1) : 0;
      v.nivel = instantaneo || Math.abs(v.nivel - alvo) < 0.004 ? alvo : THREE.MathUtils.damp(v.nivel, alvo, LAMBDA, Math.min(delta, 0.05));
      if (v.nivel !== alvo) andando = true;

      if (alvo === 0 && v.nivel === 0) {
        v.id = null;
        v.grupo.visible = false;
        continue;
      }

      const n = v.nivel;
      v.grupo.visible = true;
      (v.halo.material as THREE.MeshBasicMaterial).opacity = noEscuro ? 0.5 * n : 0;
      (v.brilho.material as THREE.MeshBasicMaterial).opacity = (noEscuro ? 1 : 0.95) * n;
      const cor = porMesa.get(v.id) ?? "#fff1b8";
      (v.brilho.material as THREE.MeshBasicMaterial).color.set(cor);
      (v.pelicula.material as THREE.MeshBasicMaterial).color.set(cor);
      (v.aro.material as THREE.MeshBasicMaterial).color.set(cor);
      (v.pelicula.material as THREE.MeshBasicMaterial).opacity = 0.12 * n;
      (v.aro.material as THREE.MeshBasicMaterial).opacity = n;
    }

    if (andando) invalidate();
  });

  return (
    <>
      {vagas.map((v, i) => (
        <primitive key={i} object={v.grupo} />
      ))}
    </>
  );
}
