export type Mode = 'direct' | 'deferred' | 'transition' | 'combined';

export interface DemoItem {
  id: number;
  name: string;
  city: string;
  tag: string;
  detail: string;
  score: number;
  accent: string;
}

export interface ExperimentConfig {
  mode: Mode;
  title: string;
  shortTitle: string;
  lead: string;
  iconClassName: string;
}

export interface CodeExample {
  key: Mode;
  label: string;
  title: string;
  note: string;
  code: string;
}
