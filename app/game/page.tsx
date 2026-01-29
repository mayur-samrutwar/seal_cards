'use client'

import Image from 'next/image'
import AnimatedButton from '@/components/AnimatedButton'
import { useState } from 'react'
import WalletCorner from '@/components/WalletCorner'
import ChooseSetModal from '@/components/ChooseSetModal'

export default function GamePage() {
  const [selected, setSelected] = useState<'pack' | 'set' | null>(null)
  const [showSetModal, setShowSetModal] = useState(false)

  return (
    <div
      className="relative w-full h-screen bg-white flex items-center justify-center"
      style={{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <WalletCorner />
      <div className="flex flex-col items-center gap-10 -translate-y-10">
        <div className="flex items-center gap-8">
          {/* Pack image with text */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setSelected('pack')}
              className={[
                'relative w-[320px] h-[440px] flex items-center justify-center transition-all duration-200',
                selected && selected !== 'pack' ? 'opacity-55 grayscale-[20%]' : 'opacity-100',
              ].join(' ')}
              aria-pressed={selected === 'pack'}
            >
              <Image
                src="/pack.png"
                alt="Pack"
                width={280}
                height={385}
                className="object-contain"
              />
            </button>
            <p className="text-gray-600 text-lg font-medium">
              Get a 'Seal' pack with random cards
            </p>
          </div>

          {/* OR Sign */}
          <div className="text-3xl font-semibold text-gray-600">OR</div>

          {/* Set image with text */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelected('set')
                setShowSetModal(true)
              }}
              className={[
                'relative w-[320px] h-[440px] flex items-center justify-center transition-all duration-200',
                selected && selected !== 'set' ? 'opacity-55 grayscale-[20%]' : 'opacity-100',
              ].join(' ')}
              aria-pressed={selected === 'set'}
            >
              <Image
                src="/set.png"
                alt="Set"
                width={320}
                height={440}
                className="object-contain"
              />
            </button>
            <p className="text-gray-600 text-lg font-medium">
              Choose your own set of cards
            </p>
          </div>
        </div>

        <AnimatedButton disabled={!selected} to="/game" />
      </div>

      <ChooseSetModal open={showSetModal} onClose={() => setShowSetModal(false)} />
    </div>
  )
}

