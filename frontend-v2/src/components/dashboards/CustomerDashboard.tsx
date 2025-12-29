import { useState } from 'react'
import { ChevronDown, Shield, TrendingUp, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import type { Receipt, PolicyConfirmation } from '../../lib/schemas'

interface Props {
  receipt: Receipt
  policy: PolicyConfirmation | null
}

export function CustomerDashboard({ receipt, policy }: Props) {
  const [expandedSections, setExpandedSections] = useState({
    policy: true,
    coverage: true,
    claims: true,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const getDaysUntilExpiry = () => {
    if (!policy?.coverage_period) return null
    // Parse coverage period for demonstration
    const months = parseInt(policy.coverage_period) || 3
    const expiry = new Date()
    expiry.setMonth(expiry.getMonth() + months)
    const today = new Date()
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft
  }

  const daysLeft = getDaysUntilExpiry()

  return (
    <div className="space-y-3">
      {/* Policy Overview Section */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100 transition-colors"
          onClick={() => toggleSection('policy')}
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Your Policy</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
              expandedSections.policy ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.policy && (
          <CardContent className="p-4 pt-2 space-y-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <p className="font-semibold text-gray-800 capitalize">{policy?.status || 'Active'}</p>
                </div>
              </div>

              {/* Policy ID */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Policy ID</p>
                <p className="font-mono text-sm text-gray-700 truncate">{policy?.policy_id || 'N/A'}</p>
              </div>

              {/* Coverage Amount */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Coverage</p>
                <p className="text-lg font-bold text-green-600">${policy?.premium?.toFixed(2) || '0.00'}</p>
              </div>

              {/* Expiry */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Expires In</p>
                <p className={`font-semibold ${
                  daysLeft && daysLeft < 30 ? 'text-orange-600' : 'text-gray-800'
                }`}>
                  {daysLeft ? `${daysLeft} days` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Policy Holder Info */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-xs text-gray-600 font-semibold">Purchase Location</p>
              <p className="font-semibold text-gray-800 mt-1">{receipt.merchant}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Coverage Details Section */}
      <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-emerald-50 to-transparent hover:from-emerald-100 transition-colors"
          onClick={() => toggleSection('coverage')}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-lg">Coverage Details</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
              expandedSections.coverage ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.coverage && (
          <CardContent className="p-4 pt-2 space-y-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Coverage Percentage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-gray-700">Coverage %</p>
                <Badge className="bg-emerald-600 text-lg py-1">
                  75%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: '75%' }}
                />
              </div>
            </div>

            {/* Eligibility */}
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-sm font-semibold text-gray-700">Eligibility</span>
              <Badge className="bg-emerald-600">{receipt.eligibility || 'Eligible'}</Badge>
            </div>

            {/* Coverage Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Premium</p>
                <p className="text-lg font-bold text-gray-800 mt-1">${policy?.premium?.toFixed(2) || '0'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Period</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{policy?.coverage_period || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Recent Claims Section */}
      <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-transparent hover:from-purple-100 transition-colors"
          onClick={() => toggleSection('claims')}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
              expandedSections.claims ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.claims && (
          <CardContent className="p-4 pt-2 space-y-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Current Transaction */}
            <div className="bg-gradient-to-r from-purple-50 to-transparent p-4 rounded-lg border border-purple-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-800">{receipt.merchant}</p>
                  <p className="text-xs text-gray-500 mt-1">{receipt.date || new Date().toLocaleDateString()}</p>
                </div>
                <Badge className="bg-purple-600">Recent</Badge>
              </div>
              <p className="text-xl font-bold text-gray-800 mt-2">${receipt.total?.toFixed(2) || '0.00'}</p>
            </div>

            {/* QR Status */}
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-green-700">QR Verified ✓</span>
            </div>

            {/* Confidence */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Analysis Confidence</span>
                <Badge className="bg-blue-600">{Math.round(receipt.confidence * 100)}%</Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
