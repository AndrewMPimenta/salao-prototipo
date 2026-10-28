"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import * as THREE from "three";
import type { VistaCamera } from "@/components/floor-3d";
import { caixaDaSala, type Cenario } from "./cenarios";
import { enquadrarCaixa, regiaoLivre, transladarParaPonto, type Folga } from "./enquadramento";

const { ACTION } = CameraControlsImpl;

const PRESETS: Record<VistaCamera, { pol: number; az: number }> = {
  aerea: { pol: 0.08, az: 0 },
  perspectiva: { pol: 0.8, az: 0.55 },
  nivel: { pol: 1.22, az: 0.35 },
};

/** Em retrato o lado maior corre na vertical; a diagonal é atenuada porque alarga a sala na tela estreita. */
const azimuteDe = (az: number, aspecto: number) => (aspecto < 0.9 ? Math.PI / 2 + az * 0.3 : az);

interface VistaSalva {
  p: [number, number, number];
  t: [number, number, number];
  retrato: boolean;
}

const chaveVista = (ambienteId: string) => `vistaPadrao:${ambienteId}`;

function lerVista(ambienteId: string, retrato: boolean): VistaSalva | null {
  try {
    const v = JSON.parse(localStorage.getItem(chaveVista(ambienteId)) ?? "null") as VistaSalva | null;
    // A pose de um formato de tela não serve no outro: o azimute de retrato é girado.
    if (!v || v.retrato !== retrato || v.p?.length !== 3 || v.t?.length !== 3) return null;
    return v;
  } catch {
    return null;
  }
}

interface Props {
  cenario: Cenario;
  ambienteId: string;
  vistaCamera: VistaCamera;
  sinalReset: number;
  zoom: { direcao: 1 | -1; n: number } | null;
  foco: { id: number; n: number } | null;
  sinalNorte: number;
  /** Muda a cada "salvar vista": grava a pose atual como padrão do ambiente. */
  sinalSalvarVista: number;
  /** Muda a cada "restaurar padrão": apaga a vista salva e volta ao enquadramento do preset. */
  sinalLimparVista: number;
  onCameraChange?: (azimute: number) => void;
  folga: Folga;
  /** Posição de cada mesa no mundo (x, z). */
  posicoes: Map<number, [number, number, number]>;
  selecionada: number | null;
  reduzMovimento: boolean;
}

/** Margem, em fração da região livre, que a mesa selecionada guarda das bordas da interface. */
const MARGEM_LIVRE = 0.14;
/** Quanto do embalo do arrasto vira deslize depois de soltar, em segundos de velocidade. */
const EMBALO = 0.22;

export function Camera(p: Props) {
  const ref = useRef<CameraControlsImpl | null>(null);
  // O controle só existe depois da montagem do filho; como estado, os efeitos que o configuram rodam quando ele chega.
  const [pronto3d, setPronto3d] = useState(false);
  const aoMontar = useCallback((c: CameraControlsImpl | null) => {
    ref.current = c;
    setPronto3d(c !== null);
  }, []);
  const { size, camera, invalidate, gl } = useThree();
  const fov = (camera as THREE.PerspectiveCamera).fov;
  const pronto = size.width > 0 && size.height > 0;

  // Os efeitos de foco e redimensionamento leem o estado mais recente sem se re-disparar.
  const atual = useRef({ ...p, w: size.width, h: size.height, fov });
  atual.current = { ...p, w: size.width, h: size.height, fov };

  const ultimoAmbiente = useRef<string | null>(null);
  const aspectoEnquadrado = useRef(0);
  const ultimoZoom = useRef(p.zoom?.n ?? 0);
  const ultimoFoco = useRef(p.foco?.n ?? 0);
  const ultimoNorte = useRef(p.sinalNorte);
  const ultimoPreset = useRef(p.vistaCamera);
  const ultimoReset = useRef(p.sinalReset);
  const ultimaSalva = useRef(p.sinalSalvarVista);
  const ultimaLimpa = useRef(p.sinalLimparVista);
  // Preset escolhido à mão vence a vista salva até o próximo reset ou troca de ambiente.
  const usaPadrao = useRef(true);
  // Depois que o usuário mexe na câmera ou seleciona uma mesa, a folga da interface não reenquadra: clicar não pode dar zoom.
  const mexeu = useRef(false);
  const pendente = useRef<{ id: number; ate: number } | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    // Navegação de mapa: arrastar desloca pelo piso; girar fica no botão direito ou com Ctrl/Shift.
    c.mouseButtons.left = ACTION.TRUCK;
    c.mouseButtons.right = ACTION.ROTATE;
    c.mouseButtons.middle = ACTION.DOLLY;
    c.mouseButtons.wheel = ACTION.DOLLY;
    c.touches.one = ACTION.TOUCH_TRUCK;
    c.touches.two = ACTION.TOUCH_DOLLY_ROTATE;
    c.touches.three = ACTION.TOUCH_TRUCK;

    // A ação do botão é lida no pointerdown; o modificador só é conhecido ali.
    const alvo = gl.domElement.parentElement ?? gl.domElement;
    const aoPressionar = (e: PointerEvent) => {
      if (e.pointerType === "mouse") c.mouseButtons.left = e.ctrlKey || e.shiftKey ? ACTION.ROTATE : ACTION.TRUCK;
    };
    alvo.addEventListener("pointerdown", aoPressionar, true);
    return () => alvo.removeEventListener("pointerdown", aoPressionar, true);
  }, [gl, pronto3d]);

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
  }, [p.cenario, pronto3d]);

  // Sob demanda, nada desenha sozinho: a pose só é aplicada no quadro seguinte e a transição precisa de quadros até o fim.
  const renderizarPor = useCallback((ms: number) => {
    const fim = performance.now() + ms;
    const passo = () => {
      invalidate();
      if (performance.now() < fim) requestAnimationFrame(passo);
    };
    passo();
  }, [invalidate]);

  const enquadrar = useCallback((instantaneo: boolean, usarSalva: boolean, entrada = false) => {
    const c = ref.current;
    const a = atual.current;
    if (!c || a.w <= 0) return;

    // O tamanho do canvas no DOM chega antes do estado do R3F; medir aqui evita enquadrar com a proporção errada.
    const el = gl.domElement;
    const w = el.clientWidth || a.w;
    const h = el.clientHeight || a.h;
    const aspecto = w / h;
    const retrato = aspecto < 0.9;
    // Em retrato o campo vertical de 34° dá um horizontal estreito demais: a sala só caberia a >100 m.
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = retrato ? 55 : 34;
    cam.updateProjectionMatrix();
    const vp = { w, h, fov: cam.fov };
    const preset = PRESETS[a.vistaCamera];
    // Em retrato o lado maior da sala corre na vertical do celular.
    const az = azimuteDe(preset.az, aspecto);
    const { pos, alvo, d } = enquadrarCaixa(caixaDaSala(a.cenario, 0), az, preset.pol, a.folga, vp);
    // Afastar além da visão geral enquadrada não informa nada.
    c.maxDistance = d * 1.15;

    const salva = usarSalva ? lerVista(a.ambienteId, retrato) : null;
    const [pp, tt] = salva ? [salva.p, salva.t] : [pos.toArray(), alvo.toArray()];

    aspectoEnquadrado.current = aspecto;
    mexeu.current = false;
    if (entrada && !a.reduzMovimento) {
      // Entrada no ambiente: parte 8% mais longe e 4° girada e assenta na pose, sob o fade-in da cena.
      const de = new THREE.Vector3(pp[0] - tt[0], pp[1] - tt[1], pp[2] - tt[2])
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(4))
        .multiplyScalar(1.08);
      void c.setLookAt(tt[0] + de.x, tt[1] + de.y, tt[2] + de.z, tt[0], tt[1], tt[2], false);
    }
    void c.setLookAt(pp[0], pp[1], pp[2], tt[0], tt[1], tt[2], entrada ? !a.reduzMovimento : !instantaneo && !a.reduzMovimento);
    renderizarPor(1800);
  }, [camera, gl, renderizarPor]);

  useEffect(() => {
    if (!pronto || !pronto3d) return;
    const novoAmbiente = ultimoAmbiente.current !== p.ambienteId;
    ultimoAmbiente.current = p.ambienteId;
    const pedido = novoAmbiente || ultimoReset.current !== p.sinalReset || ultimoPreset.current !== p.vistaCamera;
    if (!pedido && mexeu.current) return;
    if (novoAmbiente || ultimoReset.current !== p.sinalReset) usaPadrao.current = true;
    else if (ultimoPreset.current !== p.vistaCamera) usaPadrao.current = false;
    ultimoReset.current = p.sinalReset;
    ultimoPreset.current = p.vistaCamera;
    // Trocar de ambiente troca a cena inteira: voar entre escalas diferentes confunde.
    enquadrar(false, usaPadrao.current, novoAmbiente);
  }, [
    pronto,
    pronto3d,
    p.ambienteId,
    p.vistaCamera,
    p.sinalReset,
    p.folga.topo,
    p.folga.base,
    p.folga.esquerda,
    p.folga.direita,
    enquadrar,
  ]);

  // O canvas pode ganhar o tamanho final (ou as fontes chegar) depois do primeiro quadro; sob demanda isso não redesenha sozinho.
  useEffect(() => {
    if (!pronto3d) return;
    const el = gl.domElement.parentElement ?? gl.domElement;
    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        const aspecto = gl.domElement.clientWidth / gl.domElement.clientHeight;
        const base = aspectoEnquadrado.current;
        if (base > 0 && Math.abs(aspecto - base) / base > 0.08) enquadrar(true, usaPadrao.current);
        renderizarPor(400);
      }, 100);
    });
    ro.observe(el);
    void document.fonts?.ready.then(() => renderizarPor(600));
    const pedir = () => invalidate();
    const c = ref.current;
    c?.addEventListener("update", pedir);
    c?.addEventListener("rest", pedir);
    return () => {
      clearTimeout(t);
      ro.disconnect();
      c?.removeEventListener("update", pedir);
      c?.removeEventListener("rest", pedir);
    };
  }, [pronto3d, gl, enquadrar, renderizarPor, invalidate]);

  // Só reenquadra se a proporção mudou de fato: a barra de endereço do celular não deve mexer na vista.
  useEffect(() => {
    if (!pronto) return;
    const t = setTimeout(() => {
      const aspecto = size.width / size.height;
      const base = aspectoEnquadrado.current;
      if (base > 0 && Math.abs(aspecto - base) / base > 0.08) enquadrar(true, usaPadrao.current);
    }, 150);
    return () => clearTimeout(t);
  }, [pronto, size.width, size.height, enquadrar]);

  // Só desloca: quem navega por lista ou busca já escolheu o zoom e o ângulo que quer.
  const panoramicaPara = useCallback((id: number) => {
    const c = ref.current;
    const a = atual.current;
    const xz = a.posicoes.get(id);
    if (!c || !xz || a.w <= 0) return;

    const vp = { w: a.w, h: a.h, fov: (camera as THREE.PerspectiveCamera).fov };
    const pos = c.getPosition(new THREE.Vector3());
    const alvo = c.getTarget(new THREE.Vector3());
    const w = transladarParaPonto(new THREE.Vector3(xz[0], 0.5, xz[1]), pos, c.azimuthAngle, c.polarAngle, a.folga, vp);
    pos.add(w);
    alvo.add(w);
    void c.setLookAt(pos.x, pos.y, pos.z, alvo.x, alvo.y, alvo.z, !a.reduzMovimento);
    renderizarPor(1800);
  }, [camera, renderizarPor]);

  // Foco sob demanda (lista/busca): desloca mesmo que a mesa já esteja selecionada.
  useEffect(() => {
    if (!p.foco || p.foco.n === ultimoFoco.current) return;
    ultimoFoco.current = p.foco.n;
    mexeu.current = true;
    panoramicaPara(p.foco.id);
  }, [p.foco, panoramicaPara]);

  useEffect(() => {
    const c = ref.current;
    if (!c || p.sinalNorte === ultimoNorte.current) return;
    ultimoNorte.current = p.sinalNorte;
    const a = atual.current;
    const az = azimuteDe(PRESETS[a.vistaCamera].az, gl.domElement.clientWidth / gl.domElement.clientHeight);
    void c.rotateTo(az, c.polarAngle, !a.reduzMovimento);
    renderizarPor(1800);
  }, [p.sinalNorte, gl, renderizarPor]);

  useEffect(() => {
    const c = ref.current;
    if (!c || p.sinalSalvarVista === ultimaSalva.current) return;
    ultimaSalva.current = p.sinalSalvarVista;
    const v: VistaSalva = {
      p: c.getPosition(new THREE.Vector3()).toArray(),
      t: c.getTarget(new THREE.Vector3()).toArray(),
      retrato: gl.domElement.clientWidth / gl.domElement.clientHeight < 0.9,
    };
    try {
      localStorage.setItem(chaveVista(atual.current.ambienteId), JSON.stringify(v));
    } catch {}
  }, [p.sinalSalvarVista, gl]);

  useEffect(() => {
    if (p.sinalLimparVista === ultimaLimpa.current) return;
    ultimaLimpa.current = p.sinalLimparVista;
    try {
      localStorage.removeItem(chaveVista(atual.current.ambienteId));
    } catch {}
    usaPadrao.current = true;
    enquadrar(false, false);
  }, [p.sinalLimparVista, enquadrar]);

  /*
    Seleção: se a mesa caiu sob a interface (cartão à direita, folha embaixo), desliza só o
    necessário para ela entrar na região livre, sem zoom. A folga muda logo depois da seleção,
    quando o cartão abre; por isso a checagem fica pendente por um instante e roda de novo.
  */
  useEffect(() => {
    if (p.selecionada === null) {
      pendente.current = null;
      return;
    }
    mexeu.current = true;
    pendente.current = { id: p.selecionada, ate: performance.now() + 900 };
  }, [p.selecionada]);

  useEffect(() => {
    const c = ref.current;
    const pend = pendente.current;
    if (!c || !pend || performance.now() > pend.ate) return;
    const a = atual.current;
    const xz = a.posicoes.get(pend.id);
    if (!xz || a.w <= 0) return;

    const vp = { w: a.w, h: a.h, fov: (camera as THREE.PerspectiveCamera).fov };
    const r = regiaoLivre(a.folga, vp);
    const mx = (r.dir - r.esq) * MARGEM_LIVRE;
    const my = (r.cima - r.baixo) * MARGEM_LIVRE;
    const ponto = new THREE.Vector3(xz[0], 0.74, xz[1]);
    // Pose de destino, não a atual: uma transição em curso não pode enganar a conta.
    const pos = c.getPosition(new THREE.Vector3(), false);
    const alvo = c.getTarget(new THREE.Vector3(), false);
    const cam = new THREE.PerspectiveCamera(vp.fov, vp.w / vp.h, 0.1, 1000);
    cam.position.copy(pos);
    cam.lookAt(alvo);
    cam.updateMatrixWorld();
    const ndc = ponto.clone().project(cam);
    const destino = {
      x: Math.min(Math.max(ndc.x, r.esq + mx), r.dir - mx),
      y: Math.min(Math.max(ndc.y, r.baixo + my), r.cima - my),
    };
    if (Math.abs(destino.x - ndc.x) < 1e-3 && Math.abs(destino.y - ndc.y) < 1e-3) return;

    const w = transladarParaPonto(ponto, pos, c.azimuthAngle, c.polarAngle, a.folga, vp, destino);
    void c.moveTo(alvo.x + w.x, alvo.y + w.y, alvo.z + w.z, !a.reduzMovimento);
    renderizarPor(900);
  }, [p.selecionada, p.folga.topo, p.folga.base, p.folga.esquerda, p.folga.direita, camera, renderizarPor]);

  /*
    Embalo: o arrasto acompanha o ponteiro 1:1 e, ao soltar, o alvo segue na velocidade do gesto
    e desacelera (o smoothDamp herda a velocidade e não ultrapassa). Pegar no meio do deslize
    para onde está: o controle descarta o destino ao começar um arrasto.
  */
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const amostras: { t: number; x: number; z: number }[] = [];
    let arrastando = false;
    const alvo = new THREE.Vector3();

    const inicio = () => {
      arrastando = true;
      mexeu.current = true;
      amostras.length = 0;
    };
    const amostra = () => {
      if (!arrastando) return;
      c.getTarget(alvo, true);
      const t = performance.now();
      amostras.push({ t, x: alvo.x, z: alvo.z });
      while (amostras.length > 2 && t - amostras[0].t > 90) amostras.shift();
    };
    const fim = () => {
      arrastando = false;
      const a = amostras[0];
      const b = amostras[amostras.length - 1];
      amostras.length = 0;
      // Soltar parado (sem movimento nos últimos 60 ms) não desliza.
      if (!a || !b || b.t - a.t < 16 || performance.now() - b.t > 60 || atual.current.reduzMovimento) return;
      const dt = (b.t - a.t) / 1000;
      const vx = (b.x - a.x) / dt;
      const vz = (b.z - a.z) / dt;
      if (Math.hypot(vx, vz) < 0.8) return;
      c.getTarget(alvo, false);
      void c.moveTo(alvo.x + vx * EMBALO, alvo.y, alvo.z + vz * EMBALO, true);
      renderizarPor(900);
    };

    c.addEventListener("controlstart", inicio);
    c.addEventListener("update", amostra);
    c.addEventListener("controlend", fim);
    return () => {
      c.removeEventListener("controlstart", inicio);
      c.removeEventListener("update", amostra);
      c.removeEventListener("controlend", fim);
    };
  }, [pronto3d, renderizarPor]);

  // Os planos de recorte acompanham a distância: com near fixo, camadas a milímetros cintilavam de longe.
  const recorte = useRef({ near: 0, far: 0 });
  useFrame(() => {
    const c = ref.current;
    if (!c) return;
    const cam = camera as THREE.PerspectiveCamera;
    const d = c.distance;
    const near = THREE.MathUtils.clamp(d / 150, 0.05, 2);
    const far = d * 4 + Math.hypot(atual.current.cenario.salaL, atual.current.cenario.salaP);
    const r = recorte.current;
    if (Math.abs(r.near - near) / near < 0.02 && Math.abs(r.far - far) / far < 0.02) return;
    r.near = cam.near = near;
    r.far = cam.far = far;
    cam.updateProjectionMatrix();
  }, -0.5);

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
  }, [pronto3d]);

  useEffect(() => {
    const c = ref.current;
    if (!c || !p.zoom || p.zoom.n === ultimoZoom.current) return;
    ultimoZoom.current = p.zoom.n;
    mexeu.current = true;
    void c.dolly(p.zoom.direcao * c.distance * 0.25, !p.reduzMovimento);
    renderizarPor(1200);
  }, [p.zoom, p.reduzMovimento, renderizarPor]);

  return (
    <CameraControls
      ref={aoMontar}
      makeDefault
      smoothTime={p.reduzMovimento ? 0 : 0.25}
      draggingSmoothTime={p.reduzMovimento ? 0 : 0.03}
      boundaryFriction={0.35}
      dollyToCursor
      minPolarAngle={0}
      maxPolarAngle={1.35}
      boundaryEnclosesCamera={false}
    />
  );
}
