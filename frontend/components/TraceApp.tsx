import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TraceBrowser } from "./TraceBrowser";
import { TraceViewer } from "./TraceViewer";

function AppLoader() {
  return (
    <div className="app-loader">
      <div className="app-loader-spinner" />
      <span>Loading lectures…</span>
    </div>
  );
}

export function TraceApp() {
  const [params] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const tracePath = params.get("trace");

  const toggleSidebar = () => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    if (isMobile) {
      setDrawerOpen(d => !d);
    } else {
      setSidebarOpen(s => !s);
    }
  };

  return (
    <div className={`app-layout${sidebarOpen ? "" : " sidebar-collapsed"}`}>
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
      )}
      <TraceBrowser open={drawerOpen} onClose={() => setDrawerOpen(false)} onReady={() => setReady(true)} />
      <main className="app-main">
        {!ready && !tracePath
          ? <AppLoader />
          : tracePath && <TraceViewer onToggleSidebar={toggleSidebar} />
        }
      </main>
    </div>
  );
}
