import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/common/Header";

export const metadata: Metadata = {
  title: "Aptos Transaction Simulator | MVP",
  description: "Simulate Aptos blockchain transactions before execution to preview gas usage and detect errors in advance.",
  keywords: "Aptos, blockchain, transaction, simulation, gas, error, preview",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <div className="h-screen flex flex-col">
          <Header />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}