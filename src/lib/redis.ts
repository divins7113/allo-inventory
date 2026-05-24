// Mock Redis for local testing without Docker
class MockRedis {
  private store = new Map<string, { value: string; expiresAt: number }>()

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key)
    if (!item) return null
    if (Date.now() > item.expiresAt) {
      this.store.delete(key)
      return null
    }
    return item.value
  }

  async set(key: string, value: string, ...args: any[]): Promise<'OK' | null> {
    let ttlMs = 86400000 // 1 day default
    let nx = false

    for (let i = 0; i < args.length; i++) {
      if (args[i] === 'EX') ttlMs = args[i + 1] * 1000
      if (args[i] === 'PX') ttlMs = args[i + 1]
      if (args[i] === 'NX') nx = true
    }

    if (nx && await this.get(key) !== null) {
      return null
    }

    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
    return 'OK'
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }
}

const globalForRedis = globalThis as unknown as {
  redis: MockRedis | undefined
}

export const redis = globalForRedis.redis ?? new MockRedis()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Utility for distributed lock
export async function acquireLock(key: string, ttlMs: number = 5000): Promise<boolean> {
  const result = await redis.set(key, 'locked', 'PX', ttlMs, 'NX')
  return result === 'OK'
}

export async function releaseLock(key: string): Promise<void> {
  await redis.del(key)
}
