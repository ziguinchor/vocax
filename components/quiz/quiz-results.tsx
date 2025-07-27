"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Word } from "@/types/index"
import type { QuizType } from "@/components/quiz/quiz-container"
import { Check, X, RotateCcw, Home } from "lucide-react"

interface QuizAnswer {
  wordId: string
  correct: boolean
  userAnswer?: string
  correctAnswer: string
}

interface QuizResultsProps {
  answers: QuizAnswer[]
  quizWords: Word[]
  quizType: QuizType
  onRestartQuiz: () => void
  onClose: () => void
}

export default function QuizResults({ answers, quizWords, quizType, onRestartQuiz, onClose }: QuizResultsProps) {
  const correctAnswers = answers.filter((answer) => answer.correct)
  const score = Math.round((correctAnswers.length / answers.length) * 100) || 0

  const getScoreMessage = (score: number): { message: string; color: string } => {
    if (score >= 90) return { message: "Excellent! You're mastering these words.", color: "text-green-600" }
    if (score >= 70) return { message: "Great job! Keep practicing.", color: "text-emerald-600" }
    if (score >= 50) return { message: "Good effort! More practice will help.", color: "text-blue-600" }
    return { message: "Keep studying! You'll improve with practice.", color: "text-amber-600" }
  }

  const scoreMessage = getScoreMessage(score)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{score}%</div>
            <div className={`text-lg font-medium ${scoreMessage.color}`}>{scoreMessage.message}</div>
            <div className="text-sm text-gray-500 mt-1">
              {correctAnswers.length} correct out of {answers.length} questions
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Score</span>
              <span className="text-sm font-medium">{score}%</span>
            </div>
            <Progress
              value={score}
              className="h-2"
              indicatorClassName={score >= 70 ? "bg-green-500" : score >= 50 ? "bg-blue-500" : "bg-amber-500"}
            />
          </div>

          <div className="space-y-4 mt-6">
            <h3 className="text-sm font-medium">Question Review</h3>
            {answers.map((answer, index) => {
              const word = quizWords.find((w) => w.id === answer.wordId)
              if (!word) return null

              return (
                <div
                  key={index}
                  className={`p-3 rounded-md border ${
                    answer.correct ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">Question {index + 1}</div>
                      <div className="text-sm">{word.text}</div>
                    </div>
                    <div className="ml-4">
                      {answer.correct ? (
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                          <X className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  {!answer.correct && (
                    <div className="mt-2 text-sm">
                      <div className="font-medium">Correct answer:</div>
                      <div className="mt-1">{answer.correctAnswer}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
          <Button onClick={onRestartQuiz} className="flex items-center gap-1">
            <RotateCcw className="h-4 w-4" />
            New Quiz
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
