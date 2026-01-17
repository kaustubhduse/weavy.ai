import { useState, useRef, useEffect } from 'react'
import { useWorkflowStore } from '@/lib/store/workflowStore'

export function useNodeLabel(nodeId: string, initialLabel: string) {
  const updateNode = useWorkflowStore((state) => state.updateNode)
  const [isRenaming, setIsRenaming] = useState(false)
  const [label, setLabel] = useState(initialLabel)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLabel(initialLabel)
  }, [initialLabel])

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isRenaming])

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value)
  }

  const handleLabelSubmit = () => {
    setIsRenaming(false)
    updateNode(nodeId, { label })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSubmit()
    }
  }

  const startRenaming = () => {
    setIsRenaming(true)
  }

  return {
    isRenaming,
    label,
    inputRef,
    handleLabelChange,
    handleLabelSubmit,
    handleKeyDown,
    startRenaming,
  }
}
