'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useSolanaWallets } from '@privy-io/react-auth/solana'

function truncateAddress(address: string) {
  if (address.length <= 10) return address
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

export default function WalletCorner() {
  const router = useRouter()
  const { ready, authenticated, logout } = usePrivy()
  const { wallets } = useSolanaWallets()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const solWallet = useMemo(() => wallets?.[0], [wallets])

  if (!ready || !authenticated) return null

  const address = solWallet?.address

  return (
    <div className="absolute top-6 right-6 z-50">
      <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white/80 backdrop-blur px-4 py-2">
        <span className="text-sm font-semibold text-gray-800 tabular-nums">
          {address ? truncateAddress(address) : 'Not connected'}
        </span>
        <span className="w-px h-5 bg-gray-200" />
        <button
          type="button"
          disabled={isLoggingOut}
          onClick={async () => {
            try {
              setIsLoggingOut(true)
              await logout()
              router.push('/')
            } finally {
              setIsLoggingOut(false)
            }
          }}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}

