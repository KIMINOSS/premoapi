import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PREMO API Monitor",
  description: "HMC/KMC API Interface Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
