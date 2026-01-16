'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, ConnectionMode, 
  type Node, type ReactFlowInstance, } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import { TextNode } from '@/components/nodes/TextNode'
import { UploadImageNode } from '@/components/nodes/UploadImageNode'
import { UploadVideoNode } from '@/components/nodes/UploadVideoNode'
import { CropImageNode } from '@/components/nodes/CropImageNode'
import { ExtractFrameNode } from '@/components/nodes/ExtractFrameNode'
import { LLMNode } from '@/components/nodes/LLMNode'
import { CanvasControls } from '@/components/workflow/CanvasControls'

const nodeTypes = {
  text: TextNode,
  'upload-image': UploadImageNode,
  'upload-video': UploadVideoNode,
  llm: LLMNode,
  'crop-image': CropImageNode,
  'extract-frame': ExtractFrameNode,
}

export function Canvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    duplicateNode,
    preferences,
  } = useWorkflowStore()
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

        const selectedNodes = nodes.filter((n) => n.selected)
        const deleteNode = useWorkflowStore.getState().deleteNode
        selectedNodes.forEach((n) => deleteNode(n.id))

        const selectedEdges = edges.filter((e) => e.selected)
        const deleteEdge = useWorkflowStore.getState().deleteEdge
        selectedEdges.forEach((e) => deleteEdge(e.id))
      }

      // Duplicate (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

        const selectedNodes = nodes.filter((n) => n.selected)
        selectedNodes.forEach((n) => duplicateNode(n.id))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nodes, edges, duplicateNode])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as string
      
      if (!type || !reactFlowInstance || !reactFlowWrapper.current) {
        return
      }

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const id = `${type}-${Date.now()}`
      let data: any = {}
      let label = ''

      switch (type) {
        case 'text':
           label = 'Text Node'
           data = { label, text: '' }
           break
        case 'upload-image':
           label = 'Upload Image'
           data = { label, imageData: '' }
           break
        case 'upload-video':
           label = 'Upload Video'
           data = { label, videoUrl: '' }
           break
        case 'llm':
           label = 'Run Any LLM'
           data = { label, model: 'gemini-2.0-flash-lite', temperature: 0.7 }
           break
        case 'crop-image':
           label = 'Crop Image'
           data = { label, x: 0, y: 0, width: 100, height: 100 }
           break
        case 'extract-frame':
           label = 'Extract Frame'
           data = { label, timestamp: 0 }
           break
      }

      const newNode: Node = {id, type, position, data}
      addNode(newNode)
    },
    [reactFlowInstance, addNode]
  )

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full bg-zinc-950" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        className="bg-zinc-950"
        proOptions={{ hideAttribution: true }}
        zoomOnScroll={preferences.useScrollWheelZoom}
        panOnScroll={!preferences.useScrollWheelZoom}
        onContextMenu={(e) => preferences.rightClickToOpenMenu && e.preventDefault()}
        connectionLineStyle={{ stroke: '#F1A0FA', strokeWidth: 5 }}
        defaultEdgeOptions={{
          style: { strokeWidth: 3, stroke: '#FFFFFF' },
          type: 'default',
        }}
        isValidConnection={(connection) => {
          if (connection.source === connection.target) return false

          const sourceHandle = connection.sourceHandle
          const targetHandle = connection.targetHandle
          
          let sourceType = 'unknown'
          let targetType = 'unknown'

          // Determine Source Type
          if (sourceHandle === 'prompt-output') sourceType = 'text'
          if (sourceHandle === 'text-output') sourceType = 'text' // LLM result
          if (sourceHandle === 'image-output') sourceType = 'image'
          if (sourceHandle === 'video-output') sourceType = 'video'

          // Determine Target Type
          if (targetHandle === 'system_prompt-input') targetType = 'text'
          if (targetHandle === 'user_message-input') targetType = 'text'
          if (targetHandle === 'images-input') targetType = 'image' // LLM accepts images
          if (targetHandle === 'image-url-input') targetType = 'image' // Crop accepts image
          if (targetHandle === 'video-url-input') targetType = 'video' // Extract accepts video
          
          // Strict Type Matching
          return sourceType === targetType
        }}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#27272a"
          className="bg-zinc-950"
        />
        
        <CanvasControls />
        
        <MiniMap 
          className="bg-zinc-900 border border-zinc-700"
          nodeColor={(node) => {
            if (node.type === 'text') return '#10b981'
            if (node.type === 'image') return '#8b5cf6'
            if (node.type === 'llm') return '#3b82f6'
            return '#64748b'
          }}
          maskColor="rgba(24, 24, 27, 0.6)"
        />
      </ReactFlow>
    </div>
  )
}
