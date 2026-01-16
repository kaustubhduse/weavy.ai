
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { executeWorkflow } from "@/server/workflow/engine";
import { runLLM } from "@/server/workflow/llm";

export const executionRouter = createTRPCRouter({
  runWorkflow: publicProcedure
    .input(z.object({
      workflowId: z.string(),
      nodes: z.array(z.any()),
      edges: z.array(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const { workflowId, nodes, edges } = input;

      // Create WorkflowRun for Full Execution
      const dbRun = await ctx.db.workflowRun.create({
        data: {
            workflowId,
            status: 'RUNNING',
            // @ts-ignore
            scope: 'FULL',
            // @ts-ignore
            triggerType: 'MANUAL',
        }
      });

      // Fire and forget (inline execution without worker)
      executeWorkflow(ctx, {
        workflowId,
        nodes,
        edges,
        runId: dbRun.id
      }).then((result) => {
        console.log("Inline workflow finished:", result?.status);
      }).catch(err => {
        console.error("CRITICAL: Inline workflow failed/crashed:", err);
      });

      return { runId: dbRun.id };
    }),

  executeLLMNode: publicProcedure
    .input(z.object({
      workflowId: z.string(),
      nodeId: z.string(),
      systemPrompt: z.string().optional(),
      userMessage: z.string(),
      images: z.array(z.string()).optional(),
      temperature: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { workflowId, nodeId, systemPrompt, userMessage, images = [], temperature = 0.7 } = input;
      const startTime = Date.now();

      // Create WorkflowRun and NodeRun
      const run = await ctx.db.workflowRun.create({
        data: {
            workflowId,
            status: 'RUNNING',
            // @ts-ignore
            scope: 'SINGLE',
            // @ts-ignore
            triggerType: 'MANUAL',
            nodeRuns: {
                create: {
                    nodeId,
                    status: 'RUNNING',
                    inputs: { systemPrompt, userMessage, imagesCount: images.length } as any,
                }
            }
        },
        include: { nodeRuns: true }
      });
      
      // @ts-ignore
      const nodeRunId = run.nodeRuns?.[0]?.id;

      try {
        const result = await runLLM({
             prompt: userMessage,
             system: systemPrompt,
             images,
             temperature
        });

        const output = result.text;
        
        // Update History: Success
        const duration = Date.now() - startTime;
        if (nodeRunId) {
             await ctx.db.nodeRun.update({
                 where: { id: nodeRunId },
                 data: {
                     status: 'COMPLETED',
                     outputs: { output },
                     finishedAt: new Date(),
                     duration
                 }
             });
        }
        await ctx.db.workflowRun.update({
             where: { id: run.id },
             data: {
                 status: 'COMPLETED',
                 finishedAt: new Date(),
                 duration
             }
        });

        return { output };

      } catch (error: any) {
         // Failure handling
         console.error("Single Node Execution Failed:", error);
         const duration = Date.now() - startTime;
         const errorMessage = error instanceof Error ? error.message : 'Unknown error';
         
         if (nodeRunId) {
            await ctx.db.nodeRun.update({
                where: { id: nodeRunId },
                data: {
                    status: 'FAILED',
                    error: errorMessage,
                    finishedAt: new Date(),
                    duration
                }
            });
         }
         await ctx.db.workflowRun.update({
             where: { id: run.id },
             data: {
                 status: 'FAILED',
                 finishedAt: new Date(),
                 duration
             }
         });
         
         throw error;
      }
    }),
});
