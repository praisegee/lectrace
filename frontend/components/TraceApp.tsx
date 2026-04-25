import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TraceBrowser } from "./TraceBrowser";
import { TraceViewer } from "./TraceViewer";

export function TraceApp() {
  const [params, setParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      <TraceBrowser open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="app-main">
        {tracePath ? (
          <TraceViewer onToggleSidebar={toggleSidebar} />
        ) : (
          <TracePrompt onSelect={(id) => setParams({ trace: id })} />
        )}
      </main>
    </div>
  );
}

function TracePrompt({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="trace-prompt">
      <h2>Open a Lecture</h2>
      <p>Select a lecture from the sidebar, or type a trace name below.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const val = (e.currentTarget.elements.namedItem("trace") as HTMLInputElement).value.trim();
          if (val) onSelect(val);
        }}
      >
        <input
          name="trace"
          type="text"
          placeholder="e.g. lecture_01 or traces/lecture_01.json"
          autoFocus
          className="trace-input"
        />
        <button type="submit">Open</button>
      </form>
    </div>
  );
}
