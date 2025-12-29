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

  // Mock merchant data
  const merchantData = {
    inventory: [
      { name: 'Electronics', count: 234, value: '$12,450' },
      { name: 'Clothing', count: 567, value: '$8,200' },
      { name: 'Food & Beverage', count: 89, value: '$3,400' },
    ],
    todaySales: 3200.5,
    weekSales: 18500,
    monthSales: 78500,
    transactionCount: 145,
    avgTransaction: 54.14,
  }

  return (
    <div className="space-y-3">
      {/* Sales Overview Section */}
      <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-orange-50 to-transparent hover:from-orange-100 transition-colors"
          onClick={() => toggleSection('sales')}
        >
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-lg">Sales Analytics</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
              expandedSections.sales ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.sales && (
          <CardContent className="p-4 pt-2 space-y-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Today</p>
                <p className="text-xl font-bold text-orange-600 mt-2">${merchantData.todaySales.toFixed(2)}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">This Week</p>
                <p className="text-xl font-bold text-orange-600 mt-2">${merchantData.weekSales.toFixed(2)}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">This Month</p>
                <p className="text-xl font-bold text-orange-600 mt-2">${merchantData.monthSales.toFixed(2)}</p>
              </div>
            </div>

            {/* Transaction Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{merchantData.transactionCount}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Avg Transaction</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">${merchantData.avgTransaction.toFixed(2)}</p>
              </div>
            </div>

            {/* Current Transaction Highlight */}
            <div className="bg-gradient-to-r from-orange-100 to-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Latest Transaction</p>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="font-semibold text-gray-800">{receipt.merchant}</p>
                  <p className="text-xs text-gray-500 mt-1">{receipt.date || new Date().toLocaleTimeString()}</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">${receipt.total?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Inventory Management Section */}
      <Card className="border-l-4 border-l-cyan-500 hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-cyan-50 to-transparent hover:from-cyan-100 transition-colors"
          onClick={() => toggleSection('inventory')}
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-cyan-600" />
            <CardTitle className="text-lg">Inventory</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
              expandedSections.inventory ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.inventory && (
          <CardContent className="p-4 pt-2 space-y-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
            {merchantData.inventory.map((item, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.count} units</p>
                  </div>
                  <Badge className="bg-cyan-600">{item.value}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full"
                    style={{ width: `${(idx + 1) * 30}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Performance Metrics Section */}
      <Card className="border-l-4 border-l-pink-500 hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-pink-50 to-transparent hover:from-pink-100 transition-colors"
          onClick={() => toggleSection('performance')}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-pink-600" />
            <CardTitle className="text-lg">Performance</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
              expandedSections.performance ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.performance && (
          <CardContent className="p-4 pt-2 space-y-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Key Performance Indicators */}
            <div className="space-y-3">
              {/* Customer Satisfaction */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">Customer Satisfaction</p>
                  <Badge className="bg-pink-600">4.8/5</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-pink-400 h-2 rounded-full"
                    style={{ width: '96%' }}
                  />
                </div>
              </div>

              {/* QR Verification Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">QR Verification Rate</p>
                  <Badge className="bg-pink-600">99.2%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-pink-400 h-2 rounded-full"
                    style={{ width: '99.2%' }}
                  />
                </div>
              </div>

              {/* Return Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">Return Rate</p>
                  <Badge className="bg-green-600">2.3%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full"
                    style={{ width: '2.3%' }}
                  />
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900">Inventory Alert</p>
                <p className="text-xs text-amber-700 mt-0.5">Food & Beverage stock low - reorder recommended</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
