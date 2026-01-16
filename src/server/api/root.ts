import { createTRPCRouter } from '@/server/api/trpc'
import { workflowRouter } from '@/server/api/routers/workflow'
import { executionRouter } from '@/server/api/routers/execution'
import { folderRouter } from '@/server/api/routers/folder'
import { historyRouter } from '@/server/api/routers/history'

export const appRouter = createTRPCRouter({
  workflow: workflowRouter,
  execution: executionRouter,
  folder: folderRouter,
  history: historyRouter,
})

export type AppRouter = typeof appRouter
