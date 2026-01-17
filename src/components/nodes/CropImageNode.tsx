import { memo, useCallback, useState, useRef, useEffect } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Crop } from 'lucide-react'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import { NodeActionsMenu } from './NodeActionsMenu'

const ParamInput = ({ id, label, value, handleId, onChange, nodeId }: { 
  id: string, 
  label: string, 
  value: string | number, 
  handleId: string, 
  onChange: (val: string) => void,
  nodeId: string
}) => {
  return (
    <div className="flex items-center justify-between gap-2 relative">
      <div className="relative pl-1">
         <Label htmlFor={`${nodeId}-${id}`} className="text-[10px] text-zinc-400 font-mono uppercase">{label}</Label>
      </div>
      <Input 
        id={`${nodeId}-${id}`}
        type="number" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-16 text-[10px] px-1 text-right bg-zinc-950 border-zinc-800 focus:ring-teal-500/20"
        placeholder="0"
      />
    </div>
  )
}

export const CropImageNode = memo(({ id, data, selected }: NodeProps) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNode)
  const nodeData = data as any

  const [isRenaming, setIsRenaming] = useState(false)
  const [label, setLabel] = useState(data.label as string || 'Crop Image')
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
    updateNodeData(id, { [key]: parseFloat(val) || 0 })
  }, [id, updateNodeData])

  return (
    <Card className={`w-64 bg-[#2B2B2F] border-zinc-800 shadow-xl rounded-2xl overflow-visible ${selected ? 'ring-2 ring-teal-500' : ''} ${nodeData.locked ? 'nodrag border-red-900/50' : ''} ${nodeData.isExecuting ? 'node-executing' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-400">
            <Crop className="w-4 h-4" />
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

      {/* Main Image Input */}
      <div className="p-4 pt-2 pb-0 relative min-h-[40px] flex items-center mb-2">
         <div 
            className="absolute -left-[12px] top-1/2 -translate-y-1/2 w-6 h-8 bg-[#2B2B2F] rounded-l-full -z-10" 
         />
         <Handle
            id="image-url-input"
            type="target"
            position={Position.Left}
            className="!w-3 !h-3 !rounded-full !border-[2px] !border-teal-400 !bg-[#18181B] !opacity-100"
            style={{ left: '-13px', top: '50%', transform: 'translateY(-50%)' }}
         />
         <span className="text-xs font-medium text-teal-400 ml-2">Image Input</span>
      </div>

      {/* Parameters */}
      <div className="p-4 pt-0 space-y-2">
         {/* X and Y */}
         <div className="grid grid-cols-2 gap-4">
            <ParamInput 
              id="x" label="X (%)" 
              value={data.x as number || 0} 
              handleId="x-input" 
              onChange={(v) => handleParamChange('x', v)}
              nodeId={id}
            />
            <ParamInput 
              id="y" label="Y (%)" 
              value={data.y as number || 0} 
              handleId="y-input" 
              onChange={(v) => handleParamChange('y', v)}
              nodeId={id}
            />
         </div>
         {/* Width and Height */}
         <div className="grid grid-cols-2 gap-4">
            <ParamInput 
              id="width" label="W (%)" 
              value={data.width as number || 100} 
              handleId="width-input" 
              onChange={(v) => handleParamChange('width', v)}
              nodeId={id}
            />
            <ParamInput 
              id="height" label="H (%)" 
              value={data.height as number || 100} 
              handleId="height-input" 
              onChange={(v) => handleParamChange('height', v)}
              nodeId={id}
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
         Cropped
      </span>
    </Card>
  )
})

CropImageNode.displayName = 'CropImageNode'
