import { memo, useCallback, useState, useRef, useEffect } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Film } from 'lucide-react'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import { NodeActionsMenu } from './NodeActionsMenu'

export const ExtractFrameNode = memo(({ id, data, selected }: NodeProps) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNode)
  const nodeData = data as any

  const [isRenaming, setIsRenaming] = useState(false)
  const [label, setLabel] = useState(data.label as string || 'Extract Frame')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value)
  }

  const handleLabelSubmit = () => {
    setIsRenaming(false)
    updateNodeData(id, { label })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleLabelSubmit()
  }

  useEffect(() => {
    if (isRenaming && inputRef.current) {
        inputRef.current.focus()
    }
  }, [isRenaming])

  const handleParamChange = useCallback((key: string, val: string) => {
    // allow string for percentage, otherwise number
    updateNodeData(id, { [key]: val })
  }, [id, updateNodeData])

  return (
    <Card className={`w-64 bg-[#2B2B2F] border-zinc-800 shadow-xl rounded-2xl overflow-visible ${selected ? 'ring-2 ring-red-500' : ''} ${nodeData.locked ? 'nodrag border-red-900/50' : ''} ${nodeData.isExecuting ? 'node-executing' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-red-500/10 text-red-400">
            <Film className="w-4 h-4" />
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
        <NodeActionsMenu 
            nodeId={id} 
            isLocked={nodeData.locked} 
            onRename={() => setIsRenaming(true)} 
        />
      </div>

      {/* Main Video Input */}
      <div className="p-4 pt-2 pb-0 relative min-h-[40px] flex items-center mb-2">
         <div 
            className="absolute -left-[12px] top-1/2 -translate-y-1/2 w-6 h-8 bg-[#2B2B2F] rounded-l-full -z-10" 
         />
         <Handle
            id="video-url-input"
            type="target"
            position={Position.Left}
            className="!w-3 !h-3 !rounded-full !border-[2px] !border-orange-400 !bg-[#18181B] !opacity-100"
            style={{ left: '-13px', top: '50%', transform: 'translateY(-50%)' }}
         />
         <span className="text-xs font-medium text-orange-400 ml-2">Video Input</span>
      </div>

      {/* Parameters */}
      <div className="p-4 pt-0 space-y-2">
         {/* Custom Timestamp Input with Unit Select */}
         <div className="flex items-center justify-between gap-2 relative">
            <div className="relative pl-1">
                <Label htmlFor={`${id}-timestamp`} className="text-[10px] text-zinc-400 font-mono uppercase">Time</Label>
            </div>
            
            <div className="flex items-center gap-1">
                <Input 
                    id={`${id}-timestamp`}
                    type="number" 
                    value={String(data.timestamp || '0').replace('%', '')}
                    onChange={(e) => {
                        const val = e.target.value;
                        const currentUnit = String(data.timestamp || '').endsWith('%') ? '%' : 's';
                        handleParamChange('timestamp', currentUnit === '%' ? `${val}%` : val);
                    }}
                    className="h-6 w-12 text-[10px] px-1 text-right bg-zinc-950 border-zinc-800 focus:ring-red-500/20"
                    placeholder="0"
                />
                <select
                    value={String(data.timestamp || '').endsWith('%') ? '%' : 's'}
                    onChange={(e) => {
                        const newUnit = e.target.value;
                        const currentVal = String(data.timestamp || '0').replace('%', '');
                        handleParamChange('timestamp', newUnit === '%' ? `${currentVal}%` : currentVal);
                    }}
                    className="h-6 w-12 text-[10px] px-1 bg-zinc-950 border border-zinc-800 rounded text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                >
                    <option value="s">sec</option>
                    <option value="%">%</option>
                </select>
            </div>

            {/* Handle for dynamic timestamp input */}
            <Handle
                type="target"
                position={Position.Left}
                id="timestamp-input"
                className="!w-2 !h-2 !bg-zinc-600 !border-zinc-800"
                style={{ left: '-20px', top: '50%', transform: 'translateY(-50%)' }}
            />
         </div>
      </div>

      {/* Output Handle */}
      <div 
         className="absolute -right-[12px] top-[50%] -translate-y-1/2 w-6 h-8 bg-[#2B2B2F] rounded-r-full -z-10" 
      />
      <Handle
         id="image-output"
         type="source"
         position={Position.Right}
         className="!w-3 !h-3 !rounded-full !border-[2px] !border-teal-400 !bg-[#18181B] !opacity-100"
         style={{ right: '-13px', top: '50%', transform: 'translateY(-50%)' }}
      />
      <span className="absolute -right-[70px] top-[50%] -translate-y-[150%] text-xs font-medium text-teal-400 whitespace-nowrap">
         Frame
      </span>
    </Card>
  )
})

ExtractFrameNode.displayName = 'ExtractFrameNode'
