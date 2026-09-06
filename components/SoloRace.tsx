'use client'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import GameTextArea from './GameTextArea'
import ModifierPicker from './ModifierPicker'
import Button from './ui/Button'
import { pickRaceText } from '@/lib/dummy-text'
import { MODIFIERS, type ModifierId } from '@/lib/modifiers'
import { SOLO_COUNTDOWN_MS } from '@/lib/race'
import { scoreRace } from '@/lib/score'

type Phase = 'setup' | 'countdown' | 'racing' | 'result'

type SoloResult = {
  wpm: number
  accuracy: number
  durationMs: number
  isBest: boolean
}

const BEST_KEY = 'typefast:solo-best'

let cachedBest: number | null | undefined
let bestListeners: (() => void)[] = []

const readBest = () => {
  if (cachedBest === undefined) {
    try {
      const stored = Number(window.localStorage.getItem(BEST_KEY))
      cachedBest = Number.isFinite(stored) && stored > 0 ? stored : null
    } catch {
      cachedBest = null
    }
  }

  return cachedBest
}

const subscribeBest = (onChange: () => void) => {
  bestListeners = [...bestListeners, onChange]

  return () => {
    bestListeners = bestListeners.filter(listener => listener !== onChange)
  }
}

const persistBest = (wpm: number) => {
  try {
    window.localStorage.setItem(BEST_KEY, String(wpm))
  } catch {
    return
  }
}

const writeBest = (wpm: number) => {
  cachedBest = wpm
  persistBest(wpm)
  bestListeners.forEach(listener => listener())
}

const SoloRace = () => {
  const [phase, setPhase] = useState<Phase>('setup')
  const [modifiers, setModifiers] = useState<ModifierId[]>([])
  const [raceText, setRaceText] = useState('')
  const [remaining, setRemaining] = useState(SOLO_COUNTDOWN_MS)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<SoloResult | null>(null)
  const startedAtRef = useRef(0)
  const best = useSyncExternalStore(subscribeBest, readBest, () => null)

  useEffect(() => {
    if (phase !== 'countdown') return

    const endsAt = Date.now() + SOLO_COUNTDOWN_MS

    const tick = () => {
      const left = Math.max(0, endsAt - Date.now())
      setRemaining(left)

      if (left > 0) return

      clearInterval(id)
      startedAtRef.current = Date.now()
      setPhase('racing')
    }

    const id = setInterval(tick, 100)
    tick()

    return () => clearInterval(id)
  }, [phase])

  const toggleModifier = (id: ModifierId) => {
    setModifiers(current =>
      current.includes(id) ? current.filter(modifier => modifier !== id) : [...current, id],
    )
  }

  const beginRace = () => {
    setRaceText(current => pickRaceText(current))
    setResult(null)
    setProgress(0)
    setRemaining(SOLO_COUNTDOWN_MS)
    setPhase('countdown')
  }

  const handleProgress = useCallback((next: number) => {
    setProgress(next)
  }, [])

  const handleFinish = useCallback(
    (typedText: string) => {
      const durationMs = Math.max(1, Date.now() - startedAtRef.current)
      const { wpm, accuracy } = scoreRace(raceText, typedText, durationMs)
      const isBest = best === null || wpm > best

      if (isBest) writeBest(wpm)

      setResult({ wpm, accuracy, durationMs, isBest })
      setPhase('result')
    },
    [best, raceText],
  )

  const activeModifiers = MODIFIERS.filter(modifier => modifiers.includes(modifier.id))

  if (phase === 'setup') {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-10 md:px-10">
        <p className="font-mono text-xs font-bold tracking-[0.3em] text-dim uppercase">Solo</p>
        <h1 className="mt-2 text-5xl font-extrabold tracking-tighter uppercase">Race yourself</h1>
        <p className="mt-3 font-mono text-sm text-dim">
          No room, no waiting. Pick your rules and go.
        </p>

        {best !== null && (
          <div className="mt-8 border-[4px] border-ink bg-lime px-5 py-4 shadow-[6px_6px_0_0_var(--color-ink)]">
            <p className="font-mono text-[11px] font-bold tracking-widest uppercase">
              Personal best
            </p>
            <p className="text-4xl font-extrabold tabular-nums">
              {best} <span className="text-lg">WPM</span>
            </p>
          </div>
        )}

        <p className="mt-8 font-mono text-xs font-bold tracking-widest text-dim uppercase">Rules</p>
        <div className="mt-3">
          <ModifierPicker modifiers={modifiers} onToggle={toggleModifier} />
        </div>

        <Button className="mt-8" onClick={beginRace}>
          Start race →
        </Button>

        <Link
          href="/"
          className="mt-6 block text-center font-mono text-[11px] font-bold tracking-widest text-dim uppercase"
        >
          ← Back to multiplayer
        </Link>
      </main>
    )
  }

  if (phase === 'countdown') {
    return (
      <main className="px-6 py-12 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-bold tracking-[0.3em] text-dim uppercase">
            Hands on the keys
          </p>

          <p className="mt-4 text-[9rem] leading-none font-extrabold text-hot tabular-nums md:text-[11rem]">
            {Math.ceil(remaining / 1000)}
          </p>

          <div className="mt-8 border-[3px] border-ink bg-bg p-8 text-left">
            <p className="font-mono text-lg leading-[1.9] text-dim md:text-xl">{raceText}</p>
          </div>

          {activeModifiers.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {activeModifiers.map(modifier => (
                <span
                  key={modifier.id}
                  className="border-[3px] border-ink bg-ink px-3 py-2 font-mono text-[11px] font-bold tracking-widest text-panel uppercase"
                >
                  {modifier.label}
                </span>
              ))}
            </div>
          )}

          <p className="mt-6 font-mono text-xs font-bold tracking-[0.3em] text-dim uppercase">
            Typing unlocks at zero
          </p>
        </div>
      </main>
    )
  }

  if (phase === 'racing') {
    return (
      <main className="px-6 py-10 md:px-10">
        <GameTextArea
          raceText={raceText}
          modifiers={modifiers}
          onProgress={handleProgress}
          onFinish={handleFinish}
        />

        <div className="mx-auto mt-10 max-w-3xl border-[3px] border-ink bg-sunk">
          <div
            className="h-4 bg-ink transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </main>
    )
  }

  if (!result) return null

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10 md:px-10">
      <p className="font-mono text-xs font-bold tracking-[0.3em] text-dim uppercase">Solo</p>
      <h1 className="mt-2 text-5xl font-extrabold tracking-tighter uppercase">Result</h1>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="border-[4px] border-ink bg-lime px-4 py-3 shadow-[6px_6px_0_0_var(--color-ink)]">
          <p className="font-mono text-[11px] font-bold tracking-widest uppercase">WPM</p>
          <p className="text-3xl font-extrabold tabular-nums">{result.wpm}</p>
        </div>
        <div className="border-[4px] border-ink bg-panel px-4 py-3 shadow-[6px_6px_0_0_var(--color-ink)]">
          <p className="font-mono text-[11px] font-bold tracking-widest text-dim uppercase">
            Accuracy
          </p>
          <p className="text-3xl font-extrabold tabular-nums">{result.accuracy}%</p>
        </div>
        <div className="border-[4px] border-ink bg-panel px-4 py-3 shadow-[6px_6px_0_0_var(--color-ink)]">
          <p className="font-mono text-[11px] font-bold tracking-widest text-dim uppercase">Time</p>
          <p className="text-3xl font-extrabold tabular-nums">
            {(result.durationMs / 1000).toFixed(1)}s
          </p>
        </div>
      </div>

      {result.isBest ? (
        <p className="mt-6 border-[3px] border-ink bg-hot px-4 py-3 font-mono text-sm font-bold tracking-widest text-panel uppercase">
          New personal best
        </p>
      ) : (
        best !== null && (
          <p className="mt-6 font-mono text-xs font-bold tracking-widest text-dim uppercase">
            Personal best {best} WPM
          </p>
        )
      )}

      {activeModifiers.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {activeModifiers.map(modifier => (
            <span
              key={modifier.id}
              className="border-[2px] border-ink bg-ink px-2 py-1 font-mono text-[11px] font-bold tracking-widest text-panel uppercase"
            >
              {modifier.label}
            </span>
          ))}
        </div>
      )}

      <Button className="mt-8" onClick={beginRace}>
        Race again →
      </Button>

      <Button className="mt-4 bg-panel" onClick={() => setPhase('setup')}>
        Change rules
      </Button>

      <Link
        href="/"
        className="mt-6 block text-center font-mono text-[11px] font-bold tracking-widest text-dim uppercase"
      >
        ← Back to multiplayer
      </Link>
    </main>
  )
}

export default SoloRace
