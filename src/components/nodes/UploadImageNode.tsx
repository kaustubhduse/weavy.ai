import { memo, useState, useEffect, useRef } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { ImageIcon, X, UploadCloud } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { NodeActionsMenu } from './NodeActionsMenu'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import Image from 'next/image'
import Uppy from '@uppy/core'
import Transloadit from '@uppy/transloadit'
import '@uppy/core/css/style.min.css'

export const UploadImageNode = memo(({ id, data, selected }: NodeProps) => {
  const updateNodeData = useWorkflowStore((state) => state.updateNode)
  const nodeData = data as any
  
  const [mounted, setMounted] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [label, setLabel] = useState(data.label as string || 'Upload Image')
  const [linkInput, setLinkInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleLinkSubmit = () => {
    if (linkInput.trim()) {
      updateNodeData(id, { imageData: linkInput, fileName: 'Image from URL' })
      setLinkInput('')
    }
  }

  const handleLinkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLinkSubmit()
  }
  
  const [uppy] = useState(() => {
    // Only initialize Uppy on client side
    if (typeof window === 'undefined') return null

    const uppyInstance = new Uppy({
       id: `uppy-${id}`,
       autoProceed: true,
       restrictions: {
          maxNumberOfFiles: 1,
          allowedFileTypes: ['image/*']
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
                updateNodeData(id, { imageData: url, fileName: file.name })
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

  const clearImage = () => {
    updateNodeData(id, { imageData: '', fileName: '' })
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
              updateNodeData(id, { imageData: result, fileName: file.name })
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
        <Card className={`w-80 bg-[#2B2B2F] border-zinc-800 shadow-xl rounded-2xl overflow-visible ${selected ? 'ring-2 ring-blue-500' : ''}`}>
             {/* Loading State */}
             <div className="h-[300px] flex items-center justify-center">
                <span className="text-zinc-500 text-xs">Loading...</span>
             </div>
        </Card>
      )
  }

  return (
    <Card className={`w-80 bg-[#2B2B2F] border-zinc-800 shadow-xl rounded-2xl overflow-visible ${selected ? 'ring-2 ring-blue-500' : ''} ${nodeData.locked ? 'nodrag border-red-900/50' : ''} ${nodeData.isExecuting ? 'node-executing' : ''}`}>
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
        {!data.imageData ? (
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
                accept="image/*"
                className="hidden" 
             />
           </div>
        ) : (
          <div className="relative group rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
            <div className="relative aspect-video w-full">
              <Image 
                src={data.imageData as string} 
                alt="Upload preview" 
                fill
                className="object-cover"
              />
            </div>
             <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="p-2 border-t border-zinc-800 bg-zinc-900/90 truncate">
               <span className="text-xs text-zinc-400">{(data.fileName as string) || 'Image'}</span>
            </div>
          </div>
        )}

        {/* Footer Input */}
        {!data.imageData && (
            <div className="w-full">
                <Input
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={handleLinkKeyDown}
                    placeholder="Paste a file link"
                    className="h-8 bg-[#18181b] border-zinc-800/50 text-[10px] text-zinc-300 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
            </div>
        )}
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
         Image
      </span>
    </Card>
  )
})

UploadImageNode.displayName = 'UploadImageNode'
