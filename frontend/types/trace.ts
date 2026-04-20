export interface Trace {
  version: "2";
  metadata: TraceMetadata;
  files: Record<string, string>;
  hidden_line_numbers: Record<string, number[]>;
  steps: Step[];
}

export interface TraceMetadata {
  title: string;
  module: string;
  built_at: string;
  source_hash: string;
  python_version: string;
  lectrace_version: string;
  error: TraceError | null;
}

export interface TraceError {
  exception_type: string;
  message: string;
  traceback: string;
}

export interface Step {
  stack: StackFrame[];
  env: Record<string, Value>;
  renderings: Rendering[];
}

export interface StackFrame {
  path: string;
  line_number: number;
  function_name: string;
  source_line: string;
}

export type Value =
  | { type: "NoneType"; contents: null }
  | { type: "bool"; contents: boolean }
  | { type: "int" | "float"; contents: number | string }
  | { type: "str"; contents: string }
  | { type: "complex"; contents: { real: number; imag: number } }
  | { type: string; contents: Value[]; shape?: number[]; dtype?: string }
  | { type: string; contents: Record<string, Value> }
  | { type: string; contents: string | number | boolean | null };

export type Rendering =
  | { type: "markdown"; data: string; style?: React.CSSProperties }
  | { type: "image"; data: string; style?: React.CSSProperties }
  | { type: "video"; data: string; style?: React.CSSProperties }
  | { type: "link"; data?: string; style?: React.CSSProperties; internal_link?: CodeLocation; external_link?: ExternalReference }
  | { type: "plot"; data: unknown; style?: React.CSSProperties }
  | { type: "note"; data: string };

export interface CodeLocation {
  path: string;
  line_number: number;
}

export interface ExternalReference {
  url?: string;
  title?: string;
  authors?: string[];
  organization?: string;
  date?: string;
  description?: string;
  notes?: string;
}

export interface TraceIndex {
  version: "2";
  traces: TraceIndexEntry[];
}

export interface TraceIndexEntry {
  id: string;
  title: string;
  path: string;
  step_count: number;
  built_at: string;
}
