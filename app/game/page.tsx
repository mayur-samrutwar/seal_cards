'use client'

import Image from 'next/image'
import AnimatedButton from '@/components/AnimatedButton'

export default function GamePage() {
  return (
    <div
      className="w-full h-screen bg-white flex items-center justify-center"
      style={{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="flex flex-col items-center gap-10 -translate-y-10">
        <div className="flex items-center gap-8">
          {/* Pack image with text */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-[320px] h-[440px] flex items-center justify-center">
              <Image
                src="/pack.png"
                alt="Pack"
                width={280}
                height={385}
                className="object-contain"
              />
            </div>
            <p className="text-gray-600 text-lg font-medium">
              Get a seal pack with random cards
            </p>
          </div>

          {/* OR Sign */}
          <div className="text-3xl font-semibold text-gray-600">OR</div>

          {/* Set image with text */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-[320px] h-[440px] flex items-center justify-center">
              <Image
                src="/set.png"
                alt="Set"
                width={320}
                height={440}
                className="object-contain"
              />
            </div>
            <p className="text-gray-600 text-lg font-medium">
              Choose your own set of cards
            </p>
          </div>
        </div>

        <AnimatedButton />
      </div>
    </div>
  )
}

