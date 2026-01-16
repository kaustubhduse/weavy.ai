import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'

export const historyRouter = createTRPCRouter({
  getWorkflowRuns: publicProcedure
    .input(z.object({
      workflowId: z.string(),
      limit: z.number().optional().default(3)  // Default to 3 for fast loading
    }))
    .query(async ({ ctx, input }) => {
      const runs = await ctx.db.workflowRun.findMany({
        where: { workflowId: input.workflowId },
        orderBy: { startedAt: 'desc' },
        take: input.limit
      })
      return runs
    }),

  getRunDetails: publicProcedure
    .input(z.object({
      runId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const run = await ctx.db.workflowRun.findUnique({
        where: { id: input.runId },
        include: {
          nodeRuns: {
             orderBy: { startedAt: 'asc' }
          }
        }
      })
      
      if (!run) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Run not found',
        })
      }
      return run
    }),
})
