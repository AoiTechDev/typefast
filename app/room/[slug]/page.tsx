import { getHostId } from '@/actions/get-host-id'
import CopyInvLinkButton from '@/components/CopyInvLinkButton'
import { cookies } from 'next/headers'
import React from 'react'

interface PageProps {
  params: {
    slug: string
  }
}
const page = async ({ params }: PageProps) => {
  const { slug } = await params
  const cookieStore = await cookies()
  const playerId = cookieStore.get('playerId')
  const hostId = await getHostId(slug)
  const isPlayerHost = String(hostId) === String(playerId?.value)

  return (
    <div>
      {isPlayerHost && <CopyInvLinkButton text={`http://localhost:3000/invitation?code=${slug}`} />}


    </div>
  )
}

export default page