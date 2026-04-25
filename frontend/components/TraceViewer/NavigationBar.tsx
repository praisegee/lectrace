import {
  PlayIcon, PauseIcon, CodeIcon, PanelIcon,
  ExpandIcon, CompressIcon,
  StepBackIcon, StepFwdIcon, SkipBackIcon, SkipFwdIcon, StepOutIcon,
  SidebarIcon,
} from "../icons";

interface Props {
  path: string;
  title: string;
  stepIndex: number;
  totalSteps: number;
  rawMode: boolean;
  animateMode: boolean;
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
  onToggleEnv: () => void;
  onToggleFullscreen: () => void;
}

export function NavigationBar({
  path, title, stepIndex, totalSteps,
  rawMode, animateMode, hideEnv, isFullscreen,
  onToggleSidebar,
  onStepForward, onStepBackward, onStepOverForward, onStepOverBackward, onStepUp,
  onToggleRaw, onToggleAnimate, onToggleEnv, onToggleFullscreen,
}: Props) {
  const pct = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="nav-bar">
      <div className="nav-bar-row">
        {/* Mobile: hamburger to open lecture drawer */}
        <button className="nav-hamburger" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <SidebarIcon size={16} />
        </button>

        {/* Mobile: lecture title */}
        <span className="nav-title">{title}</span>

        {/* Desktop: file path */}
        <span className="nav-path">{path}</span>

        <span className="nav-counter">{stepIndex + 1} / {totalSteps}</span>

        <span className="nav-buttons">
          {/* Visible on all screen sizes */}
          <button title="Toggle reveal animation [A]" onClick={onToggleAnimate} className={`nav-btn-animate${animateMode ? " active" : ""}`}>
            {animateMode ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button title="Toggle raw code view [R]" onClick={onToggleRaw} className={`nav-btn-raw${rawMode ? " active" : ""}`}>
            <CodeIcon />
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
      </div>
    </div>
  );
}
