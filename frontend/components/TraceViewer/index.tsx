import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTrace } from "../../hooks/useTrace";
import { useNavigation } from "../../hooks/useNavigation";
import { useKeyboard } from "../../hooks/useKeyboard";
import { useSwipe } from "../../hooks/useSwipe";
import { NavigationBar } from "./NavigationBar";
import { LinesPanel } from "./LinesPanel";
import { EnvPanel } from "./EnvPanel";
import { MobileBottomNav } from "./MobileBottomNav";
import { ChevronDownIcon, ChevronUpIcon } from "../icons";

interface Props {
  onToggleSidebar: () => void;
}

export function TraceViewer({ onToggleSidebar }: Props) {
  const [params, setParams] = useSearchParams();
  const tracePath = params.get("trace");
  const stepParam = parseInt(params.get("step") ?? "0") || 0;

  const { trace, loading, error } = useTrace(tracePath);

  const setStep = (i: number) => setParams((p) => { p.set("step", String(i)); return p; });
  const { stepForward, stepBackward, stepOverForward, stepOverBackward, stepUp } =
    useNavigation(trace, stepParam, setStep);

  const rawMode = params.get("raw") === "1";
  const animateMode = params.get("animate") !== "0";
  const hideEnv = params.get("hideEnv") === "1";

  const toggle = (key: string, val: string) =>
    setParams((p) => { p.get(key) ? p.delete(key) : p.set(key, val); return p; });
  const toggleAnimate = () =>
    setParams((p) => { animateMode ? p.set("animate", "0") : p.delete("animate"); return p; });

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Resizable env panel (desktop)
  const [envWidth, setEnvWidth] = useState(380);
  const resizeRef = useRef({ active: false, startX: 0, startW: 380 });
  const [mobileEnvOpen, setMobileEnvOpen] = useState(false);

  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { active: true, startX: e.clientX, startW: envWidth };
    document.body.classList.add("resizing");
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current.active) return;
      const delta = e.clientX - resizeRef.current.startX;
      setEnvWidth(Math.max(160, Math.min(520, resizeRef.current.startW - delta)));
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

  // Swipe to step on mobile
  const swipe = useSwipe(stepForward, stepBackward);

  useKeyboard({
    ArrowRight: stepForward, l: stepForward,
    ArrowLeft: stepBackward, h: stepBackward,
    "Shift+ArrowRight": stepOverForward, j: stepOverForward,
    "Shift+ArrowLeft": stepOverBackward, k: stepOverBackward,
    u: stepUp,
    R: () => toggle("raw", "1"),
    A: toggleAnimate,
    E: () => toggle("hideEnv", "1"),
    F: toggleFullscreen,
  }, [trace, stepParam, rawMode, animateMode, hideEnv, isFullscreen]);

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

  const entryDefLine = (() => {
    if (stepIndex !== 0) return null;
    const fn = trace.steps[0]?.stack.at(-1)?.function_name;
    if (!fn) return null;
    const lines = (trace.files[currentPath] ?? "").split("\n");
    const idx = lines.findIndex(l => {
      const t = l.trimStart();
      return t.startsWith(`def ${fn}(`) || t.startsWith(`async def ${fn}(`);
    });
    return idx >= 0 ? idx + 1 : null;
  })();

  const hasEnvContent = !hideEnv &&
    trace.steps.slice(0, stepIndex + 1).some(s => Object.keys(s.env).length > 0);

  const gotoLine = (ln: number) => {
    const dir = ln > currentLine ? 1 : -1;
    let i = stepIndex + dir;
    while (i >= 0 && i < trace.steps.length) {
      const f = trace.steps[i].stack.at(-1);
      if (f?.path === currentPath && f.line_number === ln) { setStep(i); return; }
      i += dir;
    }
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

  const envVarCount = Object.keys(
    trace.steps.slice(0, stepIndex + 1).reduce((acc, s) => ({ ...acc, ...s.env }), {})
  ).length;

  return (
    <div className="viewer-layout">
      <NavigationBar
        path={currentPath}
        title={trace.metadata.title}
        stepIndex={stepIndex}
        totalSteps={trace.steps.length}
        rawMode={rawMode}
        animateMode={animateMode}
        hideEnv={hideEnv}
        isFullscreen={isFullscreen}
        onToggleSidebar={onToggleSidebar}
        onStepForward={stepForward}
        onStepBackward={stepBackward}
        onStepOverForward={stepOverForward}
        onStepOverBackward={stepOverBackward}
        onStepUp={stepUp}
        onToggleRaw={() => toggle("raw", "1")}
        onToggleAnimate={toggleAnimate}
        onToggleEnv={() => toggle("hideEnv", "1")}
        onToggleFullscreen={toggleFullscreen}
      />
      <div className="viewer-body">
        <div
          className="viewer-code"
          onTouchStart={swipe.onTouchStart}
          onTouchEnd={swipe.onTouchEnd}
        >
          <LinesPanel
            trace={trace}
            path={currentPath}
            lineNumber={currentLine}
            stepIndex={stepIndex}
            rawMode={rawMode}
            animateMode={animateMode}
            entryDefLine={entryDefLine}
            onGotoLine={gotoLine}
            onGotoLocation={gotoLocation}
          />
        </div>
        {hasEnvContent && (
          <>
            <div className="viewer-resize-handle" onMouseDown={onResizeStart} />
            <div className="env-wrapper" style={{ width: envWidth }}>
              <div
                className="mobile-env-header"
                onClick={() => setMobileEnvOpen(o => !o)}
                role="button"
                aria-expanded={mobileEnvOpen}
              >
                <span>Variables {envVarCount > 0 ? `(${envVarCount})` : ""}</span>
                {mobileEnvOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
              </div>
              <div className={`env-panel-wrap${mobileEnvOpen ? "" : " env-panel-wrap--closed"}`}>
                <EnvPanel trace={trace} stepIndex={stepIndex} />
              </div>
            </div>
          </>
        )}
      </div>
      <MobileBottomNav
        onStepBackward={stepBackward}
        onStepForward={stepForward}
        onStepOverBackward={stepOverBackward}
        onStepOverForward={stepOverForward}
        onStepUp={stepUp}
      />
      {trace.metadata.error && (
        <div className="trace-error-banner">
          ⚠ Execution raised {trace.metadata.error.exception_type}: {trace.metadata.error.message}
        </div>
      )}
    </div>
  );
}
