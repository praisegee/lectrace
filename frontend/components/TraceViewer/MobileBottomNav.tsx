import { SkipBackIcon, StepBackIcon, StepFwdIcon, SkipFwdIcon, StepOutIcon } from "../icons";

interface Props {
  onStepBackward: () => void;
  onStepForward: () => void;
  onStepOverBackward: () => void;
  onStepOverForward: () => void;
  onStepUp: () => void;
}

export function MobileBottomNav({
  onStepBackward, onStepForward,
  onStepOverBackward, onStepOverForward,
  onStepUp,
}: Props) {
  return (
    <div className="mobile-bottom-nav">
      <button onClick={onStepOverBackward} aria-label="Step over backward">
        <SkipBackIcon size={20} />
      </button>
      <button onClick={onStepBackward} aria-label="Step backward">
        <StepBackIcon size={20} />
      </button>
      <button onClick={onStepForward} aria-label="Step forward" className="mobile-step-primary">
        <StepFwdIcon size={20} />
      </button>
      <button onClick={onStepOverForward} aria-label="Step over forward">
        <SkipFwdIcon size={20} />
      </button>
      <button onClick={onStepUp} aria-label="Step out of function">
        <StepOutIcon size={20} />
      </button>
    </div>
  );
}
