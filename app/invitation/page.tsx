'use client'
import { joinRoom } from '@/actions/join-room';
import { useSearchParams } from 'next/navigation';
import React, { useActionState, useState } from 'react'
import { codec } from 'zod/mini';
const InvitationPage = () => {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  const joinRoomWithCode = joinRoom.bind(null, code!)
  const [state, formAction, pending] = useActionState(joinRoomWithCode, {});
  return (
    <div>
      <form action={formAction}>
        <span>nick</span>
        <input name="nick" required maxLength={16} />
        <button type="submit">join</button>
      </form>
    </div>
  )
}

export default InvitationPage