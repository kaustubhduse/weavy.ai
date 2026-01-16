'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  Sparkles, 
  Search,
  ArrowUpDown,
  Download,
  Bot,
  Type,
  Image as ImageIcon,
  Video,
  Crop,
  Film,
  Save
} from 'lucide-react'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import { type Node } from '@xyflow/react'

interface SidebarProps {
  activeTab: 'search' | 'quick-access' | null
  workflowName?: string
  onRename?: (name: string) => void
  onSave?: () => void
  isSaving?: boolean
}

type NodeType = 'text' | 'upload-image' | 'upload-video' | 'llm' | 'crop-image' | 'extract-frame'

export function Sidebar({ activeTab, workflowName = 'Untitled Workflow', onRename, onSave, isSaving }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { nodes, addNode } = useWorkflowStore()
  const [tempName, setTempName] = useState(workflowName)

  useEffect(() => {
    setTempName(workflowName)
  }, [workflowName])

  const handleNameSubmit = () => {
    if (tempName.trim() && tempName !== workflowName && onRename) {
      onRename(tempName)
    } else {
      setTempName(workflowName)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit()
    }
    if (e.key === 'Escape') {
      setTempName(workflowName)
      // Optional: blur the input if desired, e.g. (e.target as HTMLInputElement).blur()
      ;(e.target as HTMLInputElement).blur()
    }
  }

  // Smart positioning: Find free space on canvas
  const findFreePosition = (): { x: number; y: number } => {
    if (nodes.length === 0) {
      return { x: 100, y: 100 }
    }

    // Try grid positions
    const gridSize = 300
    const maxAttempts = 50
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const row = Math.floor(attempt / 5)
      const col = attempt % 5
      const testX = 100 + col * gridSize
      const testY = 100 + row * gridSize
      
      // Check if this position overlaps with existing nodes
      const hasOverlap = nodes.some((node) => {
        const nodeX = node.position.x
        const nodeY = node.position.y
        const distance = Math.sqrt(
          Math.pow(testX - nodeX, 2) + Math.pow(testY - nodeY, 2)
        )
        return distance < 250 // Minimum distance between nodes
      })
      
      if (!hasOverlap) {
        return { x: testX, y: testY }
      }
    }
    
    // Fallback: place to the right of all nodes
    const maxX = Math.max(...nodes.map((n) => n.position.x))
    return { x: maxX + 350, y: 100 }
  }

  /* 
   * Updated helper to accept label override 
   */
  const createNode = (type: NodeType, labelOverride?: string) => {
    const id = `${type}-${Date.now()}`
    const position = findFreePosition()
    
    let data: any = {}
    let label = labelOverride || ''
    
    switch (type) {
      case 'text':
        if (!label) label = 'Text Node'
        data = { label, text: '' }
        break
      case 'upload-image':
        if (!label) label = 'Upload Image'
        data = { label, imageData: '' }
        break
      case 'upload-video':
        if (!label) label = 'Upload Video'
        data = { label, videoUrl: '' }
        break
      case 'llm':
        if (!label) label = 'Run Any LLM'
        data = { label, model: 'gemini-2.0-flash-lite', temperature: 0.7 }
        break
      case 'crop-image':
        if (!label) label = 'Crop Image'
        data = { label, x: 0, y: 0, width: 100, height: 100 }
        break
      case 'extract-frame':
        if (!label) label = 'Extract Frame'
        data = { label, timestamp: 0 }
        break
    }
    
    const newNode: Node = {
      id,
      type,
      position,
      data,
    }
    
    addNode(newNode)
  }

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const isCollapsed = !activeTab

  return (
    <>
      {/* 1. COLLAPSED STATE: Floating Title Pill */}
      <div 
        className={`absolute top-[18px] left-4 z-50 transition-all duration-300 ease-in-out ${
          isCollapsed 
            ? 'opacity-100 translate-x-0 pointer-events-auto' 
            : 'opacity-0 -translate-x-4 pointer-events-none'
        }`}
      >
         <Input
           value={tempName}
           onChange={(e) => setTempName(e.target.value)}
           onBlur={handleNameSubmit}
           onKeyDown={handleKeyDown}
           className="text-sm text-white bg-zinc-900/90 border border-zinc-800 h-9 px-3 focus-visible:ring-blue-600 font-semibold w-52 shadow-lg backdrop-blur-sm"
         />
      </div>

      {/* 2. EXPANDED STATE: Sidebar Drawer */}
      <div 
        className={`bg-zinc-900 border-r border-zinc-800 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-0 border-r-0 opacity-0' : 'w-60 opacity-100'
        }`}
      >
        <div className="w-60 flex flex-col h-full"> {/* Inner container to fix width during transition */}
          
          {/* Header */}
          <div className="px-4 pt-[10%] pb-0">
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyDown}
              className="text-sm text-white bg-transparent border-transparent h-auto p-0 font-semibold focus-visible:ring-0 focus-visible:border-zinc-700 hover:border-zinc-800 border transition-all mb-3 w-full rounded px-2 py-1.5 cursor-text"
            />

            <div className="space-y-2">
              <div className="mt-11 flex items-center gap-2">
                <div className="relative flex-1 mr-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-zinc-500" />
                  <Input 
                    placeholder="Search" 
                    className="pl-9 bg-zinc-800/50 border-zinc-700 text-xs h-8 text-zinc-300 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="mb-6">
              <h3 className={`text-md font-medium text-white mb-4 ${activeTab === 'quick-access' ? 'mt-4' : ''}`}>Quick access</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Text Node */}
                <Button
                  onClick={() => createNode('text', 'Text Node')}
                  onDragStart={(e) => onDragStart(e, 'text')}
                  draggable
                  variant="outline"
                  className="h-28 flex flex-col items-center justify-center gap-3 bg-transparent border-zinc-600 text-white hover:bg-zinc-800/50 hover:text-white hover:border-zinc-700 transition-all p-0"
                >
                  <Type className="h-6 w-6" strokeWidth={1.5} />
                  <span className="text-xs font-medium">Text Node</span>
                </Button>
                
                {/* 2. Upload Image Node */}
                <Button
                  onClick={() => createNode('upload-image', 'Upload Image')}
                  onDragStart={(e) => onDragStart(e, 'upload-image')}
                  draggable
                  variant="outline"
                  className="h-28 flex flex-col items-center justify-center gap-3 bg-transparent border-zinc-600 text-white hover:bg-zinc-800/50 hover:text-white hover:border-zinc-700 transition-all p-0"
                >
                  <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
                  <span className="text-xs font-medium">Upload Image</span>
                </Button>

                {/* 3. Upload Video Node */}
                <Button
                  onClick={() => createNode('upload-video', 'Upload Video')}
                  onDragStart={(e) => onDragStart(e, 'upload-video')}
                  draggable
                  variant="outline"
                  className="h-28 flex flex-col items-center justify-center gap-3 bg-transparent border-zinc-600 text-white hover:bg-zinc-800/50 hover:text-white hover:border-zinc-700 transition-all p-0"
                >
                  <Video className="h-6 w-6" strokeWidth={1.5} />
                  <span className="text-xs font-medium">Upload Video</span>
                </Button>
                
                {/* 4. Run Any LLM */}
                <Button
                  onClick={() => createNode('llm', 'Run Any LLM')}
                  onDragStart={(e) => onDragStart(e, 'llm')}
                  draggable
                  variant="outline"
                  className="h-28 flex flex-col items-center justify-center gap-3 bg-transparent border-zinc-600 text-white hover:bg-zinc-800/50 hover:text-white hover:border-zinc-700 transition-all p-0"
                >
                  <Sparkles className="h-6 w-6" strokeWidth={1.5} />
                  <span className="text-xs font-medium">Run Any LLM</span>
                </Button>

                {/* 5. Crop Image Node */}
                <Button
                  onClick={() => createNode('crop-image', 'Crop Image')}
                  onDragStart={(e) => onDragStart(e, 'crop-image')}
                  draggable
                  variant="outline"
                  className="h-28 flex flex-col items-center justify-center gap-3 bg-transparent border-zinc-600 text-white hover:bg-zinc-800/50 hover:text-white hover:border-zinc-700 transition-all p-0"
                >
                  <Crop className="h-6 w-6" strokeWidth={1.5} />
                  <span className="text-xs font-medium">Crop Image</span>
                </Button>

                {/* 6. Extract Frame Node */}
                <Button
                  onClick={() => createNode('extract-frame', 'Extract Frame')}
                  onDragStart={(e) => onDragStart(e, 'extract-frame')}
                  draggable
                  variant="outline"
                  className="h-28 flex flex-col items-center justify-center gap-3 bg-transparent border-zinc-600 text-white hover:bg-zinc-800/50 hover:text-white hover:border-zinc-700 transition-all p-0"
                >
                  <Film className="h-6 w-6" strokeWidth={1.5} />
                  <span className="text-xs font-medium">Extract Frame</span>
                </Button>
              </div>
            </div>
            
          </div>

          {/* Footer Save Button */}
          <div className="p-4 border-t border-zinc-800">
             <Button
                onClick={onSave}
                disabled={isSaving}
                className="w-full bg-zinc-100 hover:bg-white text-zinc-900 transition-colors"
             >
                {isSaving ? (
                    <>
                        <span className="w-4 h-4 mr-2 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Workflow
                    </>
                )}
             </Button>
          </div>
        </div>
      </div>
    </>
  )
}
