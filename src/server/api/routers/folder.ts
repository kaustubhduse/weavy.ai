import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const folderRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.folder.create({
        data: {
          name: input.name,
          userId: ctx.userId,
          parentId: input.parentId,
        },
      })
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.folder.findMany({
      where: { userId: ctx.userId },
      include: {
        workflows: true,
        children: true,
      },
      orderBy: { createdAt: 'asc' },
    })
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const folder = await ctx.db.folder.findUnique({
        where: { id: input.id },
        include: {
          workflows: true,
          children: true,
        },
      })

      if (!folder || folder.userId !== ctx.userId) {
        throw new Error('Folder not found')
      }

      return folder
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const folder = await ctx.db.folder.findUnique({
        where: { id: input.id },
      })

      if (!folder || folder.userId !== ctx.userId) {
        throw new Error('Folder not found')
      }

      return ctx.db.folder.update({
        where: { id: input.id },
        data: { name: input.name },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const folder = await ctx.db.folder.findUnique({
        where: { id: input.id },
      })

      if (!folder || folder.userId !== ctx.userId) {
        throw new Error('Folder not found')
      }

      return ctx.db.folder.delete({
        where: { id: input.id },
      })
    }),

  moveWorkflow: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        folderId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workflow = await ctx.db.workflow.findUnique({
        where: { id: input.workflowId },
      })

      if (!workflow || workflow.userId !== ctx.userId) {
        throw new Error('Workflow not found')
      }

      return ctx.db.workflow.update({
        where: { id: input.workflowId },
        data: { folderId: input.folderId },
      })
    }),
})
