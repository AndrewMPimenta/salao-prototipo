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
  A interface flutuante cobre parte do canvas. Em vez de padding em unidades
  de mundo (que depende da distância), desloca-se o alvo para que o ponto
  apareça no centro da região LIVRE, o que é linear na distância.
*/
function regiaoLivre(f: Folga, vp: Viewport) {
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

export function poseParaPonto(
  centro: THREE.Vector3,
  az: number,
  pol: number,
  dist: number,
  folga: Folga,
  vp: Viewport,
) {
  const { back, right, up } = eixos(az, pol);
  const tan = Math.tan(THREE.MathUtils.degToRad(vp.fov) / 2);
  const aspecto = vp.w / vp.h;
  const r = regiaoLivre(folga, vp);
  const cx = (r.esq + r.dir) / 2;
  const cy = (r.baixo + r.cima) / 2;

  const alvo = centro
    .clone()
    .addScaledVector(right, -cx * aspecto * tan * dist)
    .addScaledVector(up, -cy * tan * dist);
  const pos = alvo.clone().addScaledVector(back, dist);

  return { pos, alvo };
}

/*
  O centro da caixa não é o centro do que se vê: em perspectiva a borda
  próxima aparece maior que a distante. Por isso o alvo é refinado até o
  retângulo projetado dos cantos ficar centrado na região livre.
*/
function projetar(
  cantos: THREE.Vector3[],
  centro: THREE.Vector3,
  az: number,
  pol: number,
  d: number,
  folga: Folga,
  vp: Viewport,
) {
  const { back, right, up } = eixos(az, pol);
  const tan = Math.tan(THREE.MathUtils.degToRad(vp.fov) / 2);
  const aspecto = vp.w / vp.h;
  const r = regiaoLivre(folga, vp);
  const cx = (r.esq + r.dir) / 2;
  const cy = (r.baixo + r.cima) / 2;

  let { alvo, pos } = poseParaPonto(centro, az, pol, d, folga, vp);
  let larg = Infinity;
  let alt = Infinity;

  for (let k = 0; k < 6; k++) {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const c of cantos) {
      const rel = c.clone().sub(pos);
      const prof = -rel.dot(back);
      if (prof < 0.1) return { pos, alvo, larg: Infinity, alt: Infinity, r };
      const nx = rel.dot(right) / (prof * tan * aspecto);
      const ny = rel.dot(up) / (prof * tan);
      x0 = Math.min(x0, nx);
      x1 = Math.max(x1, nx);
      y0 = Math.min(y0, ny);
      y1 = Math.max(y1, ny);
    }
    larg = x1 - x0;
    alt = y1 - y0;
    const ex = (x0 + x1) / 2 - cx;
    const ey = (y0 + y1) / 2 - cy;
    alvo = alvo.clone().addScaledVector(right, ex * aspecto * tan * d).addScaledVector(up, ey * tan * d);
    pos = alvo.clone().addScaledVector(back, d);
  }

  return { pos, alvo, larg, alt, r };
}

/** Menor distância em que a caixa inteira cabe, com 6% de folga, na região livre; a busca binária vale porque o ajuste é monotônico. */
export function enquadrarCaixa(
  caixa: THREE.Box3,
  az: number,
  pol: number,
  folga: Folga,
  vp: Viewport,
  min: number,
  max: number,
) {
  const centro = caixa.getCenter(new THREE.Vector3());
  const cantos: THREE.Vector3[] = [];
  for (const x of [caixa.min.x, caixa.max.x])
    for (const y of [caixa.min.y, caixa.max.y])
      for (const z of [caixa.min.z, caixa.max.z]) cantos.push(new THREE.Vector3(x, y, z));

  const tenta = (d: number) => {
    const p = projetar(cantos, centro, az, pol, d, folga, vp);
    const ok = p.larg <= (p.r.dir - p.r.esq) * 0.88 && p.alt <= (p.r.cima - p.r.baixo) * 0.88;
    return { ...p, d, ok };
  };

  let lo = min;
  let hi = max;
  if (!tenta(hi).ok) return tenta(hi);
  for (let i = 0; i < 26; i++) {
    const meio = (lo + hi) / 2;
    if (tenta(meio).ok) hi = meio;
    else lo = meio;
  }
  return tenta(hi);
}
