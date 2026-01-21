'use client'

import { useState } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Plus, Folder, FileText, ChevronRight, Search, Menu, LayoutGrid, Users, Box, ArrowDown, ArrowUp, ChevronLeft, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { CreateFolderModal } from '@/components/modals/CreateFolderModal'

export default function HomePage() {
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: 'updatedAt' | 'createdAt' | 'name', direction: 'asc' | 'desc' }>({ key: 'updatedAt', direction: 'desc' })
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const utils = api.useUtils()

  const { data: folders, isLoading: foldersLoading } = api.folder.list.useQuery()
  const { data: workflows, isLoading: workflowsLoading } = api.workflow.list.useQuery()
  const createWorkflow = api.workflow.create.useMutation()
  const createFolder = api.folder.create.useMutation()
  const deleteWorkflow = api.workflow.delete.useMutation()
  const deleteFolder = api.folder.delete.useMutation()

  const isLoading = foldersLoading || workflowsLoading

  // Derived state for navigation
  const currentFolder = folders?.find((f: any) => f.id === currentFolderId)

  // Filter content based on current view (Root vs Folder) and Search Query
  const displayedFolders = (currentFolderId 
    ? currentFolder?.children || []
    : folders?.filter((f: any) => !f.parentId) || []
  ).filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const displayedWorkflows = (currentFolderId
    ? currentFolder?.workflows || []
    : workflows?.filter((w: any) => !w.folderId) || []
  ).filter((w: any) => w.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder.mutateAsync({ 
        name,
        parentId: currentFolderId || undefined 
      })
      toast({ title: 'Success', description: 'Folder created successfully' })
      setShowCreateFolder(false)
      utils.folder.list.invalidate()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive'
      })
    }
  }

  const handleCreateWorkflow = async () => {
    try {
      const workflow = await createWorkflow.mutateAsync({ 
        name: 'Untitled Workflow',
        folderId: currentFolderId || undefined
      })
      router.push(`/workflow/${workflow.id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create workflow',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteWorkflow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation
    
    // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
    await utils.workflow.list.cancel()

    // Snapshot the previous value
    const previousWorkflows = utils.workflow.list.getData()

    // Optimistic update
    utils.workflow.list.setData(undefined, (oldData) => {
        if (!oldData) return []
        return oldData.filter((w) => w.id !== id)
    })

    try {
        await deleteWorkflow.mutateAsync({ id })
        toast({ title: 'Success', description: 'Workflow deleted' })
    } catch (error) {
        // Revert on error
        utils.workflow.list.setData(undefined, previousWorkflows)
        toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to delete workflow',
            variant: 'destructive'
        })
    }
  }

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation
    
    // Cancel outgoing refetches
    await utils.folder.list.cancel()

    // Snapshot previous value
    const previousFolders = utils.folder.list.getData()

    // Optimistic update
    utils.folder.list.setData(undefined, (oldData) => {
        if (!oldData) return []
        return oldData.filter((f) => f.id !== id)
    })

    try {
        await deleteFolder.mutateAsync({ id })
        toast({ title: 'Success', description: 'Folder deleted' })
    } catch (error) {
        // Revert on error
        utils.folder.list.setData(undefined, previousFolders)
        toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to delete folder',
            variant: 'destructive'
        })
    }
  }

  const handleSort = (key: 'updatedAt' | 'createdAt' | 'name') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const sortData = (data: any[]) => {
    if (!data) return []
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  const sortedFolders = sortData(displayedFolders)
  const sortedWorkflows = sortData(displayedWorkflows)

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'just now'
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Sidebar */}
      <div className="w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col">
        {/* User Profile */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <UserButton afterSignOutUrl="/" />
            <div className="flex-1">
              <div className="text-white text-sm font-medium">Kaustubh Duse</div>
            </div>
          </div>
        </div>

        {/* Create New File Button */}
        <div className="p-3 pb-6">
          <Button
            onClick={handleCreateWorkflow}
            className="w-full text-black font-medium hover:opacity-90"
            style={{ backgroundColor: '#F7FFA8' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New File
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 mb-1">
            <div className="bg-zinc-900 rounded-lg flex items-center justify-between" style={{ padding: '8px 16px' }}>
              <div className="flex items-center gap-3">
                <Folder className="h-5 w-5 text-white flex-shrink-0" />
                <span className="text-white font-medium" style={{ fontSize: '14px' }}>My Files</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-white hover:bg-zinc-800 rounded p-1">
                    <Plus className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border-zinc-700 text-white">
                  <DropdownMenuItem
                    onClick={handleCreateWorkflow}
                    className="cursor-pointer hover:bg-zinc-800"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    New File
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowCreateFolder(true)}
                    className="cursor-pointer hover:bg-zinc-800"
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    New Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Shared with me */}
          <button className="w-full flex items-center gap-3 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg mx-3" style={{ fontSize: '14px', padding: '8px 16px', width: 'calc(100% - 24px)' }}>
            <Users className="h-5 w-5 flex-shrink-0" />
            <span>Shared with me</span>
          </button>

          {/* Apps */}
          <button className="w-full flex items-center gap-3 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg mx-3" style={{ fontSize: '14px', padding: '8px 16px', width: 'calc(100% - 24px)' }}>
            <Box className="h-5 w-5 flex-shrink-0" />
            <span>Apps</span>
          </button>
        </div>

        {/* Discord at bottom */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <span>Discord</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="h-16 bg-zinc-950 flex items-center justify-between px-[5%] mt-4">
          <h1 className="text-white font-semibold" style={{ fontSize: '14px' }}>Kaustubh Duse's Workspace</h1>
          <Button
            onClick={handleCreateWorkflow}
            className="text-black font-medium hover:opacity-90"
            style={{ backgroundColor: '#F7FFA8' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New File
          </Button>
        </div>

        {/* Workflow Library Section */}
        <div className="bg-black py-6 px-[5%]">
          <div className="bg-zinc-900 rounded-lg px-6 py-3">
            <div className="flex items-center gap-0 mb-4">
              <button suppressHydrationWarning className="text-white px-4 py-2 rounded-md" style={{ backgroundColor: '#353539', fontSize: '12px' }}>
                Workflow library
              </button>
              <button suppressHydrationWarning className="text-zinc-400 hover:text-white px-4 py-2 rounded-md hover:bg-zinc-700" style={{ fontSize: '12px' }}>
                Tutorials
              </button>
            </div>
          
            {/* Template Workflow Cards - Horizontal Scroll */}
            <div className="flex gap-4 overflow-x-auto pb-2">
              {['Weavy Welcome', 'Weavy Iterators', 'Multiple Image Models', 'Editing Images', 'Compositor Node', 'Image to Video'].map((name, i) => (
                <Card key={i} className="min-w-[15%] bg-zinc-700 border-zinc-600 overflow-hidden cursor-pointer hover:border-zinc-500">
                  <div className="h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <div className="w-12 h-12 bg-zinc-600 rounded-lg"></div>
                  </div>
                  <div className="p-3">
                    <div className="text-white text-sm font-medium truncate">{name}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* My Files Section */}
        <div className="flex-1 bg-black px-[5%] pb-6 pt-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-white" style={{ fontSize: '14px' }}>
              <span 
                className={`font-semibold cursor-pointer hover:text-zinc-300 transition-colors ${currentFolderId ? 'text-zinc-400' : 'text-white'}`}
                onClick={() => setCurrentFolderId(null)}
              >
                My files
              </span>
              {currentFolderId && currentFolder && (
                <>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                  <span className="font-semibold text-white">
                    {currentFolder.name}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  suppressHydrationWarning
                  placeholder="Search"
                  className="pl-9 bg-zinc-900 border-zinc-800 text-white w-64 h-9 focus-visible:ring-1 focus-visible:ring-zinc-700 placeholder:text-zinc-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-0 bg-zinc-900/50 rounded-lg p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-lg transition-all [&_svg]:size-5 ${viewMode === 'list' ? 'bg-zinc-800 shadow-sm' : 'hover:bg-transparent'}`}
                  onClick={() => setViewMode('list')}
                >
                  <Menu className="text-white" strokeWidth={3} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-lg transition-all [&_svg]:size-5 ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-transparent'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid />
                </Button>
              </div>
            </div>
          </div>

          {!isLoading && displayedFolders.length === 0 && displayedWorkflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center mt-12">
              <div className="w-16 h-16 mb-4">
                <Folder className="w-full h-full text-zinc-600" strokeWidth={1} />
              </div>
              <h3 className="text-white text-lg font-medium mb-1">This folder is empty</h3>
              <p className="text-zinc-500 text-sm">Create new files or move files here from other folders</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-zinc-900 border-zinc-800 animate-pulse overflow-hidden">
                    <div className="aspect-[3/4] bg-zinc-800"></div>
                    <div className="p-4 bg-black">
                      <div className="h-4 bg-zinc-800 rounded mb-2"></div>
                      <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
                    </div>
                  </Card>
                ))
              ) : (
                <>
                  {/* Folders First */}
                  {sortedFolders.map((folder: any) => (
                    <ContextMenu key={folder.id}>
                        <ContextMenuTrigger>
                            <Card
                            onClick={() => setCurrentFolderId(folder.id)}
                            className="bg-transparent border-none cursor-pointer group overflow-hidden"
                            >
                            <div className="aspect-[3/4] bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-zinc-700 transition-colors border border-zinc-800 group-hover:border-zinc-700">
                                <Folder className="h-10 w-10 text-white" strokeWidth={1} />
                            </div>
                            <div className="pt-2 bg-transparent px-1">
                                <div className="text-white text-sm font-medium truncate">{folder.name}</div>
                                <div className="text-zinc-500 text-xs mt-0.5">
                                Last edited <span suppressHydrationWarning>{formatDate(folder.updatedAt)}</span>
                                </div>
                            </div>
                            </Card>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="bg-zinc-900 border-zinc-700 text-white w-48">
                                <ContextMenuItem 
                                className="cursor-pointer hover:bg-zinc-800 text-red-500 hover:text-red-400 focus:text-red-400 focus:bg-zinc-800"
                                onClick={(e: any) => handleDeleteFolder(folder.id, e)}
                                >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                                </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                  ))}

                  {/* Workflows */}
                  {sortedWorkflows.map((workflow: any) => (
                    <ContextMenu key={workflow.id}>
                        <ContextMenuTrigger>
                            <Card
                            onClick={() => router.push(`/workflow/${workflow.id}`)}
                            className="bg-transparent border-none cursor-pointer group overflow-hidden"
                            >
                            <div className="aspect-[3/4] bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-zinc-700 transition-colors border border-zinc-800 group-hover:border-zinc-700">
                                <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="4" y="10" width="3" height="3" rx="1" strokeWidth={1} />
                                <rect x="16" y="6" width="3" height="3" rx="1" strokeWidth={1} />
                                <rect x="16" y="14" width="3" height="3" rx="1" strokeWidth={1} />
                                <path d="M8 12h3m0 0v-4h4m-4 4v4h4" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="pt-2 bg-transparent px-1">
                                <div className="text-white text-sm font-medium truncate">{workflow.name}</div>
                                <div className="text-zinc-500 text-xs mt-0.5"><span suppressHydrationWarning>{formatDate(workflow.updatedAt)}</span></div>
                            </div>
                            </Card>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="bg-zinc-900 border-zinc-700 text-white w-48">
                             <ContextMenuItem 
                                className="cursor-pointer hover:bg-zinc-800 text-red-500 hover:text-red-400 focus:text-red-400 focus:bg-zinc-800"
                                onClick={(e: any) => handleDeleteWorkflow(workflow.id, e)}
                             >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                             </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </>
              )}
            </div>
          ) : (
            /* List View */
            <div className="w-full">
              {/* List Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 font-medium text-gray-300 tracking-wider mb-2" style={{ fontSize: '12px', fontFamily: 'var(--font-dm-mono)' }}>
                <div className="col-span-4 cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => handleSort('name')}>
                  Name
                </div>
                <div className="col-span-2 text-right">Files</div>
                <div 
                  className="col-span-3 flex items-center justify-end gap-1 cursor-pointer hover:text-zinc-300 transition-colors text-right"
                  onClick={() => handleSort('updatedAt')}
                >
                  Last modified
                  {sortConfig.key === 'updatedAt' && (
                    sortConfig.direction === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
                  )}
                </div>
                <div className="col-span-2 cursor-pointer hover:text-zinc-300 transition-colors text-right" onClick={() => handleSort('createdAt')}>
                  Created at
                </div>
              </div>

                {/* Unified Paginated List */}
                {(() => {
                  const combinedData = [
                    ...sortedFolders.map((f: any) => ({ ...f, type: 'folder' })),
                    ...sortedWorkflows.map((w: any) => ({ ...w, type: 'workflow' }))
                  ]
                  
                  const itemsPerPage = 5
                  const totalItems = combinedData.length
                  const totalPages = Math.ceil(totalItems / itemsPerPage)
                  const startIndex = (currentPage - 1) * itemsPerPage
                  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
                  const paginatedItems = combinedData.slice(startIndex, endIndex)

                  return (
                    <div className="space-y-1">
                      {paginatedItems.map((item: any) => (
                         item.type === 'workflow' ? (
                            <ContextMenu key={`${item.type}-${item.id}`}>
                                <ContextMenuTrigger asChild>
                                    <div
                                        onClick={() => router.push(`/workflow/${item.id}`)}
                                        className={`grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-zinc-900/50 rounded-lg group border border-transparent hover:border-zinc-800/50 transition-all text-white cursor-pointer`}
                                        style={{ fontSize: '12px' }}
                                    >
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className={`w-40 h-20 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700/50 group-hover:border-zinc-600/50 group-hover:bg-zinc-700 transition-colors`}>
                                                <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <rect x="4" y="10" width="4" height="4" rx="1" strokeWidth={1} />
                                                    <rect x="16" y="6" width="4" height="4" rx="1" strokeWidth={1} />
                                                    <rect x="16" y="14" width="4" height="4" rx="1" strokeWidth={1} />
                                                    <path d="M8 12h3m0 0v-4h4m-4 4v4h4" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <span className="font-medium group-hover:text-zinc-300 truncate">{item.name}</span>
                                        </div>
                                        <div className="col-span-2 text-white text-right"> - </div>
                                        <div className="col-span-3 text-white text-right">
                                            <span suppressHydrationWarning>{formatDate(item.updatedAt)}</span>
                                        </div>
                                        <div className="col-span-2 text-white text-right">
                                            <span suppressHydrationWarning>{formatDate(item.createdAt)}</span>
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="bg-zinc-900 border-zinc-700 text-white w-48">
                                    <ContextMenuItem
                                        className="cursor-pointer hover:bg-zinc-800 text-red-500 hover:text-red-400 focus:text-red-400 focus:bg-zinc-800"
                                        onClick={(e: any) => handleDeleteWorkflow(item.id, e)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                         ) : (
                             // Folder rendering
                             <ContextMenu key={`${item.type}-${item.id}`}>
                                <ContextMenuTrigger asChild>
                                    <div
                                    onClick={() => setCurrentFolderId(item.id)}
                                    className={`grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-zinc-900/50 rounded-lg group border border-transparent hover:border-zinc-800/50 transition-all text-white cursor-pointer`}
                                    style={{ fontSize: '12px' }}
                                    >
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className={`w-40 h-20 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700/50 group-hover:border-zinc-600/50 group-hover:bg-zinc-700 transition-colors`}>
                                        <Folder className="h-5 w-5 text-white" strokeWidth={1} />
                                        </div>
                                        <span className="font-medium group-hover:text-zinc-300 truncate">{item.name}</span>
                                    </div>
                                    <div className="col-span-2 text-white text-right">
                                        {item.workflows?.length || 0} Files
                                    </div>
                                    <div className="col-span-3 text-white text-right">
                                        <span suppressHydrationWarning>{formatDate(item.updatedAt)}</span>
                                    </div>
                                    <div className="col-span-2 text-white text-right">
                                        <span suppressHydrationWarning>{formatDate(item.createdAt)}</span>
                                    </div>
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="bg-zinc-900 border-zinc-700 text-white w-48">
                                    <ContextMenuItem
                                        className="cursor-pointer hover:bg-zinc-800 text-red-500 hover:text-red-400 focus:text-red-400 focus:bg-zinc-800"
                                        onClick={(e: any) => handleDeleteFolder(item.id, e)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                         )
                      ))}

                      {/* Pagination Controls */}
                      {totalItems > 0 && (
                        <div className="flex items-center justify-end gap-6 mt-4 px-4 text-white text-sm">
                          <span>
                            {startIndex + 1}–{endIndex} of {totalItems}
                          </span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="p-2 rounded-full hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="p-2 rounded-full hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      <CreateFolderModal open={showCreateFolder} onOpenChange={setShowCreateFolder} parentId={currentFolderId || undefined} />
    </div>
  )
}
