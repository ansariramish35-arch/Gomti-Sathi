import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gomti Saathi — AI for Gomti River Water Quality",
  description:
    "Gomti Saathi: a RAG chatbot concept that converts official UPPCB/CPCB water-quality reports into plain-language, location-specific answers for Lucknow residents. Final project — 1M1B AI for Sustainability Virtual Internship with IBM SkillsBuild & AICTE.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
