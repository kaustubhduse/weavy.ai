'use client'

import { create } from 'zustand'
import { type Node, type Edge, type Connection, addEdge as addReactFlowEdge, applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange } from '@xyflow/react'
import { type TextNodeData, type ImageNodeData, type LLMNodeData, type HandleType } from '@/lib/types'

interface HistoryState {
  nodes: Node[]
  edges: Edge[]
}

interface Preferences {
  useScrollWheelZoom: boolean
  rightClickToOpenMenu: boolean
  altDragForNodeSuggestions: boolean
}

interface WorkflowStore {
  nodes: Node[]
  edges: Edge[]
  history: HistoryState[]
  historyIndex: number
  preferences: Preferences
  
  togglePreference: (key: keyof Preferences) => void
  
  setNodes: (nodes: Node[]) => void
  addNode: (node: Node) => void
  updateNode: (id: string, data: Partial<Node['data']>) => void
  deleteNode: (id: string) => void
  duplicateNode: (id: string) => void
  onNodesChange: (changes: NodeChange<Node>[]) => void
  
  setEdges: (edges: Edge[]) => void
  addEdge: (edge: Edge | Connection) => void
  deleteEdge: (id: string) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  saveHistory: () => void
  
  validateConnection: (connection: Connection) => boolean
  checkForCycles: (source: string, target: string) => boolean
  
  loadWorkflow: (nodes: Node[], edges: Edge[]) => void
  resetWorkflow: () => void
}

const connectionRules: Record<HandleType, HandleType[]> = {
  text: ['text'],
  image: ['image'],
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  history: [],
  historyIndex: -1,
  preferences: {
    useScrollWheelZoom: false,
    rightClickToOpenMenu: true,
    altDragForNodeSuggestions: false,
  },

  togglePreference: (key) => set((state) => ({
    preferences: {
      ...state.preferences,
      [key]: !state.preferences[key]
    }
  })),

  setNodes: (nodes) => set({ nodes }),
  
  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }))
    get().saveHistory()
  },
  
  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    }))
  },
  
  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
    }))
    get().saveHistory()
  },

  duplicateNode: (id) => {
    const { nodes } = get()
    const nodeToDuplicate = nodes.find((n) => n.id === id)
    
    if (nodeToDuplicate) {
      const newNode: Node = {
        ...nodeToDuplicate,
        id: `${nodeToDuplicate.type}-${Date.now()}`,
        position: {
          x: nodeToDuplicate.position.x + 20,
          y: nodeToDuplicate.position.y + 20,
        },
        selected: true,
        data: {
          ...nodeToDuplicate.data,
          label: nodeToDuplicate.data.label ? `${nodeToDuplicate.data.label} (Copy)` : undefined,
        },
      }
      
      set((state) => ({
        nodes: [...state.nodes.map(n => ({ ...n, selected: false })), newNode]
      }))
      get().saveHistory()
    }
  },
  
  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }))
  },

  setEdges: (edges) => set({ edges }),
  
  addEdge: (edge) => {
    set((state) => ({
      edges: addReactFlowEdge(edge, state.edges),
    }))
    get().saveHistory()
  },
  
  deleteEdge: (id) => {
    get().saveHistory()
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
    }))
  },
  
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }))
  },

  onConnect: (connection) => {
    if (get().validateConnection(connection)) {
      get().addEdge(connection)
    }
  },

  validateConnection: (connection) => {
    if (!connection.source || !connection.target) return false
    
    const { nodes } = get()
    const sourceNode = nodes.find((n) => n.id === connection.source)
    const targetNode = nodes.find((n) => n.id === connection.target)
    
    if (!sourceNode || !targetNode) return false
    
    if (get().checkForCycles(connection.source, connection.target)) {
      return false
    }
    
    return true
  },

  checkForCycles: (source, target) => {
    const { edges } = get()
    const visited = new Set<string>()
    
    const dfs = (nodeId: string): boolean => {
      if (nodeId === source) return true
      if (visited.has(nodeId)) return false
      
      visited.add(nodeId)
      const outgoingEdges = edges.filter((e) => e.source === nodeId)
      
      for (const edge of outgoingEdges) {
        if (dfs(edge.target)) return true
      }
      
      return false
    }
    
    return dfs(target)
  },

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const state = history[newIndex]
      if (state) {
        set({
          nodes: state.nodes,
          edges: state.edges,
          historyIndex: newIndex,
        })
      }
    }
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const state = history[newIndex]
      if (state) {
        set({
          nodes: state.nodes,
          edges: state.edges,
          historyIndex: newIndex,
        })
      }
    }
  },

  canUndo: () => {
    const { historyIndex } = get()
    return historyIndex > 0
  },

  canRedo: () => {
    const { history, historyIndex } = get()
    return historyIndex < history.length - 1
  },

  saveHistory: () => {
    const { nodes, edges, history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ nodes: [...nodes], edges: [...edges] })
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    })
  },

  loadWorkflow: (nodes, edges) => {
    set({
      nodes,
      edges,
      history: [{ nodes, edges }],
      historyIndex: 0,
    })
  },

  resetWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      history: [{ nodes: [], edges: [] }],
      historyIndex: 0,
    })
  },
}))
