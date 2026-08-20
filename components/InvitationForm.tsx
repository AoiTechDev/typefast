'use client'
import { useActionState } from 'react'

import { joinRoom } from '@/actions/join-room'

type InvitationFormProps = {
  code: string
}

const InvitationForm = ({ code }: InvitationFormProps) => {
  const [state, formAction, pending] = useActionState(joinRoom.bind(null, code), {})

  return (
    <form action={formAction}>
      <label
        htmlFor="invitation-nick"
        className="block font-mono text-xs font-bold tracking-widest uppercase"
      >
        Pick a nickname
      </label>
      <input
        id="invitation-nick"
        name="nick"
        required
        minLength={2}
        maxLength={16}
        placeholder="NULL_PTR"
        autoFocus
        className="mt-2 w-full border-[3px] border-ink bg-veil px-4 py-3 font-mono text-xl tracking-wide uppercase outline-none placeholder:text-dim focus:bg-panel"
      />

      {state.error && (
        <p className="mt-4 border-[3px] border-hot bg-hot px-3 py-2 font-mono text-sm text-panel">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full border-[3px] border-ink bg-lime py-4 text-lg font-extrabold tracking-wide uppercase shadow-[6px_6px_0_0_var(--color-ink)] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60"
      >
        {pending ? 'Joining…' : 'Join the race →'}
      </button>
    </form>
  )
}

export default InvitationForm
