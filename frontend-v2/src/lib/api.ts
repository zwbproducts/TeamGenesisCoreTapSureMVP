import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { Receipt, Recommendation, PolicyConfirmation, CoverageOption, ActorRole } from './schemas'
import { debugLog } from './debugLogger'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '')

class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor for auth tokens
    this.client.interceptors.request.use(
      (config) => {
        debugLog('API_REQUEST', {
          method: config.method,
          url: `${config.baseURL ?? ''}${config.url ?? ''}`,
          headers: config.headers,
          data: config.data instanceof FormData ? '<FormData>' : config.data,
        })
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        debugLog('API_RESPONSE', {
          url: `${response.config?.baseURL ?? ''}${response.config?.url ?? ''}`,
          status: response.status,
          data: response.data,
        })
        return response
      },
      async (error: AxiosError) => {
        debugLog('API_ERROR', {
          url: `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        })
        if (error.response?.status === 401) {
          // Handle unauthorized - clear token and redirect
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }
        return Promise.reject(this.formatError(error))
      }
    )
  }

  private formatError(error: AxiosError): Error {
    if (error.response?.data) {
      const data = error.response.data as any
      return new Error(data.detail || data.message || 'An error occurred')
    }
    if (error.request) {
      return new Error('No response from server. Please check your connection.')
    }
    return new Error(error.message || 'An unexpected error occurred')
  }

  async analyzeReceipt(file: File): Promise<Receipt> {
    debugLog('analyzeReceipt()', { name: file.name, type: file.type, size: file.size })
    const formData = new FormData()
    formData.append('receipt', file)

    const requirePosQr = import.meta.env.VITE_POS_REQUIRE_QR === '1'

    const response = await this.client.post<Receipt>('/api/receipt/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(requirePosQr ? { 'X-POS-Require-QR': '1' } : {}),
      },
    })
    return response.data
  }

  async recommendCoverage(receipt: Receipt): Promise<Recommendation> {
    const response = await this.client.post<Recommendation>('/api/coverage/recommend', receipt)
    return response.data
  }

  async confirmPolicy(receipt: Receipt, selected: CoverageOption): Promise<PolicyConfirmation> {
    const response = await this.client.post<PolicyConfirmation>('/api/flow/confirm', {
      receipt,
      selected,
    })
    return response.data
  }

  async sendChatMessage(message: string, actorRole?: ActorRole | null): Promise<{ reply: string }> {
    const response = await this.client.post<{ reply: string }>('/api/chat', {
      message,
      ...(actorRole ? { actor_role: actorRole } : {}),
    })
    return response.data
  }

  async getChatIntents(): Promise<Array<{ name: string; phrases: string[]; expects_any?: string[] }>> {
    const response = await this.client.get<Array<{ name: string; phrases: string[]; expects_any?: string[] }>>(
      '/api/chat/intents'
    )
    return response.data
  }

  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get<{ status: string }>('/health')
    return response.data
  }
}

export const apiClient = new APIClient()
