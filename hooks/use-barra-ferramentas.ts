"use client";

import { useCallback, useState } from "react";
import { gravarArmazenado, lerArmazenado } from "./use-armazenado";

export type Dispositivo = "desktop" | "movel";
export type Orientacao = "vertical" | "horizontal";
export type IdFerramenta = "presets" | "aproximar" | "afastar" | "bussola" | "recentralizar" | "vista" | "exibicao";

/** Colunas e linhas da grade 3x3 sem o centro: as oito zonas de ancoragem. */
export interface Ancora {
  col: 0 | 1 | 2;
  linha: 0 | 1 | 2;
}

export const ANCORAS: Record<string, Ancora> = {
  se: { col: 0, linha: 0 },
  sc: { col: 1, linha: 0 },
  sd: { col: 2, linha: 0 },
  me: { col: 0, linha: 1 },
  md: { col: 2, linha: 1 },
  ie: { col: 0, linha: 2 },
  ic: { col: 1, linha: 2 },
  id: { col: 2, linha: 2 },
};

export type IdAncora = keyof typeof ANCORAS;

/** No celular a barra só encosta nas laterais: topo e base são do cabeçalho e da gaveta. */
export const ANCORAS_DISPOSITIVO: Record<Dispositivo, IdAncora[]> = {
  desktop: ["se", "sc", "sd", "me", "md", "ie", "ic", "id"],
  movel: ["me", "md"],
};

export const ROTULO_FERRAMENTA: Record<IdFerramenta, string> = {
  presets: "Ângulo da câmera",
  aproximar: "Aproximar",
  afastar: "Afastar",
  bussola: "Bússola",
  recentralizar: "Recentralizar",
  vista: "Vista padrão",
  exibicao: "Exibição",
};

export const ORDEM_PADRAO: IdFerramenta[] = ["presets", "aproximar", "afastar", "bussola", "recentralizar", "vista", "exibicao"];

export interface ConfigBarra {
  ancora: IdAncora;
  orientacao: Orientacao;
  ordem: IdFerramenta[];
  ocultas: IdFerramenta[];
}

export const configPadrao = (d: Dispositivo): ConfigBarra => ({
  ancora: d === "desktop" ? "id" : "md",
  orientacao: "vertical",
  ordem: ORDEM_PADRAO,
  ocultas: [],
});

const chave = (d: Dispositivo) => `salao:barra:${d}`;

const ehId = (v: unknown): v is IdFerramenta => typeof v === "string" && v in ROTULO_FERRAMENTA;

function validar(d: Dispositivo, bruto: unknown): ConfigBarra | null {
  if (!bruto || typeof bruto !== "object") return null;
  const b = bruto as Partial<Record<keyof ConfigBarra, unknown>>;
  const base = configPadrao(d);

  const ancora = typeof b.ancora === "string" && ANCORAS_DISPOSITIVO[d].includes(b.ancora) ? b.ancora : base.ancora;
  const orientacao = b.orientacao === "horizontal" ? "horizontal" : "vertical";

  // Uma ferramenta nova numa versão futura entra no fim em vez de sumir.
  const lida = Array.isArray(b.ordem) ? b.ordem.filter(ehId) : [];
  const ordem = [...new Set([...lida, ...ORDEM_PADRAO])];
  const ocultas = Array.isArray(b.ocultas) ? [...new Set(b.ocultas.filter(ehId))] : [];

  return { ancora, orientacao, ordem, ocultas };
}

/** Preferências da barra de ferramentas, por tipo de dispositivo. O layout só monta no cliente, então a leitura inicial é segura. */
export function useBarraFerramentas(dispositivo: Dispositivo) {
  const [config, setConfig] = useState<ConfigBarra>(
    () => lerArmazenado(chave(dispositivo), (v) => validar(dispositivo, v)) ?? configPadrao(dispositivo),
  );

  const atualizar = useCallback(
    (patch: Partial<ConfigBarra>) => {
      setConfig((atual) => {
        const prox = { ...atual, ...patch };
        gravarArmazenado(chave(dispositivo), prox);
        return prox;
      });
    },
    [dispositivo],
  );

  const restaurar = useCallback(() => {
    const padrao = configPadrao(dispositivo);
    setConfig(padrao);
    gravarArmazenado(chave(dispositivo), padrao);
  }, [dispositivo]);

  return { config, atualizar, restaurar };
}
