"use client"

import { useState, useEffect } from "react"
import type { Word, Category } from "@/types/index" // Import Category type
import { formatTextWithArabic, type StudyMode, containsArabic, containsNonArabic } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Edit, Plus, Check, X, Eye, Trash2, Tags, AlertTriangle, Star, MessageSquare } from "lucide-react" // Import MessageSquare icon
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu" // Import DropdownMenu components
import { Badge } from "@/components/ui/badge" // Import Badge for displaying categories

interface WordItemProps {
  word: Word
  onStatusChange: (wordId: string, statusIndex: number, checked: boolean) => void
  onTextUpdate: (wordId: string, newText: string) => void
  onTextAppend: (wordId: string, textToAppend: string) => void
  onDelete: (wordId: string) => void
  studyMode: StudyMode
  categories: Category[] // Pass all available categories
  onUpdateWordCategories: (wordId: string, newCategoryIds: string[]) => void // Handler to update word categories
  onAddConfusingWord: (wordId: string, confusingWord: string) => void // Handler to add confusing words
  onRemoveConfusingWord: (wordId: string, confusingWordIndex: number) => void // Handler to remove confusing words
  onToggleImportance: (wordId: string) => void // Handler to toggle importance
  onToggleExpression: (wordId: string) => void // Handler to toggle expression
  onEyeClick: (wordId: string) => void // Handler for eye click tracking
}

export default function WordItem({
  word,
  onStatusChange,
  onTextUpdate,
  onTextAppend,
  onDelete,
  studyMode,
  categories,
  onUpdateWordCategories,
  onAddConfusingWord,
  onRemoveConfusingWord,
  onToggleImportance,
  onToggleExpression,
  onEyeClick,
}: WordItemProps) {
  const checkboxLabels = ["R", "U", "C", "F"] // Recognize, Understand, Recall, Use fluently
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(word.text)
  const [isAppending, setIsAppending] = useState(false)
  const [appendText, setAppendText] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isAddingConfusing, setIsAddingConfusing] = useState(false)
  const [confusingText, setConfusingText] = useState("")

  // Determine if this item has content that can be hidden
  const hasArabic = containsArabic(word.text)
  const hasNonArabic = containsNonArabic(word.text)
  const canBeHidden = (studyMode === "hide-arabic" && hasArabic) || (studyMode === "hide-english" && hasNonArabic)

  // Reset revealed state when study mode changes
  useEffect(() => {
    setIsRevealed(false)
  }, [studyMode])

  const handleSaveEdit = async () => {
    if (editText.trim() === "") return
    setIsUpdating(true)
    await onTextUpdate(word.id, editText.trim())
    setIsUpdating(false)
    setIsEditing(false)
  }

  const handleAppend = async () => {
    if (appendText.trim() === "") return
    setIsUpdating(true)
    await onTextAppend(word.id, appendText.trim())
    setIsUpdating(false)
    setAppendText("")
    setIsAppending(false)
  }

  const handleAddConfusing = async () => {
    if (confusingText.trim() === "") return
    setIsUpdating(true)
    await onAddConfusingWord(word.id, confusingText.trim())
    setIsUpdating(false)
    setConfusingText("")
    setIsAddingConfusing(false)
  }

  const handleCancelEdit = () => {
    setEditText(word.text)
    setIsEditing(false)
  }

  const handleCancelAppend = () => {
    setAppendText("")
    setIsAppending(false)
  }

  const handleCancelConfusing = () => {
    setConfusingText("")
    setIsAddingConfusing(false)
  }

  const toggleReveal = () => {
    const wasRevealed = isRevealed
    setIsRevealed(!isRevealed)
    // Only track eye click when revealing (showing) hidden text
    if (!wasRevealed) {
      onEyeClick(word.id)
    }
  }

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    let newCategoryIds = [...word.categoryIds]
    if (checked) {
      if (!newCategoryIds.includes(categoryId)) {
        newCategoryIds.push(categoryId)
      }
    } else {
      newCategoryIds = newCategoryIds.filter((id) => id !== categoryId)
    }
    onUpdateWordCategories(word.id, newCategoryIds)
  }

  // Determine the color for the Tags icon based on assigned categories
  const tagIconColor =
    word.categoryIds.length > 0
      ? categories.find((cat) => cat.id === word.categoryIds[0])?.color || "currentColor"
      : "currentColor" // Default to current color if no categories or color not found

  // Determine row background color based on importance
  const rowBgColor = word.isImportant
    ? "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100/70 dark:hover:bg-yellow-900/30"
    : "hover:bg-gray-50/70 dark:hover:bg-gray-800/70"

  return (
    <div
      className={`flex flex-col py-2.5 px-4 border-b border-gray-100 dark:border-gray-700 ${rowBgColor} transition-colors`}
    >
      {/* Desktop layout (hidden on mobile) */}
      <div className="hidden md:flex md:flex-1 md:items-center">
        <div className="w-2/3 flex flex-col justify-between">
          <div className="flex-1 mr-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="text-sm h-8 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit()
                    if (e.key === "Escape") handleCancelEdit()
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveEdit}
                  className="h-7 w-7 text-green-600 dark:text-green-500"
                  disabled={isUpdating}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-7 w-7 text-red-500"
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span
                className="text-sm dark:text-gray-200"
                dangerouslySetInnerHTML={{
                  __html: formatTextWithArabic(word.text, studyMode, isRevealed, word.isExpression),
                }}
              />
            )}
            {isAppending && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={appendText}
                  onChange={(e) => setAppendText(e.target.value)}
                  placeholder="Text to append..."
                  className="text-sm h-8 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  autoFocus
                  disabled={isUpdating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAppend()
                    if (e.key === "Escape") handleCancelAppend()
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAppend}
                  className="h-7 w-7 text-green-600 dark:text-green-500"
                  disabled={isUpdating}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancelAppend}
                  className="h-7 w-7 text-red-500"
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {isAddingConfusing && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={confusingText}
                  onChange={(e) => setConfusingText(e.target.value)}
                  placeholder="Add confusing word..."
                  className="text-sm h-8 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  autoFocus
                  disabled={isUpdating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddConfusing()
                    if (e.key === "Escape") handleCancelConfusing()
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddConfusing}
                  className="h-7 w-7 text-green-600 dark:text-green-500"
                  disabled={isUpdating}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancelConfusing}
                  className="h-7 w-7 text-red-500"
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Always visible confusing words */}
          {word.confusingWords && word.confusingWords.length > 0 && (
            <div className="mt-2 mr-2">
              <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Confusing with:</div>
              <div className="flex flex-wrap gap-1">
                {word.confusingWords.map((confusingWord, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded text-xs"
                  >
                    <span>{confusingWord}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveConfusingWord(word.id, index)}
                      className="h-4 w-4 ml-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
                      disabled={isUpdating}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Always visible categories */}
          {word.categoryIds.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {word.categoryIds.map((catId) => {
                const category = categories.find((c) => c.id === catId)
                return category ? (
                  <Badge key={catId} style={{ backgroundColor: category.color, color: "white" }}>
                    {category.name}
                  </Badge>
                ) : null
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {studyMode !== "show-all" && canBeHidden && (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleReveal}
                className={`h-6 w-6 ${
                  isRevealed
                    ? "text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400"
                    : "text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
                title={isRevealed ? "Hide text" : "Reveal text"}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{word.eyeClickCount || 0}</span>
            </div>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onToggleExpression(word.id)}
            className={`h-6 w-6 ${
              word.isExpression
                ? "text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400"
                : "text-gray-400 hover:text-emerald-500 dark:text-gray-500 dark:hover:text-emerald-400"
            }`}
            title={word.isExpression ? "Remove expression mark" : "Mark as expression"}
            disabled={isUpdating}
          >
            <MessageSquare className={`h-3.5 w-3.5 ${word.isExpression ? "fill-current" : ""}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                title="Assign categories"
                disabled={isUpdating}
              >
                <Tags className="h-3.5 w-3.5" style={{ color: tagIconColor }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 dark:bg-gray-800 dark:border-gray-700">
              <DropdownMenuLabel className="dark:text-gray-100">Assign Categories</DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-gray-700" />
              {categories.length === 0 ? (
                <span className="block px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                  No categories available.
                </span>
              ) : (
                categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.id}
                    checked={word.categoryIds.includes(category.id)}
                    onCheckedChange={(checked) => handleCategoryToggle(category.id, checked)}
                    className="dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span style={{ color: category.color }}>{category.name}</span>
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onToggleImportance(word.id)}
            className={`h-6 w-6 ${
              word.isImportant
                ? "text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
                : "text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400"
            }`}
            title={word.isImportant ? "Remove from important" : "Mark as important"}
            disabled={isUpdating}
          >
            <Star className={`h-3.5 w-3.5 ${word.isImportant ? "fill-current" : ""}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsAddingConfusing(true)
              setConfusingText("")
            }}
            className="h-6 w-6 text-gray-400 hover:text-orange-600 dark:text-gray-500 dark:hover:text-orange-400"
            title="Add confusing word"
            disabled={isUpdating}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsEditing(true)
              setEditText(word.text)
            }}
            className="h-6 w-6 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
            title="Edit phrase"
            disabled={isUpdating}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsAppending(true)
              setAppendText("")
            }}
            className="h-6 w-6 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
            title="Append to phrase"
            disabled={isUpdating}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(word.id)}
            className="h-6 w-6 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-500"
            title="Delete phrase"
            disabled={isUpdating}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="w-1/3 flex items-center justify-end">
          <div className="flex items-center space-x-2">
            {checkboxLabels.map((label, index) => (
              <div key={index} className="flex flex-col items-center">
                <button
                  onClick={() => onStatusChange(word.id, index, !word.statuses[index])}
                  className={`h-5 w-5 rounded-full flex items-center justify-center transition-colors ${
                    word.statuses[index] ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"
                  }`}
                  aria-checked={word.statuses[index]}
                  role="checkbox"
                  disabled={isUpdating}
                >
                  {word.statuses[index] && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 text-white"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 block">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile layout (hidden on desktop) */}
      <div className="flex flex-col md:hidden">
        <div className="flex justify-between items-start mt-2">
          <div className="flex-1 mr-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="text-sm h-8 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit()
                    if (e.key === "Escape") handleCancelEdit()
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveEdit}
                  className="h-7 w-7 text-green-600 dark:text-green-500"
                  disabled={isUpdating}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-7 w-7 text-red-500"
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span
                className="text-sm dark:text-gray-200"
                dangerouslySetInnerHTML={{
                  __html: formatTextWithArabic(word.text, studyMode, isRevealed, word.isExpression),
                }}
              />
            )}
            {isAppending && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={appendText}
                  onChange={(e) => setAppendText(e.target.value)}
                  placeholder="Text to append..."
                  className="text-sm h-8 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  autoFocus
                  disabled={isUpdating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAppend()
                    if (e.key === "Escape") handleCancelAppend()
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAppend}
                  className="h-7 w-7 text-green-600 dark:text-green-500"
                  disabled={isUpdating}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancelAppend}
                  className="h-7 w-7 text-red-500"
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {isAddingConfusing && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={confusingText}
                  onChange={(e) => setConfusingText(e.target.value)}
                  placeholder="Add confusing word..."
                  className="text-sm h-8 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  autoFocus
                  disabled={isUpdating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddConfusing()
                    if (e.key === "Escape") handleCancelConfusing()
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddConfusing}
                  className="h-7 w-7 text-green-600 dark:text-green-500"
                  disabled={isUpdating}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancelConfusing}
                  className="h-7 w-7 text-red-500"
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {studyMode !== "show-all" && canBeHidden && (
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleReveal}
                  className={`h-6 w-6 ${
                    isRevealed
                      ? "text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400"
                      : "text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                  }`}
                  title={isRevealed ? "Hide text" : "Reveal text"}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{word.eyeClickCount || 0}</span>
              </div>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onToggleExpression(word.id)}
              className={`h-6 w-6 ${
                word.isExpression
                  ? "text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400"
                  : "text-gray-400 hover:text-emerald-500 dark:text-gray-500 dark:hover:text-emerald-400"
              }`}
              title={word.isExpression ? "Remove expression mark" : "Mark as expression"}
              disabled={isUpdating}
            >
              <MessageSquare className={`h-3.5 w-3.5 ${word.isExpression ? "fill-current" : ""}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                  title="Assign categories"
                  disabled={isUpdating}
                >
                  <Tags className="h-3.5 w-3.5" style={{ color: tagIconColor }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 dark:bg-gray-800 dark:border-gray-700">
                <DropdownMenuLabel className="dark:text-gray-100">Assign Categories</DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-gray-700" />
                {categories.length === 0 ? (
                  <span className="block px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                    No categories available.
                  </span>
                ) : (
                  categories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category.id}
                      checked={word.categoryIds.includes(category.id)}
                      onCheckedChange={(checked) => handleCategoryToggle(category.id, checked)}
                      className="dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <span style={{ color: category.color }}>{category.name}</span>
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onToggleImportance(word.id)}
              className={`h-6 w-6 ${
                word.isImportant
                  ? "text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
                  : "text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400"
              }`}
              title={word.isImportant ? "Remove from important" : "Mark as important"}
              disabled={isUpdating}
            >
              <Star className={`h-3.5 w-3.5 ${word.isImportant ? "fill-current" : ""}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setIsAddingConfusing(true)
                setConfusingText("")
              }}
              className="h-6 w-6 text-gray-400 hover:text-orange-600 dark:text-gray-500 dark:hover:text-orange-400"
              title="Add confusing word"
              disabled={isUpdating}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setIsEditing(true)
                setEditText(word.text)
              }}
              className="h-6 w-6 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
              title="Edit phrase"
              disabled={isUpdating}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setIsAppending(true)
                setAppendText("")
              }}
              className="h-6 w-6 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
              title="Append to phrase"
              disabled={isUpdating}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(word.id)}
              className="h-6 w-6 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-500"
              title="Delete phrase"
              disabled={isUpdating}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex justify-start items-center mt-2 pt-2 pl-2">
          <div className="flex items-center space-x-2">
            {checkboxLabels.map((label, index) => (
              <div key={index} className="flex flex-col items-center">
                <button
                  onClick={() => onStatusChange(word.id, index, !word.statuses[index])}
                  className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                    word.statuses[index] ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"
                  }`}
                  aria-checked={word.statuses[index]}
                  role="checkbox"
                  disabled={isUpdating}
                >
                  {word.statuses[index] && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 text-white"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 hidden md:inline">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Always visible confusing words for mobile */}
        {word.confusingWords && word.confusingWords.length > 0 && (
          <div className="mt-2 md:hidden">
            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Confusing with:</div>
            <div className="flex flex-wrap gap-1">
              {word.confusingWords.map((confusingWord, index) => (
                <div
                  key={index}
                  className="flex items-center bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded text-xs"
                >
                  <span>{confusingWord}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemoveConfusingWord(word.id, index)}
                    className="h-4 w-4 ml-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
                    disabled={isUpdating}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Always visible categories for mobile */}
        {word.categoryIds.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 md:hidden">
            {word.categoryIds.map((catId) => {
              const category = categories.find((c) => c.id === catId)
              return category ? (
                <Badge key={catId} style={{ backgroundColor: category.color, color: "white" }}>
                  {category.name}
                </Badge>
              ) : null
            })}
          </div>
        )}
      </div>
    </div>
  )
}
