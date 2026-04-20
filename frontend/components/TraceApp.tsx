import { useSearchParams } from "react-router-dom";
import { TraceBrowser } from "./TraceBrowser";
import { TraceViewer } from "./TraceViewer";

export function TraceApp() {
  const [params, setParams] = useSearchParams();
  const tracePath = params.get("trace");

  return (
    <div className="app-layout">
      <TraceBrowser />
      <main className="app-main">
        {tracePath ? (
          <TraceViewer />
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
