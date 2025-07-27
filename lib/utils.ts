import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type StudyMode = "show-all" | "hide-english" | "hide-arabic"

export function containsArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
  return arabicRegex.test(text)
}

export function containsNonArabic(text: string): boolean {
  // Check if text contains non-Arabic characters (excluding common punctuation and numbers)
  const nonArabicRegex = /[a-zA-Z]/
  return nonArabicRegex.test(text)
}

export function formatTextWithArabic(
  text: string,
  studyMode: StudyMode,
  isRevealed: boolean,
  isExpression = false,
): string {
  // If it's an expression, always show it fully regardless of study mode
  if (isExpression) {
    return `<span style="color: #10b981; font-weight: 500;">${text}</span>`
  }

  if (studyMode === "show-all") {
    return text
  }

  const parts = text.split(/(\s+)/)

  return parts
    .map((part) => {
      if (!part.trim()) return part // Keep whitespace as is

      const hasArabic = containsArabic(part)
      const hasNonArabic = containsNonArabic(part)

      let shouldHide = false

      if (studyMode === "hide-arabic" && hasArabic) {
        shouldHide = true
      } else if (studyMode === "hide-english" && hasNonArabic) {
        shouldHide = true
      }

      if (shouldHide && !isRevealed) {
        return `<span style="filter: blur(4px);">${part}</span>`
      }

      return part
    })
    .join("")
}
