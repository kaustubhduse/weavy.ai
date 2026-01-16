import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import { memo } from 'react'

interface NodeActionsMenuProps {
  nodeId: string
  isLocked?: boolean
  onRename?: () => void
  children?: React.ReactNode
}

export const NodeActionsMenu = memo(({ nodeId, isLocked = false, onRename, children }: NodeActionsMenuProps) => {
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const updateNode = useWorkflowStore((state) => state.updateNode)
  const deleteNode = useWorkflowStore((state) => state.deleteNode)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer" role="button" aria-label="Node options">
             <MoreHorizontal className="h-4 w-4 text-zinc-500 hover:text-white transition-colors" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#18181B] border-zinc-800 text-zinc-300" align="end">
        <DropdownMenuItem 
            onClick={() => duplicateNode(nodeId)} 
            className="cursor-pointer hover:bg-zinc-800 hover:text-white focus:bg-zinc-800 focus:text-white py-2"
        >
          <span>Duplicate</span>
          <span className="ml-auto text-xs tracking-widest opacity-60">ctrl+d</span>
        </DropdownMenuItem>
        
        {onRename && (
            <DropdownMenuItem 
                onClick={onRename} 
                className="cursor-pointer hover:bg-zinc-800 hover:text-white focus:bg-zinc-800 focus:text-white py-2"
            >
            <span>Rename</span>
            </DropdownMenuItem>
        )}

        <DropdownMenuItem 
          onClick={() => updateNode(nodeId, { locked: !isLocked })} 
          className="cursor-pointer hover:bg-zinc-800 hover:text-white focus:bg-zinc-800 focus:text-white py-2"
        >
          <span>{isLocked ? 'Unlock' : 'Lock'}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-zinc-800" />
        
        {children && (
            <>
                {children}
                <DropdownMenuSeparator className="bg-zinc-800" />
            </>
        )}
        
        <DropdownMenuItem 
            onClick={() => deleteNode(nodeId)} 
            className="cursor-pointer hover:bg-red-900/50 hover:text-red-200 focus:bg-red-900/50 focus:text-red-200 py-2"
        >
          <span>Delete</span>
          <span className="ml-auto text-xs tracking-widest opacity-60">delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
