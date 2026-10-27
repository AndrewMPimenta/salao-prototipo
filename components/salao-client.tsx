"use client";

import { useMemo, useRef, useState } from "react";
import type { Ambiente, Limiares, Mesa } from "@/lib/types";
import { useAtalhos } from "@/hooks/use-atalhos";
import { useMidia } from "@/hooks/use-midia";
import { useSalao } from "@/hooks/use-salao";
import { useTelaCheia } from "@/hooks/use-tela-cheia";
import { LayoutDesktop } from "./shell/layout-desktop";
import { LayoutMovel } from "./shell/layout-movel";

interface SalaoClientProps {
  mesas: Mesa[];
  ambientes: Ambiente[];
  limiares: Limiares;
}

/**
 * A cena 3D ocupa a tela inteira e toda a interface flutua sobre ela. Desktop
 * e celular compartilham o estado (`useSalao`) e diferem só na composição.
 */
export function SalaoClient({ mesas, ambientes, limiares }: SalaoClientProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const desktop = useMidia("(min-width: 1024px)");
  const salao = useSalao(mesas, ambientes, limiares);
  const tela = useTelaCheia(raiz);
  const [atalhosLigados, setAtalhosLigados] = useState(true);

  const { definirRapido, ciclarAmbiente, selecionar, selecionada } = salao;
  const { alternar, sairImersivo, imersivo } = tela;
  const definirPreset = salao.camera.setVistaCamera;

  useAtalhos(
    useMemo(
      () => ({
        t: () => definirRapido("todas"),
        l: () => definirRapido("livres"),
        a: () => definirRapido("atencao"),
        f: alternar,
        "1": () => definirPreset("aerea"),
        "2": () => definirPreset("perspectiva"),
        "3": () => definirPreset("nivel"),
        pageup: () => ciclarAmbiente(-1),
        pagedown: () => ciclarAmbiente(1),
        escape: () => (imersivo ? sairImersivo() : selecionada !== null && selecionar(null)),
      }),
      [definirRapido, alternar, definirPreset, ciclarAmbiente, imersivo, sairImersivo, selecionada, selecionar],
    ),
    atalhosLigados,
  );

  const propsLayout = {
    salao,
    imersivo,
    telaCheia: { ativo: tela.ativo, imersivoNoLugar: !tela.suportado, alternar },
    atalhos: { ligados: atalhosLigados, definir: setAtalhosLigados },
  };

  return (
    <div ref={raiz} className="relative h-full w-full overflow-clip bg-(--color-app)">
      {desktop === true && <LayoutDesktop {...propsLayout} />}
      {desktop === false && <LayoutMovel {...propsLayout} />}
    </div>
  );
}
