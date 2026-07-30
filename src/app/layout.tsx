import type { Metadata } from "next";
import { Inter, Open_Sans, Roboto, Montserrat, Lato } from "next/font/google";
import "./globals.css";
import { getSystemSettings } from "@/app/actions/system-actions";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" });
const roboto = Roboto({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-roboto" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const lato = Lato({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-lato" });

const fontVarMap: Record<string, string> = {
  inter: inter.variable,
  "open sans": openSans.variable,
  roboto: roboto.variable,
  montserrat: montserrat.variable,
  lato: lato.variable,
};

export const metadata: Metadata = {
    title: "COSEMS-PB | Gestão de Auxílios",
    description: "Sistema de Gestão de Auxílios",
    icons: { icon: '/favicon.svg' },
};

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const settings = await getSystemSettings();
    const selected = settings?.fonte_padrao?.toLowerCase() || 'inter';
    const fontVar = fontVarMap[selected] || inter.variable;
    const fontClass = `font-${selected.replace(' ', '-')}`;

    return (
        <html lang="pt-BR">
            <body className={`${fontVar} ${fontClass}`}>{children}</body>
        </html>
    );
}
