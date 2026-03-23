// Global transaction queue — serializes all on-chain writes from this process
// Prevents "replacement transaction underpriced" when multiple agents share the same wallet key
//
// Usage: wrap any writeContract call with txQueue.run(() => client.writeContract(...))
// All callers share the same queue and execute sequentially

let _queue: Promise<unknown> = Promise.resolve()

export const txQueue = {
  /**
   * Run fn after all previously queued txs have settled.
   * Returns a promise that resolves to fn's return value.
   */
  run<T>(fn: () => Promise<T>): Promise<T> {
    const next = _queue.then(() => fn())
    // Keep the chain alive even if this task rejects (don't propagate to queue)
    _queue = next.catch(() => {})
    return next
  },
}
