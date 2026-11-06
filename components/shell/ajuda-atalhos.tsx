"use client";

import { useState } from "react";
import type { Salao } from "@/hooks/use-salao";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Kbd } from "../ui/kbd";
import { Separator } from "../ui/separator";
import { Chave } from "./menu-exibicao";

const ATALHOS: { teclas: string[]; texto: string }[] = [
  { teclas: ["PgUp", "PgDn"], texto: "Trocar de salão" },
  { teclas: ["T"], texto: "Todas as mesas" },
  { teclas: ["L"], texto: "Só livres" },
  { teclas: ["A"], texto: "Só atenção" },
  { teclas: ["F"], texto: "Tela cheia" },
  { teclas: ["1", "2", "3"], texto: "Câmera aérea, perspectiva, nível" },
  { teclas: ["/"], texto: "Buscar mesa" },
  { teclas: ["Esc"], texto: "Fechar ou limpar seleção" },
];

interface AjudaAtalhosProps {
  aberto: boolean;
  onAbrir: (v: boolean) => void;
  atalhosLigados: boolean;
  onAtalhos: (v: boolean) => void;
  camera: Salao["camera"];
}

/** Atalhos de teclado e as duas ações da câmera que não cabem na barra. */
export function AjudaAtalhos({ aberto, onAbrir, atalhosLigados, onAtalhos, camera }: AjudaAtalhosProps) {
  const [vistaSalva, setVistaSalva] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={onAbrir}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Atalhos</DialogTitle>
          <DialogDescription>Teclado e vista padrão da câmera.</DialogDescription>
        </DialogHeader>

        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {ATALHOS.map((a) => (
            <li key={a.texto} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{a.texto}</span>
              <span className="flex flex-none gap-1">
                {a.teclas.map((t) => (
                  <Kbd key={t}>{t}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>

        <Chave ligada={atalhosLigados} onChange={onAtalhos} rotulo="Atalhos de tecla única" />

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              camera.salvarVista();
              setVistaSalva(true);
              setTimeout(() => setVistaSalva(false), 1200);
            }}
          >
            {vistaSalva ? "Vista salva" : "Salvar vista atual como padrão"}
          </Button>
          <Button variant="ghost" size="sm" onClick={camera.limparVista}>
            Restaurar vista de fábrica
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
