"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { containsArabic } from "@/lib/utils"
import type { Word } from "@/types/index"
import QuizQuestion from "@/components/quiz/quiz-question"
import QuizResults from "@/components/quiz/quiz-results"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react"

export type QuizType = "arabic-to-english" | "english-to-arabic" | "mixed"
export type QuizMode = "flashcard" | "multiple-choice"

interface QuizContainerProps {
  words: Word[]
  onClose: () => void
}

interface QuizAnswer {
  wordId: string
  correct: boolean
  userAnswer?: string
  correctAnswer: string
}

export default function QuizContainer({ words, onClose }: QuizContainerProps) {
  const [quizType, setQuizType] = useState<QuizType>("mixed")
  const [quizMode, setQuizMode] = useState<QuizMode>("flashcard")
  const [quizWords, setQuizWords] = useState<Word[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [showAnswer, setShowAnswer] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [quizSize, setQuizSize] = useState(10)

  // Prepare quiz words when quiz type changes or when starting a new quiz
  useEffect(() => {
    if (!quizStarted) return

    // Filter words based on quiz type
    let eligibleWords: Word[] = []

    if (quizType === "arabic-to-english") {
      eligibleWords = words.filter((word) => containsArabic(word.text))
    } else if (quizType === "english-to-arabic") {
      eligibleWords = words.filter((word) => containsArabic(word.text))
    } else {
      // Mixed mode - all words with Arabic are eligible
      eligibleWords = words.filter((word) => containsArabic(word.text))
    }

    // Prioritize words with lower mastery levels
    const sortedWords = [...eligibleWords].sort((a, b) => {
      const aChecked = a.statuses.filter(Boolean).length
      const bChecked = b.statuses.filter(Boolean).length
      return aChecked - bChecked
    })

    // Select quiz words
    const selectedWords = sortedWords.slice(0, Math.min(quizSize, sortedWords.length))

    // Shuffle the selected words
    const shuffledWords = [...selectedWords].sort(() => Math.random() - 0.5)
    setQuizWords(shuffledWords)
    setAnswers([])
    setCurrentQuestionIndex(0)
    setShowAnswer(false)
    setQuizFinished(false)
  }, [quizStarted, quizType, words, quizSize])

  const handleStartQuiz = () => {
    setQuizStarted(true)
  }

  const handleAnswer = (isCorrect: boolean, userAnswer?: string) => {
    if (currentQuestionIndex >= quizWords.length) return

    const currentWord = quizWords[currentQuestionIndex]
    const correctAnswer =
      quizType === "arabic-to-english"
        ? extractEnglishText(currentWord.text)
        : quizType === "english-to-arabic"
          ? extractArabicText(currentWord.text)
          : currentQuestionIndex % 2 === 0
            ? extractEnglishText(currentWord.text)
            : extractArabicText(currentWord.text)

    const newAnswer: QuizAnswer = {
      wordId: currentWord.id,
      correct: isCorrect,
      userAnswer,
      correctAnswer,
    }

    setAnswers([...answers, newAnswer])
    setShowAnswer(true)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizWords.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setShowAnswer(false)
    } else {
      setQuizFinished(true)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setAnswers(answers.slice(0, -1))
      setShowAnswer(false)
    }
  }

  const handleRestartQuiz = () => {
    setQuizStarted(false)
    setQuizFinished(false)
    setAnswers([])
    setCurrentQuestionIndex(0)
    setShowAnswer(false)
  }

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

  // Quiz setup screen
  if (!quizStarted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Quiz Type</h3>
              <Tabs defaultValue={quizType} onValueChange={(value) => setQuizType(value as QuizType)}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="arabic-to-english">Arabic → English</TabsTrigger>
                  <TabsTrigger value="english-to-arabic">English → Arabic</TabsTrigger>
                  <TabsTrigger value="mixed">Mixed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Quiz Mode</h3>
              <Tabs defaultValue={quizMode} onValueChange={(value) => setQuizMode(value as QuizMode)}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="flashcard">Flashcards</TabsTrigger>
                  <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Number of Questions</h3>
              <Tabs defaultValue={quizSize.toString()} onValueChange={(value) => setQuizSize(Number.parseInt(value))}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="5">5</TabsTrigger>
                  <TabsTrigger value="10">10</TabsTrigger>
                  <TabsTrigger value="20">20</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-md p-3 text-sm">
              <p className="font-medium text-amber-800">Quiz Focus</p>
              <p className="text-amber-700 mt-1">
                The quiz will prioritize words you haven't mastered yet, focusing on those with fewer checked boxes.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleStartQuiz}>Start Quiz</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Quiz results screen
  if (quizFinished) {
    return (
      <QuizResults
        answers={answers}
        quizWords={quizWords}
        quizType={quizType}
        onRestartQuiz={handleRestartQuiz}
        onClose={onClose}
      />
    )
  }

  // Active quiz screen
  const currentWord = quizWords[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quizWords.length) * 100

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">
          Question {currentQuestionIndex + 1} of {quizWords.length}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
          <Progress value={progress} className="w-[100px] h-2" />
        </div>
      </div>

      {currentWord && (
        <QuizQuestion
          word={currentWord}
          quizType={quizType}
          quizMode={quizMode}
          showAnswer={showAnswer}
          onAnswer={handleAnswer}
          questionIndex={currentQuestionIndex}
          otherWords={quizWords.filter((w) => w.id !== currentWord.id)}
        />
      )}

      <div className="flex justify-between mt-4">
        <Button
          variant="outline"
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        {showAnswer ? (
          <Button onClick={handleNextQuestion} className="flex items-center gap-1">
            {currentQuestionIndex < quizWords.length - 1 ? (
              <>
                Next <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              "Finish Quiz"
            )}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
              onClick={() => handleAnswer(false)}
            >
              <X className="h-4 w-4 mr-1" /> I don't know
            </Button>
            <Button
              variant="outline"
              className="bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700"
              onClick={() => handleAnswer(true)}
            >
              <Check className="h-4 w-4 mr-1" /> I know this
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
