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

export interface MomentumState {
  vx: number
  vy: number
  timestamp: number
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
  /** Cancel any running momentum animation */
  cancel: () => void
}

const defaults: Required<MomentumConfig> = {
  minVelocity: 5,
  amplitude: 0.25,
  timeConstant: 342,
  stopThreshold: 0.5,
}

export function createMomentum(config: MomentumConfig = {}): MomentumResult {
  const settings = { ...defaults, ...config }

  let state: MomentumState = {
    vx: 0,
    vy: 0,
    timestamp: 0,
    lastX: 0,
    lastY: 0,
  }

  let rafId: number | null = null

  function cancel() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function start(x: number, y: number) {
    cancel()
    state = {
      vx: 0,
      vy: 0,
      timestamp: performance.now(),
      lastX: x,
      lastY: y,
    }
  }

  function track(x: number, y: number) {
    const now = performance.now()
    const elapsed = now - state.timestamp
    state.timestamp = now

    const dx = x - state.lastX
    const dy = y - state.lastY
    state.lastX = x
    state.lastY = y

    // Normalize to velocity per second
    const dt = 1000 / (1 + elapsed)

    // Moving average: 80% new sample, 20% previous velocity
    state.vx = 0.8 * dx * dt + 0.2 * state.vx
    state.vy = 0.8 * dy * dt + 0.2 * state.vy

    return { vx: state.vx, vy: state.vy }
  }

  function stop(
    currentX: number,
    currentY: number,
    onUpdate: (x: number, y: number) => void,
    onComplete?: () => void
  ) {
    cancel()

    const { minVelocity, amplitude, timeConstant, stopThreshold } = settings

    let targetX = currentX
    let targetY = currentY
    let ax = 0
    let ay = 0

    // Only apply momentum if velocity exceeds threshold
    if (Math.abs(state.vx) > minVelocity) {
      ax = amplitude * state.vx
      targetX += ax
    }

    if (Math.abs(state.vy) > minVelocity) {
      ay = amplitude * state.vy
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
