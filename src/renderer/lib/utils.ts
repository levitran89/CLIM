import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Lưới 2 cột có đường kẻ dọc ở giữa */
export const twoColumnListClass =
  'relative grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 sm:before:pointer-events-none sm:before:content-[""] sm:before:absolute sm:before:left-1/2 sm:before:inset-y-0 sm:before:w-px sm:before:-translate-x-1/2 sm:before:bg-zinc-700/70'
