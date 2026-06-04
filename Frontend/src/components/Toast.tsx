import { useEffect } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastProps {
  toast: ToastMessage
  onRemove: (id: string) => void
}

const iconMap = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
}

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
}

const iconColorMap = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
}

export function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const duration = toast.duration || 4000
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, duration)

    return () => clearTimeout(timer)
  }, [toast, onRemove])

  const Icon = iconMap[toast.type]

  return (
    <div
      className={`border rounded-lg p-4 flex items-start gap-3 shadow-md animate-fade-in ${colorMap[toast.type]}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColorMap[toast.type]}`} />
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        aria-label="Close"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onRemove }: { toasts: ToastMessage[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-40 space-y-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  )
}
