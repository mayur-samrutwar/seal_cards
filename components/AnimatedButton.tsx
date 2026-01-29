'use client'

import { useRouter } from 'next/navigation'

export default function AnimatedButton() {
  const router = useRouter()

  const characters = ['P', 'L', 'A', 'Y', ' ', 'P', 'L', 'A', 'Y', ' ', 'P', 'L', 'A', 'Y', ' ', 'P', 'L', 'A', 'Y', ' ']
  const totalChars = characters.length
  const anglePerChar = 360 / totalChars

  return (
    <button
      type="button"
      onClick={() => router.push('/game')}
      className="group cursor-pointer border-none bg-[#7808d0] text-white w-[120px] h-[120px] rounded-full overflow-hidden relative grid place-content-center transition-[background,transform] duration-300 font-semibold hover:bg-black hover:scale-105"
    >
      <p className="absolute inset-0 animate-[text-rotation_8s_linear_infinite]">
        {characters.map((char, index) => (
          <span
            key={index}
            className="absolute"
            style={{
              transform: `rotate(calc(${anglePerChar}deg * ${index}))`,
              inset: '4px',
            }}
          >
            {char}
          </span>
        ))}
      </p>

      <div className="relative w-14 h-14 overflow-hidden bg-white text-[#7808d0] rounded-full flex items-center justify-center group-hover:text-black">
        <svg
          viewBox="0 0 14 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[14px] transition-transform duration-300 ease-in-out group-hover:translate-x-[200%] group-hover:-translate-y-[200%]"
          width="14"
        >
          <path
            d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
            fill="currentColor"
          />
        </svg>

        <svg
          viewBox="0 0 14 15"
          fill="none"
          width="14"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute w-[14px] transition-transform duration-300 ease-in-out delay-100 translate-x-[-200%] translate-y-[200%] group-hover:translate-x-0 group-hover:translate-y-0"
        >
          <path
            d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
            fill="currentColor"
          />
        </svg>
      </div>
    </button>
  )
}
