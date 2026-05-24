'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, MapPin, AlertCircle, ShoppingCart } from 'lucide-react'

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data)
        else setError('Failed to load products')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleReserve = async (productId: string, warehouseId: string) => {
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({ productId, warehouseId, quantity: 1 })
      })

      const data = await res.json()
      if (res.status === 409) {
        setError('Not enough stock available for this item.')
        return
      }
      if (!res.ok) {
        setError(data.error || 'Failed to reserve')
        return
      }

      router.push(`/checkout/${data.id}`)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Allo Inventory
          </h1>
          <p className="text-zinc-400 mt-2">Next-generation distributed reservation system</p>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-8">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">✕</button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{product.name}</h3>
                    <p className="text-zinc-400 text-sm mt-1">{product.description}</p>
                  </div>
                  <span className="bg-zinc-800 text-emerald-400 font-medium px-3 py-1 rounded-full text-sm">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-4 mt-6">
                  {product.stock.map((s: any) => (
                    <div key={s.warehouseId} className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-zinc-300 text-sm">
                          <MapPin className="w-4 h-4" />
                          {s.warehouseName}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Package className="w-3 h-3" />
                          <span className={s.available > 0 ? "text-emerald-400" : "text-red-400"}>
                            {s.available} available
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleReserve(product.id, s.warehouseId)}
                        disabled={s.available <= 0}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {s.available > 0 ? 'Reserve 1 Unit' : 'Out of Stock'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
