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
    <html lang="en">
      <body className="min-h-screen bg-background antialiased" suppressHydrationWarning>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t py-6 md:py-0">
            <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
              <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  Built for the Aptos ecosystem. Made with ❤️ using Next.js and TypeScript.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="https://aptoslabs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Aptos Labs
                </a>
                <a
                  href="https://developer.aptoslabs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Developer Docs
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}