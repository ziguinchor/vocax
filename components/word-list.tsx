"use client"

import type { Word, Category } from "@/types/index"
import type { StudyMode } from "@/lib/utils"
import WordItem from "./word-item"
import { useState } from "react"

interface WordListProps {
  words: Word[]
  onStatusChange: (wordId: string, statusIndex: number, checked: boolean) => void
  onTextUpdate: (wordId: string, newText: string) => void
  onTextAppend: (wordId: string, textToAppend: string) => void
  onDelete: (wordId: string) => void
  currentPage: number
  studyMode: StudyMode
  categories: Category[]
  onUpdateWordCategories: (wordId: string, newCategoryIds: string[]) => void
  onAddConfusingWord: (wordId: string, confusingWord: string) => void
  onRemoveConfusingWord: (wordId: string, confusingWordIndex: number) => void
  onToggleImportance: (wordId: string) => void
  onToggleExpression: (wordId: string) => void
  onEyeClick: (wordId: string) => void
}

function highlightArabic(text: string) {
  // Regex for Arabic Unicode range
  return text.replace(/([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+)/g, '<span style="color:#12b981;">$1</span>')
}

export default function WordList({
  words,
  onStatusChange,
  onTextUpdate,
  onTextAppend,
  onDelete,
  currentPage,
  studyMode,
  categories,
  onUpdateWordCategories,
  onAddConfusingWord,
  onRemoveConfusingWord,
  onToggleImportance,
  onToggleExpression,
  onEyeClick,
}: WordListProps) {
  const [showDuplicates, setShowDuplicates] = useState(false)

  // Find duplicated phrases by normalized text
  const duplicates = words.reduce<{ [normText: string]: Word[] }>((acc, word) => {
    const normText = word.text.trim().toLowerCase()
    acc[normText] = acc[normText] ? [...acc[normText], word] : [word]
    return acc
  }, {})

  // Only keep groups with more than one word
  const duplicateGroups = Object.entries(duplicates)
    .filter(([_, arr]) => arr.length > 1)

  if (showDuplicates) {
    if (duplicateGroups.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No duplicated phrases found.
          </p>
        </div>
      )
    }
    return (
      <div>
        <div className="flex justify-end p-2">
          <button
            className="px-3 py-1 rounded text-sm font-medium border bg-green-100 text-green-700 border-green-300"
            onClick={() => setShowDuplicates(false)}
          >
            Show All Phrases
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {duplicateGroups.map(([normText, group]) => (
            <div key={normText} className="border-b border-gray-200 dark:border-gray-700 px-4 py-2">
              <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {group[0].text}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.map(word => (
                  <WordItem
                    key={word.id}
                    word={word}
                    onStatusChange={onStatusChange}
                    onTextUpdate={onTextUpdate}
                    onTextAppend={onTextAppend}
                    onDelete={onDelete}
                    studyMode={studyMode}
                    categories={categories}
                    onUpdateWordCategories={onUpdateWordCategories}
                    onAddConfusingWord={onAddConfusingWord}
                    onRemoveConfusingWord={onRemoveConfusingWord}
                    onToggleImportance={onToggleImportance}
                    onToggleExpression={onToggleExpression}
                    onEyeClick={onEyeClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const displayWords = showDuplicates ? duplicatedWords : words

  if (displayWords.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          {showDuplicates ? "No duplicated phrases found." : "No words found. Add some words to get started!"}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end p-2">
        <button
          className={`px-3 py-1 rounded text-sm font-medium border ${showDuplicates ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-700 border-gray-300"}`}
          onClick={() => setShowDuplicates((prev) => !prev)}
        >
          {showDuplicates ? "Show All Phrases" : "Show Only Duplicated Phrases"}
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {displayWords.map((word) => (
          <WordItem
            key={word.id}
            word={word}
            onStatusChange={onStatusChange}
            onTextUpdate={onTextUpdate}
            onTextAppend={onTextAppend}
            onDelete={onDelete}
            studyMode={studyMode}
            categories={categories}
            onUpdateWordCategories={onUpdateWordCategories}
            onAddConfusingWord={onAddConfusingWord}
            onRemoveConfusingWord={onRemoveConfusingWord}
            onToggleImportance={onToggleImportance}
            onToggleExpression={onToggleExpression}
            onEyeClick={onEyeClick}
          />
        ))}
      </div>
    </div>
  )
}

// Example usage in render:
// <span
//   dangerouslySetInnerHTML={{
//     __html: highlightArabic(word.text),
//   }}
//   style={isBlurred ? { filter: "blur(4px)" } : {}}
// />
