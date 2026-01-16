import { memo, useState, useEffect, useRef } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Video, X, UploadCloud } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { NodeActionsMenu } from './NodeActionsMenu'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import Uppy from '@uppy/core'
import Transloadit from '@uppy/transloadit'
import '@uppy/core/css/style.min.css'

export const UploadVideoNode = memo(({ id, data, selected }: NodeProps) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNode)
  const nodeData = data as any

  const [mounted, setMounted] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [label, setLabel] = useState(data.label as string || 'Upload Video')
  const inputRef = useRef<HTMLInputElement>(null)

  const [uppy] = useState(() => {
    // Only initialize Uppy on client side
    if (typeof window === 'undefined') return null

    const uppyInstance = new Uppy({
       id: `uppy-${id}`,
       autoProceed: true,
       restrictions: {
          maxNumberOfFiles: 1,
          allowedFileTypes: ['video/*']
       }
    })

    // Only add plugin if keys exist
    if (process.env.NEXT_PUBLIC_TRANSLOADIT_KEY && process.env.NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID) {
        uppyInstance.use(Transloadit, {
            assemblyOptions: {
                params: {
                    auth: { key: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY },
                    template_id: process.env.NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID
                }
            },
            waitForEncoding: true
        })
    }
    
    uppyInstance.on('complete', (result) => {
       if (result.successful && result.successful.length > 0) {
           const file = result.successful[0]
           const url = file.uploadURL
           
           if (url) {
                updateNodeData(id, { videoUrl: url, fileName: file.name })
           }
       }
    }) 
    
    return uppyInstance
  })

  // Set mounted state
  useEffect(() => {
    setMounted(true)
    return () => {
        if (uppy) uppy.destroy()
    }
  }, [uppy])

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

  const clearVideo = () => {
    updateNodeData(id, { videoUrl: '', fileName: '' })
    if (uppy) uppy.cancelAll()
  }

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // Process file with FileReader for immediate Base64 result
  const processFile = (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
          const result = e.target?.result as string
          if (result) {
              updateNodeData(id, { videoUrl: result, fileName: file.name })
          }
      }
      reader.readAsDataURL(file)
      
      // Still try Uppy if available (optional background upload)
      if (uppy) {
          try {
              uppy.addFile({
                  source: 'file input',
                  name: file.name,
                  type: file.type,
                  data: file,
              })
          } catch (err) {
              console.error("Uppy addFile error:", err)
          }
      }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
        processFile(files[0])
    }
  }

  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault()
  }

  const onDrop = (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
         processFile(files[0])
      }
  }

  if (!mounted || !uppy) {
      return (
        <Card className={`w-80 bg-[#2B2B2F] border-zinc-800 shadow-xl rounded-2xl overflow-visible ${selected ? 'ring-2 ring-orange-500' : ''}`}>
             <div className="h-[300px] flex items-center justify-center">
                <span className="text-zinc-500 text-xs">Loading...</span>
             </div>
        </Card>
      )
  }

  return (
    <Card className={`w-80 bg-[#2B2B2F] border-zinc-800 shadow-xl rounded-2xl overflow-visible ${selected ? 'ring-2 ring-orange-500' : ''} ${nodeData.locked ? 'nodrag border-red-900/50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
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

      {/* Content */}
      <div className="p-4 pt-2 space-y-3">
        {!data.videoUrl ? (
           <div 
             onClick={handleClick}
             onDragOver={onDragOver}
             onDrop={onDrop}
             className="w-full h-[240px] bg-[#18181b] rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors cursor-pointer group relative overflow-hidden flex flex-col items-center justify-center gap-2"
           >
             {/* Checkerboard Pattern */}
             <div className="absolute inset-0 opacity-[0.03]" 
                style={{
                    backgroundImage: `linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)`,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }} 
             />
             
             <div className="p-3 rounded-full bg-zinc-800/50 text-zinc-400 group-hover:text-zinc-300 transition-colors z-10">
                <UploadCloud className="w-5 h-5" />
             </div>
             <div className="text-xs text-zinc-400 font-medium z-10">
                 Drag & drop or click to upload
             </div>
             
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="video/*"
                className="hidden" 
             />
           </div>
        ) : (
          <div className="relative group rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
            <div className="relative aspect-video w-full">
              <video 
                src={data.videoUrl as string} 
                className="w-full h-full object-cover"
                controls
              />
            </div>
             <button
              onClick={clearVideo}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-10"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="p-2 border-t border-zinc-800 bg-zinc-900/90 truncate">
               <span className="text-xs text-zinc-400">{(data.fileName as string) || 'Video'}</span>
            </div>
          </div>
        )}

        {/* Footer Input (Visual only for now matching design) */}
        {!data.videoUrl && (
            <div className="w-full h-8 bg-[#18181b] rounded border border-zinc-800/50 flex items-center px-3">
                <span className="text-[10px] text-zinc-500">Paste a file link</span>
            </div>
        )}
      </div>

      {/* Output Handle */}
      <div 
         className="absolute -right-[12px] top-[50%] -translate-y-1/2 w-6 h-8 bg-[#2B2B2F] rounded-r-full -z-10" 
      />
      <Handle
         id="video-output"
         type="source"
         position={Position.Right}
         className="!w-3 !h-3 !rounded-full !border-[2px] !border-orange-400 !bg-[#18181B] !opacity-100"
         style={{ right: '-13px', top: '50%', transform: 'translateY(-50%)' }}
      />
      <span className="absolute -right-[70px] top-[50%] -translate-y-[150%] text-xs font-medium text-orange-400 whitespace-nowrap">
         Video
      </span>
    </Card>
  )
})

UploadVideoNode.displayName = 'UploadVideoNode'
