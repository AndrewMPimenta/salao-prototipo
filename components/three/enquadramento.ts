import * as THREE from "three";

export interface Folga {
  topo: number;
  base: number;
  esquerda: number;
  direita: number;
}

export interface Viewport {
  w: number;
  h: number;
  fov: number;
}

/** Fração da região livre que a caixa ocupa no eixo limitante. */
const PREENCHIMENTO = 0.9;

function eixos(az: number, pol: number) {
  const back = new THREE.Vector3(
    Math.sin(pol) * Math.sin(az),
    Math.cos(pol),
    Math.sin(pol) * Math.cos(az),
  );
  const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));
  const up = new THREE.Vector3().crossVectors(back, right);
  return { back, right, up };
}

/*
  A interface flutuante cobre parte do canvas. A região LIVRE, em NDC, é onde
  a cena deve ficar centrada; o centro do canvas não importa.
*/
export function regiaoLivre(f: Folga, vp: Viewport) {
  const l = Math.min(f.esquerda, vp.w * 0.35);
  const r = Math.min(f.direita, vp.w * 0.35);
  const t = Math.min(f.topo, vp.h * 0.35);
  const b = Math.min(f.base, vp.h * 0.55);
  return {
    esq: -1 + (2 * l) / vp.w,
    dir: 1 - (2 * r) / vp.w,
    baixo: -1 + (2 * b) / vp.h,
    cima: 1 - (2 * t) / vp.h,
  };
}

/**
 * Translação da câmera (no plano dela) que leva o ponto ao centro da região livre, ou ao
 * destino em NDC quando dado, sem mexer em distância nem rotação.
 */
export function transladarParaPonto(
  ponto: THREE.Vector3,
  pos: THREE.Vector3,
  az: number,
  pol: number,
  folga: Folga,
  vp: Viewport,
  destino?: { x: number; y: number },
) {
  const { back, right, up } = eixos(az, pol);
  const ty = Math.tan(THREE.MathUtils.degToRad(vp.fov) / 2);
  const tx = ty * (vp.w / vp.h);
  const r = regiaoLivre(folga, vp);

  const rel = ponto.clone().sub(pos);
  const prof = Math.max(0.1, -rel.dot(back));
  const alvo = destino ?? { x: (r.esq + r.dir) / 2, y: (r.baixo + r.cima) / 2 };
  const dx = rel.dot(right) - alvo.x * tx * prof;
  const dy = rel.dot(up) - alvo.y * ty * prof;

  return right.multiplyScalar(dx).addScaledVector(up, dy);
}

/**
 * Pose em que a caixa ocupa PREENCHIMENTO da região livre no eixo limitante,
 * centrada nela. Em perspectiva a borda próxima aparece maior que a distante,
 * então o centro é refinado por iteração e a distância por bisseção (o
 * preenchimento só diminui conforme a câmera se afasta).
 */
export function enquadrarCaixa(caixa: THREE.Box3, az: number, pol: number, folga: Folga, vp: Viewport) {
  const { back, right, up } = eixos(az, pol);
  const ty = Math.tan(THREE.MathUtils.degToRad(vp.fov) / 2);
  const tx = ty * (vp.w / vp.h);
  const r = regiaoLivre(folga, vp);
  const cx = (r.esq + r.dir) / 2;
  const cy = (r.baixo + r.cima) / 2;
  const livreW = r.dir - r.esq;
  const livreH = r.cima - r.baixo;

  const centro = caixa.getCenter(new THREE.Vector3());
  const cantos: { x: number; y: number; z: number }[] = [];
  for (const x of [caixa.min.x, caixa.max.x])
    for (const y of [caixa.min.y, caixa.max.y])
      for (const z of [caixa.min.z, caixa.max.z]) {
        const rel = new THREE.Vector3(x, y, z).sub(centro);
        cantos.push({ x: rel.dot(right), y: rel.dot(up), z: rel.dot(back) });
      }

  // Para uma distância D da câmera ao centro, acha o deslocamento lateral (u, v) que centra a projeção.
  const resolve = (D: number) => {
    let u = 0;
    let v = 0;
    let fx = 0;
    let fy = 0;
    for (let k = 0; k < 12; k++) {
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      for (const c of cantos) {
        const prof = D - c.z;
        const nx = (c.x - u) / (prof * tx);
        const ny = (c.y - v) / (prof * ty);
        x0 = Math.min(x0, nx);
        x1 = Math.max(x1, nx);
        y0 = Math.min(y0, ny);
        y1 = Math.max(y1, ny);
      }
      fx = (x1 - x0) / livreW;
      fy = (y1 - y0) / livreH;
      u += ((x0 + x1) / 2 - cx) * tx * D;
      v += ((y0 + y1) / 2 - cy) * ty * D;
    }
    return { u, v, fill: Math.max(fx, fy) };
  };

  let lo = Math.max(...cantos.map((c) => c.z)) + 0.5;
  let hi = Math.hypot(caixa.max.x - caixa.min.x, caixa.max.z - caixa.min.z) * 12;
  for (let i = 0; i < 40; i++) {
    const meio = (lo + hi) / 2;
    if (resolve(meio).fill > PREENCHIMENTO) lo = meio;
    else hi = meio;
  }

  const D = hi;
  const { u, v } = resolve(D);
  const pos = centro.clone().addScaledVector(right, u).addScaledVector(up, v).addScaledVector(back, D);

  // Qualquer ponto do raio central dá a mesma imagem; o do piso mantém o pan "no chão" e dentro do limite.
  const plano = 0.3;
  const t = pos.y > plano + 1 ? (pos.y - plano) / back.y : D;
  const alvo = pos.clone().addScaledVector(back, -t);

  return { pos, alvo, d: t };
}
