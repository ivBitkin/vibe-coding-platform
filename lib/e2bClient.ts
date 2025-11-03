import { Sandbox } from "e2b";

/**
 * E2B Client wrapper for sandbox operations
 * Provides clean interface for E2B API interactions
 */
export class E2BClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.E2B_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('E2B_API_KEY is not configured');
    }
  }

  /**
   * Create a new E2B sandbox
   */
  async createSandbox(options?: {
    timeout?: number;
    templateId?: string;
  }): Promise<{ sandboxId: string }> {
    const sandbox = await Sandbox.create({
      apiKey: this.apiKey,
      template: options?.templateId || process.env.E2B_TEMPLATE_ID || undefined,
      metadata: {
        timeout: String(options?.timeout ?? 600000), // 10 minutes default
      },
    });

    return {
      sandboxId: sandbox.sandboxId,
    };
  }

  /**
   * Connect to existing sandbox
   */
  async connectSandbox(sandboxId: string): Promise<Sandbox> {
    return Sandbox.connect(sandboxId, {
      apiKey: this.apiKey,
    });
  }

  /**
   * Run command in sandbox
   */
  async runCommand(
    sandboxId: string,
    command: string,
    options?: {
      args?: string[];
      sudo?: boolean;
      wait?: boolean;
    }
  ): Promise<{
    commandId: string;
    exitCode?: number;
    stdout?: string;
    stderr?: string;
  }> {
    const sandbox = await this.connectSandbox(sandboxId);
    
    const fullCommand = options?.sudo 
      ? `sudo ${command} ${(options.args || []).join(' ')}`
      : `${command} ${(options.args || []).join(' ')}`;

    const result = await sandbox.commands.run(fullCommand);

    return {
      commandId: `cmd_${Date.now()}`,
      exitCode: result.exitCode ?? 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
    };
  }

  /**
   * Write files to sandbox
   */
  async writeFiles(
    sandboxId: string,
    files: Array<{ path: string; content: string }>
  ): Promise<void> {
    const sandbox = await this.connectSandbox(sandboxId);
    
    for (const file of files) {
      await sandbox.files.write(file.path, file.content);
    }
  }

  /**
   * Read file from sandbox
   */
  async readFile(sandboxId: string, path: string): Promise<string> {
    const sandbox = await this.connectSandbox(sandboxId);
    return sandbox.files.read(path);
  }

  /**
   * Get sandbox URL for running server
   */
  async getSandboxUrl(sandboxId: string, port: number): Promise<string> {
    const sandbox = await this.connectSandbox(sandboxId);
    return `https://${sandbox.getHost(port)}`;
  }
}

