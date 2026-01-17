
import { PrismaClient } from "@prisma/client";
import { runLLM } from "./llm";
import { runFFmpeg } from "./ffmpeg";

type NodeData = any;
type Node = { id: string; type: string; data: NodeData };
type Edge = { id: string; source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null };

// Topological Sort Helper
function topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach(e => {
    if (adj.has(e.source) && inDegree.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const sorted: Node[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    sorted.push(nodes.find(n => n.id === u)!);

    if (adj.has(u)) {
      adj.get(u)!.forEach(v => {
        inDegree.set(v, (inDegree.get(v) || 0) - 1);
        if (inDegree.get(v) === 0) queue.push(v);
      });
    }
  }

  return sorted;
}

export async function executeWorkflow(
    ctx: { db: PrismaClient }, 
    payload: { workflowId: string; nodes: Node[]; edges: Edge[]; runId: string }
) {
    const { workflowId, nodes, edges, runId } = payload;
    
    const run = await ctx.db.workflowRun.findUnique({ where: { id: runId } });
    if (!run) throw new Error("Workflow Run not found");

    const nodeOutputs = new Map<string, any>();
    const completedNodes = new Set<string>();
    const runningNodes = new Set<string>();

    try {
        // Continue until all nodes are completed
        while (completedNodes.size < nodes.length) {
            // Check if workflow has been marked as failed (by user or system)
            const currentRun = await ctx.db.workflowRun.findUnique({ where: { id: runId } });
            if (currentRun && (currentRun.status === 'FAILED' || currentRun.status === 'CANCELLED')) {
                console.log('[Workflow] Detected FAILED/CANCELLED status, stopping execution...');
                break;
            }
            
            // Find nodes that are:
            // 1. Not completed
            // 2. Not currently running
            // 3. Have all dependencies (incoming edges) met
            const executableNodes = nodes.filter(node => {
                if (completedNodes.has(node.id) || runningNodes.has(node.id)) return false;

                const incomingEdges = edges.filter(e => e.target === node.id);
                // Check if all source nodes for incoming edges are completed
                const allDependenciesMet = incomingEdges.every(e => completedNodes.has(e.source));
                return allDependenciesMet;
            });

            if (executableNodes.length === 0 && runningNodes.size === 0) {
                 // Deadlock or finished? 
                 if (completedNodes.size < nodes.length) {
                     console.warn(`Worklow Deadlock: Completed ${completedNodes.size}/${nodes.length}. Running: ${runningNodes.size}. Executable: ${executableNodes.length}`);
                     // Force fail remaining
                     const remaining = nodes.filter(n => !completedNodes.has(n.id));
                     remaining.forEach(async n => {
                        await ctx.db.nodeRun.create({
                             data: {
                               runId: run.id,
                               nodeId: n.id,
                               status: "FAILED",
                               startedAt: new Date(),
                               finishedAt: new Date(),
                               error: "Workflow Deadlock: Dependency cycle or unreachable."
                             }
                        });
                     });
                 }
                 break;
            }

            if (executableNodes.length === 0) {
                // Wait for some running nodes to finish before checking again
                // In a real event-loop, we'd wait for a promise. 
                // Since we are iterating, we await the *promises* of the current batch.
                // However, the logic below executes the batch immediately.
                // If we are here, it means we have running nodes but no NEW nodes can start yet.
                // We should just wait for the current batch loop to continue.
                // But since we await Promise.all below, we won't hit this 'continue' state usually.
                // Actually, due to the structure, we identify a batch, await it, then loop.
                // So if executableNodes is empty, it means we are truly done or stuck.
                break; 
            }

            // Mark these as running
            executableNodes.forEach(n => runningNodes.add(n.id));

            // Execute batch in parallel
            await Promise.all(executableNodes.map(async (node) => {
                // Log Start
                const nodeRun = await ctx.db.nodeRun.create({
                    data: {
                        runId: run.id,
                        nodeId: node.id,
                        status: "RUNNING",
                        startedAt: new Date(),
                        inputs: JSON.stringify(node.data),
                    }
                });

                const startTime = Date.now();
                let output: any = null;

                try {
                    // Resolve Inputs
                    const incomingEdges = edges.filter(e => e.target === node.id);
                    const systemPrompts: string[] = [];
                    const userMessages: string[] = [];
                    const inputImages: string[] = [];
                    let inputVideo: string | null = null;
                    let inputImageUrl: string | null = null;

                    for (const edge of incomingEdges) {
                        const sourceOutput = nodeOutputs.get(edge.source);
                        if (!sourceOutput) continue;

                        if (edge.targetHandle === 'system_prompt-input') systemPrompts.push(sourceOutput.text || '');
                        else if (edge.targetHandle === 'user_message-input') userMessages.push(sourceOutput.text || '');
                        else if (edge.targetHandle === 'images-input') {
                            // Aggressive image collection
                            if (sourceOutput.output) inputImages.push(sourceOutput.output);
                            else if (sourceOutput.imageData) inputImages.push(sourceOutput.imageData);
                            else if (Array.isArray(sourceOutput.images)) inputImages.push(...sourceOutput.images);
                            // Also check for 'text' if it looks like a url (rare but possible)
                            else if (sourceOutput.text && (sourceOutput.text.startsWith('http') || sourceOutput.text.startsWith('data:'))) {
                                inputImages.push(sourceOutput.text);
                            }
                        }
                        else if (edge.targetHandle === 'image-url-input') {
                            const candidate = sourceOutput.output || sourceOutput.imageData || sourceOutput.text;
                             if (candidate) {
                                inputImageUrl = candidate;
                                if (typeof inputImageUrl === 'object' && (inputImageUrl as any)?.text) {
                                    inputImageUrl = (inputImageUrl as any).text;
                                }
                            }
                        }
                        else if (edge.targetHandle === 'video-url-input') {
                             // Fix: check for text specifically if needed, but usually videoUrl or output
                            inputVideo = sourceOutput.output || sourceOutput.videoUrl || sourceOutput.text;
                        }
                    }

                    // Node Logic
                    if (node.type === 'text') {
                        output = { text: node.data.text };
                    } 
                    else if (node.type === 'upload-image') {
                        output = { imageData: node.data.imageData };
                    }
                    else if (node.type === 'upload-video') {
                        output = { videoUrl: node.data.videoUrl };
                    }
                    else if (node.type === 'llm') {
                        const prompt = userMessages.join('\n') || node.data.prompt || ''; 
                        const system = systemPrompts.join('\n');
                        const result = await runLLM({
                            prompt,
                            system,
                            images: inputImages, // Pass aggregated images
                            temperature: node.data.temperature || 0.7
                        });
                        output = { text: result.text };
                    }
                    else if (node.type === 'crop-image') {
                        if (!inputImageUrl) throw new Error("No image input provided. Connect an image source.");
                        const result = await runFFmpeg({
                             operation: 'crop',
                             inputUrl: inputImageUrl,
                             params: {
                                 x: node.data.x,
                                 y: node.data.y,
                                 width: node.data.width,
                                 height: node.data.height
                             }
                        });
                        output = { output: result.output };
                    }
                    else if (node.type === 'extract-frame') {
                         if (!inputVideo) throw new Error("No video input provided. Connect a video source.");
                         const result = await runFFmpeg({
                             operation: 'extract',
                             inputUrl: inputVideo,
                             params: { timestamp: node.data.timestamp }
                         });
                         output = { output: result.output };
                    }

                    // Success
                    nodeOutputs.set(node.id, output);
                    completedNodes.add(node.id);
                    runningNodes.delete(node.id); // Remove from running

                    await ctx.db.nodeRun.update({
                        where: { id: nodeRun.id },
                        data: {
                            status: "COMPLETED",
                            finishedAt: new Date(),
                            duration: Date.now() - startTime,
                            outputs: output ? JSON.stringify(output) : undefined
                        }
                    });

                } catch (err: any) {
                    // Failure
                    console.error(`Node ${node.id} failed:`, err);
                    await ctx.db.nodeRun.update({
                        where: { id: nodeRun.id },
                        data: {
                            status: "FAILED",
                            finishedAt: new Date(),
                            duration: Date.now() - startTime,
                            error: err.message
                        }
                    });
                     // Stop entire workflow by rethrowing
                    throw err;
                }
            }));
        }

        // Workflow Success
        await ctx.db.workflowRun.update({
            where: { id: run.id },
            data: {
                status: "COMPLETED",
                finishedAt: new Date(),
                duration: Date.now() - run.startedAt.getTime()
            }
        });

        return { status: "COMPLETED", runId: run.id };

    } catch (error: any) {
        // Workflow Failed
        await ctx.db.workflowRun.update({
            where: { id: run.id },
            data: {
                status: "FAILED",
                finishedAt: new Date(),
                duration: Date.now() - run.startedAt.getTime()
            }
        });
    }
}
