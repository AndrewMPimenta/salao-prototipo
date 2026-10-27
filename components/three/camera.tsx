"use client";

import { useCallback, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import * as THREE from "three";
import type { VistaCamera } from "@/components/floor-3d";
import { caixaDaSala, type Cenario } from "./cenarios";
import { enquadrarCaixa, poseParaPonto, type Folga } from "./enquadramento";

const { ACTION } = CameraControlsImpl;

const PRESETS: Record<VistaCamera, { pol: number; az: number }> = {
  aerea: { pol: 0.08, az: 0 },
  perspectiva: { pol: 0.8, az: 0.55 },
  nivel: { pol: 1.22, az: 0.35 },
};

const POLAR_MESA = 0.85;

/** Em retrato o lado maior corre na vertical; a diagonal é atenuada porque alarga a sala na tela estreita. */
const azimuteDe = (az: number, aspecto: number) => (aspecto < 0.9 ? Math.PI / 2 + az * 0.3 : az);

interface Props {
  cenario: Cenario;
  ambienteId: string;
  vistaCamera: VistaCamera;
  sinalReset: number;
  zoom: { direcao: 1 | -1; n: number } | null;
  foco: { id: number; n: number } | null;
  sinalNorte: number;
  onCameraChange?: (azimute: number) => void;
  folga: Folga;
  selecionada: number | null;
  /** Posição de cada mesa no mundo (x, z). */
  posicoes: Map<number, [number, number, number]>;
  reduzMovimento: boolean;
}

export function Camera(p: Props) {
  const ref = useRef<CameraControlsImpl>(null);
  const { size, camera, invalidate } = useThree();
  const fov = (camera as THREE.PerspectiveCamera).fov;
  const pronto = size.width > 0 && size.height > 0;

  // Os efeitos de seleção e redimensionamento leem o estado mais recente sem se re-disparar.
  const atual = useRef({ ...p, w: size.width, h: size.height, fov });
  atual.current = { ...p, w: size.width, h: size.height, fov };

  const ultimoAmbiente = useRef<string | null>(null);
  const aspectoEnquadrado = useRef(0);
  const ultimoZoom = useRef(p.zoom?.n ?? 0);
  const ultimaSelecao = useRef<number | null>(null);
  const ultimoFoco = useRef(p.foco?.n ?? 0);
  const ultimoNorte = useRef(p.sinalNorte);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.mouseButtons.left = ACTION.ROTATE;
    c.mouseButtons.right = ACTION.TRUCK;
    c.mouseButtons.wheel = ACTION.DOLLY;
    c.touches.one = ACTION.TOUCH_ROTATE;
    c.touches.two = ACTION.TOUCH_DOLLY_TRUCK;
    c.touches.three = ACTION.TOUCH_TRUCK;
  }, []);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const diag = Math.hypot(p.cenario.salaL, p.cenario.salaP);
    // Aproximar além disto só mostra cadeiras; o teto real vem do enquadramento (ver enquadrar).
    c.minDistance = Math.max(6, diag * 0.28);
    c.maxDistance = diag * 3;
    // Pan livre o bastante para o enquadramento deslocado pela interface, curto o bastante para não perder a sala.
    const limite = caixaDaSala(p.cenario, 3);
    limite.min.y = -3;
    limite.max.y = 6;
    c.setBoundary(limite);
  }, [p.cenario]);

  const enquadrar = useCallback((instantaneo: boolean) => {
    const c = ref.current;
    const a = atual.current;
    if (!c || a.w <= 0) return;

    const aspecto = a.w / a.h;
    // Em retrato o campo vertical de 34° dá um horizontal estreito demais: a sala só caberia a >100 m.
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = aspecto < 0.9 ? 55 : 34;
    cam.updateProjectionMatrix();
    const vp = { w: a.w, h: a.h, fov: cam.fov };
    const preset = PRESETS[a.vistaCamera];
    // Em retrato o lado maior da sala corre na vertical do celular.
    const az = azimuteDe(preset.az, aspecto);
    const caixa = caixaDaSala(a.cenario, 0.4);
    const diag = Math.hypot(a.cenario.salaL, a.cenario.salaP);
    const { pos, alvo, d } = enquadrarCaixa(caixa, az, preset.pol, a.folga, vp, c.minDistance, diag * 8);
    // Afastar além da visão geral enquadrada não informa nada.
    c.maxDistance = d * 1.15;

    aspectoEnquadrado.current = aspecto;
    void c.setLookAt(pos.x, pos.y, pos.z, alvo.x, alvo.y, alvo.z, !instantaneo && !a.reduzMovimento);
    // Sob demanda, a pose só é aplicada no quadro seguinte e esse quadro precisa pedir o seguinte.
    invalidate();
    requestAnimationFrame(() => {
      invalidate();
      requestAnimationFrame(() => invalidate());
    });
  }, [camera, invalidate]);

  useEffect(() => {
    if (!pronto) return;
    const novoAmbiente = ultimoAmbiente.current !== p.ambienteId;
    ultimoAmbiente.current = p.ambienteId;
    // Trocar de ambiente troca a cena inteira: voar entre escalas diferentes confunde.
    enquadrar(novoAmbiente);
  }, [
    pronto,
    p.ambienteId,
    p.vistaCamera,
    p.sinalReset,
    p.folga.topo,
    p.folga.base,
    p.folga.esquerda,
    p.folga.direita,
    enquadrar,
  ]);

  // Só reenquadra se a proporção mudou de fato: a barra de endereço do celular não deve mexer na vista.
  useEffect(() => {
    if (!pronto) return;
    const t = setTimeout(() => {
      const aspecto = size.width / size.height;
      const base = aspectoEnquadrado.current;
      if (base > 0 && Math.abs(aspecto - base) / base > 0.08) enquadrar(true);
    }, 150);
    return () => clearTimeout(t);
  }, [pronto, size.width, size.height, enquadrar]);

  const voarPara = useCallback((id: number) => {
    const c = ref.current;
    const a = atual.current;
    const xz = a.posicoes.get(id);
    if (!c || !xz || a.w <= 0) return;

    const vp = { w: a.w, h: a.h, fov: (camera as THREE.PerspectiveCamera).fov };
    const { pos, alvo } = poseParaPonto(
      new THREE.Vector3(xz[0], 0.5, xz[1]),
      c.azimuthAngle,
      POLAR_MESA,
      // Mesas maiores pedem mais recuo para as cadeiras não encherem a tela.
      Math.max(c.minDistance, 6 + xz[2] * 2.5),
      a.folga,
      vp,
    );
    void c.setLookAt(pos.x, pos.y, pos.z, alvo.x, alvo.y, alvo.z, !a.reduzMovimento);
  }, [camera]);

  useEffect(() => {
    const id = p.selecionada;
    if (id === ultimaSelecao.current) return;
    ultimaSelecao.current = id;
    // Ao limpar a seleção a câmera fica onde o usuário a deixou.
    if (id !== null) voarPara(id);
  }, [p.selecionada, voarPara]);

  // Foco sob demanda (lista/busca): voa mesmo que a mesa já esteja selecionada.
  useEffect(() => {
    if (!p.foco || p.foco.n === ultimoFoco.current) return;
    ultimoFoco.current = p.foco.n;
    voarPara(p.foco.id);
  }, [p.foco, voarPara]);

  useEffect(() => {
    const c = ref.current;
    if (!c || p.sinalNorte === ultimoNorte.current) return;
    ultimoNorte.current = p.sinalNorte;
    const a = atual.current;
    const az = azimuteDe(PRESETS[a.vistaCamera].az, a.w / a.h);
    void c.rotateTo(az, c.polarAngle, !a.reduzMovimento);
  }, [p.sinalNorte]);

  // O azimute alimenta a bússola do shell; ~10 Hz poupa renderizações do React.
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ultimo = 0;
    let anterior = NaN;
    const aoAtualizar = () => {
      const agora = performance.now();
      if (agora - ultimo < 100 || Math.abs(c.azimuthAngle - anterior) < 0.005) return;
      ultimo = agora;
      anterior = c.azimuthAngle;
      atual.current.onCameraChange?.(anterior);
    };
    c.addEventListener("update", aoAtualizar);
    return () => c.removeEventListener("update", aoAtualizar);
  }, []);

  useEffect(() => {
    const c = ref.current;
    if (!c || !p.zoom || p.zoom.n === ultimoZoom.current) return;
    ultimoZoom.current = p.zoom.n;
    void c.dolly(p.zoom.direcao * c.distance * 0.25, !p.reduzMovimento);
  }, [p.zoom, p.reduzMovimento]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      smoothTime={p.reduzMovimento ? 0 : 0.35}
      draggingSmoothTime={p.reduzMovimento ? 0 : 0.12}
      dollyToCursor
      minPolarAngle={0}
      maxPolarAngle={1.35}
      boundaryEnclosesCamera={false}
    />
  );
}
