"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import "./shell.css";

function Esqueleto() {
  return (
    <div
      role="status"
      className="esqueleto-brilho absolute inset-0 grid place-items-center overflow-hidden bg-(--color-app)"
    >
      <p className="m-0 text-[13px] font-medium text-(--color-ink-3)">Montando o salão…</p>
    </div>
  );
}

// memo: o shell re-renderiza com frequência (busca, painéis); a cena só quando suas props mudam.
const CenaDinamica = dynamic(() => import("../floor-3d").then((m) => m.Floor3D), {
  ssr: false,
  loading: () => <Esqueleto />,
});

export const Cena = memo(CenaDinamica);
