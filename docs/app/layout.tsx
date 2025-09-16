import type { Metadata } from "next";
import { ThemeProvider } from "@/components/contexts/theme-provider";
import { Navbar } from "@/components/navbar";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Footer } from "@/components/footer";
import "@/styles/globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Shellviz",
  metadataBase: new URL("https://shellviz.com"),
  description: "Shellviz is a data visualization tool that uses your phone as an interactive second screen, allowing you to upload and explore data to it from your Javascript or Python scripts", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://unpkg.com/shellviz@0.5.0-beta.3"
          // src="http://localhost:4005/build/browser_client.umd.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-regular antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="sm:container mx-auto w-[90vw] h-auto scroll-smooth">
            {children}
          </main>
          {/* <Footer /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
