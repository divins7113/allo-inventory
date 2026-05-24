'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [reservation, setReservation] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [status, setStatus] = useState<'LOADING' | 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED'>('LOADING')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/reservations/${resolvedParams.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setReservation(data)
        if (data.status !== 'PENDING') {
          setStatus(data.status)
        } else if (new Date(data.expiresAt) < new Date()) {
          setStatus('EXPIRED')
        } else {
          setStatus('PENDING')
        }
      })
      .catch(err => setError(err.message))
  }, [resolvedParams.id])

  useEffect(() => {
    if (status !== 'PENDING' || !reservation) return

    const interval = setInterval(() => {
      const expiry = new Date(reservation.expiresAt)
      if (expiry < new Date()) {
        setStatus('EXPIRED')
        clearInterval(interval)
      } else {
        const diffMs = expiry.getTime() - new Date().getTime()
        const mins = Math.floor(diffMs / 60000)
        const secs = Math.floor((diffMs % 60000) / 1000)
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [reservation, status])

  const handleConfirm = async () => {
    try {
      const res = await fetch(`/api/reservations/${resolvedParams.id}/confirm`, { method: 'POST' })
      const data = await res.json()
      if (res.status === 410) {
        setStatus('EXPIRED')
        setError('Reservation expired before confirmation.')
        return
      }
      if (!res.ok) throw new Error(data.error)
      setStatus('CONFIRMED')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCancel = async () => {
    try {
      const res = await fetch(`/api/reservations/${resolvedParams.id}/release`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      setStatus('RELEASED')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (status === 'LOADING') return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">Checkout</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {status === 'PENDING' && (
          <div className="space-y-6">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-400">Time remaining</span>
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-lg font-bold">
                <Clock className="w-5 h-5" />
                {timeLeft || '--:--'}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-medium transition-colors"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        )}

        {status === 'CONFIRMED' && (
          <div className="text-center space-y-4 py-8">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-medium text-emerald-400">Payment Successful</h3>
            <p className="text-zinc-400">Your reservation has been confirmed.</p>
            <button onClick={() => router.push('/')} className="mt-4 text-sm text-white hover:text-zinc-300 transition-colors">Back to Home</button>
          </div>
        )}

        {(status === 'RELEASED' || status === 'EXPIRED') && (
          <div className="text-center space-y-4 py-8">
            <XCircle className="w-16 h-16 text-red-400 mx-auto" />
            <h3 className="text-xl font-medium text-red-400">
              {status === 'EXPIRED' ? 'Reservation Expired' : 'Reservation Cancelled'}
            </h3>
            <p className="text-zinc-400">The units have been released back to stock.</p>
            <button onClick={() => router.push('/')} className="mt-4 text-sm text-white hover:text-zinc-300 transition-colors">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  )
}
