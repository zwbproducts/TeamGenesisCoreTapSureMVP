import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface HowItWorksModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg"
            >
              <Card className="rounded-t-3xl sm:rounded-3xl border-0 shadow-2xl">
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <HelpCircle className="w-6 h-6 text-primary" />
                    How It Works
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute right-4 top-4"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </CardHeader>
                
                <CardContent className="space-y-6 pb-8">
                  {/* Steps */}
                  <div className="space-y-6">
                    {[
                      {
                        number: 1,
                        title: 'Upload Receipt',
                        description: 'Take a photo or upload your purchase receipt. Our AI instantly analyzes it to extract merchant, amount, and category.',
                        icon: '📄',
                      },
                      {
                        number: 2,
                        title: 'Choose Coverage',
                        description: 'Review personalized protection plans based on your purchase. Select the coverage period and features that work for you.',
                        icon: '🛡️',
                      },
                      {
                        number: 3,
                        title: 'Stay Protected',
                        description: 'Your purchase is instantly covered against damage, theft, and other risks. Make a claim anytime if something goes wrong.',
                        icon: '✅',
                      },
                    ].map((step) => (
                      <motion.div
                        key={step.number}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: step.number * 0.1 }}
                        className="flex gap-4"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                            {step.icon}
                          </div>
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="font-bold text-lg text-gray-900 mb-1">
                            {step.title}
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={onClose}
                  >
                    Got It!
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
