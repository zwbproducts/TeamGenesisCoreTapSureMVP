import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Check, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { Alert, AlertDescription } from './ui/alert'
import { apiClient } from '../lib/api'
import { useInsuranceStore } from '../lib/store'
import { formatCurrency } from '../lib/utils'
import type { CoverageOption } from '../lib/schemas'

export function CoverageOptions() {
  const {
    receipt,
    recommendation,
    selectedCoverage,
    isRecommending,
    error,
    setRecommendation,
    setSelectedCoverage,
    setIsRecommending,
    setError,
  } = useInsuranceStore()

  useEffect(() => {
    if (receipt && !recommendation && !isRecommending) {
      fetchRecommendations()
    }
  }, [receipt])

  const fetchRecommendations = async () => {
    if (!receipt) return

    setIsRecommending(true)
    setError(null)

    try {
      const data = await apiClient.recommendCoverage(receipt)
      // data is already the Recommendation object with options array
      setRecommendation(data.options || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load coverage options'
      setError(message)
    } finally {
      setIsRecommending(false)
    }
  }

  if (!receipt) {
    return null
  }

  if (isRecommending) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="link"
              size="sm"
              onClick={fetchRecommendations}
              className="ml-2"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </motion.div>
    )
  }

  if (!recommendation || recommendation.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Coverage Options
          </CardTitle>
          <CardDescription>
            Choose the protection plan that works best for you
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {recommendation.map((option, index) => (
            <CoverageOptionCard
              key={index}
              option={option}
              index={index}
              isSelected={selectedCoverage === option}
              onSelect={() => setSelectedCoverage(option)}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface CoverageOptionCardProps {
  option: CoverageOption
  index: number
  isSelected: boolean
  onSelect: () => void
}

function CoverageOptionCard({ option, index, isSelected, onSelect }: CoverageOptionCardProps) {
  const isPremium = index === 2 // Last option is typically premium

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={`
          relative p-4 rounded-xl border-2 cursor-pointer transition-all
          ${isSelected 
            ? 'border-primary bg-primary-50 shadow-md' 
            : 'border-gray-200 hover:border-primary-300 hover:shadow-sm'
          }
          ${isPremium ? 'ring-2 ring-primary-200' : ''}
        `}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          }
        }}
      >
        {isPremium && (
          <div className="absolute -top-3 left-4">
            <Badge variant="default" className="shadow-sm">
              Best Value
            </Badge>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-lg text-gray-900">
                {option.protection_type}
              </h4>
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {option.coverage_period}
              </Badge>
            </div>

            <ul className="space-y-1">
              {option.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(option.premium)}
              </div>
              <div className="text-xs text-gray-500">one-time</div>
            </div>

            <Button
              variant={isSelected ? "primary" : "secondary"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
              }}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4" />
                  Selected
                </>
              ) : (
                'Select'
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
