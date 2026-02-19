export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  agent?: string
  isError?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

export interface Agent {
  name: string
  description: string
  keywords: string[]
}

export interface ChatResponse {
  result: string
  agent?: string
}

export interface AgentsResponse {
  agents: string[]
}