import { useSearchParams } from "react-router-dom";
import { useTrace } from "../../hooks/useTrace";
import { useNavigation } from "../../hooks/useNavigation";
import { useKeyboard } from "../../hooks/useKeyboard";
import { NavigationBar } from "./NavigationBar";
import { LinesPanel } from "./LinesPanel";
import { EnvPanel } from "./EnvPanel";

export function TraceViewer() {
  const [params, setParams] = useSearchParams();
  const tracePath = params.get("trace");
  const stepParam = parseInt(params.get("step") ?? "0") || 0;

  const { trace, loading, error } = useTrace(tracePath);

  const setStep = (i: number) => setParams((p) => { p.set("step", String(i)); return p; });
  const { stepForward, stepBackward, stepOverForward, stepOverBackward, stepUp } =
    useNavigation(trace, stepParam, setStep);

  const rawMode = params.get("raw") === "1";
  const animateMode = params.get("animate") !== "0"; // on by default
  const hideEnv = params.get("hideEnv") === "1";
  const showNotes = params.get("showNotes") === "1";

  const toggle = (key: string, val: string) =>
    setParams((p) => { p.get(key) ? p.delete(key) : p.set(key, val); return p; });
  const toggleAnimate = () =>
    setParams((p) => { animateMode ? p.set("animate", "0") : p.delete("animate"); return p; });

  useKeyboard({
    ArrowRight: stepForward, l: stepForward,
    ArrowLeft: stepBackward, h: stepBackward,
    "Shift+ArrowRight": stepOverForward, j: stepOverForward,
    "Shift+ArrowLeft": stepOverBackward, k: stepOverBackward,
    u: stepUp,
    R: () => toggle("raw", "1"),
    A: toggleAnimate,
    E: () => toggle("hideEnv", "1"),
    N: () => toggle("showNotes", "1"),
  }, [trace, stepParam, rawMode, animateMode, hideEnv, showNotes]);

  if (!tracePath) return null;
  if (loading) return <div className="status-msg">Loading…</div>;
  if (error) return (
    <div className="error-msg">
      <h2>Failed to load trace</h2>
      <p>{error}</p>
    </div>
  );
  if (!trace) return null;

  const stepIndex = Math.min(stepParam, trace.steps.length - 1);
  const step = trace.steps[stepIndex];
  const frame = step?.stack.at(-1);
  const currentPath = frame?.path ?? Object.keys(trace.files)[0];
  const currentLine = frame?.line_number ?? 1;

  const gotoLine = (ln: number) => {
    const dir = ln > currentLine ? 1 : -1;
    let i = stepIndex + dir;
    while (i >= 0 && i < trace.steps.length) {
      const f = trace.steps[i].stack.at(-1);
      if (f?.path === currentPath && f.line_number === ln) {
        setStep(i);
        return;
      }
      i += dir;
    }
    setParams((p) => { p.set("step", String(stepIndex)); return p; });
  };

  const gotoLocation = (path: string, ln: number) => {
    setParams((p) => {
      const i = trace.steps.findIndex((s) => {
        const f = s.stack.at(-1);
        return f?.path === path && f.line_number === ln;
      });
      if (i >= 0) p.set("step", String(i));
      return p;
    });
  };

  return (
    <div className="viewer-layout">
      <NavigationBar
        path={currentPath}
        stepIndex={stepIndex}
        totalSteps={trace.steps.length}
        rawMode={rawMode}
        animateMode={animateMode}
        hideEnv={hideEnv}
        showNotes={showNotes}
        onStepForward={stepForward}
        onStepBackward={stepBackward}
        onStepOverForward={stepOverForward}
        onStepOverBackward={stepOverBackward}
        onStepUp={stepUp}
        onToggleRaw={() => toggle("raw", "1")}
        onToggleAnimate={toggleAnimate}
        onToggleEnv={() => toggle("hideEnv", "1")}
        onToggleNotes={() => toggle("showNotes", "1")}
      />
      <div className="viewer-body">
        <LinesPanel
          trace={trace}
          path={currentPath}
          lineNumber={currentLine}
          stepIndex={stepIndex}
          rawMode={rawMode}
          animateMode={animateMode}
          showNotes={showNotes}
          onGotoLine={gotoLine}
          onGotoLocation={gotoLocation}
        />
        {!hideEnv && <EnvPanel trace={trace} stepIndex={stepIndex} />}
      </div>
      {trace.metadata.error && (
        <div className="trace-error-banner">
          ⚠ Execution raised {trace.metadata.error.exception_type}: {trace.metadata.error.message}
        </div>
      )}
    </div>
  );
}
