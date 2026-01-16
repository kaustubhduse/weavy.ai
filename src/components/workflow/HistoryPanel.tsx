'use client'

import { api } from '@/lib/trpc/client'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, Clock, ChevronRight, ChevronDown, PlayCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface HistoryPanelProps {
  workflowId: string
  isOpen: boolean
  onClose: () => void
}

// Helper to safely parse and display output
const OutputDisplay = ({ output }: { output: any }) => {
    let data = output;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch (e) {
            // It's just a string string
            return <div className="text-zinc-400 italic">"{output}"</div>;
        }
    }

    if (!data) return <div className="text-zinc-600 italic">Empty output</div>;

    // 1. Text Output
    if (data.text) {
        return (
            <div className="text-zinc-300 text-xs whitespace-pre-wrap bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                {data.text}
            </div>
        );
    }

    // 2. Image Output (imageData or generic output that looks like image)
    const imgUrl = data.imageData || data.output || (typeof data.output === 'string' && data.output) || (typeof data === 'string' && data.startsWith('data:image') ? data : null);
    
    // Check if it's actually an image string
    if (imgUrl && typeof imgUrl === 'string' && (imgUrl.startsWith('http') || imgUrl.startsWith('data:image'))) {
        return (
            <div className="mt-1">
                 <div className="relative aspect-video w-full max-w-[200px] overflow-hidden rounded border border-zinc-700 bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt="Output" className="object-cover w-full h-full" />
                 </div>
                 <div className="text-[10px] text-zinc-500 mt-1 truncate max-w-[200px]">{imgUrl.slice(0, 30)}...</div>
            </div>
        )
    }

    // 3. Video Output
    if (data.videoUrl) {
         return (
            <div className="mt-1">
                 <div className="relative aspect-video w-full max-w-[200px] overflow-hidden rounded border border-zinc-700 bg-zinc-950 flex items-center justify-center">
                    <PlayCircle className="w-8 h-8 text-zinc-500" />
                    <video src={data.videoUrl} className="absolute inset-0 w-full h-full cursor-pointer" controls />
                 </div>
                 <div className="text-[10px] text-zinc-500 mt-1">Video Output</div>
            </div>
        )
    }

    // 4. Default JSON Fallback
    return (
        <div className="text-zinc-500 font-mono bg-zinc-950 rounded p-1.5 overflow-hidden whitespace-pre-wrap max-h-[100px] overflow-y-auto border border-zinc-800/50 text-[10px]">
            {JSON.stringify(data, null, 2)}
        </div>
    );
};

export function HistoryPanel({ workflowId, isOpen, onClose }: HistoryPanelProps) {
  const { data: runs, isLoading, refetch } = api.workflow.getHistory.useQuery(
    { workflowId },
    { refetchInterval: 1000, enabled: isOpen } 
  )

  const [expandedRuns, setExpandedRuns] = useState<string[]>([])

  const toggleRun = (runId: string) => {
    setExpandedRuns(prev => 
      prev.includes(runId) 
        ? prev.filter(id => id !== runId)
        : [...prev, runId]
    )
  }

  return (
    <div 
        className={cn(
            "absolute top-0 right-0 h-full w-80 bg-zinc-900 border-l border-zinc-800 z-50 transition-transform duration-300 ease-in-out shadow-2xl flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            History
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors">
            <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
            <div className="flex h-full items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
        ) : !runs || runs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-500">
                <Clock className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No run history yet.</p>
                <p className="text-xs text-zinc-600 mt-1">Run a node to see it here.</p>
            </div>
        ) : (
            <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-4">
                {runs.map((run) => (
                <div 
                    key={run.id} 
                    className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden"
                >
                    {/* Run Header */}
                    <button 
                        onClick={() => toggleRun(run.id)}
                        className="flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors w-full text-left"
                    >
                        <div className="flex items-center gap-3">
                            <StatusIcon status={run.status} />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-zinc-200">
                                    {/* @ts-ignore */}
                                    {run.scope === 'SINGLE' ? 'Single Node Run' : 'Full Workflow'}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {format(new Date(run.startedAt), 'MMM d, h:mm a')}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {run.duration !== null ? (
                                <span className="text-xs font-mono text-zinc-500">
                                    {(run.duration / 1000).toFixed(1)}s
                                </span>
                            ) : run.status === 'RUNNING' && (
                                <span className="text-xs font-mono text-amber-500 animate-pulse">
                                    Running...
                                </span>
                            )}
                            {expandedRuns.includes(run.id) ? (
                                <ChevronDown className="h-4 w-4 text-zinc-500" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-zinc-500" />
                            )}
                        </div>
                    </button>
                    {/* Expanded Content ... */}
                    {expandedRuns.includes(run.id) && (
                        <div className="border-t border-zinc-800 bg-zinc-950/30 p-2 space-y-1">
                            {run.nodeRuns.map((nodeRun) => (
                                <div key={nodeRun.id} className="flex flex-col gap-1 p-2 rounded hover:bg-zinc-900 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <StatusIcon status={nodeRun.status} size={12} />
                                            <span className="font-mono text-xs text-zinc-300 truncate">
                                                node-{nodeRun.nodeId.slice(0, 8)}...
                                            </span>
                                        </div>
                                        {nodeRun.duration && (
                                            <span className="text-xs text-zinc-600">{(nodeRun.duration / 1000).toFixed(1)}s</span>
                                        )}
                                    </div>
                                    
                                    {nodeRun.outputs && (
                                        <div className="pl-5 mt-1">
                                            {/* @ts-ignore */}
                                            <OutputDisplay output={nodeRun.outputs} />
                                        </div>
                                    )}
                                    {nodeRun.error && (
                                        <div className="text-red-400 mt-1 bg-red-950/20 p-1.5 rounded border border-red-900/30 text-xs pl-5">
                                            Error: {nodeRun.error}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                ))}
            </div>
            </ScrollArea>
        )}
      </div>
    </div>
  )
}

function StatusIcon({ status, size = 16 }: { status: string, size?: number }) {
    if (status === 'COMPLETED') return <CheckCircle2 size={size} className="text-teal-500" />
    if (status === 'FAILED') return <XCircle size={size} className="text-red-500" />
    if (status === 'RUNNING') return <Loader2 size={size} className="text-amber-500 animate-spin" />
    return <Clock size={size} className="text-zinc-500" />
}
