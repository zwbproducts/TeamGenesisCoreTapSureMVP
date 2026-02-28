import { useState } from 'react'
import { ChevronDown, Package, BarChart3, DollarSign, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import type { Receipt } from '../../lib/schemas'

interface Props {
  receipt: Receipt
}

export function MerchantDashboard({ receipt }: Props) {
  const [expandedSections, setExpandedSections] = useState({
    inventory: true,
    sales: true,
    performance: true,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Punk grunge themed merchant data
  const merchantData = {
    inventory: [
      { name: 'CYBER GEAR', count: 189, value: '$15,750' },
      { name: 'PUNK APPAREL', count: 423, value: '$12,690' },
      { name: 'NEON SNACKS', count: 67, value: '$4,250' },
    ],
    todaySales: 4850.75,
    weekSales: 27800,
    monthSales: 115000,
    transactionCount: 218,
    avgTransaction: 62.45,
  }

  return (
    <div className="space-y-4">
      {/* Sales Overview Section */}
      <Card className="border-2 border-orange-500 bg-black/80 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-300 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-transparent to-orange-500/20 pointer-events-none" />
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-orange-900/30 to-transparent hover:from-orange-900/50 transition-colors relative z-10"
          onClick={() => toggleSection('sales')}
        >
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-orange-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]" />
            <CardTitle className="text-lg font-bold text-orange-400 tracking-wider">SALES ANALYTICS</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-orange-400 transition-transform duration-300 ${
              expandedSections.sales ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.sales && (
          <CardContent className="p-4 pt-2 space-y-4 border-t border-orange-500/30 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-orange-900/20 p-3 rounded-lg border border-orange-500/30 backdrop-blur-sm">
                <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider">Today</p>
                <p className="text-xl font-bold text-orange-400 mt-2">${merchantData.todaySales.toFixed(2)}</p>
              </div>
              <div className="bg-orange-900/20 p-3 rounded-lg border border-orange-500/30 backdrop-blur-sm">
                <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider">This Week</p>
                <p className="text-xl font-bold text-orange-400 mt-2">${merchantData.weekSales.toFixed(2)}</p>
              </div>
              <div className="bg-orange-900/20 p-3 rounded-lg border border-orange-500/30 backdrop-blur-sm">
                <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider">This Month</p>
                <p className="text-xl font-bold text-orange-400 mt-2">${merchantData.monthSales.toFixed(2)}</p>
              </div>
            </div>

            {/* Transaction Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/50 p-3 rounded-lg border border-orange-500/30 backdrop-blur-sm">
                <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider">Total Transactions</p>
                <p className="text-2xl font-bold text-orange-300 mt-1">{merchantData.transactionCount}</p>
              </div>
              <div className="bg-black/50 p-3 rounded-lg border border-orange-500/30 backdrop-blur-sm">
                <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider">Avg Transaction</p>
                <p className="text-2xl font-bold text-orange-300 mt-1">${merchantData.avgTransaction.toFixed(2)}</p>
              </div>
            </div>

            {/* Current Transaction Highlight */}
            <div className="bg-gradient-to-r from-orange-900/20 to-transparent p-4 rounded-lg border border-orange-500/30 backdrop-blur-sm">
              <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider">Latest Transaction</p>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="font-semibold text-orange-300">{receipt.merchant || 'CYBER MARKET'}</p>
                  <p className="text-xs text-orange-400 mt-1">{receipt.date || new Date().toLocaleTimeString()}</p>
                </div>
                <p className="text-2xl font-bold text-orange-400">${receipt.total?.toFixed(2) || '459.99'}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Inventory Management Section */}
      <Card className="border-2 border-cyan-500 bg-black/80 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-300 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 via-transparent to-cyan-500/20 pointer-events-none" />
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-cyan-900/30 to-transparent hover:from-cyan-900/50 transition-colors relative z-10"
          onClick={() => toggleSection('inventory')}
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
            <CardTitle className="text-lg font-bold text-cyan-400 tracking-wider">INVENTORY</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-cyan-400 transition-transform duration-300 ${
              expandedSections.inventory ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.inventory && (
          <CardContent className="p-4 pt-2 space-y-2 border-t border-cyan-500/30 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
            {merchantData.inventory.map((item, idx) => (
              <div key={idx} className="bg-black/50 p-3 rounded-lg border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-500/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-cyan-300">{item.name}</p>
                    <p className="text-xs text-cyan-400 mt-1">{item.count} UNITS</p>
                  </div>
                  <Badge className="bg-cyan-600 text-cyan-100">{item.value}</Badge>
                </div>
                <div className="w-full bg-black/50 rounded-full h-2 border-2 border-cyan-500/30">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300 h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${(idx + 1) * 30}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Performance Metrics Section */}
      <Card className="border-2 border-pink-500 bg-black/80 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all duration-300 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-900/20 via-transparent to-pink-500/20 pointer-events-none" />
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-pink-900/30 to-transparent hover:from-pink-900/50 transition-colors relative z-10"
          onClick={() => toggleSection('performance')}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-pink-400 drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]" />
            <CardTitle className="text-lg font-bold text-pink-400 tracking-wider">PERFORMANCE</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-pink-400 transition-transform duration-300 ${
              expandedSections.performance ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.performance && (
          <CardContent className="p-4 pt-2 space-y-3 border-t border-pink-500/30 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
            {/* Key Performance Indicators */}
            <div className="space-y-3">
              {/* Customer Satisfaction */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-pink-400">Customer Satisfaction</p>
                  <Badge className="bg-pink-600 text-pink-100">4.8/5</Badge>
                </div>
                <div className="w-full bg-black/50 rounded-full h-2 border-2 border-pink-500/30">
                  <div
                    className="bg-gradient-to-r from-pink-500 via-pink-400 to-pink-300 h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                    style={{ width: '96%' }}
                  />
                </div>
              </div>

              {/* QR Verification Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-pink-400">QR Verification Rate</p>
                  <Badge className="bg-pink-600 text-pink-100">99.2%</Badge>
                </div>
                <div className="w-full bg-black/50 rounded-full h-2 border-2 border-pink-500/30">
                  <div
                    className="bg-gradient-to-r from-pink-500 via-pink-400 to-pink-300 h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                    style={{ width: '99.2%' }}
                  />
                </div>
              </div>

              {/* Return Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-pink-400">Return Rate</p>
                  <Badge className="bg-green-600 text-green-100">2.3%</Badge>
                </div>
                <div className="w-full bg-black/50 rounded-full h-2 border-2 border-pink-500/30">
                  <div
                    className="bg-gradient-to-r from-green-500 via-green-400 to-green-300 h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    style={{ width: '2.3%' }}
                  />
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-500/30 backdrop-blur-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
              <div className="text-sm">
                <p className="font-semibold text-amber-400 uppercase tracking-wider">Inventory Alert</p>
                <p className="text-xs text-amber-500 mt-0.5">NEON SNACKS stock low - reorder recommended</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
