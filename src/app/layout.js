import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/providers/AppProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cholo Research Kori",
  description: "University research collaboration platform for discovery, collaboration, and publication.",
  openGraph: {
    title: "Cholo Research Kori",
    description: "University research collaboration platform for discovery, collaboration, and publication.",
    url: "https://cholo.local/",
    images: ["/logo/icon.png"],
  },
  icons: {
    icon: "/logo/icon.png",
    shortcut: "/logo/icon.png",
    apple: "/logo/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppProvider>
          <div className="flex-1">
            {children}
          </div>
          <footer className="w-full border-t border-[color:var(--border-color)] bg-[color:var(--muted)] py-4">
            <div className="mx-auto max-w-7xl px-4 text-center text-sm text-[color:var(--text-secondary)]">© {new Date().getFullYear()} Cholo Research Kori — Credit: Team 3dot</div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
