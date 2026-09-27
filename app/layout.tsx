import type { Metadata } from "next"; import "./globals.css";
export const metadata: Metadata={title:"Akteynt AI Manga Translator",description:"AI yordamida manga va manhwa PDF fayllarini o‘zbekchaga tarjima qilish"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="uz"><body>{children}</body></html>}