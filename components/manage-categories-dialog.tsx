"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash2, Edit } from "lucide-react"
import type { Category } from "@/types/index"
import { addCategory, updateCategory, deleteCategory } from "@/app/actions/word-actions"

interface ManageCategoriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>
}

export default function ManageCategoriesDialog({
  open,
  onOpenChange,
  categories,
  setCategories,
}: ManageCategoriesDialogProps) {
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#000000")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleAddCategory = async () => {
    if (newCategoryName.trim() === "" || isSaving) return

    setIsSaving(true)
    try {
      const result = await addCategory(newCategoryName.trim(), newCategoryColor)
      if (result.success && result.category) {
        setCategories((prev) => [...prev, result.category!])
        setNewCategoryName("")
        setNewCategoryColor("#000000")
        toast({ title: "Success", description: "Category added." })
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      console.error("Error adding category:", error)
      toast({ title: "Error", description: "Failed to add category.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryColor(category.color)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || newCategoryName.trim() === "" || isSaving) return

    setIsSaving(true)
    try {
      const updatedCategory: Category = {
        ...editingCategory,
        name: newCategoryName.trim(),
        color: newCategoryColor,
      }
      const result = await updateCategory(updatedCategory)
      if (result.success) {
        setCategories((prev) => prev.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat)))
        setEditingCategory(null)
        setNewCategoryName("")
        setNewCategoryColor("#000000")
        toast({ title: "Success", description: "Category updated." })
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      console.error("Error updating category:", error)
      toast({ title: "Error", description: "Failed to update category.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (isSaving) return

    if (!window.confirm("Are you sure you want to delete this category? This cannot be undone.")) {
      return
    }

    setIsSaving(true)
    try {
      const result = await deleteCategory(categoryId)
      if (result.success) {
        setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
        toast({ title: "Success", description: "Category deleted." })
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({ title: "Error", description: "Failed to delete category.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setEditingCategory(null)
    setNewCategoryName("")
    setNewCategoryColor("#000000")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Manage Categories</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-end gap-2">
            <div className="grid flex-1 gap-1.5">
              <Label htmlFor="category-name" className="dark:text-gray-300">
                Category Name
              </Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="category-color" className="dark:text-gray-300">
                Color
              </Label>
              <Input
                id="category-color"
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="h-9 w-12 p-0 border-gray-200 dark:border-gray-700"
              />
            </div>
            <Button
              onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
              disabled={isSaving || newCategoryName.trim() === ""}
            >
              {isSaving ? "Saving..." : editingCategory ? "Update" : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {categories.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No categories added yet.</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-2 border rounded-md dark:border-gray-700 dark:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                      title={category.color}
                    />
                    <span className="dark:text-gray-100">{category.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditCategory(category)}
                      disabled={isSaving}
                      className="dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={isSaving}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:bg-gray-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
