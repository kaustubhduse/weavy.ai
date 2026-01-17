export interface TextNodeData {
  label: string
  text: string
  locked?: boolean
  isExecuting?: boolean
}

export interface ImageNodeData {
  label: string
  imageUrl?: string
  imageData?: string 
  images?: string[]
  locked?: boolean
  isExecuting?: boolean
}

export interface LLMNodeData {
  label: string
  model: string
  temperature: number
  result?: string
  loading?: boolean
  error?: string
  locked?: boolean
  isExecuting?: boolean
}

export type NodeType = 'text' | 'image' | 'llm'

export type HandleType = 'text' | 'image'

export interface ConnectionRule {
  source: HandleType
  target: HandleType
  allowed: boolean
}
