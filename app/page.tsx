"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  FileDown,
  FileUp,
  Shuffle,
  Plus,
  Eye,
  EyeOff,
  BarChart,
  BookOpen,
  Tags,
  Filter,
  Languages,
  ShuffleIcon,
  Star,
  ArrowUpDown,
} from "lucide-react"
import WordList from "@/components/word-list"
import StatisticsDashboard from "@/components/statistics-dashboard"
import QuizContainer from "@/components/quiz/quiz-container"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Word, Category } from "@/types/index"
import type { StudyMode } from "@/lib/utils"
import { containsArabic } from "@/lib/utils"
import { Pagination } from "@/components/pagination"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getWords,
  updateWordStatus,
  updateWordText,
  appendWordText,
  addWord,
  importWords,
  deleteWord,
  getCategories,
  updateWordCategories,
  addConfusingWord,
  removeConfusingWord,
  toggleWordImportance,
  toggleWordExpression,
  incrementEyeClickCount,
} from "./actions/word-actions"
import { useRouter } from "next/navigation"
import ManageCategoriesDialog from "@/components/manage-categories-dialog"

export default function Home() {
  const [words, setWords] = useState<Word[]>([])
  const [filteredWords, setFilteredWords] = useState<Word[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isPagesShuffled, setIsPagesShuffled] = useState(false)
  const [shuffledPageOrder, setShuffledPageOrder] = useState<number[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false)
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false)
  const [isManageCategoriesDialogOpen, setIsManageCategoriesDialogOpen] = useState(false)
  const [newWordText, setNewWordText] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [studyMode, setStudyMode] = useState<StudyMode>("show-all")
  const [showArabicOnly, setShowArabicOnly] = useState(false)
  const [showImportantOnly, setShowImportantOnly] = useState(false)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all")
  const [isSortedByEyeClicks, setIsSortedByEyeClicks] = useState(false)
  const isStatusChangeRef = useRef(false)
  const isTextUpdateRef = useRef(false)
  const isEyeClickRef = useRef(false)
  const isDeleteRef = useRef(false)
  const { toast } = useToast()
  const itemsPerPage = 15
  const [wordToDelete, setWordToDelete] = useState<string | null>(null)
  const [wordsLearnedTodayCount, setWordsLearnedTodayCount] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const router = useRouter()

  // Load words and categories from the server
  useEffect(() => {
    async function loadData() {
      try {
        const [loadedWords, loadedCategories] = await Promise.all([getWords(), getCategories()])
        setWords(loadedWords)
        setCategories(loadedCategories)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try refreshing the page.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Filter words based on search term, Arabic filter, and category filter
  useEffect(() => {
    let filtered = words

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((word) => word.text.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Apply Arabic-only filter
    if (showArabicOnly) {
      filtered = filtered.filter((word) => containsArabic(word.text))
    }

    // Apply category filter
    if (selectedCategoryFilter !== "all") {
      filtered = filtered.filter((word) => word.categoryIds && word.categoryIds.includes(selectedCategoryFilter))
    }

    // Apply important filter
    if (showImportantOnly) {
      filtered = filtered.filter((word) => word.isImportant)
    }

    // Apply eye click sorting
    if (isSortedByEyeClicks) {
      filtered = [...filtered].sort((a, b) => (b.eyeClickCount || 0) - (a.eyeClickCount || 0))
    }

    setFilteredWords(filtered)

    // Only reset page if not a status/text/eye/delete update
    if (
      !isStatusChangeRef.current &&
      !isTextUpdateRef.current &&
      !isEyeClickRef.current &&
      !isDeleteRef.current
    ) {
      setCurrentPage(1)
      setIsPagesShuffled(false)
      setShuffledPageOrder([])
    }

    // Reset all flags
    isStatusChangeRef.current = false
    isTextUpdateRef.current = false
    isEyeClickRef.current = false
    isDeleteRef.current = false
  }, [searchTerm, words, showArabicOnly, selectedCategoryFilter, showImportantOnly, isSortedByEyeClicks])

  const handleStatusChange = async (wordId: string, statusIndex: number, checked: boolean) => {
    // Set the flag to indicate this update is from a status change
    isStatusChangeRef.current = true

    // Optimistically update the UI
    const updatedWords = words.map((word) => {
      if (word.id === wordId) {
        const newStatuses = [...word.statuses]
        newStatuses[statusIndex] = checked
        return { ...word, statuses: newStatuses }
      }
      return word
    })
    setWords(updatedWords)

    // Update words learned today count if 'F' (Fluently) status is checked
    if (statusIndex === 3 && checked) {
      setWordsLearnedTodayCount((prevCount) => prevCount + 1)
    } else if (statusIndex === 3 && !checked) {
      setWordsLearnedTodayCount((prevCount) => Math.max(0, prevCount - 1))
    }

    // Save to localStorage via action
    try {
      const result = await updateWordStatus(wordId, statusIndex, checked)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating word status:", error)
      toast({
        title: "Error",
        description: "Failed to update word status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEyeClick = async (wordId: string) => {
    isEyeClickRef.current = true // Add this line

    // Optimistically update the UI
    const updatedWords = words.map((word) =>
      word.id === wordId ? { ...word, eyeClickCount: (word.eyeClickCount || 0) + 1 } : word,
    )
    setWords(updatedWords)

    // Save to localStorage via action
    try {
      const result = await incrementEyeClickCount(wordId)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating eye click count:", error)
      toast({
        title: "Error",
        description: "Failed to update eye click count. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleExpression = async (wordId: string) => {
    setIsSaving(true)
    isTextUpdateRef.current = true

    // Optimistically update the UI
    const updatedWords = words.map((word) =>
      word.id === wordId ? { ...word, isExpression: !word.isExpression } : word,
    )
    setWords(updatedWords)

    try {
      const result = await toggleWordExpression(wordId)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        // Revert if error (re-fetch from localStorage)
        const originalWords = await getWords()
        setWords(originalWords)
      } else {
        toast({
          title: "Success",
          description: "Word expression status updated.",
        })
      }
    } catch (error) {
      console.error("Error updating word expression status:", error)
      toast({
        title: "Error",
        description: "Failed to update word expression status. Please try again.",
        variant: "destructive",
      })
      // Revert if error (re-fetch from localStorage)
      const originalWords = await getWords()
      setWords(originalWords)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTextUpdate = async (wordId: string, newText: string) => {
    if (isSaving) return
    setIsSaving(true)
    isTextUpdateRef.current = true

    // Optimistically update the UI
    const updatedWords = words.map((word) => {
      if (word.id === wordId) {
        return { ...word, text: newText }
      }
      return word
    })
    setWords(updatedWords)

    // Save to localStorage via action
    try {
      const result = await updateWordText(wordId, newText)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating word text:", error)
      toast({
        title: "Error",
        description: "Failed to update word text. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTextAppend = async (wordId: string, textToAppend: string) => {
    if (isSaving) return
    setIsSaving(true)
    isTextUpdateRef.current = true

    // Optimistically update the UI
    const updatedWords = words.map((word) => {
      if (word.id === wordId) {
        return { ...word, text: `${word.text} -- ${textToAppend}` }
      }
      return word
    })
    setWords(updatedWords)

    // Save to localStorage via action
    try {
      const result = await appendWordText(wordId, textToAppend)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error appending word text:", error)
      toast({
        title: "Error",
        description: "Failed to append word text. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddNewWord = async () => {
    if (newWordText.trim() === "" || isSaving) return
    setIsSaving(true)

    try {
      const result = await addWord(newWordText.trim())

      if (result.success && result.word) {
        setWords([...words, result.word])
        setNewWordText("")
        setIsAddDialogOpen(false)
        toast({
          title: "Success",
          description: "New word added successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding new word:", error)
      toast({
        title: "Error",
        description: "Failed to add new word. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateWordCategories = async (wordId: string, newCategoryIds: string[]) => {
    setIsSaving(true)
    isTextUpdateRef.current = true

    // Optimistically update the UI
    const updatedWords = words.map((word) => (word.id === wordId ? { ...word, categoryIds: newCategoryIds } : word))
    setWords(updatedWords)

    try {
      const result = await updateWordCategories(wordId, newCategoryIds)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        // Revert if error (re-fetch from localStorage)
        const originalWords = await getWords()
        setWords(originalWords)
      } else {
        toast({
          title: "Success",
          description: "Word categories updated.",
        })
      }
    } catch (error) {
      console.error("Error updating word categories:", error)
      toast({
        title: "Error",
        description: "Failed to update word categories. Please try again.",
        variant: "destructive",
      })
      // Revert if error (re-fetch from localStorage)
      const originalWords = await getWords()
      setWords(originalWords)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleImportance = async (wordId: string) => {
    setIsSaving(true)
    isTextUpdateRef.current = true

    // Optimistically update the UI
    const updatedWords = words.map((word) => (word.id === wordId ? { ...word, isImportant: !word.isImportant } : word))
    setWords(updatedWords)

    try {
      const result = await toggleWordImportance(wordId)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        // Revert if error (re-fetch from localStorage)
        const originalWords = await getWords()
        setWords(originalWords)
      } else {
        toast({
          title: "Success",
          description: "Word importance updated.",
        })
      }
    } catch (error) {
      console.error("Error updating word importance:", error)
      toast({
        title: "Error",
        description: "Failed to update word importance. Please try again.",
        variant: "destructive",
      })
      // Revert if error (re-fetch from localStorage)
      const originalWords = await getWords()
      setWords(originalWords)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddConfusingWord = async (wordId: string, confusingWord: string) => {
    setIsSaving(true)
    isTextUpdateRef.current = true

    // Optimistically update the UI
    const updatedWords = words.map((word) => {
      if (word.id === wordId) {
        const newConfusingWords = [...(word.confusingWords || []), confusingWord]
        return { ...word, confusingWords: newConfusingWords }
      }
      return word
    })
    setWords(updatedWords)

    try {
      const result = await addConfusingWord(wordId, confusingWord)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        // Revert if error (re-fetch from localStorage)
        const originalWords = await getWords()
        setWords(originalWords)
      } else {
        toast({
          title: "Success",
          description: "Confusing word added.",
        })
      }
    } catch (error) {
      console.error("Error adding confusing word:", error)
      toast({
        title: "Error",
        description: "Failed to add confusing word. Please try again.",
        variant: "destructive",
      })
      // Revert if error (re-fetch from localStorage)
      const originalWords = await getWords()
      setWords(originalWords)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveConfusingWord = async (wordId: string, confusingWordIndex: number) => {
    setIsSaving(true)
    isTextUpdateRef.current = true

    // Optimistically update the UI
    const updatedWords = words.map((word) => {
      if (word.id === wordId) {
        const newConfusingWords = [...(word.confusingWords || [])]
        newConfusingWords.splice(confusingWordIndex, 1)
        return { ...word, confusingWords: newConfusingWords }
      }
      return word
    })
    setWords(updatedWords)

    try {
      const result = await removeConfusingWord(wordId, confusingWordIndex)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        // Revert if error (re-fetch from localStorage)
        const originalWords = await getWords()
        setWords(originalWords)
      } else {
        toast({
          title: "Success",
          description: "Confusing word removed.",
        })
      }
    } catch (error) {
      console.error("Error removing confusing word:", error)
      toast({
        title: "Error",
        description: "Failed to remove confusing word. Please try again.",
        variant: "destructive",
      })
      // Revert if error (re-fetch from localStorage)
      const originalWords = await getWords()
      setWords(originalWords)
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate pagination with page shuffling support
  const totalPages = Math.ceil(filteredWords.length / itemsPerPage)

  // Generate shuffled page order if needed
  useEffect(() => {
    if (isPagesShuffled && totalPages > 0) {
      const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
      const shuffled = [...pageNumbers]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setShuffledPageOrder(shuffled)
    }
  }, [isPagesShuffled, totalPages])

  // Get current page words based on shuffle state
  const getCurrentPageWords = () => {
    if (isPagesShuffled && shuffledPageOrder.length > 0) {
      const actualPageIndex = shuffledPageOrder.indexOf(currentPage)
      const startIndex = actualPageIndex * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      return filteredWords.slice(startIndex, endIndex)
    } else {
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      return filteredWords.slice(startIndex, endIndex)
    }
  }

  const paginatedWords = getCurrentPageWords()

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        const importedWords = importedData.words || importedData
        const importedCategories = importedData.categories || []

        setIsSaving(true)
        const wordImportResult = await importWords(importedWords)

        if (importedCategories.length > 0) {
          setCategories(importedCategories)
          const updatedCategories = await getCategories()
          setCategories(updatedCategories)
        }

        if (wordImportResult.success) {
          setWords(importedWords)
          setCurrentPage(1)
          setIsShuffled(false)
          setIsPagesShuffled(false)
          setShuffledPageOrder([])
          toast({
            title: "Success",
            description: "Words imported successfully.",
          })
        } else {
          toast({
            title: "Error",
            description: wordImportResult.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error importing words:", error)
        toast({
          title: "Error",
          description: "Invalid JSON file. Please check the format and try again.",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
      }
    }
    reader.readAsText(file)
  }

  const handleExport = () => {
    const dataToExport = {
      words: words,
      categories: categories,
    }
    const dataStr = JSON.stringify(dataToExport, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = "arabic-words-and-categories.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleShuffle = () => {
    // Fisher-Yates shuffle algorithm on the entire word list
    const shuffled = [...words]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setWords(shuffled)
    setCurrentPage(1)
    setIsShuffled(true)
    setIsPagesShuffled(false)
    setShuffledPageOrder([])
  }

  const handleShufflePages = () => {
    if (isPagesShuffled) {
      // Reset page shuffle
      setIsPagesShuffled(false)
      setShuffledPageOrder([])
      setCurrentPage(1)
    } else {
      // Enable page shuffle
      setIsPagesShuffled(true)
      setCurrentPage(1)
    }
  }

  const handleResetOrder = async () => {
    setIsLoading(true)
    try {
      const originalWords = await getWords()

      const wordsMap = new Map(words.map((word) => [word.id, word]))
      const resetWords = originalWords.map((originalWord) => {
        const currentWord = wordsMap.get(originalWord.id)
        return currentWord
          ? {
              ...originalWord,
              statuses: currentWord.statuses,
              categoryIds: currentWord.categoryIds,
              confusingWords: currentWord.confusingWords,
              isImportant: currentWord.isImportant,
              eyeClickCount: currentWord.eyeClickCount,
              isExpression: currentWord.isExpression,
            }
          : originalWord
      })

      setWords(resetWords)
      setCurrentPage(1)
      setIsShuffled(false)
      setIsPagesShuffled(false)
      setShuffledPageOrder([])
    } catch (error) {
      console.error("Error resetting order:", error)
      toast({
        title: "Error",
        description: "Failed to reset word order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWord = async (wordId: string) => {
    setWordToDelete(wordId)
  }

  const confirmDeleteWord = async () => {
    if (!wordToDelete) return

    setIsSaving(true)

    const updatedWords = words.filter((word) => word.id !== wordToDelete)
    setWords(updatedWords)

    setWordToDelete(null)

    try {
      const result = await deleteWord(wordToDelete)
      if (result.success) {
        toast({
          title: "Success",
          description: "Word deleted successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        const originalWords = await getWords()
        setWords(originalWords)
      }
    } catch (error) {
      console.error("Error deleting word:", error)
      toast({
        title: "Error",
        description: "Failed to delete word. Please try again.",
        variant: "destructive",
      })
      const originalWords = await getWords()
      setWords(originalWords)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSortByEyeClicks = () => {
    setIsSortedByEyeClicks(!isSortedByEyeClicks)
    setCurrentPage(1)
  }

  return (
    <main className="container mx-auto py-6 px-4 bg-gray-50/30 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col items-center mb-6">
        <div className="w-full max-w-4xl flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Arabic Word Learning Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Words Learned Today: <span className="font-bold text-lg">{wordsLearnedTodayCount}</span>
            </span>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("isAuthenticated")
                router.push("/login")
              }}
              className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Logout
            </Button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 mb-6 w-full max-w-4xl">
          <p className="text-gray-600 dark:text-gray-300 text-center text-sm">
            Track your progress learning Arabic words and phrases. Check the boxes as you become more confident:
            <span className="font-medium"> R</span>=Recognize,
            <span className="font-medium"> U</span>=Understand,
            <span className="font-medium"> C</span>=Recall,
            <span className="font-medium"> F</span>=Use Fluently
          </p>
        </div>

        <div className="w-full max-w-4xl flex flex-col gap-4 mb-6">
          {/* Study Mode Buttons */}
          <div className="flex justify-center gap-2 mb-2 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={studyMode === "show-all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStudyMode("show-all")}
                    className={studyMode === "show-all" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    Show All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show both English and Arabic text</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={studyMode === "hide-english" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStudyMode("hide-english")}
                    className={studyMode === "hide-english" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                  >
                    <EyeOff className="h-4 w-4 mr-1.5" />
                    Hide English
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hide English text to practice reading Arabic</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={studyMode === "hide-arabic" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStudyMode("hide-arabic")}
                    className={studyMode === "hide-arabic" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                  >
                    <EyeOff className="h-4 w-4 mr-1.5" />
                    Hide Arabic
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hide Arabic text to practice recall</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showArabicOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowArabicOnly(!showArabicOnly)}
                    className={showArabicOnly ? "bg-blue-500 hover:bg-blue-600" : ""}
                  >
                    <Languages className="h-4 w-4 mr-1.5" />
                    Arabic Only
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show only words that contain Arabic text</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showImportantOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowImportantOnly(!showImportantOnly)}
                    className={showImportantOnly ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                  >
                    <Star className="h-4 w-4 mr-1.5" />
                    Important Only
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show only words marked as important</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsQuizDialogOpen(true)}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 ml-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <BookOpen className="h-4 w-4 mr-1.5" />
                    Quiz Mode
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Test your knowledge with a quiz</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsStatsDialogOpen(true)}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 ml-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <BarChart className="h-4 w-4 mr-1.5" />
                    Statistics
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View your learning progress statistics</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex flex-wrap gap-4 justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex gap-3 items-center flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  placeholder="Search words..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span style={{ color: category.color }}>{category.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
                className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                disabled={isSaving}
              >
                <Plus size={16} className="mr-1.5" />
                Add Word
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isSortedByEyeClicks ? "default" : "outline"}
                      size="sm"
                      onClick={handleSortByEyeClicks}
                      className={`border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${
                        isSortedByEyeClicks
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "text-gray-700 hover:text-gray-900 dark:text-gray-300"
                      }`}
                      disabled={isSaving}
                    >
                      <ArrowUpDown size={16} className="mr-1.5" />
                      Sort by Eye Clicks
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sort words by number of times eye icon was clicked</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isShuffled ? handleResetOrder : handleShuffle}
                      className={`border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${
                        isShuffled
                          ? "text-amber-600 hover:text-amber-700 dark:text-amber-500"
                          : "text-gray-700 hover:text-gray-900 dark:text-gray-300"
                      }`}
                      disabled={isSaving}
                    >
                      <Shuffle size={16} className="mr-1.5" />
                      {isShuffled ? "Reset Order" : "Shuffle"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isShuffled ? "Restore original order" : "Randomize all phrases"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShufflePages}
                      className={`border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${
                        isPagesShuffled
                          ? "text-purple-600 hover:text-purple-700 dark:text-purple-500"
                          : "text-gray-700 hover:text-gray-900 dark:text-gray-300"
                      }`}
                      disabled={isSaving}
                    >
                      <ShuffleIcon size={16} className="mr-1.5" />
                      {isPagesShuffled ? "Reset Pages" : "Shuffle Pages"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isPagesShuffled ? "Restore page order" : "Randomize page order"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsManageCategoriesDialogOpen(true)}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      disabled={isSaving}
                    >
                      <Tags size={16} className="mr-1.5" />
                      Manage Categories
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add, edit, or delete categories</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div>
                <input type="file" id="import" accept=".json" onChange={handleImport} className="hidden" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("import")?.click()}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  disabled={isSaving}
                >
                  <FileUp size={16} className="mr-1.5" />
                  Import
                </Button>
              </div>
              <Button
                size="sm"
                onClick={handleExport}
                className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                disabled={isSaving}
              >
                <FileDown size={16} className="mr-1.5" />
                Export
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <p className="dark:text-gray-300">Loading words...</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <WordList
            words={paginatedWords}
            onStatusChange={handleStatusChange}
            onTextUpdate={handleTextUpdate}
            onTextAppend={handleTextAppend}
            onDelete={handleDeleteWord}
            currentPage={currentPage}
            studyMode={studyMode}
            categories={categories}
            onUpdateWordCategories={handleUpdateWordCategories}
            onAddConfusingWord={handleAddConfusingWord}
            onRemoveConfusingWord={handleRemoveConfusingWord}
            onToggleImportance={handleToggleImportance}
            onToggleExpression={handleToggleExpression}
            onEyeClick={handleEyeClick}
          />

          <div className="mt-4 flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      {/* Add Word Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Add New Word or Phrase</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newWordText}
              onChange={(e) => setNewWordText(e.target.value)}
              placeholder="Enter word or phrase..."
              className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddNewWord()
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSaving}
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button onClick={handleAddNewWord} disabled={isSaving}>
              {isSaving ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Learning Progress Statistics</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <StatisticsDashboard words={words} />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsStatsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Quiz Mode</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <QuizContainer words={words} onClose={() => setIsQuizDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Categories Dialog */}
      <ManageCategoriesDialog
        open={isManageCategoriesDialogOpen}
        onOpenChange={setIsManageCategoriesDialogOpen}
        categories={categories}
        setCategories={setCategories}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={wordToDelete !== null} onOpenChange={(open) => !open && setWordToDelete(null)}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This action cannot be undone. This will permanently delete the word from your list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteWord} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
