"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Ambiente, EstadoMesa, Limiares, Mesa } from "@/lib/types";
import { derivarEstado, precisaAtencao } from "@/lib/state";
import { resumir } from "@/components/shell/estatisticas";
import { PRESETS, type FiltroRapido, type Vista, type VistaCamera } from "@/components/shell/tipos";

/**
 * Todo o estado de seleção e câmera mora aqui, fora dos layouts: desktop e
 * celular são duas composições da mesma conversa com a cena.
 */
export function useSalao(todas: Mesa[], ambientes: Ambiente[], limiares: Limiares) {
  const [ambienteId, setAmbienteId] = useState(ambientes[0]?.id ?? "principal");
  const [vista, setVista] = useState<Vista>("3d");
  const [filtro, setFiltro] = useState<EstadoMesa | null>(null);
  const [atencao, setAtencao] = useState(false);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [foco, setFoco] = useState<{ id: number; n: number } | null>(null);
  const [vistaCamera, setVistaCamera] = useState<VistaCamera>("perspectiva");
  const [sinalReset, setSinalReset] = useState(0);
  const [sinalNorte, setSinalNorte] = useState(0);
  const [sinalSalvarVista, setSinalSalvarVista] = useState(0);
  const [sinalLimparVista, setSinalLimparVista] = useState(0);
  const [zoom, setZoom] = useState<{ direcao: 1 | -1; n: number } | null>(null);
  const [mostrarRotulos, setMostrarRotulos] = useState(true);

  // Preferência explícita (localStorage) vence o automático; só é lida no cliente para não divergir da hidratação.
  const [preferenciaLeve, setPreferenciaLeve] = useState<boolean | null>(null);
  const [maquinaFraca, setMaquinaFraca] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem("modoLeve");
      if (v === "1" || v === "0") setPreferenciaLeve(v === "1");
    } catch {}
    setMaquinaFraca(typeof navigator !== "undefined" && navigator.hardwareConcurrency <= 4);
  }, []);
  const definirModoLeve = useCallback((v: boolean | null) => {
    setPreferenciaLeve(v);
    try {
      if (v === null) localStorage.removeItem("modoLeve");
      else localStorage.setItem("modoLeve", v ? "1" : "0");
    } catch {}
  }, []);

  // O azimute chega a ~10Hz; em estado re-renderizaria o shell inteiro. A bússola assina direto.
  const azimute = useRef(0);
  const ouvintes = useRef(new Set<() => void>());
  const aoMudarCamera = useCallback((rad: number) => {
    azimute.current = rad;
    ouvintes.current.forEach((f) => f());
  }, []);
  const assinarAzimute = useCallback((f: () => void) => {
    ouvintes.current.add(f);
    return () => void ouvintes.current.delete(f);
  }, []);
  const lerAzimute = useCallback(() => azimute.current, []);

  const mesas = useMemo(() => todas.filter((m) => m.ambienteId === ambienteId), [todas, ambienteId]);
  const modoLeve = preferenciaLeve ?? (mesas.length > 60 || maquinaFraca);
  const resumo = useMemo(() => resumir(mesas, limiares), [mesas, limiares]);
  const mesasVisiveis = useMemo(
    () => (atencao ? mesas.filter((m) => precisaAtencao(derivarEstado(m, limiares))) : mesas),
    [atencao, mesas, limiares],
  );
  const destacar = useMemo(
    () => (atencao ? (m: Mesa) => precisaAtencao(derivarEstado(m, limiares)) : undefined),
    [atencao, limiares],
  );
  const mesaSelecionada = mesas.find((m) => m.id === selecionada) ?? null;

  const filtroRapido: FiltroRapido | "outro" = atencao
    ? "atencao"
    : filtro === null
      ? "todas"
      : filtro === "livre"
        ? "livres"
        : "outro";

  const definirRapido = useCallback((r: FiltroRapido) => {
    setFiltro(r === "livres" ? "livre" : null);
    setAtencao(r === "atencao");
  }, []);
  const filtrar = useCallback((e: EstadoMesa | null) => {
    setFiltro(e);
    setAtencao(false);
  }, []);

  const mudarAmbiente = useCallback(
    (id: string) => {
      if (id === ambienteId) return;
      setAmbienteId(id);
      setSelecionada(null);
      setFoco(null);
      filtrar(null);
      setSinalReset((n) => n + 1);
    },
    [ambienteId, filtrar],
  );

  const ciclarAmbiente = useCallback(
    (passo: 1 | -1) => {
      const i = ambientes.findIndex((a) => a.id === ambienteId);
      mudarAmbiente(ambientes[(i + passo + ambientes.length) % ambientes.length].id);
    },
    [ambientes, ambienteId, mudarAmbiente],
  );

  /** Seleciona e leva a câmera até a mesa, mudando de ambiente se preciso. */
  const irParaMesa = useCallback(
    (id: number) => {
      const m = todas.find((x) => x.id === id);
      if (!m) return;
      setAmbienteId(m.ambienteId);
      filtrar(null);
      setSelecionada(id);
      setFoco((f) => ({ id, n: (f?.n ?? 0) + 1 }));
    },
    [todas, filtrar],
  );

  return {
    todas, mesas, mesasVisiveis, destacar, ambientes, limiares, resumo,
    ambienteId, mudarAmbiente, ciclarAmbiente,
    vista, setVista,
    filtro, filtrar, filtroRapido, definirRapido,
    selecionada, mesaSelecionada, selecionar: setSelecionada,
    alternarSelecao: (id: number) => setSelecionada((s) => (s === id ? null : id)),
    irParaMesa, foco,
    mostrarRotulos, setMostrarRotulos,
    modoLeve, modoLeveAutomatico: preferenciaLeve === null, definirModoLeve,
    camera: {
      vistaCamera, setVistaCamera, sinalReset, sinalNorte, sinalSalvarVista, sinalLimparVista, zoom,
      ciclarPreset: () => setVistaCamera((v) => PRESETS[(PRESETS.indexOf(v) + 1) % PRESETS.length]),
      zoomar: (direcao: 1 | -1) => setZoom((z) => ({ direcao, n: (z?.n ?? 0) + 1 })),
      recentralizar: () => setSinalReset((n) => n + 1),
      norte: () => setSinalNorte((n) => n + 1),
      salvarVista: () => setSinalSalvarVista((n) => n + 1),
      limparVista: () => setSinalLimparVista((n) => n + 1),
      aoMudarCamera, assinarAzimute, lerAzimute,
    },
  };
}

export type Salao = ReturnType<typeof useSalao>;
