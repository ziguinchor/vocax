"use client"

import type { Word, Category } from "@/types/index"
import type { StudyMode } from "@/lib/utils"
import WordItem from "./word-item"

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
  if (words.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No words found. Add some words to get started!</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {words.map((word) => (
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
  )
}
