import type { Metadata } from "next";
import { Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ocupação do salão",
  description: "Mapa de mesas em tempo real para o salão do restaurante.",
};

/*
  Roda antes da primeira pintura: sem isto a página carrega no tema padrão e
  salta para o escolhido quando o React hidrata. O padrão é "claro" e precisa
  ser o mesmo valor inicial do hook `useTema`, senão os dois discordam.
*/
const SCRIPT_TEMA = `
(function () {
  try {
    var t = localStorage.getItem("tema") || "claro";
    var escuro =
      t === "escuro" ||
      (t === "sistema" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = escuro ? "dark" : "light";
  } catch (e) {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="font-[family-name:var(--font-sans)]">{children}</body>
    </html>
  );
}
