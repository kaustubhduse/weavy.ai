import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const workflowRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        folderId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workflow = await ctx.db.workflow.create({
        data: {
          name: input.name,
          description: input.description,
          userId: ctx.userId,
          folderId: input.folderId,
        },
      })
      return workflow
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await ctx.db.workflow.findUnique({
        where: { id: input.id },
        include: {
          nodes: true,
          edges: true,
        },
      })

      if (!workflow || (workflow.userId !== ctx.userId && workflow.userId !== 'sample_user')) {
        throw new Error('Workflow not found')
      }

      return workflow
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.workflow.findMany({
      where: {
        OR: [
          { userId: ctx.userId },
          { userId: 'sample_user' }
        ]
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        nodes: true,
        edges: true,
      },
    })
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        nodes: z.array(z.any()).optional(),
        edges: z.array(z.any()).optional(),
        viewport: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Verify ownership
      const workflow = await ctx.db.workflow.findUnique({
        where: { id },
      })

      if (!workflow || workflow.userId !== ctx.userId) {
        throw new Error('Workflow not found')
      }

      // Delete existing nodes and edges
      if (data.nodes || data.edges) {
        await ctx.db.node.deleteMany({ where: { workflowId: id } })
        await ctx.db.edge.deleteMany({ where: { workflowId: id } })
      }

      // Update workflow
      const updated = await ctx.db.workflow.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.viewport && { viewport: data.viewport }),
        },
      })

      // Create new nodes
      if (data.nodes) {
        await ctx.db.node.createMany({
          data: data.nodes.map((node: any) => ({
            id: node.id,
            workflowId: id,
            type: node.type,
            position: node.position,
            data: node.data,
          })),
        })
      }

      // Create new edges
      if (data.edges) {
        await ctx.db.edge.createMany({
          data: data.edges.map((edge: any) => ({
            id: edge.id,
            workflowId: id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            type: edge.type,
          })),
        })
      }

      return updated
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.workflow.findUnique({
        where: { id: input.id },
        include: {
          nodes: true,
          edges: true,
        },
      })

      if (!existing || existing.userId !== ctx.userId) {
        throw new Error('Workflow not found')
      }

      const newWorkflow = await ctx.db.workflow.create({
        data: {
          name: `${existing.name} (Copy)`,
          description: existing.description,
          userId: ctx.userId,
          folderId: existing.folderId,
          viewport: existing.viewport || undefined,
          nodes: {
            create: existing.nodes.map((node) => ({
              type: node.type,
              position: node.position as any,
              data: node.data as any,
            })),
          },
          edges: {
            create: existing.edges.map((edge) => ({
              source: edge.source,
              target: edge.target,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle,
              type: edge.type,
            })),
          },
        },
      })

      return newWorkflow
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workflow = await ctx.db.workflow.findUnique({
        where: { id: input.id },
      })

      if (!workflow || workflow.userId !== ctx.userId) {
        throw new Error('Workflow not found')
      }

      return ctx.db.workflow.delete({
        where: { id: input.id },
      })
    }),

  getHistory: protectedProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await ctx.db.workflow.findUnique({
        where: { id: input.workflowId },
      })

      if (!workflow || workflow.userId !== ctx.userId) {
        throw new Error('Workflow not found')
      }

      return ctx.db.workflowRun.findMany({
        where: { workflowId: input.workflowId },
        orderBy: { startedAt: 'desc' },
        include: {
          nodeRuns: true,
        },
      })
    }),
})
