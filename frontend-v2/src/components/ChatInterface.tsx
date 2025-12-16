import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageCircle, Loader2, Minimize2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { apiClient } from '../lib/api'
import { useChatStore, useInsuranceStore } from '../lib/store'
import { cn } from '../lib/utils'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [quickPhrases, setQuickPhrases] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, isTyping, addMessage, setIsTyping } = useChatStore()
  const actorRole = useInsuranceStore((s) => s.actorRole)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    let isMounted = true
    apiClient
      .getChatIntents()
      .then((intents) => {
        if (!isMounted) return
        const phrases = intents.flatMap((i) => i.phrases || [])
        const uniq = Array.from(new Set(phrases.map((p) => p.trim()).filter(Boolean)))
        setQuickPhrases(uniq)
      })
      .catch(() => {
        // No chips if endpoint is unavailable
        if (!isMounted) return
        setQuickPhrases([])
      })
    return () => {
      isMounted = false
    }
  }, [])

  const sendText = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    setInput('')
    addMessage('user', trimmed)
    setIsTyping(true)

    try {
      const response = await apiClient.sendChatMessage(trimmed, actorRole)
      addMessage('assistant', response.reply)
    } catch (error) {
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.')
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = async () => {
    await sendText(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="sticky bottom-4"
    >
      <Card className={cn(
        "shadow-xl border-2",
        isMinimized && "h-[60px] overflow-hidden"
      )}>
        <CardHeader 
          className="cursor-pointer select-none py-3"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5 text-primary" />
              Ask a Question
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Minimize2 className={cn(
                "w-4 h-4 transition-transform",
                isMinimized && "rotate-180"
              )} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Messages */}
          {messages.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-2">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "flex",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                        msg.role === 'user'
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-900 rounded-bl-sm"
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <p className="font-semibold text-xs text-primary mb-1">Agent</p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-gray-500">Agent is typing...</span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          {messages.length === 0 && quickPhrases.length > 0 && (
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
              {quickPhrases.map((phrase) => (
                <Button
                  key={phrase}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  disabled={isTyping}
                  onClick={() => sendText(phrase)}
                  aria-label={`Quick question: ${phrase}`}
                >
                  {phrase}
                </Button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about coverage, policies, or how it works..."
              disabled={isTyping}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl border border-gray-300",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all"
              )}
              aria-label="Chat message input"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="rounded-xl"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {messages.length === 0 && (
            <p className="text-xs text-gray-500 text-center">
              Ask questions about coverage, eligibility, or how TapSure works
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
