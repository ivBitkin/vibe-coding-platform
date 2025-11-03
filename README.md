# Vibe Coding Platform - E2B + Trigger.dev Integration

This project is a fork of [Vercel's Vibe Code OSS](https://github.com/vercel/examples/tree/main/apps/vibe-coding-platform) with the **Vercel Sandbox** execution layer replaced by **Trigger.dev workflows** using **E2B sandbox** for code execution.

## 🎯 Project Goal

Replace Vercel's proprietary sandbox with open-source alternatives while maintaining the same user experience:
- ✅ **Trigger.dev** - Manages workflow orchestration and job execution
- ✅ **E2B** - Provides secure sandbox environments for code execution
- ✅ **Real-time output** - Streaming logs and error handling
- ✅ **Same UX** - Identical user interface and interaction patterns

## 🏗️ Architecture

### Original Stack
- **Frontend**: Next.js 15 + React 19
- **AI**: Vercel AI SDK
- **Sandbox**: `@vercel/sandbox` (proprietary)

### New Stack
- **Frontend**: Next.js 15 + React 19 (unchanged)
- **AI**: Vercel AI SDK with Groq (free) or OpenAI (paid)
- **Sandbox**: E2B (`e2b` package)
- **Orchestration**: Trigger.dev v4 (workflow orchestration)
- **API Routes**: `/api/run/start` and `/api/run/stream` for execution

### Key Changes

| Component | Original | New |
|-----------|----------|-----|
| Sandbox Creation | `@vercel/sandbox` | E2B via Trigger.dev workflow |
| Command Execution | Vercel Sandbox API | Trigger.dev → E2B Process API |
| File Management | Vercel Files API | E2B Files API |
| Streaming Logs | Vercel Command Logs | Trigger.dev → SSE Stream |
| API Routes | Direct sandbox calls | `/api/run/start` + `/api/run/stream` |

## 📦 Prerequisites

- **Node.js**: v20+ (required for E2B and Trigger.dev)
- **npm**: v8+
- **Accounts**:
  - [E2B Account](https://e2b.dev/) - Get API key (required)
  - [Groq Account](https://console.groq.com/) (FREE) - Recommended for AI features
  - [OpenAI Account](https://platform.openai.com/) (optional, paid) - Alternative for AI features
  - [Trigger.dev Account](https://trigger.dev/) (optional) - For advanced workflows

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd vibe-coding-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Trigger.dev Configuration (REQUIRED)
# IMPORTANT: Use Production API key from Trigger.dev dashboard
# Get it from: https://trigger.dev → Your Project → Settings → API Keys
TRIGGER_DEV_API_KEY=your_trigger_dev_api_key_here

# Optional: Override API base URL (default: https://api.trigger.dev)
# TRIGGER_DEV_API_BASE=https://api.trigger.dev

# Task/Workflow ID in Trigger.dev (must match task ID in trigger/run-code.ts)
# Default: "run-code"
TRIGGER_DEV_TASK_ID=run-code

# E2B Configuration (REQUIRED)
E2B_API_KEY=your_e2b_api_key_here

# Optional: E2B template ID (e.g., "nodejs-lts", "python3")
# E2B_TEMPLATE_ID=nodejs-lts

# AI Configuration (REQUIRED - at least one)
# Option 1: Groq API (FREE tier available! Recommended)
GROQ_API_KEY=your_groq_api_key_here

# Option 2: OpenAI API (Paid - requires billing)
OPENAI_API_KEY=your_openai_api_key

# AI Gateway (if using AI Gateway instead of direct API)
# AI_GATEWAY_BASE_URL=https://your-gateway-url.com
# AI_GATEWAY_API_KEY=your_gateway_api_key

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Get Trigger.dev API Key (REQUIRED):
1. Go to [https://trigger.dev](https://trigger.dev)
2. Sign up and create a project
3. Navigate to **Settings** → **API Keys**
4. **IMPORTANT**: Copy your **Production API Key** (not Dev key)
5. Make sure the key matches your Production environment
6. Paste it in `.env.local` as `TRIGGER_DEV_API_KEY`

#### Get E2B API Key:
1. Go to [https://e2b.dev](https://e2b.dev)
2. Sign up and create an account
3. Navigate to **Settings** → **API Keys**
4. Copy your API key and paste it in `.env.local`

#### Get Groq API Key (FREE - Recommended):
1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up and create an account (FREE)
3. Navigate to **API Keys** section
4. Click "Create API Key"
5. Copy your API key and paste it in `.env.local`
6. **No credit card required!** Groq offers generous free tier with fast inference

#### Get OpenAI API Key (Paid - Alternative):
1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign up and create an account
3. Navigate to **API Keys** section
4. Create a new API key
5. **Note**: Requires billing information and has usage costs

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Development

### Project Structure

```
vibe-coding-platform/
├── ai/
│   ├── tools/
│   │   ├── create-sandbox.ts    # E2B sandbox creation
│   │   ├── run-command.ts       # Command execution via E2B
│   │   ├── generate-files.ts    # File generation
│   │   └── get-sandbox-url.ts   # Get sandbox URL
│   └── gateway.ts
├── app/
│   ├── api/
│   │   └── sandboxes/           # API routes for sandbox operations
│   └── page.tsx                 # Main UI
├── trigger/
│   └── sandbox.ts               # Trigger.dev workflows (optional)
├── components/                   # React components
└── trigger.config.ts            # Trigger.dev configuration
```

### Key Files Modified

1. **`ai/tools/create-sandbox.ts`**
   - Replaced `@vercel/sandbox` with `e2b`
   - Uses `Sandbox.create()` from E2B

2. **`ai/tools/run-command.ts`**
   - Replaced Vercel command execution with E2B process API
   - Uses `sandbox.process.start()` and `.wait()`

3. **`ai/tools/generate-files.ts`**
   - Updated file writing to use E2B Files API
   - Uses `sandbox.files.write()`

4. **API Routes** (`app/api/sandboxes/*`)
   - Updated all endpoints to work with E2B
   - Adapted streaming and status checking

### Testing Locally

1. **Create a Sandbox**:
   - Open the app
   - Ask the AI to create a coding environment
   - Example: "Create a Node.js environment"

2. **Run Code**:
   - Write or generate code files
   - Execute commands (e.g., `node index.js`, `python app.py`)
   - View real-time output

3. **Test Features**:
   - File generation and editing
   - Command execution
   - Error handling
   - Streaming logs

## 🏭 Production Deployment

### Deploy to Vercel

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit - E2B + Trigger.dev integration"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Deploy Trigger.dev Workflows**:
   ```bash
   # Install Trigger.dev CLI if not already installed
   npm install -g @trigger.dev/cli
   
   # Login to Trigger.dev
   npx trigger.dev login
   
   # Deploy workflows to Production
   npx trigger.dev deploy
   ```
   
   This will deploy the `run-code` workflow defined in `trigger/run-code.ts` to your Trigger.dev project.

3. **Deploy on Vercel**:
   - Go to [https://vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `TRIGGER_DEV_API_KEY` (REQUIRED - Production API key from Trigger.dev)
     - `TRIGGER_DEV_TASK_ID` (default: "run-code")
     - `E2B_API_KEY` (REQUIRED)
     - `GROQ_API_KEY` (RECOMMENDED - FREE tier available!)
     - `OPENAI_API_KEY` (OPTIONAL - if not using Groq)
     - `AI_GATEWAY_BASE_URL` (OPTIONAL - if using AI Gateway)
     - `AI_GATEWAY_API_KEY` (OPTIONAL - if using AI Gateway)
   - Deploy!
   
   **Important**: 
   - **CRITICAL**: Use Production API key from Trigger.dev (not Dev key)
   - Make sure `TRIGGER_DEV_TASK_ID` matches the task ID in `trigger/run-code.ts`
   - **Recommended**: Use Groq API (FREE, no credit card needed). Get your key at [https://console.groq.com](https://console.groq.com)
   - The default model is Llama 3.1 70B (Groq - FREE)
   - If using OpenAI, make sure your API key has sufficient credits/billing set up

4. **Update Environment Variables**:
   - In Vercel dashboard, go to **Settings** → **Environment Variables**
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL

## 📝 Technical Decisions

### Why E2B?
- **Open Source**: E2B is open-source and self-hostable
- **Feature Parity**: Provides similar capabilities to Vercel Sandbox
- **Language Support**: Supports Node.js, Python, and more out of the box
- **Security**: Isolated sandbox environments with configurable timeouts

### Why Trigger.dev?
- **Workflow Management**: Better handling of long-running tasks
- **Observability**: Built-in logging and monitoring
- **Scalability**: Easy to scale background jobs
- **Flexibility**: Can be used for complex orchestration if needed

### Implementation Notes
- **Trigger.dev v4 Integration**: Uses Trigger.dev as the orchestration layer
  - Main workflow: `trigger/run-code.ts` - executes code in E2B sandbox
  - API Routes: `/api/run/start` (triggers workflow) and `/api/run/stream` (SSE logs)
  - HTTP API: Uses Trigger.dev REST API for triggering and polling
- **E2B Integration**: E2B sandbox executes code via Trigger.dev workflow
- **Groq AI Integration**: Uses Groq API (FREE tier) as default for AI features - no credit card required!
- **OpenAI Integration**: Alternative paid option, uses OpenAI API directly (not Vercel AI Gateway)
- **AI Gateway**: Optional support for AI Gateway via `AI_GATEWAY_BASE_URL` and `AI_GATEWAY_API_KEY`
- **Streaming**: Server-Sent Events (SSE) for real-time log streaming
- **Production Ready**: All workflows must be deployed to Trigger.dev Production environment

## 🔍 Differences from Original

### API Differences
| Feature | Vercel Sandbox | E2B |
|---------|---------------|-----|
| Sandbox Creation | `Sandbox.create({ timeout, ports })` | `Sandbox.create({ apiKey, timeoutMs })` |
| Get Sandbox | `Sandbox.get({ sandboxId })` | `Sandbox.connect({ sandboxId, apiKey })` |
| Run Command | `sandbox.runCommand({ cmd, args })` | `sandbox.process.start({ cmd })` |
| Read File | `sandbox.readFile(path)` | `sandbox.files.read(path)` |
| Write File | `sandbox.writeFiles([{ path, content }])` | `sandbox.files.write(path, content)` |
| Get URL | `sandbox.domain(port)` | `sandbox.getHost(port)` |

### Breaking Changes
- **Command IDs**: E2B uses PIDs instead of custom command IDs
- **Streaming**: E2B streams are slightly different from Vercel's
- **File API**: E2B writes files individually, not in batch

## 🐛 Known Issues & Troubleshooting

1. **Node Version Warning**: Project requires Node.js v20+, but works with v18 (with warnings)
2. **Command Tracking**: Command metadata stored in memory (needs Redis for production)
3. **Real-time Streaming**: Current implementation waits for command completion (can be improved)
4. **AI Provider Setup**: 
   - **Recommended**: Use Groq API (FREE, no credit card needed) - Get key at [https://console.groq.com](https://console.groq.com)
   - The app uses Llama 3.1 70B (Groq - FREE) by default
   - If using OpenAI and getting "insufficient_quota" errors: Add billing at [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing)
   - You can switch between models in the dropdown (Groq models are free, OpenAI models are paid)

## 🔮 Future Improvements

- [ ] Implement true real-time streaming for command output
- [ ] Add Redis for command metadata storage
- [ ] Support for more programming languages
- [ ] Better error messages and retry logic
- [ ] Implement Trigger.dev workflows for complex operations
- [ ] Add tests and CI/CD pipeline

## 📚 Resources

- [E2B Documentation](https://e2b.dev/docs)
- [Trigger.dev Documentation](https://trigger.dev/docs)
- [Original Vibe Code](https://github.com/vercel/examples/tree/main/apps/vibe-coding-platform)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is based on Vercel's Vibe Code OSS example. Please refer to the original repository for license information.

## 👥 Credits

- **Original Project**: [Vercel Vibe Code OSS](https://github.com/vercel/examples/tree/main/apps/vibe-coding-platform)
- **E2B**: [https://e2b.dev](https://e2b.dev)
- **Trigger.dev**: [https://trigger.dev](https://trigger.dev)
- **Developer**: Built with Cursor AI

---

**Live Demo**: [https://vibe-coding-platform-tawny-xi.vercel.app/](https://vibe-coding-platform-tawny-xi.vercel.app/)

**Questions?** Open an issue or reach out!
