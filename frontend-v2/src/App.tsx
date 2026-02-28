import { useState } from 'react'
import { HelpCircle, RefreshCcw } from 'lucide-react'
import { ReceiptUpload } from './components/ReceiptUpload'
import { ReceiptDetails } from './components/ReceiptDetails'
import { CoverageOptions } from './components/CoverageOptions'
import { PolicyConfirmation } from './components/PolicyConfirmation'
import { ChatInterface } from './components/ChatInterface'
import { HowItWorksModal } from './components/HowItWorksModal'
import { RoleDashboards } from './components/RoleDashboards'
import { Button } from './components/ui/button'
import { useInsuranceStore } from './lib/store'

function App() {
  const [showModal, setShowModal] = useState(false)
  const [showDashboards, setShowDashboards] = useState(false)
  const { receipt, reset } = useInsuranceStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Punk Grunge Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.5)]">
              <span className="text-white font-bold text-xl tracking-wider">T</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent tracking-wider">
              TAPSURE
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {receipt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('START OVER? THIS WILL CLEAR YOUR CURRENT SESSION.')) {
                    reset()
                  }
                }}
                className="text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700"
              >
                <RefreshCcw className="w-4 h-4" />
                <span className="hidden sm:inline uppercase tracking-wider text-xs">Reset</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
              className="text-pink-400 hover:text-pink-300 hover:bg-pink-900/20 border border-pink-500/30"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline uppercase tracking-wider text-xs">How It Works</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Upload Section */}
        <ReceiptUpload />
        
        {/* Receipt Details */}
        {receipt && <ReceiptDetails />}

        {receipt?.pos_qr_verified && (
          <div className="flex justify-end">
            <Button 
              type="button" 
              onClick={() => setShowDashboards((v) => !v)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)] uppercase tracking-wider text-sm"
            >
              {showDashboards ? 'HIDE DASHBOARDS' : 'OPEN DASHBOARDS'}
            </Button>
          </div>
        )}

        {showDashboards && receipt?.pos_qr_verified && <RoleDashboards />}
        
        {/* Coverage Options */}
        {receipt && <CoverageOptions />}
        
        {/* Policy Confirmation */}
        {receipt && <PolicyConfirmation />}
        
        {/* Chat Interface */}
        <ChatInterface />
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-sm text-gray-500 relative z-10 border-t border-gray-700">
        <p className="uppercase tracking-wider">© 2025 TAPSURE. INSTANT INSURANCE FOR EVERYDAY PURCHASES.</p>
        <p className="mt-2 uppercase tracking-wider text-xs">
          <a href="#" className="text-pink-400 hover:text-pink-300 hover:underline">Terms</a>
          {' • '}
          <a href="#" className="text-pink-400 hover:text-pink-300 hover:underline">Privacy</a>
          {' • '}
          <a href="#" className="text-pink-400 hover:text-pink-300 hover:underline">Support</a>
        </p>
      </footer>

      {/* How It Works Modal */}
      <HowItWorksModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}

export default App
