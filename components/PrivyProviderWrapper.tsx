'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'

export default function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  if (!appId) {
    // Fail loudly in dev so misconfig is obvious
    throw new Error('Missing NEXT_PUBLIC_PRIVY_APP_ID')
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['wallet'],
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors({ shouldAutoConnect: false }),
          },
        },
        appearance: {
          theme: 'light',
          accentColor: '#7808d0',
          logo: '/seal.png',
          walletChainType: 'solana-only',
          walletList: ['detected_solana_wallets', 'phantom'],
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}

