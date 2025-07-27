interface Word {
  id: string
  text: string
  statuses: boolean[]
  categoryIds?: string[]
  confusingWords?: string[]
  isImportant?: boolean // New field for marking important words
  eyeClickCount?: number // New field for tracking eye icon clicks
  isExpression?: boolean // New field for marking expressions
}

interface Category {
  id: string
  name: string
  color: string
}

export type { Word, Category }
