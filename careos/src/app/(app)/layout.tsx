import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";

/** Authenticated application shell: sidebar, topbar and the content canvas. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        {/* Bottom padding on small screens keeps content clear of the tab bar. */}
        <main id="main" className="surface-gradient min-h-[calc(100vh-4rem)] px-4 pb-28 pt-6 md:px-8 md:pt-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
