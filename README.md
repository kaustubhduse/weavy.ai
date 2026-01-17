# Weavy - Visual Workflow Builder

A powerful visual workflow automation platform for building AI-powered workflows with drag-and-drop nodes. Create complex data pipelines combining LLMs, image/video processing, and custom logic.

## ✨ Features

### Visual Workflow Engine
- **Drag-and-Drop Canvas** - Intuitive node-based interface powered by React Flow
- **6 Node Types**:
  - **Text Node** - Editable prompts and text inputs
  - **Upload Image** - Image upload with base64 encoding
  - **Upload Video** - Video upload with optional Transloadit processing
  - **Run Any LLM** - Execute Google Gemini AI with multimodal support
  - **Crop Image** - Precise image cropping with x/y/width/height controls
  - **Extract Frame** - Extract specific video frames using FFmpeg

### Workflow Execution
- **Real-time Execution** - Watch nodes execute with pulsating yellow glow animation
- **Animated Edges** - Flowing connections show data flow direction
- **Execution History** - Track all workflow runs with status and timing
- **Error Handling** - Graceful failure handling with detailed error messages

### Collaboration & Organization
- **Folder System** - Organize workflows in nested folders
- **User Authentication** - Secure auth powered by Clerk
- **Workflow Sharing** - Copy workflow links to clipboard
- **Auto-save** - Changes persisted immediately to PostgreSQL

### Developer Experience
- **Type-Safe API** -tRPC with full TypeScript inference
- **Toast Notifications** - Consistent feedback using custom toast hook
- **Undo/Redo** - Full history tracking
- **Node Locking** - Prevent accidental edits to critical nodes

## 🛠 Tech Stack

### Core Stack (Required)

| Technology | Purpose |
|------------|---------|
| **Next.js+** | React framework with App Router |
| **TypeScript** | Type safety throughout the codebase |
| **PostgreSQL** | Database (use Supabase, Neon, or similar) |
| **Prisma** | ORM for database access |
| **Clerk** | Authentication |

### Libraries & Tools

| Technology | Purpose |
|------------|---------|
| **React Flow** | Visual workflow/node graph library |
| **Trigger.dev** | ALL node execution MUST use Trigger.dev |
| **Transloadit** | File uploads and media processing |
| **FFmpeg** | Image/video processing (via Trigger.dev) |
| **Tailwind CSS** | Styling (match Weavy's theme exactly) |
| **Zustand** | State management |
| **Zod** | Schema validation |
| **Google Generative AI SDK** | `@google/generative-ai` package |
| **Lucide React** | Icon library |

### Additional Stack Details

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Clerk account ([clerk.com](https://clerk.com))
- Google Gemini API key ([aistudio.google.com](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Clone & install
npm install

# Generate Prisma client
npm run prisma:generate

# Push database schema
npm run prisma:push

# Seed sample data (optional)
npm run prisma:seed
```

### Environment Variables

Create `.env` or `.env.local` in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/weavy"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Google Gemini AI  
GOOGLE_GEMINI_API_KEY="AIza..."

# Transloadit (Optional - for cloud video processing)
NEXT_PUBLIC_TRANSLOADIT_KEY="your_key"
NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID="your_template"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 How It Works

### 1. **Create a Workflow**
- Log in with Clerk authentication
- Create a new workflow or open existing one
- Access the visual canvas editor

### 2. **Build Your Pipeline**
- **Drag nodes** from the left sidebar onto the canvas
- **Connect nodes** by dragging from output handles (right) to input handles (left)
- **Configure nodes** by clicking and editing their properties
- **Valid connections**:
  - Text → Text (prompts, messages)
  - Image → Image (visual data)
  - Video → Video or Image (frame extraction)

### 3. **Execute Workflows**
- Click **Run** button in the top controls
- Nodes execute in topological order (dependencies first)
- Watch execution with:
  - **Yellow pulsating glow** on active nodes
  - **Status updates** in real-time
  - **Results** displayed inline on nodes

### 4. **View Execution History**
- Open History panel (clock icon, left sidebar)
- See all past runs with status (COMPLETED/FAILED)
- Click any run to view detailed node execution logs
- Check execution times and error messages

## 📊 Database Schema

```prisma
Folder         # Organize workflows
  ├─ Workflow  # Contains nodes & edges
      ├─ Node  # Individual workflow steps
      ├─ Edge  # Connections between nodes
      └─ WorkflowRun  # Execution history
          └─ NodeRun  # Individual node execution logs
```

### Key Models

**Workflow**: Stores workflow metadata, nodes (JSON), edges (JSON), viewport state

**WorkflowRun**: Tracks execution with status, timestamps, duration

**NodeRun**: Logs individual node execution with inputs, outputs, errors

## 🎨 Node Types Deep Dive

### Text Node
- **Purpose**: Provide text input for prompts or messages
- **Outputs**: Plain text string
- **Use Cases**: System prompts, user messages, static text

### Upload Image Node
- **Purpose**: Upload and encode images
- **Outputs**: Base64 data URL
- **Features**: File upload, URL input, image gallery preview
- **Supported Formats**: JPEG, PNG, GIF, WebP

### Upload Video Node
- **Purpose**: Upload videos for processing
- **Outputs**: Base64 data URL or Transloadit URL
- **Features**: Optional cloud processing, file size display
- **Supported Formats**: MP4, WebM, MOV

### Run Any LLM Node
- **Purpose**: Execute Google Gemini AI
- **Inputs**:
  - System Prompt (optional)
  - User Message (required)
  - Images (optional, multiple)
- **Outputs**: Generated text
- **Models**: Gemini 2.0 Flash Lite (default), 2.5 Flash, 2.0 Flash (fallbacks)
- **Features**: Multimodal support, model fallback, inline results

### Crop Image Node
- **Purpose**: Crop images to specific dimensions
- **Inputs**: Image data URL
- **Parameters**: X, Y, Width, Height (pixels)
- **Outputs**: Cropped image as base64

### Extract Frame Node
- **Purpose**: Extract single frame from video
- **Inputs**: Video data URL
- **Parameters**: Timestamp (seconds/milliseconds)
- **Outputs**: Frame as base64 PNG
- **Technology**: FFmpeg (serverless-compatible binary)

## 🚀 Development Commands

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:push      # Push schema changes to DB
npm run prisma:seed      # Seed sample workflows
```

## 🎯 API Routes (tRPC)

### Workflows
- `workflow.list` - Get user's workflows
- `workflow.get` - Get workflow by ID
- `workflow.create` - Create new workflow
- `workflow.update` - Update workflow (nodes, edges, viewport)
- `workflow.delete` - Delete workflow
- `workflow.duplicate` - Clone workflow

### Folders
- `folder.list` - Get folder tree
- `folder.create` - Create folder
- `folder.update` - Rename folder
- `folder.delete` - Delete folder (cascade)

### Execution
- `execution.runWorkflow` - Execute entire workflow
- `execution.executeLLMNode` - Execute single LLM node

### History
- `history.getWorkflowRuns` - Get execution history
- `history.getRunDetails` - Get detailed run logs

## 🔐 Security

- **Authentication**: Clerk middleware protects all routes
- **Authorization**: User ID verified on all API calls
- **Data Isolation**: Users can only access their own workflows
- **Input Validation**: Zod schemas validate all API inputs
- **SQL Injection**: Prevented by Prisma's parameterized queries

## 🎨 UI Components

### Custom Hooks
- `useNodeLabel` - Shared label editing logic across all nodes
- `useToast` - Consistent toast notifications

### Visual Features
- **Node Execution Glow**: Yellow pulsating animation (2s cycle)
- **Animated Edges**: Flowing dashed lines (indigo blue, #6366f1)
- **Dot Grid Background**: Subtle grid for canvas alignment
- **Dark Mode**: Professional dark theme throughout

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `@xyflow/react` | Visual workflow canvas |
| `@clerk/nextjs` | Authentication |
| `@trpc/server` | Type-safe API |
| `@prisma/client` | Database ORM |
| `@google/generative-ai` | Gemini AI SDK |
| `fluent-ffmpeg` | Video processing |
| `@uppy/core` | File uploads |
| `zustand` | State management |
| `zod` | Schema validation |
| `sonner` | Toast notifications |

## 🐛 Troubleshooting

**"Prisma Client not found"**
```bash
npm run prisma:generate
```

**"Database connection failed"**
- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Test connection: `npx prisma db pull`

**"Clerk is not configured"**
- Add Clerk keys to `.env`
- Restart dev server
- Clear browser cookies

**"FFmpeg not found"**
- FFmpeg is bundled via `@ffmpeg-installer/ffmpeg`
- On Vercel, ensure webpack config includes binary
- Check `next.config.ts` for externals/copy plugins

**"Workflow execution timeout"**
- Workflows auto-fail after 200 seconds
- Check node execution logs in History panel
- Simplify workflow or optimize node processing

## 📝 License

This project is for educational and portfolio purposes.

## 🙏 Credits

Built with ❤️ using modern web technologies

- [React Flow](https://reactflow.dev) - Visual workflow engine
- [Clerk](https://clerk.com) - Authentication
- [Google Gemini](https://ai.google.dev) - AI capabilities
- [Shadcn/ui](https://ui.shadcn.com) - UI components
