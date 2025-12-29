import { useState } from 'react'
import { ChevronDown, BarChart2, TrendingDown, Users, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import type { Receipt } from '../../lib/schemas'

interface Props {
  receipt: Receipt
}

export function InsurerDashboard({ receipt }: Props) {
  const [expandedSections, setExpandedSections] = useState({
    claims: true,
    merchants: true,
    riskAnalysis: true,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Mock insurer data
  const insurerData = {
    totalClaims: 2847,
    approvedClaims: 2756,
    pendingClaims: 67,
    deniedClaims: 24,
    activeMerchants: 342,
    totalCoverage: 1250000,
    payoutsThisMonth: 45200,
    claimSuccess: 96.8,
    merchants: [
      { name: 'Walmart', policies: 234, claims: 12, risk: 'Low' },
      { name: 'Amazon', policies: 189, claims: 8, risk: 'Low' },
      { name: 'Target', policies: 156, claims: 15, risk: 'Medium' },
    ],
  }

  return (
    <div className="space-y-3">
      {/* Claims Overview Section */}
      <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-red-50 to-transparent hover:from-red-100 transition-colors"
          onClick={() => toggleSection('claims')}
        >
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-red-600" />
            <CardTitle className="text-lg">Claims Dashboard</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
              expandedSections.claims ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.claims && (
          <CardContent className="p-4 pt-2 space-y-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Claims Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Total Claims</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{insurerData.totalClaims}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{insurerData.approvedClaims}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{insurerData.pendingClaims}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Denied</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{insurerData.deniedClaims}</p>
              </div>
            </div>

            {/* Claims Success Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-gray-700">Claims Success Rate</p>
                <Badge className="bg-red-600 text-lg py-1">{insurerData.claimSuccess}%</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${insurerData.claimSuccess}%` }}
                />
              </div>
            </div>

            {/* Current Transaction Risk */}
            <div className="bg-gradient-to-r from-red-100 to-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Current Transaction</p>
                  <p className="text-xs text-gray-600 mt-1">{receipt.merchant}</p>
                </div>
                <Badge className="bg-green-600">Low Risk</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <p className="text-xs text-gray-600">Amount</p>
                  <p className="font-bold text-gray-800">${receipt.total?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Risk Score</p>
                  <p className="font-bold text-gray-800">{Math.round(receipt.confidence * 10)}/10</p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Merchant Database Section */}
      <Card className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-indigo-50 to-transparent hover:from-indigo-100 transition-colors"
          onClick={() => toggleSection('merchants')}
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-lg">Merchant Database</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
              expandedSections.merchants ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.merchants && (
          <CardContent className="p-4 pt-2 space-y-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Merchant Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Active Merchants</p>
                <p className="text-2xl font-bold text-indigo-600 mt-2">{insurerData.activeMerchants}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Total Coverage</p>
                <p className="text-2xl font-bold text-indigo-600 mt-2">${(insurerData.totalCoverage / 1000).toFixed(0)}K</p>
              </div>
            </div>

            {/* Merchant List */}
            {insurerData.merchants.map((merchant, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{merchant.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{merchant.policies} policies</p>
                  </div>
                  <Badge
                    className={
                      merchant.risk === 'Low'
                        ? 'bg-green-600'
                        : merchant.risk === 'Medium'
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                    }
                  >
                    {merchant.risk} Risk
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded">
                    <p className="text-gray-500">Claims</p>
                    <p className="font-bold text-gray-800">{merchant.claims}</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-gray-500">Claim Rate</p>
                    <p className="font-bold text-gray-800">{((merchant.claims / merchant.policies) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Risk Analysis Section */}
      <Card className="border-l-4 border-l-violet-500 hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-violet-50 to-transparent hover:from-violet-100 transition-colors"
          onClick={() => toggleSection('riskAnalysis')}
        >
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-violet-600" />
            <CardTitle className="text-lg">Risk Analysis</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
              expandedSections.riskAnalysis ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.riskAnalysis && (
          <CardContent className="p-4 pt-2 space-y-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Financial Metrics */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">Payouts This Month</p>
                  <Badge className="bg-violet-600">${insurerData.payoutsThisMonth}</Badge>
                </div>
                <div className="bg-violet-50 p-3 rounded-lg border border-violet-100">
                  <p className="text-xs text-gray-600">Total exposure managed</p>
                  <p className="font-bold text-violet-600 mt-1">${(insurerData.payoutsThisMonth * 1.5).toFixed(0)}</p>
                </div>
              </div>
            </div>

            {/* Risk Indicators */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                <span className="text-sm font-semibold text-gray-700">Fraud Detection Score</span>
                <Badge className="bg-green-600">Low Risk</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                <span className="text-sm font-semibold text-gray-700">QR Verification Status</span>
                <Badge className="bg-green-600">99.2% Valid</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <span className="text-sm font-semibold text-gray-700">Claim Variance</span>
                <Badge className="bg-yellow-600">4.2% Above Normal</Badge>
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="bg-red-50 p-3 rounded-lg border border-red-200 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-red-900">High-Value Claims Alert</p>
                  <p className="text-xs text-red-700 mt-0.5">5 claims over $500 this week</p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
