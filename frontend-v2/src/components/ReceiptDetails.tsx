import { motion } from 'framer-motion'
import { Package, Calendar, Building2, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { useInsuranceStore } from '../lib/store'
import { formatCurrency } from '../lib/utils'

export function ReceiptDetails() {
  const { receipt, isAnalyzing } = useInsuranceStore()

  if (isAnalyzing) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-7 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (!receipt) {
    return null
  }

  const eligibilityColor = {
    APPROVED: 'success' as const,
    DENIED: 'error' as const,
    PENDING: 'warning' as const,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-lg border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Receipt Details</CardTitle>
            <Badge variant={eligibilityColor[receipt.eligibility]}>
              {receipt.eligibility}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-4">
            {/* Merchant */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <Building2 className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Merchant</p>
                <p className="text-lg font-semibold text-gray-900">{receipt.merchant}</p>
              </div>
            </div>

            {/* Category */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <Tag className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="text-lg font-semibold text-gray-900">{receipt.category}</p>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary-50 border border-primary-200">
              <Package className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-700">Total Amount</p>
                <p className="text-2xl font-bold text-primary-900">
                  {formatCurrency(receipt.total)}
                </p>
              </div>
            </div>

            {/* Date */}
            {receipt.date && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Purchase Date</p>
                  <p className="text-lg font-semibold text-gray-900">{receipt.date}</p>
                </div>
              </div>
            )}

            {/* Confidence Score */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Analysis Confidence</span>
                <span className="font-semibold text-gray-900">
                  {Math.round(receipt.confidence * 100)}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${receipt.confidence * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
