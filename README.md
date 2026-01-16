# Weavy.ai Clone - LLM Workflow Builder

A pixel-perfect clone of Weavy.ai's workflow builder interface, focusing on LLM workflows with Google Gemini integration. Build powerful visual workflows for multimodal content generation.

## 🚀 Features

- **Visual Workflow Builder**: Drag-and-drop canvas with React Flow
- **3 Node Types**:
  - **Text Node**: Editable text input for prompts and messages
  - **Image Node**: Upload and preview images  
  - **Run Any LLM Node**: Execute Google Gemini with multimodal support (text + images)
- **Type-Safe Connections**: Text connects to text, images to images
- **DAG Validation**: Prevents circular dependencies
- **Undo/Redo**: Full history tracking
- **Persistence**: Save and load workflows from PostgreSQL
- **Pre-built Sample**: "Product Marketing Workflow" demonstrating end-to-end multimodal capabilities

## 🛠 Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Database** | PostgreSQL + Prisma |
| **Auth** | Clerk |
| **API** | tRPC |
| **Data Fetching** | TanStack Query |
| **Canvas** | React Flow (@xyflow/react) |
| **State** | Zustand |
| **Validation** | Zod |
| **UI** | Shadcn/ui + Tailwind CSS |
| **LLM** | Google Gemini API |

## ⚡ Quick Start & Setup

### Prerequisites

- **Node.js 20+** and npm
- **PostgreSQL database** (local or cloud)
- **Clerk account** - [Sign up for free](https://clerk.com)
- **Google Gemini API key** - [Get free key](https://aistudio.google.com/app/apikey)

---

### 🔧 Step 1: Install Dependencies

The project is already initialized with all dependencies in `package.json`. Simply run:

```bash
# Navigate to project directory
cd c:\Users\Kaustubh Duse\OneDrive\Desktop\weavy\weavy

# Install all dependencies (514 packages)
npm install
```

**Expected output:** `added 514 packages` with no vulnerabilities

---

### 🔑 Step 2: Set Up Environment Variables

Create a `.env.local` file in the **project root directory**:

**Option A: Using PowerShell**
```powershell
# Create the file
New-Item -Path ".env.local" -ItemType File -Force
```

**Option B: Manual creation**
- Right-click in the project folder → New → Text Document
- Name it `.env.local` (remove `.txt` extension)

Then add your API keys to `.env.local`:

```env
# Database - Replace with your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/weavy"

# Clerk Authentication - Get from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Google Gemini - Get from https://aistudio.google.com/app/apikey
GOOGLE_GEMINI_API_KEY="AIza..."

# App URL (keep as-is for local development)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### 🔗 Where to Get API Keys:

1. **PostgreSQL Database:**
   - **Local:** Install PostgreSQL locally
   - **Cloud (Free):** [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com)
   - Connection string format: `postgresql://username:password@host:5432/database_name`

2. **Clerk (Free tier available):**
   - Go to [clerk.com](https://clerk.com) → Sign up
   - Create a new application
   - Go to **API Keys** → Copy both keys

3. **Google Gemini API (Free tier: 15 requests/min):**
   - Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Click **"Get API Key"** → Create new key
   - Copy the `AIza...` key

---

### 💾 Step 3: Initialize Database

Run these commands **in order**:

```bash
# 1. Generate Prisma client (creates type-safe database client)
npm run prisma:generate

# 2. Push schema to database (creates tables)
npm run prisma:push

# 3. Seed sample data (optional - creates "Product Marketing" workflow)
npm run prisma:seed
```

**Expected output for seed:**
```
Created workflow: clxxxxxx
Sample workflow created successfully!
```

---

### 🚀 Step 4: Run the Application

```bash
# Start development server
npm run dev
```

**Expected output:**
```
▲ Next.js 16.1.1
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

**Open your browser** and navigate to:
```
http://localhost:3000
```

---

### 🎯 Step 5: First-Time Usage

1. **Sign Up/Sign In:**
   - Click "Sign Up" (powered by Clerk)
   - Use email or Google/GitHub sign-in
   
2. **Access Sample Workflow:**
   - You'll see the "Product Marketing Workflow" card
   - Click to open the visual editor

3. **Test the Workflow:**
   - Upload images to the 3 Image Nodes
   - Edit text in the Text Nodes
   - Click **"Execute"** on the "Analyze Product" LLM node
   - View results appearing inline on the node

4. **Create Your Own Workflow:**
   - Click **"+ Create New Workflow"**
   - Drag nodes from the left sidebar
   - Connect nodes by dragging from output to input handles
   - Click **"Save"** to persist to database

---

### 🛠 Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm run start

# Run ESLint
npm run lint

# Database commands
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:push      # Push schema changes to database
npm run prisma:seed      # Re-seed sample data
```

---

### ⚠️ Troubleshooting

**Issue: "Module not found: Can't resolve '@prisma/client'"**
```bash
npm run prisma:generate
```

**Issue: "Invalid `prisma.workflow.create()` invocation"**
- Check your `DATABASE_URL` in `.env.local`
- Ensure PostgreSQL is running
- Run `npm run prisma:push` again

**Issue: "Clerk is not configured"**
- Verify both Clerk keys are in `.env.local`
- Ensure keys start with `pk_test_` and `sk_test_`
- Restart the dev server after adding keys

**Issue: "Gemini API error"**
- Verify your API key starts with `AIza`
- Check quota at [aistudio.google.com](https://aistudio.google.com)
- Free tier allows 15 requests/minute

**Issue: Port 3000 already in use**
```bash
# Kill the process or use a different port
$env:PORT=3001; npm run dev
```

---

## 📋 Sample Workflow

The seed includes a pre-built "Product Marketing Workflow":

```
[Image: Product Photo 1] ──┐
[Image: Product Photo 2] ──┼──> [LLM: Analyze Product] ──┬──> [LLM: Amazon Listing] ──> [Result]
[Image: Product Photo 3] ──┘            ↑                 ├──> [LLM: Instagram Caption] ──> [Result]
                                        │                 └──> [LLM: SEO Description] ──> [Result]
[Text: System Prompt] ──────────────────┤
[Text: Product Details] ─────────────────┘
```

**To use:**
1. Upload 3 product images to the Image Nodes
2. Click "Execute" on the "Analyze Product" LLM node
3. Results appear inline on the node
4. Execute downstream nodes to generate marketing copy

## 🎨 Architecture

### State Management (Zustand)
- Nodes and edges stored in global state
- Real-time validation on connections
- Cycle detection using DFS algorithm
- History stack for undo/redo

### API Layer (tRPC)
- **Workflow Router**: CRUD operations with ownership verification
- **Execution Router**: LLM processing with Gemini API
- Type-safe end-to-end with Zod schemas

### Database (Prisma)
```prisma
model Workflow {
  id      String @id
  name    String
  userId  String
  nodes   Node[]
  edges   Edge[]
}

model Node {
  id    String @id
  type  String  // 'text' | 'image' | 'llm'
  data  Json    // Node-specific configuration
}

model Edge {
  id           String @id
  source       String
  target       String
  sourceHandle String?
  targetHandle String?
}
```

## 🔑 Key Implementation Details

### Connection Validation
```typescript
const connectionRules = {
  text: ['text'],   // Text only connects to text
  image: ['image'], // Images only connect to images
}

// Cycle detection prevents infinite loops
function checkForCycles(source: string, target: string): boolean {
  // DFS to detect cycles in DAG
}
```

### LLM Node Execution
- **3 Input Handles**:
  1. `system_prompt` (text, optional)
  2. `user_message` (text, required)
  3. `images` (image, optional, multiple)
- **1 Output Handle**: `output` (text)
- Results displayed inline on the node
- Supports multimodal requests (text + images)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/trpc/          # tRPC API routes
│   ├── workflow/[id]/     # Workflow editor page
│   └── page.tsx           # Dashboard/landing
├── components/
│   ├── nodes/             # Custom React Flow nodes
│   │   ├── TextNode.tsx
│   │   ├── ImageNode.tsx
│   │   └── LLMNode.tsx
│   ├── workflow/          # Workflow UI components
│   │   ├── Sidebar.tsx
│   │   ├── Canvas.tsx
│   │   └── Toolbar.tsx
│   └── ui/                # Shadcn components
├── lib/
│   ├── store/             # Zustand state management
│   ├── trpc/              # tRPC client setup
│   └── types.ts           # TypeScript definitions
└── server/
    ├── api/               # tRPC routers
    ├── db.ts              # Prisma client
    └── gemini.ts          # Gemini API client
```

## 🚧 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to database
npm run prisma:seed      # Seed sample data
```

## 🔒 Security

- Environment variables never committed (`.env.local` in `.gitignore`)
- Clerk handles authentication
- tRPC protectedProcedure ensures user ownership
- Zod validates all API inputs

## 📝 License

This project is for educational purposes as a Weavy.ai clone demonstration.

## 🙏 Acknowledgments

- [Weavy.ai](https://weavy.ai) for the design inspiration
- [React Flow](https://reactflow.dev) for the canvas library
- [Google Gemini](https://ai.google.dev) for the LLM API
