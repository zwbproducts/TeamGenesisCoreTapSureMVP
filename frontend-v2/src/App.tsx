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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-700 bg-clip-text text-transparent">
              TapSure
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {receipt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('Start over? This will clear your current session.')) {
                    reset()
                  }
                }}
                className="text-gray-600"
              >
                <RefreshCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
              className="text-primary"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">How It Works</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Upload Section */}
        <ReceiptUpload />
        
        {/* Receipt Details */}
        {receipt && <ReceiptDetails />}

        {receipt?.pos_qr_verified && (
          <div className="flex justify-end">
            <Button type="button" onClick={() => setShowDashboards((v) => !v)}>
              {showDashboards ? 'Hide Dashboards' : 'Open Dashboards'}
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
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        <p>© 2025 TapSure. Instant insurance for everyday purchases.</p>
        <p className="mt-2">
          <a href="#" className="text-primary hover:underline">Terms</a>
          {' • '}
          <a href="#" className="text-primary hover:underline">Privacy</a>
          {' • '}
          <a href="#" className="text-primary hover:underline">Support</a>
        </p>
      </footer>

      {/* How It Works Modal */}
      <HowItWorksModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}

export default App
