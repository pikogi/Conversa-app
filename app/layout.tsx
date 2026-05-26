import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conversa — Hello, Stranger.",
  description: "Grupos de conversación en inglés para los que quieren algo más que un idioma.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col pb-16 sm:pb-0">{children}</body>
    </html>
  );
}
