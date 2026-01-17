'use client'

import { useRouter } from 'next/navigation'
import { Search, Clock } from 'lucide-react'

interface LeftSideProps {
  activeTab: 'search' | 'quick-access' | null
  onTabChange: (tab: 'search' | 'quick-access' | null) => void
}

export function LeftSide({ activeTab, onTabChange }: LeftSideProps) {
  const router = useRouter()

  return (
    <div className="w-14 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 flex-shrink-0 z-50">
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
