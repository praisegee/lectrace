interface SvgProps {
  size?: number;
  children: React.ReactNode;
}

function Svg({ size = 18, children }: SvgProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16"
      fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function PlayIcon({ size }: { size?: number }) {
  return <Svg size={size}><polygon points="4,2 13,8 4,14" fill="currentColor" stroke="none" /></Svg>;
}

export function PauseIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <rect x="3" y="2" width="3.5" height="12" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="9.5" y="2" width="3.5" height="12" rx="0.5" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function CodeIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <polyline points="5,4 1,8 5,12" />
      <polyline points="11,4 15,8 11,12" />
      <line x1="10" y1="3" x2="6" y2="13" />
    </Svg>
  );
}

export function PanelIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <rect x="1" y="1.5" width="14" height="13" rx="1.5" />
      <line x1="10" y1="1.5" x2="10" y2="14.5" />
    </Svg>
  );
}

export function ExpandIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <polyline points="10,2 14,2 14,6" />
      <polyline points="6,14 2,14 2,10" />
      <line x1="14" y1="2" x2="9" y2="7" />
      <line x1="2" y1="14" x2="7" y2="9" />
    </Svg>
  );
}

export function CompressIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <polyline points="9,7 14,7 14,2" />
      <polyline points="7,9 2,9 2,14" />
      <line x1="14" y1="2" x2="9" y2="7" />
      <line x1="2" y1="14" x2="7" y2="9" />
    </Svg>
  );
}

export function StepBackIcon({ size }: { size?: number }) {
  return <Svg size={size}><polyline points="10,3 5,8 10,13" /></Svg>;
}

export function StepFwdIcon({ size }: { size?: number }) {
  return <Svg size={size}><polyline points="6,3 11,8 6,13" /></Svg>;
}

export function SkipBackIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <line x1="3" y1="3" x2="3" y2="13" />
      <polyline points="13,3 7,8 13,13" />
    </Svg>
  );
}

export function SkipFwdIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <line x1="13" y1="3" x2="13" y2="13" />
      <polyline points="3,3 9,8 3,13" />
    </Svg>
  );
}

export function StepOutIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <polyline points="5,7 8,3 11,7" />
      <line x1="8" y1="3" x2="8" y2="11" />
      <line x1="4" y1="13" x2="12" y2="13" />
    </Svg>
  );
}

export function SidebarIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <rect x="1.5" y="2" width="13" height="12" rx="1.5" />
      <line x1="5.5" y1="2" x2="5.5" y2="14" />
    </Svg>
  );
}

export function CloseIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <line x1="3" y1="3" x2="13" y2="13" />
      <line x1="13" y1="3" x2="3" y2="13" />
    </Svg>
  );
}

export function ChevronDownIcon({ size }: { size?: number }) {
  return <Svg size={size}><polyline points="4,6 8,10 12,6" /></Svg>;
}

export function ChevronUpIcon({ size }: { size?: number }) {
  return <Svg size={size}><polyline points="4,10 8,6 12,10" /></Svg>;
}
