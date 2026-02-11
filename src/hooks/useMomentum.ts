/**
 * Momentum/inertia physics for pan gestures
 * Based on panzoom's kinetic scrolling algorithm
 */

export interface MomentumConfig {
  /** Minimum velocity to trigger momentum (default: 5) */
  minVelocity?: number
  /** Velocity multiplier for momentum distance (default: 0.25) */
  amplitude?: number
  /** Decay time constant in ms - higher = longer glide (default: 342) */
  timeConstant?: number
  /** Stop threshold in pixels (default: 0.5) */
  stopThreshold?: number
}

interface Sample {
  x: number
  y: number
  t: number
}

export interface MomentumState {
  samples: Sample[]
  lastX: number
  lastY: number
}

export interface MomentumResult {
  /** Call on drag start */
  start: (x: number, y: number) => void
  /** Call on drag move - returns current velocity */
  track: (x: number, y: number) => { vx: number; vy: number }
  /** Call on drag end - starts momentum animation */
  stop: (
    currentX: number,
    currentY: number,
    onUpdate: (x: number, y: number) => void,
    onComplete?: () => void
  ) => void
  /** Cancel any running momentum animation, returns true if momentum was active */
  cancel: () => boolean
}

const defaults: Required<MomentumConfig> = {
  minVelocity: 5,
  amplitude: 0.25,
  timeConstant: 342,
  stopThreshold: 0.5,
}

// Time window for velocity calculation (ms)
const VELOCITY_WINDOW = 100

export function createMomentum(config: MomentumConfig = {}): MomentumResult {
  const settings = { ...defaults, ...config }

  let state: MomentumState = {
    samples: [],
    lastX: 0,
    lastY: 0,
  }

  let rafId: number | null = null

  function cancel(): boolean {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
      return true
    }
    return false
  }

  function start(x: number, y: number) {
    cancel()
    const now = performance.now()
    state = {
      samples: [{ x, y, t: now }],
      lastX: x,
      lastY: y,
    }
  }

  function track(x: number, y: number) {
    const now = performance.now()
    state.lastX = x
    state.lastY = y

    // Add sample and prune old ones outside the velocity window
    state.samples.push({ x, y, t: now })
    const cutoff = now - VELOCITY_WINDOW
    state.samples = state.samples.filter(s => s.t >= cutoff)

    // Compute velocity from samples for return value (not used for momentum, but keeps API)
    const { vx, vy } = computeVelocity(state.samples)
    return { vx, vy }
  }

  function computeVelocity(samples: Sample[]): { vx: number; vy: number } {
    if (samples.length < 2) {
      return { vx: 0, vy: 0 }
    }

    // Use weighted linear regression for smoother velocity estimation
    // More recent samples get higher weight
    const now = samples[samples.length - 1].t
    let sumW = 0, sumWX = 0, sumWY = 0, sumWT = 0
    let sumWTT = 0, sumWTX = 0, sumWTY = 0

    for (const s of samples) {
      // Weight decreases linearly with age, minimum 0.1
      const age = now - s.t
      const w = Math.max(0.1, 1 - age / VELOCITY_WINDOW)
      sumW += w
      sumWX += w * s.x
      sumWY += w * s.y
      sumWT += w * s.t
      sumWTT += w * s.t * s.t
      sumWTX += w * s.t * s.x
      sumWTY += w * s.t * s.y
    }

    const denom = sumW * sumWTT - sumWT * sumWT
    if (Math.abs(denom) < 0.0001) {
      return { vx: 0, vy: 0 }
    }

    // Slope of weighted linear regression = velocity in px/ms
    const vx = ((sumW * sumWTX - sumWT * sumWX) / denom) * 1000 // Convert to px/s
    const vy = ((sumW * sumWTY - sumWT * sumWY) / denom) * 1000

    return { vx, vy }
  }

  function stop(
    currentX: number,
    currentY: number,
    onUpdate: (x: number, y: number) => void,
    onComplete?: () => void
  ) {
    cancel()

    const { minVelocity, amplitude, timeConstant, stopThreshold } = settings

    // Prune stale samples before computing velocity
    // This handles the case where user stops moving but keeps holding before releasing
    const now = performance.now()
    const cutoff = now - VELOCITY_WINDOW
    state.samples = state.samples.filter(s => s.t >= cutoff)

    // Compute velocity from recent samples (robust across different event frequencies)
    const { vx, vy } = computeVelocity(state.samples)

    let targetX = currentX
    let targetY = currentY
    let ax = 0
    let ay = 0

    // Only apply momentum if velocity exceeds threshold
    if (Math.abs(vx) > minVelocity) {
      ax = amplitude * vx
      targetX += ax
    }

    if (Math.abs(vy) > minVelocity) {
      ay = amplitude * vy
      targetY += ay
    }

    // No momentum needed
    if (ax === 0 && ay === 0) {
      onComplete?.()
      return
    }

    const startTime = performance.now()

    function animate() {
      const elapsed = performance.now() - startTime
      let moving = false
      let dx = 0
      let dy = 0

      if (ax !== 0) {
        dx = -ax * Math.exp(-elapsed / timeConstant)
        if (Math.abs(dx) > stopThreshold) {
          moving = true
        } else {
          dx = 0
          ax = 0
        }
      }

      if (ay !== 0) {
        dy = -ay * Math.exp(-elapsed / timeConstant)
        if (Math.abs(dy) > stopThreshold) {
          moving = true
        } else {
          dy = 0
          ay = 0
        }
      }

      if (moving) {
        onUpdate(targetX + dx, targetY + dy)
        rafId = requestAnimationFrame(animate)
      } else {
        rafId = null
        onComplete?.()
      }
    }

    rafId = requestAnimationFrame(animate)
  }

  return { start, track, stop, cancel }
}
