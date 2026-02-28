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

  // Punk grunge themed insurer data
  const insurerData = {
    totalClaims: 3127,
    approvedClaims: 2984,
    pendingClaims: 92,
    deniedClaims: 51,
    activeMerchants: 427,
    totalCoverage: 1850000,
    payoutsThisMonth: 68400,
    claimSuccess: 95.4,
    merchants: [
      { name: 'CYBER MARKET', policies: 342, claims: 18, risk: 'Low' },
      { name: 'NEON BAZAAR', policies: 276, claims: 24, risk: 'Medium' },
      { name: 'SHADOW RETAIL', policies: 198, claims: 31, risk: 'High' },
    ],
  }

  return (
    <div className="space-y-4">
      {/* Claims Overview Section */}
      <Card className="border-2 border-red-500 bg-black/80 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-transparent to-red-500/20 pointer-events-none" />
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-red-900/30 to-transparent hover:from-red-900/50 transition-colors relative z-10"
          onClick={() => toggleSection('claims')}
        >
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
            <CardTitle className="text-lg font-bold text-red-400 tracking-wider">CLAIMS DASHBOARD</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-red-400 transition-transform duration-300 ${
              expandedSections.claims ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.claims && (
          <CardContent className="p-4 pt-2 space-y-4 border-t border-red-500/30 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
            {/* Claims Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/30 backdrop-blur-sm">
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">Total Claims</p>
                <p className="text-2xl font-bold text-red-400 mt-2">{insurerData.totalClaims}</p>
              </div>
              <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/30 backdrop-blur-sm">
                <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">Approved</p>
                <p className="text-2xl font-bold text-green-400 mt-2">{insurerData.approvedClaims}</p>
              </div>
              <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/30 backdrop-blur-sm">
                <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold text-yellow-400 mt-2">{insurerData.pendingClaims}</p>
              </div>
              <div className="bg-gray-900/20 p-3 rounded-lg border border-gray-500/30 backdrop-blur-sm">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Denied</p>
                <p className="text-2xl font-bold text-gray-400 mt-2">{insurerData.deniedClaims}</p>
              </div>
            </div>

            {/* Claims Success Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-red-400">Claims Success Rate</p>
                <Badge className="bg-red-600 text-lg py-1 text-red-100">{insurerData.claimSuccess}%</Badge>
              </div>
              <div className="w-full bg-black/50 rounded-full h-3 border-2 border-red-500/30">
                <div
                  className="bg-gradient-to-r from-red-500 via-red-400 to-red-300 h-3 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  style={{ width: `${insurerData.claimSuccess}%` }}
                />
              </div>
            </div>

            {/* Current Transaction Risk */}
            <div className="bg-gradient-to-r from-red-900/20 to-transparent p-4 rounded-lg border border-red-500/30 backdrop-blur-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold text-red-300">Current Transaction</p>
                  <p className="text-xs text-red-400 mt-1">{receipt.merchant || 'CYBER MARKET'}</p>
                </div>
                <Badge className="bg-green-600 text-green-100">LOW RISK</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <p className="text-xs text-red-400">Amount</p>
                  <p className="font-bold text-red-300">${receipt.total?.toFixed(2) || '459.99'}</p>
                </div>
                <div>
                  <p className="text-xs text-red-400">Risk Score</p>
                  <p className="font-bold text-red-300">{Math.round(receipt.confidence * 10)}/10</p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Merchant Database Section */}
      <Card className="border-2 border-blue-500 bg-black/80 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-blue-500/20 pointer-events-none" />
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-blue-900/30 to-transparent hover:from-blue-900/50 transition-colors relative z-10"
          onClick={() => toggleSection('merchants')}
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
            <CardTitle className="text-lg font-bold text-blue-400 tracking-wider">MERCHANT DATABASE</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-blue-400 transition-transform duration-300 ${
              expandedSections.merchants ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.merchants && (
          <CardContent className="p-4 pt-2 space-y-3 border-t border-blue-500/30 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
            {/* Merchant Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/30 backdrop-blur-sm">
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Active Merchants</p>
                <p className="text-2xl font-bold text-blue-400 mt-2">{insurerData.activeMerchants}</p>
              </div>
              <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/30 backdrop-blur-sm">
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Total Coverage</p>
                <p className="text-2xl font-bold text-blue-400 mt-2">${(insurerData.totalCoverage / 1000).toFixed(0)}K</p>
              </div>
            </div>

            {/* Merchant List */}
            {insurerData.merchants.map((merchant, idx) => (
              <div key={idx} className="bg-black/50 p-3 rounded-lg border border-blue-500/30 backdrop-blur-sm space-y-2 hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-blue-300">{merchant.name}</p>
                    <p className="text-xs text-blue-400 mt-1">{merchant.policies} policies</p>
                  </div>
                  <Badge
                    className={
                      merchant.risk === 'Low'
                        ? 'bg-green-600 text-green-100'
                        : merchant.risk === 'Medium'
                          ? 'bg-yellow-600 text-yellow-100'
                          : 'bg-red-600 text-red-100'
                    }
                  >
                    {merchant.risk} RISK
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/30 p-2 rounded backdrop-blur-sm">
                    <p className="text-blue-400">Claims</p>
                    <p className="font-bold text-blue-300">{merchant.claims}</p>
                  </div>
                  <div className="bg-black/30 p-2 rounded backdrop-blur-sm">
                    <p className="text-blue-400">Claim Rate</p>
                    <p className="font-bold text-blue-300">{((merchant.claims / merchant.policies) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Risk Analysis Section */}
      <Card className="border-2 border-purple-500 bg-black/80 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-purple-500/20 pointer-events-none" />
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-purple-900/30 to-transparent hover:from-purple-900/50 transition-colors relative z-10"
          onClick={() => toggleSection('riskAnalysis')}
        >
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
            <CardTitle className="text-lg font-bold text-purple-400 tracking-wider">RISK ANALYSIS</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-purple-400 transition-transform duration-300 ${
              expandedSections.riskAnalysis ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.riskAnalysis && (
          <CardContent className="p-4 pt-2 space-y-3 border-t border-purple-500/30 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
            {/* Financial Metrics */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-purple-400">Payouts This Month</p>
                  <Badge className="bg-purple-600 text-purple-100">${insurerData.payoutsThisMonth}</Badge>
                </div>
                <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/30 backdrop-blur-sm">
                  <p className="text-xs text-purple-400 uppercase tracking-wider">Total exposure managed</p>
                  <p className="font-bold text-purple-400 mt-1">${(insurerData.payoutsThisMonth * 1.5).toFixed(0)}</p>
                </div>
              </div>
            </div>

            {/* Risk Indicators */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-500/30 backdrop-blur-sm">
                <span className="text-sm font-semibold text-green-400">Fraud Detection Score</span>
                <Badge className="bg-green-600 text-green-100">LOW RISK</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-500/30 backdrop-blur-sm">
                <span className="text-sm font-semibold text-green-400">QR Verification Status</span>
                <Badge className="bg-green-600 text-green-100">99.2% VALID</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30 backdrop-blur-sm">
                <span className="text-sm font-semibold text-yellow-400">Claim Variance</span>
                <Badge className="bg-yellow-600 text-yellow-100">4.2% ABOVE NORMAL</Badge>
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/30 backdrop-blur-sm space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                <div className="text-sm">
                  <p className="font-semibold text-red-400 uppercase tracking-wider">High-Value Claims Alert</p>
                  <p className="text-xs text-red-500 mt-0.5">5 claims over $500 this week</p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
