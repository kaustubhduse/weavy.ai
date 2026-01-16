'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/trpc/client'
import { toast } from '@/hooks/use-toast'

interface CreateFolderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentId?: string
}

export function CreateFolderModal({ open, onOpenChange, parentId }: CreateFolderModalProps) {
  const [name, setName] = useState('')
  const createFolder = api.folder.create.useMutation()
  const utils = api.useUtils()

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Folder name cannot be empty',
        variant: 'destructive',
      })
      return
    }

    try {
      await createFolder.mutateAsync({
        name: name.trim(),
        parentId,
      })

      await utils.folder.list.invalidate()
      
      toast({
        title: 'Success',
        description: 'Folder created successfully',
      })

      setName('')
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive',
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Create folder</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <label className="text-sm text-zinc-400 mb-2 block">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Folder name"
            className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-zinc-700"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setName('')
              onOpenChange(false)
            }}
            className="text-slate-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createFolder.isPending || !name.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createFolder.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
