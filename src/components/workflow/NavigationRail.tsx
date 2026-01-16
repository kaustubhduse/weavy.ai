'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Clock, // Quick Access / History
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import { useParams } from 'next/navigation'

interface NavigationRailProps {
  activeTab: 'search' | 'quick-access' | null
  onTabChange: (tab: 'search' | 'quick-access' | null) => void
}

export function NavigationRail({ activeTab, onTabChange }: NavigationRailProps) {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { preferences, togglePreference } = useWorkflowStore()
  
  const workflowId = params.id as string
  const createWorkflow = api.workflow.create.useMutation()
  const duplicateWorkflow = api.workflow.duplicate.useMutation()

  const handleCreateNew = async () => {
    try {
      const workflow = await createWorkflow.mutateAsync({ name: 'Untitled Workflow' })
      window.open(`/workflow/${workflow.id}`, '_blank')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create workflow',
        variant: 'destructive',
      })
    }
  }

  const handleDuplicate = async () => {
    try {
      const newWorkflow = await duplicateWorkflow.mutateAsync({ id: workflowId })
      toast({
        title: 'Success',
        description: 'Workflow duplicated',
      })
      window.open(`/workflow/${newWorkflow.id}`, '_blank')
    } catch (error) {
     toast({
        title: 'Error',
        description: 'Failed to duplicate workflow',
        variant: 'destructive',
      })
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: 'Link copied',
      description: 'Workflow link copied to clipboard',
    })
  }

  return (
    <div className="w-14 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 flex-shrink-0 z-50">
      {/* W Logo Menu */}
      {/* W Logo - Back to Files */}
      <button 
        onClick={() => router.push('/')}
        className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-zinc-900 transition-colors mb-4 outline-none"
      >
        <span className="text-xl font-bold text-white tracking-tight">W</span>
      </button>

      <div className="flex flex-col gap-4 w-full px-2 mt-3">
        {/* Search */}
        <button 
          onClick={() => onTabChange(activeTab === 'search' ? null : 'search')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeTab === 'search' 
              ? 'bg-[#EcFccb] text-black' 
              : 'text-zinc-400 hover:text-black hover:bg-[#F7FFA8]'
          }`}
          title="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Quick Access / History */}
        <button 
          onClick={() => onTabChange(activeTab === 'quick-access' ? null : 'quick-access')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeTab === 'quick-access' 
              ? 'bg-[#EcFccb] text-black' 
              : 'text-zinc-400 hover:text-black hover:bg-[#F7FFA8]'
          }`}
          title="Quick Access"
        >
          <Clock className="h-5 w-5" />
        </button>

      </div>


    </div>
  )
}
