type DebugValue = unknown

function parseCaller(stack?: string): string {
  if (!stack) return ''
  const lines = stack.split('\n').map((l) => l.trim())
  // Heuristic: skip first line (Error) and internal frames.
  for (const line of lines.slice(1)) {
    if (!line) continue
    if (line.includes('debugLogger')) continue
    if (line.includes('node_modules')) continue
    // Vite/Chrome style: "at fn (file:line:col)" or "at file:line:col"
    return line.replace(/^at\s+/, '')
  }
  return lines[1]?.replace(/^at\s+/, '') ?? ''
}

function summarize(value: DebugValue, limit = 1500): string {
  try {
    const s = JSON.stringify(value)
    if (s.length > limit) return s.slice(0, limit) + `...(+${s.length - limit} chars)`
    return s
  } catch {
    const s = String(value)
    if (s.length > limit) return s.slice(0, limit) + `...(+${s.length - limit} chars)`
    return s
  }
}

export function debugLog(event: string, data?: DebugValue) {
  const enabled = import.meta.env.DEV || import.meta.env.VITE_DEBUG_LOGGING === '1'
  if (!enabled) return

  const caller = parseCaller(new Error().stack)
  const payload = data === undefined ? '' : summarize(data)
  // eslint-disable-next-line no-console
  console.log(`[tapsure] ${event} ${caller}${payload ? ' | ' + payload : ''}`)
}
