import * as THREE from "three";
import { EV_CAMPO_L, EV_CAMPO_P } from "@/lib/data";

/*
  Cada ambiente tem sua própria caixa e seu próprio cenário: o salão é uma
  sala fechada com palco e bar; a varanda é um deck aberto; o mezanino é um
  piso elevado com vista para o salão. A sala é maior que o campo de mesas,
  e a sobra é onde cabem palco, bar, sofás e escada.
*/
export interface Cenario {
  salaL: number;
  salaP: number;
  campoL: number;
  campoP: number;
  campoZ0: number;
}

export const CENARIOS: Record<string, Cenario> = {
  principal: { salaL: 28, salaP: 22, campoL: 22, campoP: 15, campoZ0: -4.6 },
  varanda: { salaL: 19, salaP: 13, campoL: 15, campoP: 7.4, campoZ0: -1.9 },
  mezanino: { salaL: 20, salaP: 12.5, campoL: 15.5, campoP: 8.2, campoZ0: -2.4 },
  // Campo gerado em lib/data.ts (grade de banquete); a sobra ao norte é palco e pista, a oeste o buffet.
  eventos: { salaL: 58, salaP: 48, campoL: EV_CAMPO_L, campoP: EV_CAMPO_P, campoZ0: -13.5 },
};

export const obterCenario = (id: string) => CENARIOS[id] ?? CENARIOS.principal;

export const ALTURA_TAMPO = 0.74;
export const ESPESSURA_TAMPO = 0.07;
/** Altura da âncora do rótulo: bem acima do tampo, para a mesa continuar visível embaixo. */
export const ALTURA_ROTULO_3D = 1.45;

/*
  `x` e `y` da mesa são porcentagens do ambiente; `largura` e `altura` estão
  em unidades de planta (a planta 2D tem cerca de 1000 de largura). Tratar os
  quatro como porcentagem punha uma mesa de 9 metros numa sala de 13.
*/
const ESCALA_MESA = 0.013;
export const ms = (v: number) => v * ESCALA_MESA;
export const mx = (x: number, c: Cenario) => -c.campoL / 2 + (x / 100) * c.campoL;
export const mz = (y: number, c: Cenario) => c.campoZ0 + (y / 100) * c.campoP;

/** Caixa da sala incluindo a laje e as paredes baixas, para enquadrar e limitar o pan. */
export function caixaDaSala(c: Cenario, margem = 0) {
  return new THREE.Box3(
    new THREE.Vector3(-c.salaL / 2 - margem, -0.1, -c.salaP / 2 - margem),
    new THREE.Vector3(c.salaL / 2 + margem, 1.1, c.salaP / 2 + margem),
  );
}
