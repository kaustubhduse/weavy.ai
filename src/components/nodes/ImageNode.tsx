import { Handle, Position, type NodeProps, Node } from '@xyflow/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog'
import { type ImageNodeData } from '@/lib/types'
import { useState, useRef, useEffect } from 'react'
import { useWorkflowStore } from '@/lib/store/workflowStore'
import { Upload, X } from 'lucide-react'
import { NodeActionsMenu } from './NodeActionsMenu'

export function ImageNode({ id, data }: NodeProps<Node<any>>) {
  const nodeData = data as ImageNodeData
  const [images, setImages] = useState<string[]>(nodeData.images || (nodeData.imageData ? [nodeData.imageData] : []))
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [label, setLabel] = useState(nodeData.label || 'File')
  const [linkInput, setLinkInput] = useState('')
  
  const updateNode = useWorkflowStore((state) => state.updateNode)
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const deleteNode = useWorkflowStore((state) => state.deleteNode)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleLinkSubmit = () => {
    if (linkInput.trim()) {
      const newImages = [...images, linkInput]
      setImages(newImages)
      updateNode(id, { images: newImages, imageData: newImages[0] })
      setLinkInput('')
      setViewMode('single')
    }
  }

  const handleLinkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLinkSubmit()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      const newImages: string[] = []
      let processed = 0
      
      fileArray.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          newImages.push(base64)
          processed++
          
          if (processed === fileArray.length) {
            setImages(prev => {
              const updatedImages = [...prev, ...newImages]
              setTimeout(() => {
                 updateNode(id, { images: updatedImages, imageData: updatedImages[0] })
              }, 0)
              return updatedImages
            })
            setViewMode('single')
          }
        }
        reader.readAsDataURL(file)
      })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
     if(nodeData.images){
         setImages(nodeData.images)
     } 
     else if(nodeData.imageData){
         setImages([nodeData.imageData])
     }
  }, [nodeData.images, nodeData.imageData])

  const handleRemoveImage = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation()
    const updatedImages = images.filter((_, index) => index !== indexToRemove)
    setImages(updatedImages)
    updateNode(id, { images: updatedImages, imageData: updatedImages[0] || '' })
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

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isRenaming])

  return (
    <Card className={`min-w-[300px] max-w-[350px] bg-[#2B2B2F] border-zinc-800 shadow-xl rounded-2xl overflow-visible ${nodeData.locked ? 'nodrag border-red-900/50' : ''}`}>
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
        >
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation()
                if (images.length > 0) {
                  const updatedImages = images.slice(1)
                  setImages(updatedImages)
                  updateNode(id, { images: updatedImages, imageData: updatedImages[0] || '' })
                }
              }}
              disabled={images.length === 0}
              className={`cursor-pointer py-2 ${images.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800 hover:text-white focus:bg-zinc-800 focus:text-white'}`}
            >
              <span>Remove current</span>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={(e) => {
                 e.stopPropagation()
                 if (images.length > 0) {
                   const updatedImages = [images[0]]
                   setImages(updatedImages)
                   updateNode(id, { images: updatedImages, imageData: updatedImages[0] })
                 }
              }}
              disabled={images.length <= 1}
              className={`cursor-pointer py-2 ${images.length <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800 hover:text-white focus:bg-zinc-800 focus:text-white'}`}
            >
              <span>Remove all but current</span>
            </DropdownMenuItem>
        </NodeActionsMenu>
      </div>
      <CardContent className="p-4 pt-2">
        {images.length > 0 ? (
          <div className="flex flex-col gap-2">
            {/* View Mode Toggle Overlay */}
            <div className="relative group">
              {/* View Control */}
              <div 
                className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-2 cursor-pointer border border-white/10 hover:bg-black/70 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setViewMode(viewMode === 'grid' ? 'single' : 'grid')
                }}
              >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                        <div className="bg-white rounded-[1px]"></div>
                        <div className="bg-white rounded-[1px]"></div>
                        <div className="bg-white rounded-[1px]"></div>
                        <div className="bg-white rounded-[1px]"></div>
                      </div>
                      <span className="text-[10px] font-medium text-white">{images.length} images</span>
                    </>
                  ) : (
                    <>
                       <div className="w-3 h-3 border border-white rounded-[1px] flex items-center justify-center">
                          <div className="w-1 h-1 bg-white rounded-full"></div>
                       </div>
                       <span className="text-[10px] font-medium text-white">Single</span>
                    </>
                  )}
              </div>

              {/* Image Display Area */}
              <div 
                className="w-full h-[250px] bg-[#18181B] rounded-xl overflow-hidden border border-zinc-700/50 cursor-pointer"
                onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
              >
                 {viewMode === 'single' ? (
                    <div className="relative w-full h-full group/image">
                      <img 
                        src={images[0]} 
                        alt="Main" 
                        className="w-full h-full object-cover"
                      />
                      {!nodeData.locked && (
                         <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsModalOpen(true)
                              }}
                              size="icon"
                              variant="secondary"
                              className="h-6 w-6 bg-black/50 hover:bg-black/70 text-white border border-white/10"
                            >
                              <div className="w-3 h-3 grid grid-cols-2 gap-[1px]">
                                <div className="bg-current rounded-[0.5px]"></div>
                                <div className="bg-current rounded-[0.5px]"></div>
                                <div className="bg-current rounded-[0.5px]"></div>
                                <div className="bg-current rounded-[0.5px]"></div>
                              </div>
                            </Button>
                            <Button
                              onClick={(e) => handleRemoveImage(e, 0)}
                              size="icon"
                              variant="destructive"
                              className="h-6 w-6"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                         </div>
                      )}
                    </div>
                 ) : (
                   <div className={`grid w-full h-full gap-0.5 ${
                      images.length === 1 ? 'grid-cols-1' :
                      images.length === 2 ? 'grid-cols-2' :
                      images.length === 3 ? 'grid-cols-2 grid-rows-2' :
                      images.length === 4 ? 'grid-cols-2 grid-rows-2' :
                      'grid-cols-2 auto-rows-fr overflow-y-auto custom-scrollbar gap-1 p-1'
                   }`}>
                      {images.map((img, idx) => (
                        <div 
                          key={idx} 
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsModalOpen(true)
                          }}
                          className={`relative group/grid-item border-none hover:opacity-90 transition-opacity overflow-hidden ${
                            // Smart Layout Spans
                            images.length === 3 && idx === 0 ? 'col-span-2 row-span-1' : 
                            'col-span-1 row-span-1'
                          } ${images.length > 4 ? 'aspect-square rounded-sm' : 'h-full'}`}
                        >
                           <div className={`absolute inset-0 border-2 border-transparent hover:border-yellow-500 z-10 pointer-events-none transition-colors ${images.length > 4 ? 'rounded-sm' : ''}`} />
                          <img 
                            src={img} 
                            alt={`Grid ${idx}`} 
                            className="w-full h-full object-cover" 
                          />
                          {!nodeData.locked && (
                            <Button
                              onClick={(e) => handleRemoveImage(e, idx)}
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover/grid-item:opacity-100 transition-opacity z-20"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                   </div>
                 )}
              </div>
            </div>
            
            {/* Footer Action */}
            <div 
              onClick={() => !nodeData.locked && fileInputRef.current?.click()}
              className="mt-1 text-xs text-white/70 hover:text-white cursor-pointer flex items-center gap-1 pl-1"
            >
              <span>+ Add more images</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => !nodeData.locked && fileInputRef.current?.click()}
            className={`w-full h-[250px] bg-[#3A3A3D] rounded-xl flex flex-col items-center justify-center transition-colors border border-transparent ${!nodeData.locked ? 'cursor-pointer hover:bg-zinc-800' : 'cursor-not-allowed opacity-80'}`}
          >
            <Upload className="h-8 w-8 text-zinc-500 mb-3" />
            <p className="text-sm text-zinc-400 font-medium">Drag & drop or click to upload</p>
          </div>
        )}
        
        <div className="mt-2 text-xs">
          <Input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={handleLinkKeyDown}
            placeholder="Paste a file link"
            className="h-8 bg-[#2B2B2F] border-zinc-800 text-xs text-zinc-300 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-700"
            disabled={nodeData.locked}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={nodeData.locked}
        />

        {/* Gallery Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] bg-[#18181B] border-zinc-800 text-white flex flex-col p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between pr-8">
                <span>{label} ({images.length})</span>
                {!nodeData.locked && (
                   <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-[#2B2B2F] border-zinc-700 hover:bg-[#3A3A3D] text-white text-xs h-7"
                      onClick={() => fileInputRef.current?.click()}
                   >
                     + Add images
                   </Button>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto custom-scrollbar flex-1 pr-2 mt-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square group border border-zinc-800 rounded-lg overflow-hidden bg-[#2B2B2F]">
                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                  {!nodeData.locked && (
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          onClick={(e) => handleRemoveImage(e, idx)}
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                     </div>
                  )}
                </div>
              ))}
              {!nodeData.locked && (
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="aspect-square border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 hover:bg-[#2B2B2F] transition-all text-zinc-500 hover:text-zinc-300"
                >
                   <Upload className="h-6 w-6 mb-2" />
                   <span className="text-xs">Add</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Semicircle Socket - positioned absolutely relative to card */ }
        <div 
          className="absolute -right-[12px] top-[40%] -translate-y-1/2 w-6 h-8 bg-[#2B2B2F] rounded-r-full -z-10" 
        />
        
        {/* Handle - positioned absolutely to center in socket */}
        <Handle
          type="source"
          position={Position.Right}
          id="image-output"
          className="!w-3 !h-3 !rounded-full !border-[2px] !border-white !bg-[#18181B] !opacity-100"
          style={{ right: '-13px', top: '40%', transform: 'translateY(-50%)' }}
        />
        
        {/* Label - positioned outside to the right */}
        <span className="absolute -right-[40px] top-[40%] -translate-y-[150%] text-xs font-medium text-white whitespace-nowrap">
          File
        </span>
      </CardContent>
    </Card>
  )
}
