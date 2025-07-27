"use client"

import { useState } from "react"
import type { Word } from "@/types/index"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { containsArabic } from "@/lib/utils"

interface StatisticsDashboardProps {
  words: Word[]
}

export default function StatisticsDashboard({ words }: StatisticsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Calculate overall statistics
  const totalWords = words.length
  const wordsWithArabic = words.filter((word) => containsArabic(word.text)).length

  // Calculate progress for each status
  const statusLabels = ["Recognize", "Understand", "Recall", "Use Fluently"]
  const statusCounts = [0, 0, 0, 0]

  words.forEach((word) => {
    word.statuses.forEach((status, index) => {
      if (status) statusCounts[index]++
    })
  })

  const statusPercentages = statusCounts.map((count) => (totalWords > 0 ? Math.round((count / totalWords) * 100) : 0))

  // Calculate overall progress
  const totalCheckboxes = totalWords * 4
  const checkedCheckboxes = statusCounts.reduce((sum, count) => sum + count, 0)
  const overallProgressPercentage = totalCheckboxes > 0 ? Math.round((checkedCheckboxes / totalCheckboxes) * 100) : 0

  // Calculate mastery levels
  const masteryLevels = [
    { name: "Not Started", count: 0, color: "bg-gray-200" },
    { name: "Beginner", count: 0, color: "bg-red-200" },
    { name: "Intermediate", count: 0, color: "bg-yellow-200" },
    { name: "Advanced", count: 0, color: "bg-blue-200" },
    { name: "Mastered", count: 0, color: "bg-green-200" },
  ]

  words.forEach((word) => {
    const checkedCount = word.statuses.filter(Boolean).length

    if (checkedCount === 0) masteryLevels[0].count++
    else if (checkedCount === 1) masteryLevels[1].count++
    else if (checkedCount === 2) masteryLevels[2].count++
    else if (checkedCount === 3) masteryLevels[3].count++
    else if (checkedCount === 4) masteryLevels[4].count++
  })

  const masteryPercentages = masteryLevels.map((level) =>
    totalWords > 0 ? Math.round((level.count / totalWords) * 100) : 0,
  )

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>Your overall learning progress across all words and skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-medium">{overallProgressPercentage}%</span>
                </div>
                <Progress value={overallProgressPercentage} className="h-2" />

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white rounded-md p-4 border">
                    <div className="text-2xl font-bold dark:text">{totalWords}</div>
                    <div className="text-sm text-gray-500">Total Words</div>
                  </div>
                  <div className="bg-white rounded-md p-4 border">
                    <div className="text-2xl font-bold">{wordsWithArabic}</div>
                    <div className="text-sm text-gray-500">Words with Arabic</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Mastery Levels</CardTitle>
              <CardDescription>Distribution of words by mastery level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {masteryLevels.map((level, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                        <span className="text-sm font-medium">{level.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{level.count} words</span>
                        <Badge variant="outline">{masteryPercentages[index]}%</Badge>
                      </div>
                    </div>
                    <Progress value={masteryPercentages[index]} className={`h-2 ${level.color}`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Skill Breakdown</CardTitle>
              <CardDescription>Your progress for each learning skill</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusLabels.map((label, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{statusCounts[index]} words</span>
                        <Badge variant="outline">{statusPercentages[index]}%</Badge>
                      </div>
                    </div>
                    <Progress value={statusPercentages[index]} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Learning Tips</CardTitle>
              <CardDescription>Suggestions based on your current progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {statusPercentages[0] < 50 && (
                  <p className="p-2 bg-amber-50 border border-amber-100 rounded-md">
                    Focus on recognizing more words. Try using the "Hide Arabic" study mode to practice recognition.
                  </p>
                )}

                {statusPercentages[0] >= 50 && statusPercentages[1] < 40 && (
                  <p className="p-2 bg-amber-50 border border-amber-100 rounded-md">
                    You're good at recognizing words! Now focus on understanding their meaning in context.
                  </p>
                )}

                {statusPercentages[1] >= 40 && statusPercentages[2] < 30 && (
                  <p className="p-2 bg-amber-50 border border-amber-100 rounded-md">
                    Try using the "Hide English" study mode to practice recalling the Arabic words from memory.
                  </p>
                )}

                {statusPercentages[2] >= 30 && statusPercentages[3] < 20 && (
                  <p className="p-2 bg-amber-50 border border-amber-100 rounded-md">
                    Practice using these words in sentences to improve your fluency.
                  </p>
                )}

                {masteryLevels[4].count > 0 && (
                  <p className="p-2 bg-green-50 border border-green-100 rounded-md">
                    Congratulations! You've mastered {masteryLevels[4].count} words. Keep up the good work!
                  </p>
                )}

                {overallProgressPercentage < 10 && (
                  <p className="p-2 bg-blue-50 border border-blue-100 rounded-md">
                    You're just getting started. Focus on a few words at a time and practice regularly.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
