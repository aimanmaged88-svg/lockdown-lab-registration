import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar, MobileHeader, BottomTabs } from "@/components/nav";
import { RegisterSW } from "@/components/register-sw";

export const metadata: Metadata = {
  title: "UNC Thoughts HQ",
  description: "Private Instagram creator command centre for UNC Thoughts.",
  manifest: "/manifest.webmanifest",
  applicationName: "UNC Thoughts HQ",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "UNC HQ" },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        {/* Fonts self-hosted (declared in globals.css) — no third-party fetch
            in the critical path; full fallback stacks if they're slow. */}
        <link rel="preload" as="font" type="font/woff2" href="/brand/fonts/oswald-latin.woff2" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/woff2" href="/brand/fonts/inter-latin.woff2" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/brand/icon-180.png" />
      </head>
      <body>
        <div className="min-h-screen lg:flex">
          <Sidebar />
          <div className="flex-1 min-w-0">
            <MobileHeader />
            {/* bottom padding clears the phone tab bar */}
            <main className="mx-auto max-w-app px-4 py-6 pb-24 md:px-8 md:py-8 lg:pb-8">{children}</main>
          </div>
        </div>
        <BottomTabs />
        <RegisterSW />
      </body>
    </html>
  );
}
