import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TraceBrowser } from "./TraceBrowser";
import { TraceViewer } from "./TraceViewer";

const SIDEBAR_MIN = 160;
const SIDEBAR_MAX = 480;
// Dragging the sidebar narrower than this collapses it.
const SIDEBAR_COLLAPSE = 100;

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
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const resizeRef = useRef({ active: false, startX: 0, startW: 0 });

  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const nav = (e.currentTarget as HTMLElement).previousElementSibling;
    resizeRef.current = { active: true, startX: e.clientX, startW: nav?.getBoundingClientRect().width ?? 0 };
    document.body.classList.add("resizing");
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = resizeRef.current;
      if (!r.active) return;
      const w = r.startW + e.clientX - r.startX;
      if (w < SIDEBAR_COLLAPSE) {
        r.active = false;
        document.body.classList.remove("resizing");
        setSidebarOpen(false);
        return;
      }
      setSidebarWidth(Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, w)));
    };
    const onUp = () => {
      resizeRef.current.active = false;
      document.body.classList.remove("resizing");
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const toggleSidebar = () => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    if (isMobile) {
      setDrawerOpen(d => !d);
    } else {
      setSidebarOpen(s => !s);
    }
  };

  return (
    <div
      className={`app-layout${sidebarOpen ? "" : " sidebar-collapsed"}`}
      style={sidebarWidth ? { "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties : undefined}
    >
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
      )}
      <TraceBrowser open={drawerOpen} onClose={() => setDrawerOpen(false)} onReady={() => setReady(true)} />
      {sidebarOpen && (
        <div className="sidebar-resize-handle" onMouseDown={onResizeStart} title="Drag to resize; drag to the left edge to hide" />
      )}
      <main className="app-main">
        {!ready && !tracePath
          ? <AppLoader />
          : tracePath && <TraceViewer onToggleSidebar={toggleSidebar} />
        }
      </main>
    </div>
  );
}
