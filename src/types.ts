
export type AppMode = 'ui' | 'devops' | 'replica';

export interface DecisionTrace {
  element_id: string;
  element_type: 'ui_component' | 'service' | 'storage' | 'network' | 'layout';
  raw_label: string | null;
  possible_interpretations: string[];
  chosen_interpretation: string;
  confidence: number;
  reasoning: string;
  overridable: boolean;
}

export interface UIAnalysisResult {
  wireframe_code: string;
  wireframe_explanation: string;
  modern_code: string;
  modern_explanation: string;
  decision_trace: DecisionTrace[];
}

export interface DevOpsAnalysisResult {
  docker_compose: string;
  mermaid_diagram: string;
  explanation: string;
  decision_trace: DecisionTrace[];
}

export interface ReplicaAnalysisResult {
  code: string;
  test_code: string;
  explanation: string;
  fidelity_report: {
    component_count: number;
    detected_interactions: string[];
    accessibility_check: string;
  };
  decision_trace: DecisionTrace[];
}

export type AnalysisResult = UIAnalysisResult | DevOpsAnalysisResult | ReplicaAnalysisResult;

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  VIOLATION = 'VIOLATION'
}

export interface DragState {
  isDragging: boolean;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export type ConstraintSeverity = 'hard' | 'soft';

export interface Constraint {
  id: string;
  label: string;
  description: string;
  severity: ConstraintSeverity;
  mode: AppMode;
}

export interface Violation {
  constraintId: string;
  label: string;
  description: string;
  evidence: string;
  severity: ConstraintSeverity;
}
