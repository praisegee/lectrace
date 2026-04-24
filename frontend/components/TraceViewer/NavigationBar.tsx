interface Props {
  path: string;
  stepIndex: number;
  totalSteps: number;
  rawMode: boolean;
  animateMode: boolean;
  hideEnv: boolean;
  showNotes: boolean;
  isFullscreen: boolean;
  onStepForward: () => void;
  onStepBackward: () => void;
  onStepOverForward: () => void;
  onStepOverBackward: () => void;
  onStepUp: () => void;
  onToggleRaw: () => void;
  onToggleAnimate: () => void;
  onToggleEnv: () => void;
  onToggleNotes: () => void;
  onToggleFullscreen: () => void;
}

export function NavigationBar({
  path, stepIndex, totalSteps,
  rawMode, animateMode, hideEnv, showNotes, isFullscreen,
  onStepForward, onStepBackward, onStepOverForward, onStepOverBackward, onStepUp,
  onToggleRaw, onToggleAnimate, onToggleEnv, onToggleNotes, onToggleFullscreen,
}: Props) {
  const pct = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="nav-bar">
      <div className="nav-bar-row">
        <span className="nav-path">{path}</span>
        <span className="nav-counter">{stepIndex + 1} / {totalSteps}</span>
        <span className="nav-buttons">
          {/* View toggles */}
          <button title="Toggle reveal animation [A]" onClick={onToggleAnimate} className={animateMode ? "active" : ""}>
            {animateMode ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button title="Toggle raw code view [R]" onClick={onToggleRaw} className={rawMode ? "active" : ""}>
            <CodeIcon />
          </button>
          <button title="Toggle variables panel [E]" onClick={onToggleEnv} className={!hideEnv ? "active" : ""}>
            <PanelIcon />
          </button>
          <button title="Toggle notes [N]" onClick={onToggleNotes} className={showNotes ? "active" : ""}>
            <NoteIcon />
          </button>
          <button title={isFullscreen ? "Exit fullscreen [F]" : "Fullscreen presentation [F]"} onClick={onToggleFullscreen} className={isFullscreen ? "active" : ""}>
            {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
          </button>

          <span className="nav-sep" />

          {/* Step controls */}
          <button title="Step backward [← or h]" onClick={onStepBackward}><StepBackIcon /></button>
          <button title="Step forward [→ or l]" onClick={onStepForward}><StepFwdIcon /></button>
          <button title="Step over backward [Shift+← or k]" onClick={onStepOverBackward}><SkipBackIcon /></button>
          <button title="Step over forward [Shift+→ or j]" onClick={onStepOverForward}><SkipFwdIcon /></button>
          <button title="Step out of function [u]" onClick={onStepUp}><StepOutIcon /></button>
        </span>
      </div>
      <div className="progress-bar" title={`Step ${stepIndex + 1} of ${totalSteps}`}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Svg({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

function PlayIcon() {
  return <Svg><polygon points="4,2 13,8 4,14" fill="currentColor" stroke="none" /></Svg>;
}

function PauseIcon() {
  return (
    <Svg>
      <rect x="3" y="2" width="3.5" height="12" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="9.5" y="2" width="3.5" height="12" rx="0.5" fill="currentColor" stroke="none" />
    </Svg>
  );
}

function CodeIcon() {
  return (
    <Svg>
      <polyline points="5,4 1,8 5,12" />
      <polyline points="11,4 15,8 11,12" />
      <line x1="10" y1="3" x2="6" y2="13" />
    </Svg>
  );
}

function PanelIcon() {
  return (
    <Svg>
      <rect x="1" y="1.5" width="14" height="13" rx="1.5" />
      <line x1="10" y1="1.5" x2="10" y2="14.5" />
    </Svg>
  );
}

function NoteIcon() {
  return (
    <Svg>
      <path d="M2 2.5A1 1 0 013 1.5h10a1 1 0 011 1V10l-4 4H3a1 1 0 01-1-1V2.5z" />
      <line x1="5" y1="5.5" x2="11" y2="5.5" />
      <line x1="5" y1="8" x2="9" y2="8" />
    </Svg>
  );
}

function ExpandIcon() {
  return (
    <Svg>
      <polyline points="10,2 14,2 14,6" />
      <polyline points="6,14 2,14 2,10" />
      <line x1="14" y1="2" x2="9" y2="7" />
      <line x1="2" y1="14" x2="7" y2="9" />
    </Svg>
  );
}

function CompressIcon() {
  return (
    <Svg>
      <polyline points="9,7 14,7 14,2" />
      <polyline points="7,9 2,9 2,14" />
      <line x1="14" y1="2" x2="9" y2="7" />
      <line x1="2" y1="14" x2="7" y2="9" />
    </Svg>
  );
}

function StepBackIcon() {
  return <Svg><polyline points="10,3 5,8 10,13" /></Svg>;
}

function StepFwdIcon() {
  return <Svg><polyline points="6,3 11,8 6,13" /></Svg>;
}

function SkipBackIcon() {
  return (
    <Svg>
      <line x1="3" y1="3" x2="3" y2="13" />
      <polyline points="13,3 7,8 13,13" />
    </Svg>
  );
}

function SkipFwdIcon() {
  return (
    <Svg>
      <line x1="13" y1="3" x2="13" y2="13" />
      <polyline points="3,3 9,8 3,13" />
    </Svg>
  );
}

function StepOutIcon() {
  return (
    <Svg>
      <polyline points="5,7 8,3 11,7" />
      <line x1="8" y1="3" x2="8" y2="11" />
      <line x1="4" y1="13" x2="12" y2="13" />
    </Svg>
  );
}
