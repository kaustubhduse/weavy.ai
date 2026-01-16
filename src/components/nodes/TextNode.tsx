'use client'

import { Handle, Position, type NodeProps, Node } from '@xyflow/react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { type TextNodeData } from '@/lib/types'
import { useState, useRef, useEffect } from 'react'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import { NodeActionsMenu } from './NodeActionsMenu'

export function TextNode({ id, data }: NodeProps<Node<any>>) {
  const nodeData = data as TextNodeData
  const [text, setText] = useState(nodeData.text || '')
  const [isRenaming, setIsRenaming] = useState(false)
  const [label, setLabel] = useState(nodeData.label || 'Prompt')
  
  const updateNode = useWorkflowStore((state) => state.updateNode)
  const deleteNode = useWorkflowStore((state) => state.deleteNode)
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setText(value)
    updateNode(id, { text: value })
    adjustHeight()
  }

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value)
  }

  const handleLabelSubmit = () => {
    setIsRenaming(false)
    updateNode(id, { label })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLabelSubmit()
  }

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  useEffect(() => {
    adjustHeight()
  }, [])

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isRenaming])

  return (
    <Card className={`min-w-[350px] max-w-[400px] bg-[#2B2B2F] border-zinc-800 shadow-xl rounded-2xl overflow-visible ${nodeData.locked ? 'nodrag border-red-900/50' : ''}`}>
      <div className="flex items-center justify-between p-4 pb-2">
        {isRenaming ? (
          <Input
            ref={inputRef}
            value={label}
            onChange={handleLabelChange}
            onBlur={handleLabelSubmit}
            onKeyDown={handleKeyDown}
            className="h-7 w-[200px] bg-zinc-900 border-zinc-700 text-sm text-white"
          />
        ) : (
          <span className="text-sm font-medium text-white">{label}</span>
        )}
        
        <NodeActionsMenu 
            nodeId={id} 
            isLocked={nodeData.locked} 
            onRename={() => setIsRenaming(true)} 
        />
      </div>
      <CardContent className="p-4 pt-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          readOnly={nodeData.locked}
          className={`w-full min-h-[100px] p-4 text-sm bg-[#3A3A3D] border-none rounded-xl text-zinc-100 resize-none focus:outline-none focus:ring-0 leading-relaxed overflow-hidden ${nodeData.locked ? 'cursor-not-allowed opacity-80' : ''}`}
          placeholder="Enter prompt..."
          style={{ height: 'auto' }}
        />
        
        {/* Semicircle Socket - positioned absolutely relative to card */ }
        <div 
          className="absolute -right-[12px] top-[40%] -translate-y-1/2 w-6 h-8 bg-[#2B2B2F] rounded-r-full -z-10" 
        />
        
        {/* Handle - positioned absolutely to center in socket */}
        <Handle
          type="source"
          position={Position.Right}
          id="prompt-output"
          className="!w-3 !h-3 !rounded-full !border-[2px] !border-[#F1A0FA] !bg-[#18181B] !opacity-100"
          style={{ right: '-13px', top: '40%', transform: 'translateY(-50%)' }}
        />
        
        {/* Label - positioned outside to the right */}
        <span className="absolute -right-[70px] top-[40%] -translate-y-[150%] text-xs font-medium text-[#F1A0FA] whitespace-nowrap">
          Prompt
        </span>
      </CardContent>
    </Card>
  )
}
