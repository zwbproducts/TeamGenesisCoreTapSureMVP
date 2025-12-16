import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, FileText, CreditCard, Shield, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { apiClient } from '../lib/api'
import { useInsuranceStore } from '../lib/store'
import { formatCurrency } from '../lib/utils'

export function PolicyConfirmation() {
  const {
    receipt,
    selectedCoverage,
    policy,
    isConfirming,
    setPolicy,
    setIsConfirming,
    setError,
  } = useInsuranceStore()

  const [showSuccess, setShowSuccess] = useState(false)

  const handleConfirm = async () => {
    if (!receipt || !selectedCoverage) return

    setIsConfirming(true)
    setError(null)

    try {
      const confirmation = await apiClient.confirmPolicy(receipt, selectedCoverage)
      setPolicy(confirmation)
      setShowSuccess(true)

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm policy'
      setError(message)
    } finally {
      setIsConfirming(false)
    }
  }

  if (!receipt || !selectedCoverage) {
    return null
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="shadow-lg border-2 border-primary-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Confirm Your Coverage
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Coverage Period</span>
                  <span className="font-semibold text-gray-900">{selectedCoverage.coverage_period}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Protection Type</span>
                  <span className="font-semibold text-gray-900">{selectedCoverage.protection_type}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-primary-300">
                  <span className="text-lg font-bold text-gray-900">Total Premium</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedCoverage.premium)}
                  </span>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">What's Covered:</p>
              <ul className="space-y-2">
                {selectedCoverage.features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Confirm Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleConfirm}
              disabled={isConfirming || !!policy}
              loading={isConfirming}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : policy ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Policy Activated
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Confirm & Activate Policy
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By confirming, you agree to our terms of service and privacy policy
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && policy && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <Alert variant="success" className="shadow-2xl border-2 border-green-300">
              <CheckCircle2 className="h-5 w-5" />
              <AlertTitle className="text-lg font-bold">Policy Activated!</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-1">
                  <p className="font-semibold">Policy ID: {policy.policy_id}</p>
                  <p>{policy.coverage_period} at {formatCurrency(policy.premium)}</p>
                  <p className="text-xs text-green-700 mt-2">
                    Your purchase is now protected. Check your email for policy details.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
