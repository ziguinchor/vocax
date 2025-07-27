"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import type { Word } from "@/types/index"
import type { QuizType, QuizMode } from "@/components/quiz/quiz-container"
import { Check, X } from "lucide-react"

interface QuizQuestionProps {
  word: Word
  quizType: QuizType
  quizMode: QuizMode
  showAnswer: boolean
  onAnswer: (isCorrect: boolean, userAnswer?: string) => void
  questionIndex: number
  otherWords: Word[]
}

export default function QuizQuestion({
  word,
  quizType,
  quizMode,
  showAnswer,
  onAnswer,
  questionIndex,
  otherWords,
}: QuizQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [flipped, setFlipped] = useState(false)

  // Determine the question and answer based on quiz type
  const actualQuizType =
    quizType === "mixed" ? (questionIndex % 2 === 0 ? "arabic-to-english" : "english-to-arabic") : quizType

  const extractArabicText = (text: string): string => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g
    const matches = text.match(arabicRegex)
    return matches ? matches.join(" ") : ""
  }

  const extractEnglishText = (text: string): string => {
    // Replace Arabic text with empty string to get English text
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g
    return text.replace(arabicRegex, "").trim()
  }

  const questionText =
    actualQuizType === "arabic-to-english" ? extractArabicText(word.text) : extractEnglishText(word.text)

  const answerText =
    actualQuizType === "arabic-to-english" ? extractEnglishText(word.text) : extractArabicText(word.text)

  // Generate multiple choice options
  useEffect(() => {
    if (quizMode === "multiple-choice") {
      // Get the correct answer
      const correctAnswer = answerText

      // Get 3 random incorrect options from other words
      const shuffledWords = [...otherWords].sort(() => Math.random() - 0.5)
      const incorrectOptions = shuffledWords
        .slice(0, 3)
        .map((w) => (actualQuizType === "arabic-to-english" ? extractEnglishText(w.text) : extractArabicText(w.text)))
        .filter((text) => text !== correctAnswer && text.trim() !== "")

      // Combine correct answer with incorrect options and shuffle
      const allOptions = [correctAnswer, ...incorrectOptions.slice(0, 3)]
      setOptions(allOptions.sort(() => Math.random() - 0.5))
    }
  }, [word, quizMode, actualQuizType, otherWords, answerText])

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option)
    const isCorrect = option === answerText
    onAnswer(isCorrect, option)
  }

  const handleFlipCard = () => {
    if (quizMode === "flashcard" && !showAnswer) {
      setFlipped(!flipped)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="text-sm text-gray-500 mb-1">
          {actualQuizType === "arabic-to-english" ? "Arabic → English" : "English → Arabic"}
        </div>
      </CardHeader>
      <CardContent>
        {quizMode === "flashcard" ? (
          <div
            className={`relative w-full aspect-[3/2] cursor-pointer ${
              flipped ? "bg-gray-50" : "bg-white"
            } rounded-lg border flex items-center justify-center transition-all duration-300`}
            onClick={handleFlipCard}
            style={{
              perspective: "1000px",
            }}
          >
            <div
              className={`absolute w-full h-full flex items-center justify-center p-6 backface-hidden transition-transform duration-500 ${
                flipped ? "rotate-y-180 opacity-0" : "rotate-y-0 opacity-100"
              }`}
            >
              <div
                className={`text-xl font-medium text-center ${
                  actualQuizType === "arabic-to-english" ? "font-arabic text-emerald-600" : ""
                }`}
              >
                {questionText}
              </div>
            </div>
            <div
              className={`absolute w-full h-full flex items-center justify-center p-6 backface-hidden transition-transform duration-500 ${
                flipped ? "rotate-y-0 opacity-100" : "rotate-y-180 opacity-0"
              }`}
            >
              <div
                className={`text-xl font-medium text-center ${
                  actualQuizType === "english-to-arabic" ? "font-arabic text-emerald-600" : ""
                }`}
              >
                {answerText}
              </div>
            </div>
            {!showAnswer && <div className="absolute bottom-2 text-xs text-gray-400">Click to flip card</div>}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div
                className={`text-xl font-medium ${
                  actualQuizType === "arabic-to-english" ? "font-arabic text-emerald-600" : ""
                }`}
              >
                {questionText}
              </div>
            </div>

            <div className="space-y-2">
              {options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`w-full justify-start h-auto py-3 px-4 text-left ${
                    actualQuizType === "english-to-arabic" ? "font-arabic" : ""
                  } ${
                    showAnswer && option === answerText
                      ? "border-green-500 bg-green-50 text-green-700"
                      : showAnswer && option === selectedOption && option !== answerText
                        ? "border-red-500 bg-red-50 text-red-700"
                        : option === selectedOption
                          ? "border-blue-500 bg-blue-50"
                          : ""
                  }`}
                  onClick={() => !showAnswer && handleOptionSelect(option)}
                  disabled={showAnswer}
                >
                  <div className="flex items-center w-full">
                    <span className="flex-1">{option}</span>
                    {showAnswer && option === answerText && <Check className="h-5 w-5 text-green-600 ml-2" />}
                    {showAnswer && option === selectedOption && option !== answerText && (
                      <X className="h-5 w-5 text-red-600 ml-2" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        {showAnswer && (
          <div className="w-full">
            <div className="text-sm font-medium mb-1">Correct Answer:</div>
            <div
              className={`p-3 bg-green-50 border border-green-100 rounded-md ${
                actualQuizType === "english-to-arabic" ? "font-arabic text-emerald-600" : ""
              }`}
            >
              {answerText}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
