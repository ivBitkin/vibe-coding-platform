import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { Sandbox } from 'e2b'
import { getRichError } from './get-rich-error'
import { tool } from 'ai'
import description from './run-command.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const runCommand = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      sandboxId: z
        .string()
        .describe('The ID of the Vercel Sandbox to run the command in'),
      command: z
        .string()
        .describe(
          "The base command to run (e.g., 'npm', 'node', 'python', 'ls', 'cat'). Do NOT include arguments here. IMPORTANT: Each command runs independently in a fresh shell session - there is no persistent state between commands. You cannot use 'cd' to change directories for subsequent commands."
        ),
      args: z
        .array(z.string())
        .optional()
        .describe(
          "Array of arguments for the command. Each argument should be a separate string (e.g., ['install', '--verbose'] for npm install --verbose, or ['src/index.js'] to run a file, or ['-la', './src'] to list files). IMPORTANT: Use relative paths (e.g., 'src/file.js') or absolute paths instead of trying to change directories with 'cd' first, since each command runs in a fresh shell session."
        ),
      sudo: z
        .boolean()
        .optional()
        .describe('Whether to run the command with sudo'),
      wait: z
        .boolean()
        .describe(
          'Whether to wait for the command to finish before returning. If true, the command will block until it completes, and you will receive its output.'
        ),
    }),
    execute: async (
      { sandboxId, command, sudo, wait, args = [] },
      { toolCallId }
    ) => {
      writer.write({
        id: toolCallId,
        type: 'data-run-command',
        data: { sandboxId, command, args, status: 'executing' },
      })

      let sandbox: Sandbox | null = null

      try {
        sandbox = await Sandbox.connect(sandboxId, {
          apiKey: process.env.E2B_API_KEY,
        })
      } catch (error) {
        const richError = getRichError({
          action: 'get sandbox by id',
          args: { sandboxId },
          error,
        })

        writer.write({
          id: toolCallId,
          type: 'data-run-command',
          data: {
            sandboxId,
            command,
            args,
            error: richError.error,
            status: 'error',
          },
        })

        return richError.message
      }

      let processHandle: any = null
      const commandId = `cmd_${Date.now()}`

      try {
        const fullCommand = sudo 
          ? `sudo ${command} ${args.join(' ')}`
          : `${command} ${args.join(' ')}`

        processHandle = await sandbox.commands.run(fullCommand)
      } catch (error) {
        const richError = getRichError({
          action: 'run command in sandbox',
          args: { sandboxId },
          error,
        })

        writer.write({
          id: toolCallId,
          type: 'data-run-command',
          data: {
            sandboxId,
            command,
            args,
            error: richError.error,
            status: 'error',
          },
        })

        return richError.message
      }

      writer.write({
        id: toolCallId,
        type: 'data-run-command',
        data: {
          sandboxId,
          commandId,
          command,
          args,
          status: 'executing',
        },
      })

      if (!wait) {
        writer.write({
          id: toolCallId,
          type: 'data-run-command',
          data: {
            sandboxId,
            commandId,
            command,
            args,
            status: 'running',
          },
        })

        return `The command \`${command} ${args.join(
          ' '
        )}\` has been started in the background in the sandbox with ID \`${sandboxId}\` with the commandId ${commandId}.`
      }

      writer.write({
        id: toolCallId,
        type: 'data-run-command',
        data: {
          sandboxId,
          commandId,
          command,
          args,
          status: 'waiting',
        },
      })

      try {
        const exitCode = processHandle.exitCode ?? 0
        const stdout = processHandle.stdout
        const stderr = processHandle.stderr

        writer.write({
          id: toolCallId,
          type: 'data-run-command',
          data: {
            sandboxId,
            commandId,
            command,
            args,
            exitCode,
            status: 'done',
          },
        })

        return (
          `The command \`${command} ${args.join(
            ' '
          )}\` has finished with exit code ${exitCode}.` +
          `Stdout of the command was: \n` +
          `\`\`\`\n${stdout}\n\`\`\`\n` +
          `Stderr of the command was: \n` +
          `\`\`\`\n${stderr}\n\`\`\``
        )
      } catch (error) {
        const richError = getRichError({
          action: 'wait for command to finish',
          args: { sandboxId, commandId },
          error,
        })

        writer.write({
          id: toolCallId,
          type: 'data-run-command',
          data: {
            sandboxId,
            commandId,
            command,
            args,
            error: richError.error,
            status: 'error',
          },
        })

        return richError.message
      }
    },
  })
