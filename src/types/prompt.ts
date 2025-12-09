export interface PromptModule {
  id: string;
  title: string;
  content: string; // Markdown content
  level: number;
  children: PromptModule[];
  color?: string;
  collapsed?: boolean;
}

export interface PromptStats {
  moduleCount: number;
  tokenCount: number; // Approximation
  depth: number;
}

