"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Ambiente, Limiares } from "@/lib/types";
import { useAtalhos } from "@/hooks/use-atalhos";
import { useMidia } from "@/hooks/use-midia";
import { useSalao } from "@/hooks/use-salao";
import { useTelaCheia } from "@/hooks/use-tela-cheia";
import { cn } from "@/lib/utils";
import { AjudaAtalhos, precarregarTardias } from "./carregamento-tardio";
import { AppSidebar } from "./shell/app-sidebar";
import { LayoutDesktop } from "./shell/layout-desktop";
import { LayoutMovel } from "./shell/layout-movel";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";

interface SalaoClientProps {
  ambientes: Ambiente[];
  limiares: Limiares;
}

/**
 * Casca no padrão do shadcn: sidebar de altura inteira e, ao lado, o SidebarInset com cabeçalho e conteúdo. Desktop e
 * celular compartilham o estado (`useSalao`) e a sidebar (que no celular vira uma folha) e diferem só no conteúdo.
 */
export function SalaoClient({ ambientes, limiares }: SalaoClientProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const buscaRef = useRef<HTMLInputElement>(null);
  const desktop = useMidia("(min-width: 1024px)");
  const salao = useSalao(ambientes, limiares);
  const tela = useTelaCheia(raiz);
  const [atalhosLigados, setAtalhosLigados] = useState(true);
  const [ajudaAberta, setAjudaAberta] = useState(false);
  const [ajudaUsada, setAjudaUsada] = useState(false);
  const abrirAjuda = () => {
    setAjudaUsada(true);
    setAjudaAberta(true);
  };

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

  // Depois da primeira pintura, com o navegador ocioso, traz o que o primeiro clique vai precisar.
  useEffect(() => {
    const ocioso = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 1500));
    const id = ocioso(precarregarTardias);
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(id);
  }, []);

  // Cmd/Ctrl+K e "/" levam ao campo de busca do cabeçalho; "?" abre os atalhos.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        buscaRef.current?.focus();
        return;
      }
      const alvo = e.target as HTMLElement | null;
      const digitando = ["input", "textarea", "select"].includes(alvo?.tagName.toLowerCase() ?? "");
      if (!atalhosLigados || digitando || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        buscaRef.current?.focus();
      } else if (e.key === "?") {
        setAjudaUsada(true);
        setAjudaAberta((v) => !v);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [atalhosLigados]);

  // Decidir o layout só no cliente evita que o celular pisque a composição de desktop.
  if (desktop === null) return <div ref={raiz} className="h-svh w-full bg-background" />;

  const propsLayout = {
    salao,
    imersivo,
    telaCheia: { ativo: tela.ativo, imersivoNoLugar: !tela.suportado, alternar },
  };

  return (
    <div ref={raiz} className="h-svh w-full overflow-hidden bg-background">
      <SidebarProvider data-imersivo={imersivo || undefined} className="h-svh min-h-0 data-imersivo:[&_[data-slot=sidebar]]:hidden">
        <AppSidebar salao={salao} telaCheia={propsLayout.telaCheia} onAjuda={abrirAjuda} />
        <SidebarInset className={cn("min-h-0 min-w-0 overflow-hidden max-lg:m-0 max-lg:rounded-none max-lg:shadow-none", imersivo && "m-0 rounded-none")}>
          {desktop ? <LayoutDesktop {...propsLayout} buscaRef={buscaRef} /> : <LayoutMovel {...propsLayout} />}
        </SidebarInset>
      </SidebarProvider>

      {ajudaUsada && (
        <AjudaAtalhos
          aberto={ajudaAberta}
          onAbrir={setAjudaAberta}
          atalhosLigados={atalhosLigados}
          onAtalhos={setAtalhosLigados}
          camera={salao.camera}
        />
      )}
    </div>
  );
}
