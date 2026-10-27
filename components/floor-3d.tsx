"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { EstadoMesa, Limiares, Mesa } from "@/lib/types";
import { derivarEstado, GLIFO_ESTADO, ROTULO_ESTADO } from "@/lib/state";
import { cn } from "@/lib/utils";
import { useTemaEscuro } from "@/hooks/use-tema";

/*
  DIMENSÕES POR AMBIENTE

  Cada ambiente tem sua própria caixa e seu próprio cenário: o salão é uma
  sala fechada com palco, bar e banheiros; a varanda é um deck aberto, menor,
  com guarda-corpo e jardineiras. Renderizar a varanda dentro das paredes do
  salão descrevia um lugar que não existe.

  A sala é maior que o campo de mesas — a sobra é onde cabem palco e portas.
*/
interface Cenario {
  salaL: number;
  salaP: number;
  campoL: number;
  campoP: number;
  campoZ0: number;
  /** Distância da câmera, proporcional ao tamanho do ambiente. */
  escalaCamera: number;
}

const CENARIOS: Record<string, Cenario> = {
  principal: { salaL: 21, salaP: 17, campoL: 16, campoP: 11, campoZ0: -3.0, escalaCamera: 1 },
  varanda: { salaL: 14, salaP: 9.5, campoL: 11, campoP: 5.4, campoZ0: -1.4, escalaCamera: 0.66 },
};

const CENARIO_PADRAO = CENARIOS.principal;

const ALTURA_TAMPO = 0.74;
const ESPESSURA_TAMPO = 0.07;

/*
  `x` e `y` da mesa são porcentagens do ambiente; `largura` e `altura` estão
  em unidades de planta (a planta 2D tem cerca de 1000 de largura). Tratar os
  quatro como porcentagem punha uma mesa de 9 metros numa sala de 13.
*/
const ESCALA_MESA = 0.013;
const ms = (v: number) => v * ESCALA_MESA;
const mx = (x: number, c: Cenario) => -c.campoL / 2 + (x / 100) * c.campoL;
const mz = (y: number, c: Cenario) => c.campoZ0 + (y / 100) * c.campoP;

type Par = { fill: string; stroke: string };

const CLARO: Record<EstadoMesa, Par> = {
  livre: { fill: "#ffffff", stroke: "#86868b" },
  ocupada: { fill: "#d8d8dd", stroke: "#48484d" },
  alerta1: { fill: "#d4941a", stroke: "#5c3f00" },
  alerta2: { fill: "#7b2436", stroke: "#4a121f" },
  conta: { fill: "#cfe3f5", stroke: "#0043ce" },
};

const ESCURO: Record<EstadoMesa, Par> = {
  livre: { fill: "#2c2c2e", stroke: "#8e8e93" },
  ocupada: { fill: "#48484a", stroke: "#c7c7cc" },
  alerta1: { fill: "#8a6700", stroke: "#ffe0a3" },
  alerta2: { fill: "#5e1a28", stroke: "#ff93a6" },
  conta: { fill: "#1c3a5e", stroke: "#64b5f6" },
};

type Angulo = "planta" | "diagonal" | "rasante";

const ANGULOS: Record<Angulo, [number, number, number]> = {
  // `planta` não pode ser exatamente vertical: com a câmera no eixo Y o
  // lookAt fica degenerado e a cena gira sozinha.
  planta: [0.01, 22, 3.2],
  diagonal: [12, 12.5, 13],
  rasante: [8.5, 4.2, 15],
};

const ALVO: [number, number, number] = [0, 0.4, 1];

function posicaoCamera(a: Angulo, c: Cenario): [number, number, number] {
  const [x, y, z] = ANGULOS[a];
  return [x * c.escalaCamera, y * c.escalaCamera, z * c.escalaCamera];
}

export function Floor3D({
  mesas,
  limiares,
  ambienteId,
}: {
  mesas: Mesa[];
  limiares: Limiares;
  ambienteId: string;
}) {
  const cenario = CENARIOS[ambienteId] ?? CENARIO_PADRAO;
  const [colidindo, setColidindo] = useState<Set<number>>(() => new Set());
  const [angulo, setAngulo] = useState<Angulo>("diagonal");
  const [mostrarRotulos, setMostrarRotulos] = useState(true);
  const controles = useRef<any>(null);

  // As cores da cena são constantes JS, não variáveis CSS: sem observar o
  // atributo, o 3D continuaria no tema antigo depois da troca.
  const escuro = useTemaEscuro();
  const paleta = escuro ? ESCURO : CLARO;
  const aoMudar = useCallback((s: Set<number>) => setColidindo(s), []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Ângulo da câmera"
          className="inline-flex gap-1 rounded-[11px] bg-(--color-sunken)/70 p-1"
        >
          {(
            [
              ["planta", "Planta"],
              ["diagonal", "Diagonal"],
              ["rasante", "Rasante"],
            ] as const
          ).map(([v, r]) => (
            <button
              key={v}
              type="button"
              aria-pressed={angulo === v}
              onClick={() => setAngulo(v)}
              className={cn(
                "min-h-9 rounded-lg px-4 text-[13px] font-medium text-(--color-ink-2)",
                "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
                angulo === v &&
                  "bg-(--color-raised) font-semibold text-(--color-ink) shadow-[0_1px_3px_rgba(0,0,0,0.12)]",
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <label className="flex min-h-11 items-center gap-2.5 text-[13px] text-(--color-ink-2)">
          <input
            type="checkbox"
            checked={mostrarRotulos}
            onChange={(e) => setMostrarRotulos(e.target.checked)}
            className="size-4 accent-(--color-focus)"
          />
          Rótulos
        </label>

        <div className="ml-auto flex items-baseline gap-2.5 rounded-[11px] bg-(--color-sunken)/70 px-4 py-2">
          <span className="tnum font-[family-name:var(--font-mono)] text-[19px] font-semibold">
            {colidindo.size}
          </span>
          <span className="text-[12.5px] text-(--color-ink-2)">
            {colidindo.size === 1 ? "rótulo colidindo" : "rótulos colidindo"} neste ângulo
          </span>
        </div>
      </div>

      {/* O Canvas dimensiona pelo ELEMENTO PAI — a altura tem que estar aqui. */}
      <div className="h-[600px] w-full overflow-hidden rounded-2xl bg-(--color-floor) shadow-[inset_0_1px_3px_rgba(0,0,0,0.07)]">
        <Canvas shadows dpr={[1, 2]} camera={{ position: posicaoCamera("diagonal", cenario), fov: 38 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={escuro ? 0.55 : 0.82} />
            <directionalLight
              position={[7, 14, 6]}
              intensity={escuro ? 0.62 : 0.82}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.0006}
              shadow-normalBias={0.03}
              shadow-camera-left={-14}
              shadow-camera-right={14}
              shadow-camera-top={14}
              shadow-camera-bottom={-14}
              shadow-camera-far={44}
            />
            <directionalLight position={[-8, 6, -6]} intensity={0.2} />

            {ambienteId === "varanda" ? (
              <CenarioVaranda escuro={escuro} c={cenario} />
            ) : (
              <CenarioSalao escuro={escuro} c={cenario} />
            )}

            {mesas.map((mesa) => (
              <Mesa3D
                key={mesa.id}
                mesa={mesa}
                estado={derivarEstado(mesa, limiares)}
                paleta={paleta}
                escuro={escuro}
                cenario={cenario}
                colidindo={colidindo.has(mesa.id)}
                mostrarRotulo={mostrarRotulos}
              />
            ))}

            <MedidorDeRotulos mesas={mesas} onChange={aoMudar} />
            <Camera angulo={angulo} controls={controles} cenario={cenario} />
            <OrbitControls
              ref={controles}
              makeDefault
              enablePan={false}
              target={ALVO}
              minPolarAngle={0.01}
              maxPolarAngle={1.44}
              minDistance={7 * cenario.escalaCamera}
              maxDistance={38 * cenario.escalaCamera}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* A cena não é operável por teclado; esta é a via equivalente. */}
      <table className="sr-only">
        <caption>Mesas do salão</caption>
        <thead>
          <tr>
            <th>Mesa</th>
            <th>Situação</th>
            <th>Pessoas</th>
          </tr>
        </thead>
        <tbody>
          {mesas.map((m) => (
            <tr key={m.id}>
              <td>Mesa {m.id}</td>
              <td>{ROTULO_ESTADO[derivarEstado(m, limiares)]}</td>
              <td>{m.pessoas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * O OrbitControls é dono da câmera. Um `lerp` por quadro aqui disputava a
 * mesma posição com ele até empurrar a câmera para dentro da geometria.
 */
function Camera({
  angulo,
  controls,
  cenario,
}: {
  angulo: Angulo;
  controls: React.RefObject<any>;
  cenario: Cenario;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...posicaoCamera(angulo, cenario));
    if (controls.current) {
      controls.current.target.set(...ALVO);
      controls.current.update();
    } else {
      camera.lookAt(...ALVO);
    }
  }, [angulo, camera, controls, cenario]);

  return null;
}

function CenarioSalao({ escuro, c }: { escuro: boolean; c: Cenario }) {
  const piso = escuro ? "#141416" : "#ededf0";
  const parede = escuro ? "#2c2c2e" : "#c9c9d0";

  return (
    <group>
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[c.salaL, 0.12, c.salaP]} />
        <meshLambertMaterial color={piso} />
      </mesh>

      {(
        [
          [0, -c.salaP / 2, c.salaL, 0.2],
          [0, c.salaP / 2, c.salaL, 0.2],
          [-c.salaL / 2, 0, 0.2, c.salaP],
          [c.salaL / 2, 0, 0.2, c.salaP],
        ] as const
      ).map(([x, z, w, d], i) => (
        // Paredes na altura de um balcão: delimitam a sala sem esconder as
        // mesas do fundo nem lançar sombra sobre metade do salão.
        <mesh key={i} position={[x, 0.45, z]} castShadow receiveShadow>
          <boxGeometry args={[w, 0.9, d]} />
          <meshLambertMaterial color={parede} />
        </mesh>
      ))}

      <Palco escuro={escuro} c={c} />
      <Banheiros escuro={escuro} c={c} />
      <Bar escuro={escuro} c={c} />
    </group>
  );
}

/** Palco fictício no fundo do salão. */
function Palco({ escuro, c }: { escuro: boolean; c: Cenario }) {
  const tabua = escuro ? "#3a2f26" : "#9d8569";
  const borda = escuro ? "#4a3c30" : "#7d6950";
  const z = -c.salaP / 2 + 2.2;

  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 0.34, 3.4]} />
        <meshLambertMaterial color={tabua} />
      </mesh>
      {/* Faixa frontal: marca a quina do praticável, que é onde se tropeça. */}
      <mesh position={[0, 0.17, 1.72]} castShadow>
        <boxGeometry args={[8.04, 0.36, 0.06]} />
        <meshLambertMaterial color={borda} />
      </mesh>
      {/* Degrau de acesso. */}
      <mesh position={[0, 0.07, 1.95]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.16, 0.5]} />
        <meshLambertMaterial color={borda} />
      </mesh>
    </group>
  );
}

/** Duas portas de banheiro na parede direita, com pictogramas. */
function Banheiros({ escuro, c }: { escuro: boolean; c: Cenario }) {
  const x = c.salaL / 2 - 0.12;

  return (
    <group>
      <Porta x={x} z={-0.9} escuro={escuro} genero="masculino" />
      <Porta x={x} z={1.3} escuro={escuro} genero="feminino" />
    </group>
  );
}

function Porta({
  x,
  z,
  escuro,
  genero,
}: {
  x: number;
  z: number;
  escuro: boolean;
  genero: "masculino" | "feminino";
}) {
  const folha = escuro ? "#3b3b3f" : "#b4b4bc";
  const placa = escuro ? "#5a5a60" : "#f5f5f7";
  const icone = escuro ? "#15151a" : "#2a2a2e";

  return (
    <group position={[x, 0, z]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 1.76, 0.1]} />
        <meshLambertMaterial color={folha} />
      </mesh>

      <mesh position={[0, 1.3, 0.07]}>
        <boxGeometry args={[0.42, 0.5, 0.02]} />
        <meshLambertMaterial color={placa} />
      </mesh>

      <group position={[0, 1.3, 0.1]}>
        {/* Cabeça: comum aos dois. */}
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshLambertMaterial color={icone} />
        </mesh>

        {genero === "masculino" ? (
          <>
            <mesh position={[0, -0.01, 0]}>
              <boxGeometry args={[0.2, 0.22, 0.02]} />
              <meshLambertMaterial color={icone} />
            </mesh>
            <mesh position={[-0.05, -0.19, 0]}>
              <boxGeometry args={[0.065, 0.17, 0.02]} />
              <meshLambertMaterial color={icone} />
            </mesh>
            <mesh position={[0.05, -0.19, 0]}>
              <boxGeometry args={[0.065, 0.17, 0.02]} />
              <meshLambertMaterial color={icone} />
            </mesh>
          </>
        ) : (
          <>
            {/*
              Cone EM PÉ: apex nos ombros, base na barra. Deitado e com três
              segmentos ele virava um tetraedro e a silhueta se desmanchava.
            */}
            <mesh position={[0, -0.04, 0]}>
              <coneGeometry args={[0.145, 0.3, 24]} />
              <meshLambertMaterial color={icone} />
            </mesh>
            <mesh position={[-0.055, -0.27, 0]}>
              <boxGeometry args={[0.055, 0.14, 0.02]} />
              <meshLambertMaterial color={icone} />
            </mesh>
            <mesh position={[0.055, -0.27, 0]}>
              <boxGeometry args={[0.055, 0.14, 0.02]} />
              <meshLambertMaterial color={icone} />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}

function Bar({ escuro, c }: { escuro: boolean; c: Cenario }) {
  const corpo = escuro ? "#2a2a2e" : "#c4c4cc";
  const tampo = escuro ? "#3a3a40" : "#a8a8b2";

  return (
    <group position={[c.salaL / 2 - 1.5, 0, 5.4]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.1, 5]} />
        <meshLambertMaterial color={corpo} />
      </mesh>
      <mesh position={[0, 1.13, 0]} castShadow>
        <boxGeometry args={[1.7, 0.08, 5.2]} />
        <meshLambertMaterial color={tampo} />
      </mesh>
    </group>
  );
}

/**
 * A varanda é um deck aberto, não uma sala. Em vez de paredes, guarda-corpo
 * vazado na altura regulamentar; em vez de palco e bar, jardineiras. Mostrar
 * a varanda dentro das paredes do salão descrevia um lugar que não existe.
 */
function CenarioVaranda({ escuro, c }: { escuro: boolean; c: Cenario }) {
  const deck = escuro ? "#1d1a17" : "#d8cbb8";
  const ripa = escuro ? "#17150f" : "#c3b49e";
  const poste = escuro ? "#3a352e" : "#8d8275";
  const corrimao = escuro ? "#4a443b" : "#6f665b";
  const vaso = escuro ? "#2e2a25" : "#a8998a";
  const folha = escuro ? "#2f4434" : "#5f8a62";

  const meiaL = c.salaL / 2;
  const meiaP = c.salaP / 2;

  // Ripas do deck: marcam a direção do piso e diferenciam de um chão liso.
  const ripas = Math.floor(c.salaP / 0.45);

  return (
    <group>
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[c.salaL, 0.12, c.salaP]} />
        <meshLambertMaterial color={deck} />
      </mesh>

      {Array.from({ length: ripas }, (_, i) => (
        <mesh key={i} position={[0, 0.006, -meiaP + 0.225 + i * 0.45]}>
          <boxGeometry args={[c.salaL - 0.1, 0.004, 0.035]} />
          <meshLambertMaterial color={ripa} />
        </mesh>
      ))}

      {/*
        Guarda-corpo em três lados; o quarto (fundo) é a passagem para o
        salão. Montantes a cada 1,2 m com travessa superior e intermediária.
      */}
      <Guarda lados={["frente", "esquerda", "direita"]} c={c} poste={poste} corrimao={corrimao} />

      {(
        [
          [-meiaL + 0.7, -meiaP + 0.7],
          [meiaL - 0.7, -meiaP + 0.7],
          [-meiaL + 0.7, meiaP - 0.9],
          [meiaL - 0.7, meiaP - 0.9],
        ] as const
      ).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.32, 0.26, 0.6, 16]} />
            <meshLambertMaterial color={vaso} />
          </mesh>
          <mesh position={[0, 0.78, 0]} castShadow>
            <sphereGeometry args={[0.36, 16, 12]} />
            <meshLambertMaterial color={folha} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Guarda({
  lados,
  c,
  poste,
  corrimao,
}: {
  lados: ("frente" | "esquerda" | "direita")[];
  c: Cenario;
  poste: string;
  corrimao: string;
}) {
  const H = 1.05;
  const meiaL = c.salaL / 2;
  const meiaP = c.salaP / 2;

  const trechos = lados.map((lado) => {
    if (lado === "frente") return { pos: [0, 0, meiaP] as const, rot: 0, comp: c.salaL };
    if (lado === "esquerda") return { pos: [-meiaL, 0, 0] as const, rot: Math.PI / 2, comp: c.salaP };
    return { pos: [meiaL, 0, 0] as const, rot: Math.PI / 2, comp: c.salaP };
  });

  return (
    <group>
      {trechos.map((t, i) => {
        const n = Math.max(2, Math.round(t.comp / 1.2));
        return (
          <group key={i} position={[t.pos[0], 0, t.pos[2]]} rotation={[0, t.rot, 0]}>
            <mesh position={[0, H, 0]} castShadow>
              <boxGeometry args={[t.comp, 0.07, 0.07]} />
              <meshLambertMaterial color={corrimao} />
            </mesh>
            <mesh position={[0, H * 0.55, 0]} castShadow>
              <boxGeometry args={[t.comp, 0.045, 0.045]} />
              <meshLambertMaterial color={corrimao} />
            </mesh>
            {Array.from({ length: n + 1 }, (_, k) => (
              <mesh
                key={k}
                position={[-t.comp / 2 + (k * t.comp) / n, H / 2, 0]}
                castShadow
              >
                <boxGeometry args={[0.07, H, 0.07]} />
                <meshLambertMaterial color={poste} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/** Uma cadeira: assento, encosto e quatro pés. */
function Cadeira({ cor }: { cor: string }) {
  return (
    <group>
      <mesh position={[0, 0.44, 0]} castShadow>
        <boxGeometry args={[0.42, 0.055, 0.42]} />
        <meshLambertMaterial color={cor} />
      </mesh>
      <mesh position={[0, 0.69, 0.185]} castShadow>
        <boxGeometry args={[0.42, 0.46, 0.055]} />
        <meshLambertMaterial color={cor} />
      </mesh>
      {(
        [
          [-0.17, -0.17],
          [0.17, -0.17],
          [-0.17, 0.17],
          [0.17, 0.17],
        ] as const
      ).map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.21, pz]} castShadow>
          <boxGeometry args={[0.04, 0.42, 0.04]} />
          <meshLambertMaterial color={cor} />
        </mesh>
      ))}
    </group>
  );
}

function Mesa3D({
  mesa,
  estado,
  paleta,
  escuro,
  cenario,
  colidindo,
  mostrarRotulo,
}: {
  mesa: Mesa;
  estado: EstadoMesa;
  paleta: Record<EstadoMesa, Par>;
  escuro: boolean;
  cenario: Cenario;
  colidindo: boolean;
  mostrarRotulo: boolean;
}) {
  const { fill, stroke } = paleta[estado];
  const raioX = ms(mesa.largura) / 2;
  const raioZ = ms(mesa.altura) / 2;
  const redonda = mesa.forma === "redonda";
  const glifo = GLIFO_ESTADO[estado];
  const alerta = estado === "alerta1" || estado === "alerta2";

  const vazia = escuro ? "#3c4046" : "#c6c6ce";
  const ocupada = escuro ? "#8a949f" : "#5c6470";

  // Cadeiras do lado de fora da mesa; as preenchidas contam pessoas.
  const cadeiras = useMemo(() => {
    const folga = 0.36;
    const out: { x: number; z: number; rot: number; ocupada: boolean }[] = [];

    for (let i = 0; i < mesa.lugares; i++) {
      let cx: number;
      let cz: number;

      if (redonda) {
        const a = (i / mesa.lugares) * Math.PI * 2 - Math.PI / 2;
        cx = Math.cos(a) * (raioX + folga);
        cz = Math.sin(a) * (raioZ + folga);
      } else {
        const porLado = Math.ceil(mesa.lugares / 2);
        const lado = i < porLado ? -1 : 1;
        const idx = i < porLado ? i : i - porLado;
        const n = i < porLado ? porLado : mesa.lugares - porLado;
        const f = (idx + 1) / (n + 1) - 0.5;

        if (raioZ > raioX) {
          cx = lado * (raioX + folga);
          cz = f * raioZ * 2;
        } else {
          cx = f * raioX * 2;
          cz = lado * (raioZ + folga);
        }
      }

      out.push({
        x: cx,
        z: cz,
        // A cadeira olha para a mesa.
        rot: Math.atan2(cx, cz) + Math.PI,
        ocupada: i < mesa.pessoas,
      });
    }

    return out;
  }, [mesa.lugares, mesa.pessoas, raioX, raioZ, redonda]);

  return (
    <group position={[mx(mesa.x, cenario), 0, mz(mesa.y, cenario)]}>
      {cadeiras.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.rot, 0]}>
          <Cadeira cor={c.ocupada ? ocupada : vazia} />
        </group>
      ))}

      <mesh position={[0, ALTURA_TAMPO - ESPESSURA_TAMPO * 0.62, 0]} castShadow>
        {redonda ? (
          <cylinderGeometry args={[raioX * 1.1, raioX * 1.1, 0.034, 40]} />
        ) : (
          <boxGeometry args={[raioX * 2 + 0.1, 0.034, raioZ * 2 + 0.1]} />
        )}
        <meshLambertMaterial color={stroke} />
      </mesh>

      <mesh name={`mesa-${mesa.id}`} position={[0, ALTURA_TAMPO, 0]} castShadow receiveShadow>
        {redonda ? (
          <cylinderGeometry args={[raioX, raioX, ESPESSURA_TAMPO, 40]} />
        ) : (
          <boxGeometry args={[raioX * 2, ESPESSURA_TAMPO, raioZ * 2]} />
        )}
        <meshLambertMaterial color={fill} />
      </mesh>

      <mesh position={[0, (ALTURA_TAMPO - ESPESSURA_TAMPO) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.09, ALTURA_TAMPO - ESPESSURA_TAMPO, 14]} />
        <meshLambertMaterial color={stroke} />
      </mesh>

      {/*
        Sem `distanceFactor`: tamanho de tela constante. Com ele, os rótulos
        encolhiam com a distância e se empilhavam numa mancha ilegível.
      */}
      {mostrarRotulo && (
        <Html
          position={[0, ALTURA_TAMPO + 0.34, 0]}
          center
          zIndexRange={[20, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1",
              "bg-(--color-surface) text-[11px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25)]",
              "transition-opacity duration-150",
              colidindo && "opacity-35",
            )}
          >
            <span
              className="size-2.5 flex-none rounded-full"
              style={{ background: fill, boxShadow: `inset 0 0 0 2px ${stroke}` }}
            />
            <span>{mesa.id}</span>
            {glifo && <span aria-hidden>{glifo}</span>}
            {alerta && (
              <span className="tnum font-[family-name:var(--font-mono)]">{mesa.semPedido}′</span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * MEDE COLISÃO DE RÓTULO, e não oclusão — e a troca tem uma história.
 *
 * A primeira versão media oclusão geométrica: raycast da câmera até cada
 * tampo. Ela marcava zero em todos os ângulos, e estava certa: os tampos são
 * discos finos a 74 cm e a câmera nunca desce abaixo deles, então o raio até
 * uma mesa distante passa por cima das próximas. Oclusão de tampo, nesta
 * sala, é desprezível.
 *
 * O que realmente degrada ao inclinar a câmera é o RÓTULO. Em perspectiva as
 * mesas do fundo se aproximam na tela e os rótulos se empilham. Um medidor
 * que marcasse sempre zero sugeriria que a perspectiva não custa nada — o
 * contrário do que a tela mostra.
 *
 * A projeção é por ponto de âncora, aproximando cada rótulo por uma caixa
 * fixa. É estimativa, não medição de DOM: subestima rótulos largos, como os
 * que trazem o numeral de minutos.
 */
const LARGURA_ROTULO = 74;
const ALTURA_ROTULO = 24;

function MedidorDeRotulos({
  mesas,
  onChange,
}: {
  mesas: Mesa[];
  onChange: (s: Set<number>) => void;
}) {
  const { scene, camera, size } = useThree();
  const anterior = useRef("");
  const quadro = useRef(0);

  useFrame(() => {
    if (quadro.current++ % 6 !== 0) return;

    const pontos: { id: number; x: number; y: number }[] = [];
    const v = new THREE.Vector3();

    for (const mesa of mesas) {
      const tampo = scene.getObjectByName(`mesa-${mesa.id}`);
      if (!tampo) continue;

      tampo.getWorldPosition(v);
      v.y += 0.34;
      v.project(camera);
      if (v.z > 1) continue;

      pontos.push({
        id: mesa.id,
        x: (v.x * 0.5 + 0.5) * size.width,
        y: (-v.y * 0.5 + 0.5) * size.height,
      });
    }

    const colidindo = new Set<number>();
    for (let i = 0; i < pontos.length; i++) {
      for (let j = i + 1; j < pontos.length; j++) {
        const a = pontos[i];
        const b = pontos[j];
        if (Math.abs(a.x - b.x) < LARGURA_ROTULO && Math.abs(a.y - b.y) < ALTURA_ROTULO) {
          colidindo.add(a.id);
          colidindo.add(b.id);
        }
      }
    }

    const chave = [...colidindo].sort((a, b) => a - b).join(",");
    if (chave !== anterior.current) {
      anterior.current = chave;
      onChange(colidindo);
    }
  });

  return null;
}
