import Link from 'next/link'
import React from 'react'

const Navbar = () => {
  return (
    <div className="flex items-center justify-between border-b-5 border-b-ink p-4">
      <Link href="/" className="text-[28px] font-extrabold space-x-2">
        <span>TYPE</span>
        <span className="border-3 py-[0.5px] px-2 bg-lime ">FAST</span>
      </Link>
      <Link
        href="/solo"
        className="border-[3px] border-ink bg-panel px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase shadow-[4px_4px_0_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        Solo
      </Link>
    </div>
  )
}

export default Navbar