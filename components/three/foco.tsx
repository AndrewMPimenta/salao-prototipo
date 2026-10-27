"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Altura do holofote: alto o bastante para o facho caber no enquadramento sem ser visto de lado. */
const ALTURA = 7;
/** Luz de sala que sobra com uma mesa em foco: a cena continua legível, não escura. No escuro o piso já parte de perto do preto. */
const RESTO = { claro: 0.36, escuro: 0.55 };
const INTENSIDADE_SPOT = 60;
const FOLGA_FACHO = 0.9;

const VERTICE = /* glsl */ `
  varying float vAltura;
  varying float vFrente;
  void main() {
    vAltura = uv.y;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    vFrente = abs(dot(n, normalize(-mv.xyz)));
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENTO = /* glsl */ `
  uniform vec3 uCor;
  uniform float uAlfa;
  varying float vAltura;
  varying float vFrente;
  void main() {
    // Mais denso perto da fonte e no miolo; a silhueta do cone some, para não virar um tubo.
    float a = uAlfa * mix(0.3, 1.0, vAltura) * pow(vFrente, 1.5);
    gl_FragColor = vec4(uCor * a, a);
  }
`;

interface Alvo {
  x: number;
  z: number;
  /** Raio do tampo em metros. */
  raio: number;
}

/**
 * Luz da sala e o holofote do foco. Com uma mesa selecionada, a luz geral cai para ~1/3 e um
 * holofote de cima acende a mesa, as cadeiras e uma poça no piso. A transição é amortecida
 * (sem ultrapassar) e retoma do valor atual se o foco muda no meio; sem animação com movimento reduzido.
 */
export function Luzes({
  escuro,
  raio,
  alvo,
  instantaneo,
}: {
  escuro: boolean;
  raio: number;
  alvo: Alvo | null;
  instantaneo: boolean;
}) {
  const hemi = useRef<THREE.HemisphereLight>(null);
  const chave = useRef<THREE.DirectionalLight>(null);
  const contra = useRef<THREE.DirectionalLight>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const cone = useRef<THREE.Mesh>(null);
  const fator = useRef(0);
  const ultimo = useRef<Alvo>({ x: 0, z: 0, raio: 0.4 });
  if (alvo) ultimo.current = alvo;

  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [alvo, invalidate]);

  const mira = useMemo(() => new THREE.Object3D(), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTICE,
        fragmentShader: FRAGMENTO,
        uniforms: { uCor: { value: new THREE.Color("#fff3e0") }, uAlfa: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const geometria = useMemo(() => new THREE.CylinderGeometry(0.12, 1, 1, 48, 1, true), []);

  const aplica = (f: number) => {
    const luz = 1 - (1 - RESTO[escuro ? "escuro" : "claro"]) * f;
    if (hemi.current) hemi.current.intensity = 1.5 * luz;
    if (chave.current) chave.current.intensity = (escuro ? 2 : 1.7) * luz;
    if (contra.current) contra.current.intensity = (escuro ? 0.9 : 0.45) * luz;

    const s = spot.current;
    const c = cone.current;
    if (!s || !c) return;
    const { x, z, raio: r } = ultimo.current;
    const abertura = Math.atan((r + 0.55 + FOLGA_FACHO) / ALTURA);
    // O holofote fica sempre na cena com intensidade zero: ligar e desligar a luz recompilaria todos os materiais.
    c.visible = f > 0.001;
    s.intensity = INTENSIDADE_SPOT * f;
    s.angle = abertura * 1.25;
    s.position.set(x, ALTURA, z);
    mira.position.set(x, 0, z);
    mira.updateMatrixWorld();

    const base = Math.tan(abertura) * ALTURA;
    c.position.set(x, ALTURA / 2, z);
    c.scale.set(base, ALTURA, base);
    material.uniforms.uAlfa.value = (escuro ? 0.12 : 0.08) * f;
  };

  useFrame(({ invalidate }, delta) => {
    const meta = alvo ? 1 : 0;
    const f = fator.current;
    const novo = instantaneo || Math.abs(f - meta) < 0.004 ? meta : THREE.MathUtils.damp(f, meta, 14, delta);
    fator.current = novo;
    aplica(novo);
    if (novo !== meta) invalidate();
  });

  return (
    <>
      {/* Sem legado de luz, a intensidade é dividida por π no difuso: ~3 no total devolve a cor do material. O chão do hemisfério é claro para as paredes laterais não escurecerem. */}
      <hemisphereLight ref={hemi} args={["#fff8ee", escuro ? "#a39c90" : "#cfc7b9", 1.5]} />
      <directionalLight ref={chave} position={[-raio * 0.5, raio * 1.1, raio * 0.8]} color="#fff6ea" intensity={escuro ? 2 : 1.7} />
      {/* Contraluz fria e fraca: separa a silhueta do mobiliário do piso, sobretudo no tema escuro. */}
      <directionalLight ref={contra} position={[raio * 0.6, raio * 0.5, -raio * 0.7]} color="#e4ecff" intensity={escuro ? 0.9 : 0.45} />

      <primitive object={mira} />
      <spotLight ref={spot} target={mira} color="#fff3e0" penumbra={0.7} decay={1.5} distance={ALTURA * 2} intensity={0} />
      <mesh ref={cone} geometry={geometria} material={material} visible={false} renderOrder={10} raycast={() => null} />
    </>
  );
}
