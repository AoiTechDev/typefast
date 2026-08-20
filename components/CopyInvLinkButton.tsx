'use client'
import { useEffect, useState } from 'react'

type CopyInvLinkButtonProps = {
  code: string
}

const CopyInvLinkButton = ({ code }: CopyInvLinkButtonProps) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return

    const id = setTimeout(() => setCopied(false), 2000)

    return () => clearTimeout(id)
  }, [copied])

  const copy = async () => {
    const url = `${window.location.origin}/invitation?code=${code}`

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="w-full border-[3px] border-ink bg-panel py-4 font-extrabold tracking-wide uppercase shadow-[6px_6px_0_0_var(--color-ink)] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
    >
      {copied ? '✓ Copied' : '⧉ Copy invite link'}
    </button>
  )
}

export default CopyInvLinkButton
