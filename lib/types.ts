/**
 * Types for run-code workflow and API routes
 */

export interface RunCodeRequest {
  sandboxId: string;
  command: string;
  args?: string[];
  sudo?: boolean;
  wait?: boolean;
}

export interface RunCodeResponse {
  runId: string;
  commandId: string;
  status: 'executing' | 'running' | 'done' | 'error';
  error?: { message: string };
}

export interface StreamLogEvent {
  type: 'log' | 'done' | 'error';
  data?: string;
  stream?: 'stdout' | 'stderr';
  timestamp: number;
  exitCode?: number;
  error?: { message: string };
}

export interface CreateSandboxRequest {
  timeout?: number;
  templateId?: string;
}

export interface CreateSandboxResponse {
  sandboxId: string;
  status: 'done' | 'error';
  error?: { message: string };
}

