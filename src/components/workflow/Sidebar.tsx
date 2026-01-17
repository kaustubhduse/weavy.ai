'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Search, ArrowUpDown, Type, Image as ImageIcon, Video, Crop, Film, Save, Download, Upload } from 'lucide-react'
import { useWorkflowStore } from '@/lib/store/workflowStore'

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
  const [tempName, setTempName] = useState(workflowName)
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

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
      ;(e.target as HTMLInputElement).blur()
    }
  }


  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  // Export workflow as JSON
  const handleExport = () => {
    const workflowData = {
      name: workflowName,
      nodes,
      edges,
      exportedAt: new Date().toISOString()
    }
    
    const jsonString = JSON.stringify(workflowData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Import workflow from JSON
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const workflowData = JSON.parse(content)
        
        if (workflowData.nodes && workflowData.edges) {
          setNodes(workflowData.nodes)
          setEdges(workflowData.edges)
          if (workflowData.name && onRename) {
            onRename(workflowData.name)
          }
        } else {
          alert('Invalid workflow file format')
        }
      } catch (error) {
        alert('Failed to import workflow. Please check the file format.')
        console.error('Import error:', error)
      }
    }
    reader.readAsText(file)
    
    // Reset input so same file can be imported again
    event.target.value = ''
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

      {/* 2. EXPANDED STATE: Sidebar Drawer - Full width on mobile, fixed width on desktop */}
      <div 
        className={`bg-zinc-900 border-r border-zinc-800 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed 
            ? 'w-0 border-r-0 opacity-0 fixed md:relative' 
            : 'w-full md:w-60 opacity-100 fixed md:relative z-40'
        }`}
      >
        <div className="w-full md:w-60 flex flex-col h-full"> {/* Inner container */}
          
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
          <div className="p-4 flex-1 overflow-y-hidden">
            <div className="mb-6">
              <h3 className={`text-md font-medium text-white mb-4 ${activeTab === 'quick-access' ? 'mt-4' : ''}`}>Quick access</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Text Node */}
                <Button

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

          {/* Footer Export/Import/Save Buttons */}
          <div className="p-4 border-t border-zinc-800 space-y-2">
             {/* Export/Import Row */}
             <div className="grid grid-cols-2 gap-2">
                <Button
                   onClick={handleExport}
                   variant="outline"
                   className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700"
                >
                   <Download className="w-4 h-4 mr-2" />
                   Export
                </Button>
                <Button
                   onClick={() => fileInputRef.current?.click()}
                   variant="outline"
                   className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700"
                >
                   <Upload className="w-4 h-4 mr-2" />
                   Import
                </Button>
             </div>
             
             {/* Hidden file input */}
             <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
             />
             
             {/* Save Button */}
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
