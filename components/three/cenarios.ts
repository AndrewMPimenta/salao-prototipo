import * as THREE from "three";
import { EV_CAMPO_L, EV_CAMPO_P, HB_CAMPO_L, HB_CAMPO_P, RE_CAMPO_L, RE_CAMPO_P, SU_CAMPO_L, SU_CAMPO_P, TE_CAMPO_L, TE_CAMPO_P } from "@/lib/data";

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
  // Faixa norte de 5,5 m para o bar e a entrada; ao sul, 3,5 m de deck até o vidro.
  terraco: { salaL: 33, salaP: 20.5, campoL: TE_CAMPO_L, campoP: TE_CAMPO_P, campoZ0: -4.75 },
  // Buffet no miolo do campo, piscina a oeste com o bar da piscina e a entrada ao norte.
  hotbeach: { salaL: 47, salaP: 34.5, campoL: HB_CAMPO_L, campoP: HB_CAMPO_P, campoZ0: -9.25 },
  // Saguão de entrada ao sul, bar a leste e a ilha do buffet na faixa central.
  "hotbeach-suites": { salaL: 54, salaP: 40, campoL: SU_CAMPO_L, campoP: SU_CAMPO_P, campoZ0: -16.5 },
  // Piscina a oeste, buffet a leste, entrada ao norte e a faixa de areia ao sul.
  "hotbeach-resort": { salaL: 54, salaP: 31.5, campoL: RE_CAMPO_L, campoP: RE_CAMPO_P, campoZ0: -10.25 },
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

/** Marco do cenário com nome na cena (palco, bar, pista...): âncora no topo do objeto. */
export interface Marco {
  nome: string;
  x: number;
  y: number;
  z: number;
}

/** As posições acompanham os blocos de `ambientes.tsx` e `mezanino.tsx`. */
export function marcosDe(ambienteId: string): Marco[] {
  const c = obterCenario(ambienteId);
  const meiaL = c.salaL / 2;
  const meiaP = c.salaP / 2;

  switch (ambienteId) {
    case "terraco":
      return [
        { nome: "Bar", x: -meiaL + 6, y: 1.2, z: -meiaP + 1.2 },
        { nome: "Entrada", x: meiaL - 3, y: 2.5, z: -meiaP + 0.1 },
        { nome: "Varanda de vidro", x: 0, y: 1.05, z: meiaP },
      ];
    case "hotbeach":
      return [
        { nome: "Buffet", x: 0, y: 1.25, z: 1.25 },
        { nome: "Piscina", x: -meiaL + 3, y: 0.1, z: 2.75 },
        { nome: "Bar da piscina", x: -20.5, y: 3.3, z: -12.4 },
        { nome: "Entrada", x: 0, y: 2.9, z: -meiaP + 0.1 },
      ];
    case "hotbeach-suites":
      return [
        { nome: "Buffet", x: 0.75, y: 1.25, z: -1.5 },
        { nome: "Bar", x: meiaL - 1.6, y: 1.25, z: -1 },
        { nome: "Entrada", x: 0, y: 2.3, z: meiaP - 0.4 },
      ];
    case "hotbeach-resort":
      return [
        { nome: "Piscina", x: -23.55, y: 0.1, z: -0.5 },
        { nome: "Bar da piscina", x: -23.55, y: 3.3, z: -13.2 },
        { nome: "Buffet", x: 23.2, y: 1.25, z: -1 },
        { nome: "Deck", x: 0, y: 0.05, z: 9.3 },
        { nome: "Entrada", x: 4.85, y: 2.9, z: -meiaP + 0.1 },
      ];
    case "eventos":
      return [
        { nome: "Palco", x: 0, y: 0.5, z: -meiaP + 3 },
        { nome: "Pista", x: 0, y: 0.03, z: -16.5 },
        { nome: "Buffet", x: -meiaL + 1.4, y: 1.07, z: 0 },
        { nome: "Banheiros", x: meiaL - 0.12, y: 1.8, z: -4.7 },
      ];
    case "varanda":
      return [{ nome: "Passagem para o salão", x: 0, y: 0.1, z: -meiaP }];
    case "mezanino":
      return [
        { nome: "Lounge", x: -meiaL + 2.4, y: 0.6, z: -meiaP + 2.4 },
        { nome: "Escada", x: meiaL - 1, y: 1.2, z: -meiaP + 1.6 },
        { nome: "Vista para o salão", x: 0, y: 1.05, z: meiaP },
      ];
    default:
      return [
        { nome: "Palco", x: 0, y: 0.34, z: -meiaP + 2.6 },
        { nome: "Bar", x: meiaL - 1.6, y: 1.17, z: 6.2 },
        { nome: "Banheiros", x: meiaL - 0.12, y: 1.8, z: -0.3 },
      ];
  }
}
