'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'

export default function LoginToPlayButton() {
  const router = useRouter()
  const { ready, authenticated, login } = usePrivy()

  useEffect(() => {
    if (ready && authenticated) router.push('/game')
  }, [ready, authenticated, router])

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => login()}
      className={[
        'inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white/80',
        'backdrop-blur px-4 py-2',
        'transition-transform duration-200',
        'hover:scale-[1.01] active:scale-[0.99]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
      ].join(' ')}
    >
      <span className="text-sm font-semibold text-gray-800 tracking-tight">
        Connect wallet to play
      </span>
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#7808d0] text-white">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
          <path
            d="M7.5 4.5H15.5V12.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.5 4.5L4.5 15.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  )
}

