'use client'

import { Handle, Position, type NodeProps, Node } from '@xyflow/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type LLMNodeData } from '@/lib/types'
import { useRef, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import { NodeActionsMenu } from './NodeActionsMenu'
import { Loader2, Play, AlertCircle } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { toast } from '@/hooks/use-toast'
import { useParams } from 'next/navigation'
import { useNodeLabel } from '@/hooks/use-node-label'

export function LLMNode({ id, data }: NodeProps<Node<any>>) {
  const nodeData = data as LLMNodeData
  const [result, setResult] = useState(nodeData.result || '')
  const [isExecuting, setIsExecuting] = useState(false)
  const { isRenaming, label, inputRef, handleLabelChange, handleLabelSubmit, handleKeyDown, startRenaming} = useNodeLabel(id, nodeData.label || 'LLM')
  
  const updateNode = useWorkflowStore((state) => state.updateNode)
  const { nodes, edges } = useWorkflowStore()
  const params = useParams()
  
  const executeMutation = api.execution.executeLLMNode.useMutation()

  // Sync nodeData changes to local state (for workflow execution results)
  useEffect(() => {
    if (nodeData.result !== undefined && nodeData.result !== result) {
      setResult(nodeData.result)
    }
    if (nodeData.isExecuting !== undefined) {
      setIsExecuting(nodeData.isExecuting)
    }
  }, [nodeData.result, nodeData.isExecuting])

  const handleExecute = async () => {
    setIsExecuting(true)
    
    try {
      const connectedEdges = edges.filter((edge) => edge.target === id)
      
      let systemPrompt = ''
      let userMessage = ''
      const images: string[] = []
      
      for (const edge of connectedEdges) {
        const sourceNode = nodes.find((n) => n.id === edge.source)
        if (!sourceNode) continue
        
        if (edge.targetHandle === 'system_prompt-input') {
          if (sourceNode.type === 'text') {
            systemPrompt = (sourceNode.data as any).text || ''
          } else if (sourceNode.type === 'llm') {
            systemPrompt = (sourceNode.data as any).result || ''
          }
        } else if (edge.targetHandle === 'user_message-input') {
          if (sourceNode.type === 'text') {
            userMessage = (sourceNode.data as any).text || ''
          } else if (sourceNode.type === 'llm') {
            userMessage = (sourceNode.data as any).result || ''
          }
        } else if (edge.targetHandle === 'images-input') {
          // Accept images from various node types
          const validImageTypes = ['image', 'upload-image', 'crop-image', 'extract-frame']
          if (validImageTypes.includes(sourceNode.type || '')) {
             const d = sourceNode.data as any
             if (d.images && Array.isArray(d.images)) {
                 images.push(...d.images)
             } else if (d.imageData) {
                 images.push(d.imageData)
             } else if (d.frameData) { // ExtractFrameNode uses frameData
                 images.push(d.frameData)
             }
          }
        }
      }
      
      if (!userMessage) {
        toast({
          title: 'Error',
          description: 'User message is required. Please connect a text node to the user_message input.',
          variant: 'destructive',
        })
        setIsExecuting(false)
        return
      }
      
      const response = await executeMutation.mutateAsync({
        workflowId: params.id as string,
        nodeId: id,
        systemPrompt,
        userMessage,
        images,
        temperature: nodeData.temperature || 0.7,
      })
      
      setResult(response.output)
      updateNode(id, { result: response.output })
      
      toast({
        title: 'Success',
        description: 'LLM execution completed successfully',
      })
    } catch (error) {
      console.error('Execution error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to execute LLM',
        variant: 'destructive',
      })
    } finally {
      setIsExecuting(false)
    }
  }

  // Re-sync result if data changes externally
  useEffect(() => {
    if (nodeData.result !== undefined) setResult(nodeData.result)
  }, [nodeData.result])

  return (
    <Card className={`min-w-[350px] max-w-[400px] bg-[#2B2B2F] border-zinc-800 shadow-xl rounded-2xl overflow-visible ${nodeData.locked ? 'nodrag border-red-900/50' : ''} ${nodeData.isExecuting ? 'node-executing' : ''}`}>
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-900/30 flex items-center justify-center border border-teal-700/50">
                <Loader2 className={`h-5 w-5 text-teal-400 ${isExecuting ? 'animate-spin' : ''}`} />
            </div>
            {isRenaming ? (
            <Input
                ref={inputRef}
                value={label}
                onChange={handleLabelChange}
                onBlur={handleLabelSubmit}
                onKeyDown={handleKeyDown}
                className="h-7 w-[150px] bg-zinc-900 border-zinc-700 text-sm text-white"
            />
            ) : (
            <span className="text-sm font-medium text-white">{label}</span>
            )}
        </div>
        
        <div className="flex items-center gap-2">
            {!nodeData.locked && (
                <Button
                    onClick={handleExecute}
                    disabled={isExecuting}
                    size="sm"
                    className="h-7 bg-white text-black hover:bg-zinc-200 text-xs font-semibold px-3"
                >
                    {isExecuting ? 'Running...' : 'Run'}
                </Button>
            )}
            <NodeActionsMenu 
                nodeId={id} 
                isLocked={nodeData.locked} 
                onRename={startRenaming} 
            />
        </div>
      </div>
      
      <CardContent className="p-4 pt-2 space-y-4">
        
        {/* INPUTS SECTION */}
        <div className="space-y-3">
            {/* System Prompt */}
            <div className="relative flex items-center h-8 bg-zinc-900/50 rounded-lg border border-zinc-800/50 px-3">
                 {/* Handle - Left */}
                 <div className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="system_prompt-input"
                        className="!w-3 !h-3 !rounded-full !border-[2px] !border-zinc-500 !bg-[#18181B] !opacity-100"
                    />
                 </div>
                 <span className="text-xs font-medium text-zinc-400">
                    System Prompt <span className="text-[10px] opacity-60 ml-1">(Optional)</span>
                 </span>
            </div>

            {/* User Message */}
            <div className="relative flex items-center h-8 bg-zinc-900/50 rounded-lg border border-zinc-800/50 px-3">
                 <div className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="user_message-input"
                        className="!w-3 !h-3 !rounded-full !border-[2px] !border-[#F1A0FA] !bg-[#18181B] !opacity-100"
                    />
                 </div>
                 <span className="text-xs font-medium text-[#F1A0FA] flex items-center gap-1">
                    User Message <span className="text-red-400">*</span>
                 </span>
            </div>

            {/* Images */}
            <div className="relative flex items-center h-8 bg-zinc-900/50 rounded-lg border border-zinc-800/50 px-3">
                 <div className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="images-input"
                        className="!w-3 !h-3 !rounded-full !border-[2px] !border-teal-400 !bg-[#18181B] !opacity-100"
                    />
                 </div>
                 <span className="text-xs font-medium text-teal-400">
                    Images
                 </span>
            </div>
        </div>

        {/* OUTPUT SECTION */}
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Result</span>
                <div className="relative">
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="text-output"
                        className="!w-3 !h-3 !rounded-full !border-[2px] !border-[#F1A0FA] !bg-[#18181B] !opacity-100"
                        style={{ right: '-20px' }}
                    />
                </div>
            </div>
            
            <div className="min-h-[150px] max-h-[400px] bg-[#18181B] rounded-xl border border-zinc-700/50 p-5 relative group">
                {result || isExecuting ? (
                        <div className="text-[15px] text-zinc-200 whitespace-pre-wrap leading-[1.7] h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {result}
                        {isExecuting && <span className="animate-pulse inline-block w-2 h-4 bg-teal-500 ml-1 align-middle"></span>}
                        </div>
                ) : (
                    <div className="h-full py-8 flex flex-col items-center justify-center text-zinc-600 gap-2">
                        <Play className="h-8 w-8 opacity-10" />
                        <span className="text-xs font-medium opacity-50">Run node to generate output</span>
                    </div>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
