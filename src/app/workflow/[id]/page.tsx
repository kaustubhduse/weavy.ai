'use client'

import React, { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/workflow/Sidebar'
import { LeftSide } from '@/components/workflow/left-side'
import { Canvas } from '@/components/workflow/Canvas'

import { api } from '@/lib/trpc/client'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import { History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HistoryPanel } from '@/components/workflow/HistoryPanel'

export default function WorkflowPage() {
  const params = useParams()
  const workflowId = params.id as string
  const { data: workflow, isLoading } = api.workflow.get.useQuery({ id: workflowId })
  const utils = api.useUtils()
  const { nodes, edges, loadWorkflow } = useWorkflowStore()
  const [hasLoadedInitialData, setHasLoadedInitialData] = React.useState(false)
  
  const updateWorkflow = api.workflow.update.useMutation({
    onSuccess: () => {
      utils.workflow.get.invalidate({ id: workflowId })
      utils.workflow.list.invalidate()
    }
  })

  const handleRename = (name: string) => {
    updateWorkflow.mutate({ id: workflowId, name })
  }
  
  const handleSave = () => {
    updateWorkflow.mutate({ 
      id: workflowId, 
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type
      }))
    })
  }

  const [activeSidebarTab, setActiveSidebarTab] = React.useState<'search' | 'quick-access' | null>('search')
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)

  useEffect(() => {
    if (workflow && !hasLoadedInitialData) {
      loadWorkflow(
        workflow.nodes as any || [],
        workflow.edges as any || []
      )
      setHasLoadedInitialData(true)
    }
  }, [workflow, loadWorkflow, hasLoadedInitialData])
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasChanges = nodes.length > 0 || edges.length > 0
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [nodes.length, edges.length])

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading workflow...</div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Workflow not found</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-zinc-950 text-white overflow-hidden">
      {/* Left Navigation Rail - Hidden on mobile */}
      <div className="hidden md:block">
        <LeftSide activeTab={activeSidebarTab} onTabChange={setActiveSidebarTab} />
      </div>

      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="flex-1 flex overflow-hidden">
          <Sidebar 
            activeTab={activeSidebarTab} 
            workflowName={workflow?.name} 
            onRename={handleRename}
            onSave={handleSave}
            isSaving={updateWorkflow.isPending}
          />
          <div className="flex-1 relative">
            <Canvas />
            
            {/* History Toggle Button - Responsive positioning */}
            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 flex gap-2">
               <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className={`bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white backdrop-blur-sm text-xs md:text-sm ${isHistoryOpen ? 'text-blue-400 border-blue-900/50 bg-blue-900/10' : ''}`}
               >
                 <History className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                 <span className="hidden xs:inline">History</span>
               </Button>
            </div>

            <HistoryPanel 
              workflowId={workflowId}
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
