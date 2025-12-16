import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Receipt, CoverageOption, PolicyConfirmation, ActorRole } from './schemas'

interface InsuranceState {
  // Data
  receipt: Receipt | null
  recommendation: CoverageOption[] | null
  selectedCoverage: CoverageOption | null
  policy: PolicyConfirmation | null

  actorRole: ActorRole | null
  
  // UI State
  isAnalyzing: boolean
  isRecommending: boolean
  isConfirming: boolean
  error: string | null
  
  // Actions
  setReceipt: (receipt: Receipt | null) => void
  setRecommendation: (options: CoverageOption[] | null) => void
  setSelectedCoverage: (coverage: CoverageOption | null) => void
  setPolicy: (policy: PolicyConfirmation | null) => void
  setIsAnalyzing: (loading: boolean) => void
  setIsRecommending: (loading: boolean) => void
  setIsConfirming: (loading: boolean) => void
  setError: (error: string | null) => void
  setActorRole: (role: ActorRole | null) => void
  reset: () => void
}

const initialState = {
  receipt: null,
  recommendation: null,
  selectedCoverage: null,
  policy: null,
  actorRole: null,
  isAnalyzing: false,
  isRecommending: false,
  isConfirming: false,
  error: null,
}

export const useInsuranceStore = create<InsuranceState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setReceipt: (receipt) => set({ receipt, error: null }),
      setRecommendation: (options) => set({ recommendation: options, error: null }),
      setSelectedCoverage: (coverage) => set({ selectedCoverage: coverage }),
      setPolicy: (policy) => set({ policy, error: null }),
      setIsAnalyzing: (loading) => set({ isAnalyzing: loading }),
      setIsRecommending: (loading) => set({ isRecommending: loading }),
      setIsConfirming: (loading) => set({ isConfirming: loading }),
      setError: (error) => set({ error }),
      setActorRole: (actorRole) => set({ actorRole }),
      reset: () => set(initialState),
    }),
    {
      name: 'tapsure-insurance-flow',
      partialize: (state) => ({
        receipt: state.receipt,
        selectedCoverage: state.selectedCoverage,
        policy: state.policy,
        actorRole: state.actorRole,
      }),
    }
  )
)

interface ChatState {
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
  isTyping: boolean
  addMessage: (role: 'user' | 'assistant', content: string) => void
  setIsTyping: (typing: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  
  addMessage: (role, content) =>
    set((state) => ({
      messages: [...state.messages, { role, content, timestamp: new Date() }],
    })),
  
  setIsTyping: (typing) => set({ isTyping: typing }),
  
  clearMessages: () => set({ messages: [] }),
}))
