import {
  PlayIcon, PauseIcon, CodeIcon, PanelIcon,
  ExpandIcon, CompressIcon,
  StepBackIcon, StepFwdIcon, SkipBackIcon, SkipFwdIcon, StepOutIcon,
  SidebarIcon, WrapIcon,
} from "../icons";
import type { NamedState } from "../../types/trace";

interface Props {
  path: string;
  title: string;
  stepIndex: number;
  totalSteps: number;
  states: NamedState[];
  currentState: number;
  onGotoStep: (i: number) => void;
  rawMode: boolean;
  animateMode: boolean;
  wrapMode: boolean;
  hideEnv: boolean;
  isFullscreen: boolean;
  onToggleSidebar: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onStepOverForward: () => void;
  onStepOverBackward: () => void;
  onStepUp: () => void;
  onToggleRaw: () => void;
  onToggleAnimate: () => void;
  onToggleWrap: () => void;
  onToggleEnv: () => void;
  onToggleFullscreen: () => void;
}

export function NavigationBar({
  path, title, stepIndex, totalSteps, states, currentState, onGotoStep,
  rawMode, animateMode, wrapMode, hideEnv, isFullscreen,
  onToggleSidebar,
  onStepForward, onStepBackward, onStepOverForward, onStepOverBackward, onStepUp,
  onToggleRaw, onToggleAnimate, onToggleWrap, onToggleEnv, onToggleFullscreen,
}: Props) {
  const pct = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="nav-bar">
      <div className="nav-bar-row">
        {/* Mobile: hamburger to open lecture drawer */}
        <button className="nav-hamburger" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <SidebarIcon size={19} />
        </button>

        {/* Mobile: lecture title, or the state picker in its place when there are states */}
        {states.length === 0 && <span className="nav-title">{title}</span>}

        {/* Desktop: file path */}
        <span className="nav-path">{path}</span>

        {states.length > 0 && (
          <StateSelect states={states} current={currentState} onGotoStep={onGotoStep} />
        )}

        <span className="nav-counter">{stepIndex + 1} / {totalSteps}</span>

        <span className="nav-buttons">
          {/* Visible on all screen sizes */}
          <button title="Toggle reveal animation [A]" onClick={onToggleAnimate} className={`nav-btn-animate${animateMode ? " active" : ""}`}>
            {animateMode ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button title="Toggle raw code view [R]" onClick={onToggleRaw} className={`nav-btn-raw${rawMode ? " active" : ""}`}>
            <CodeIcon />
          </button>
          <button title="Toggle line wrapping [W]" onClick={onToggleWrap} className={wrapMode ? "active" : ""}>
            <WrapIcon />
          </button>
          <button title="Toggle variables panel [E]" onClick={onToggleEnv} className={!hideEnv ? "active" : ""}>
            <PanelIcon />
          </button>
          <button
            title={isFullscreen ? "Exit fullscreen [F]" : "Fullscreen presentation [F]"}
            onClick={onToggleFullscreen}
            className={isFullscreen ? "active" : ""}
          >
            {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
          </button>

          {/* Desktop only: separator + step controls */}
          <span className="nav-sep nav-desktop-sep" />
          <span className="nav-step-group">
            <button title="Step backward [← h]" onClick={onStepBackward}><StepBackIcon /></button>
            <button title="Step forward [→ l]" onClick={onStepForward}><StepFwdIcon /></button>
            <button title="Step over backward [Shift+← k]" onClick={onStepOverBackward}><SkipBackIcon /></button>
            <button title="Step over forward [Shift+→ j]" onClick={onStepOverForward}><SkipFwdIcon /></button>
            <button title="Step out of function [u]" onClick={onStepUp}><StepOutIcon /></button>
          </span>
        </span>
      </div>
      <div className="progress-bar" title={`Step ${stepIndex + 1} of ${totalSteps}`}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
        {totalSteps > 1 && states.map((st) => (
          <div
            key={st.name}
            className="progress-tick"
            style={{ left: `${(st.step_index / (totalSteps - 1)) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function StateSelect({ states, current, onGotoStep }: {
  states: NamedState[];
  current: number;
  onGotoStep: (i: number) => void;
}) {
  const total = states.reduce((sum, st) => sum + st.elapsed_s, 0);
  const share = (st: NamedState) => {
    if (total <= 0) return "";
    const pct = (st.elapsed_s / total) * 100;
    return pct < 1 ? " · <1%" : ` · ${Math.round(pct)}%`;
  };

  return (
    <select
      className="nav-state"
      value={current}
      onChange={(e) => {
        const st = states[Number(e.target.value)];
        if (st) onGotoStep(st.step_index);
      }}
      title="Named states [ [ and ] ]. Percentages are each state's share of run time; tracing slows code down, so compare states rather than reading them as real timings."
    >
      {current === -1 && <option value={-1}>Start</option>}
      {states.map((st, i) => (
        <option key={st.name} value={i}>
          {i + 1}. {st.name}{share(st)}
        </option>
      ))}
    </select>
  );
}
