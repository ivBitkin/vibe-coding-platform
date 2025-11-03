import { task } from "@trigger.dev/sdk";
import { Sandbox } from "e2b";

export interface RunCodeInput {
  sandboxId: string;
  command: string;
  args?: string[];
  sudo?: boolean;
  wait?: boolean;
}

export interface RunCodeOutput {
  runId: string;
  commandId: string;
  status: 'executing' | 'running' | 'done' | 'error';
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  error?: { message: string };
}

/**
 * Main workflow: Executes code in E2B sandbox with real-time streaming
 * This is the core task that orchestrates code execution
 */
export const runCode = task({
  id: process.env.TRIGGER_DEV_TASK_ID || "run-code",
  run: async (payload: RunCodeInput, { ctx }): Promise<RunCodeOutput> => {
    const runId = ctx.run?.id || `run_${Date.now()}`;
    const commandId = `cmd_${Date.now()}`;
    
    try {
      // Connect to existing E2B sandbox
      const sandbox = await Sandbox.connect(payload.sandboxId, {
        apiKey: process.env.E2B_API_KEY,
      });

      // Build full command
      const fullCommand = payload.sudo 
        ? `sudo ${payload.command} ${(payload.args || []).join(' ')}`
        : `${payload.command} ${(payload.args || []).join(' ')}`;

      // Execute command in sandbox
      const cmdResult = await sandbox.commands.run(fullCommand);

      if (!payload.wait) {
        // Return immediately for background execution
        return {
          runId,
          commandId,
          status: 'running',
        };
      }

      // Wait for command completion and return results
      return {
        runId,
        commandId,
        exitCode: cmdResult.exitCode ?? 0,
        stdout: cmdResult.stdout || '',
        stderr: cmdResult.stderr || '',
        status: 'done',
      };
    } catch (error) {
      console.error('Error in run-code workflow:', error);
      return {
        runId,
        commandId: '',
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error executing code',
        },
      };
    }
  },
});

