import { task } from "@trigger.dev/sdk/v3";
import { Sandbox } from "e2b";

export interface CreateSandboxInput {
  timeout?: number;
  ports?: number[];
}

export interface CreateSandboxOutput {
  sandboxId: string;
  status: 'done' | 'error';
  error?: { message: string };
}

export interface RunCommandInput {
  sandboxId: string;
  command: string;
  args?: string[];
  sudo?: boolean;
  wait: boolean;
}

export interface RunCommandOutput {
  commandId: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  status: 'executing' | 'running' | 'waiting' | 'done' | 'error';
  error?: { message: string };
}

// Create E2B Sandbox Task
export const createE2BSandbox = task({
  id: "create-e2b-sandbox",
  run: async (payload: CreateSandboxInput): Promise<CreateSandboxOutput> => {
    try {
      const sandbox = await Sandbox.create({
        apiKey: process.env.E2B_API_KEY,
        metadata: {
          timeout: String(payload.timeout ?? 600000),
        },
      });

      return {
        sandboxId: sandbox.sandboxId,
        status: 'done',
      };
    } catch (error) {
      console.error('Error creating E2B sandbox:', error);
      return {
        sandboxId: '',
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error creating sandbox',
        },
      };
    }
  },
});

// Run Command in E2B Sandbox Task
export const runE2BCommand = task({
  id: "run-e2b-command",
  run: async (payload: RunCommandInput): Promise<RunCommandOutput> => {
    try {
      const sandbox = await Sandbox.connect(payload.sandboxId, {
        apiKey: process.env.E2B_API_KEY,
      });

      const fullCommand = payload.sudo 
        ? `sudo ${payload.command} ${(payload.args || []).join(' ')}`
        : `${payload.command} ${(payload.args || []).join(' ')}`;

      const cmdResult = await sandbox.commands.run(fullCommand);

      if (!payload.wait) {
        return {
          commandId: `cmd_${Date.now()}`,
          status: 'running',
        };
      }

      // Command already completed
      return {
        commandId: `cmd_${Date.now()}`,
        exitCode: cmdResult.exitCode,
        stdout: cmdResult.stdout,
        stderr: cmdResult.stderr,
        status: 'done',
      };
    } catch (error) {
      console.error('Error running command in E2B sandbox:', error);
      return {
        commandId: '',
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error running command',
        },
      };
    }
  },
});

// Upload Files to E2B Sandbox Task
export interface UploadFilesInput {
  sandboxId: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

export interface UploadFilesOutput {
  status: 'done' | 'error';
  error?: { message: string };
}

export const uploadFilesToE2B = task({
  id: "upload-files-to-e2b",
  run: async (payload: UploadFilesInput): Promise<UploadFilesOutput> => {
    try {
      const sandbox = await Sandbox.connect(payload.sandboxId, {
        apiKey: process.env.E2B_API_KEY,
      });

      for (const file of payload.files) {
        await sandbox.files.write(file.path, file.content);
      }

      return {
        status: 'done',
      };
    } catch (error) {
      console.error('Error uploading files to E2B sandbox:', error);
      return {
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error uploading files',
        },
      };
    }
  },
});

// Get Sandbox URL (for running servers)
export interface GetSandboxUrlInput {
  sandboxId: string;
  port: number;
}

export interface GetSandboxUrlOutput {
  url: string;
  status: 'done' | 'error';
  error?: { message: string };
}

export const getE2BSandboxUrl = task({
  id: "get-e2b-sandbox-url",
  run: async (payload: GetSandboxUrlInput): Promise<GetSandboxUrlOutput> => {
    try {
      const sandbox = await Sandbox.connect(payload.sandboxId, {
        apiKey: process.env.E2B_API_KEY,
      });

      const url = `https://${sandbox.getHost(payload.port)}`;

      return {
        url,
        status: 'done',
      };
    } catch (error) {
      console.error('Error getting E2B sandbox URL:', error);
      return {
        url: '',
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error getting sandbox URL',
        },
      };
    }
  },
});

