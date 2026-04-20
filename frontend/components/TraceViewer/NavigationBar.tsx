interface Props {
  path: string;
  stepIndex: number;
  totalSteps: number;
  rawMode: boolean;
  animateMode: boolean;
  hideEnv: boolean;
  showNotes: boolean;
  onStepForward: () => void;
  onStepBackward: () => void;
  onStepOverForward: () => void;
  onStepOverBackward: () => void;
  onStepUp: () => void;
  onToggleRaw: () => void;
  onToggleAnimate: () => void;
  onToggleEnv: () => void;
  onToggleNotes: () => void;
}

export function NavigationBar({
  path, stepIndex, totalSteps,
  rawMode, animateMode, hideEnv, showNotes,
  onStepForward, onStepBackward, onStepOverForward, onStepOverBackward, onStepUp,
  onToggleRaw, onToggleAnimate, onToggleEnv, onToggleNotes,
}: Props) {
  const pct = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="nav-bar">
      <div className="nav-bar-row">
        <span className="nav-path">{path}</span>
        <span className="nav-buttons">
          <button title="Toggle animation [A]" onClick={onToggleAnimate} className={animateMode ? "active" : ""}>🌤</button>
          <button title="Toggle raw code [R]" onClick={onToggleRaw} className={rawMode ? "active" : ""}>⚙</button>
          <button title="Toggle variables [E]" onClick={onToggleEnv} className={!hideEnv ? "active" : ""}>𝐄</button>
          <button title="Toggle notes [N]" onClick={onToggleNotes} className={showNotes ? "active" : ""}>𝐍</button>
          <span className="nav-sep" />
          <button title="Step backward [← or h]" onClick={onStepBackward}>←</button>
          <button title="Step forward [→ or l]" onClick={onStepForward}>→</button>
          <button title="Step over backward [Shift+← or k]" onClick={onStepOverBackward}>↖</button>
          <button title="Step over forward [Shift+→ or j]" onClick={onStepOverForward}>↗</button>
          <button title="Step out of function [u]" onClick={onStepUp}>↩</button>
        </span>
      </div>
      <div className="progress-bar" title={`${stepIndex} / ${totalSteps}`}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
