'use client'

import React from 'react'
import { useReactFlow } from '@xyflow/react'
import { Maximize, Plus, Minus, Undo, Redo, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import { api } from '@/lib/trpc/client'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'

export function CanvasControls() {
  const { fitView, zoomIn, zoomOut } = useReactFlow()
  const { undo, redo, canUndo, canRedo, nodes, edges, updateNode } = useWorkflowStore()
  const params = useParams()
  const workflowId = params.id as string
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null)

  const utils = api.useUtils()
  
  const runWorkflow = api.execution.runWorkflow.useMutation({
    onSuccess: (data) => {
      toast.success("Workflow started")
      setCurrentRunId(data.runId)
      // Refresh history immediately so it appears in the list
      utils.history.getWorkflowRuns.invalidate({ workflowId })
    },
    onError: (err) => {
        toast.error("Failed to start workflow: " + err.message)
    }
  })

  // Polling for run details
  const { data: runDetails } = api.history.getRunDetails.useQuery(
    { runId: currentRunId! },
    { 
        enabled: !!currentRunId,
        refetchInterval: (query: any) => {
            const data = query?.state?.data
            if (data?.status === 'COMPLETED' || data?.status === 'FAILED') return false
            return 1000
        }
    }
  )

  // Sync results to nodes
  React.useEffect(() => {
    if (!runDetails) return

    runDetails.nodeRuns.forEach((run: any) => {
         const output = run.output as any

         if (output) {
             // Heuristic to map specific outputs to node data fields
             const updateData: any = {}
             
             if (output.text) updateData.result = output.text
             if (output.output) updateData.output = output.output
             if (output.imageData) updateData.imageData = output.imageData
             if (output.videoUrl) updateData.videoUrl = output.videoUrl
             
             // Also execute status visual (optional, maybe border color?)
             
             // Only update if changed to avoid loop (Zustand handles strict equality, but good to be careful)
             // We just push the update.
             updateNode(run.nodeId, updateData)
         }
         
         if (run.error) {
             updateNode(run.nodeId, { result: "Error: " + run.error, error: run.error })
         }
    })

    if (runDetails.status === 'COMPLETED' || runDetails.status === 'FAILED') {
        if (runDetails.status === 'COMPLETED') toast.success("Workflow completed")
        else toast.error("Workflow failed")
        setCurrentRunId(null) // Stop polling
        utils.history.getWorkflowRuns.invalidate({ workflowId }) // Refresh history panel
    }
  }, [runDetails, updateNode, utils, workflowId])

  const handleRun = () => {
    runWorkflow.mutate({
        workflowId,
        nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data })),
        edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle }))
    })
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center bg-[#18181B] border border-zinc-800 rounded-full shadow-xl p-1 gap-1">
      {/* Fit View - Blue Pill Button */}
      <Button
        onClick={() => fitView({ duration: 800 })}
        className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white p-0 shadow-lg shadow-blue-900/20"
      >
        <Maximize className="h-5 w-5" />
      </Button>

      {/* Divider */}
      <div className="h-4 w-[1px] bg-zinc-700 mx-1" />

      {/* Zoom Controls */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomIn({ duration: 800 })}
        className="h-9 w-9 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
      >
        <Plus className="h-5 w-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomOut({ duration: 800 })}
        className="h-9 w-9 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
      >
        <Minus className="h-5 w-5" />
      </Button>

      {/* Divider */}
      <div className="h-4 w-[1px] bg-zinc-700 mx-1" />

      {/* History Controls */}
      <Button
        variant="ghost"
        size="icon"
        onClick={undo}
        disabled={!canUndo()}
        className="h-9 w-9 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30"
      >
        <Undo className="h-5 w-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={redo}
        disabled={!canRedo()}
        className="h-9 w-9 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30"
      >
        <Redo className="h-5 w-5" />
      </Button>

      {/* Divider */}
      <div className="h-4 w-[1px] bg-zinc-700 mx-1" />

       {/* Run Button */}
       <Button
        onClick={handleRun}
        disabled={runWorkflow.isPending}
        className="h-9 px-4 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 flex items-center gap-2"
      >
        <Play className={`h-4 w-4 ${runWorkflow.isPending ? 'animate-spin' : 'fill-current'}`} />
        <span className="text-xs font-semibold">
            {runWorkflow.isPending ? 'Running...' : 'Run'}
        </span>
      </Button>

    </div>
  )
}
