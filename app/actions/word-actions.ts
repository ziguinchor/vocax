// Merged File: Combines API-based and localStorage-based logic

import type { Word, Category } from "@/types/index";
import { initialWords, initialCategories } from "@/lib/sample-data";

const API_URL = "https://words.afripamediaservice.de/words.php";
const WORDS_STORAGE_KEY = "arabic_words_data_cache";
const CATEGORIES_STORAGE_KEY = "arabic_categories_data_cache";

function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/* ---------------------------- Local Storage ---------------------------- */
function _loadCache(): { words: Word[]; categories: Category[] } {
  if (typeof window === "undefined") return { words: [], categories: [] };
  try {
    const storedWords = localStorage.getItem(WORDS_STORAGE_KEY);
    const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    let words: Word[] = storedWords ? JSON.parse(storedWords) : initialWords;
    const categories: Category[] = storedCategories
      ? JSON.parse(storedCategories)
      : initialCategories;
    words = _normalizeWords(words);
    return { words, categories };
  } catch {
    return { words: initialWords, categories: initialCategories };
  }
}

function _saveCache(words: Word[], categories: Category[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WORDS_STORAGE_KEY, JSON.stringify(words));
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch {}
}

/* ---------------------------- Normalization ---------------------------- */
function _normalizeWords(words: Word[]): Word[] {
  return _eliminateDuplicates(
    words.map((w) => ({
      ...w,
      categoryIds: w.categoryIds || [],
      confusingWords: w.confusingWords || [],
      isImportant: w.isImportant || false,
      isExpression: w.isExpression || false,
      eyeClickCount: w.eyeClickCount || 0,
      statuses:
        Array.isArray(w.statuses) && w.statuses.length === 4
          ? w.statuses
          : [false, false, false, false],
    }))
  );
}

function _eliminateDuplicates(words: Word[]): Word[] {
  // const seen = new Set<string>();
  // const out: Word[] = [];
  // for (const w of words) {
  //   const key = w.text.toLowerCase().trim();
  //   if (!seen.has(key)) {
  //     seen.add(key);
  //     out.push(w);
  //   }
  // }
  return words;
}

/* ---------------------------- API Helpers ---------------------------- */
function qs(params: Record<string, any>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    search.append(k, String(v));
  });
  return search.toString();
}

async function apiGet<T>(action: string, params: Record<string, any> = {}): Promise<T> {
  const url = `${API_URL}?${qs({ action, ...params })}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${action} failed (${res.status})`);
  return (await res.json()) as T;
}

async function apiPost<T>(action: string, body: Record<string, any> = {}): Promise<T> {
  const form = new URLSearchParams();
  Object.entries(body).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    form.append(k, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
  });
  const res = await fetch(`${API_URL}?action=${encodeURIComponent(action)}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`POST ${action} failed (${res.status})`);
  return (await res.json()) as T;
}

async function _refreshAllFromServer(): Promise<{ words: Word[]; categories: Category[] }> {
  const [words, categories] = await Promise.all([
    apiGet<Word[]>("getWords"),
    apiGet<Category[]>("getCategories"),
  ]);
  const normalizedWords = _normalizeWords(words);
  _saveCache(normalizedWords, categories);
  return { words: normalizedWords, categories };
}

/* ---------------------------- Public API ---------------------------- */

export async function getWords(): Promise<Word[]> {
  try {
    const words = await apiGet<Word[]>("getWords");
    const normalizedWords = _normalizeWords(words);
    const cached = _loadCache();
    _saveCache(normalizedWords, cached.categories);
    return normalizedWords;
  } catch {
    return _loadCache().words;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const categories = await apiGet<Category[]>("getCategories");
    const cached = _loadCache();
    _saveCache(cached.words, categories);
    return categories;
  } catch {
    return _loadCache().categories;
  }
}

export async function addWord(text: string): Promise<{ success: boolean; message: string; word?: Word }> {
  const resp = await apiPost("addWord", { text });
  if ((resp as any).success) await _refreshAllFromServer();
  return resp;
}

export async function deleteWord(wordId: string): Promise<{ success: boolean; message: string }> {
  const resp = await apiPost("deleteWord", { id: String(wordId) });
  if (resp.success) await _refreshAllFromServer();
  return resp;
}

export async function updateWordStatus(
  wordId: string,
  statusIndex: number,
  checked: boolean
): Promise<{ success: boolean; message: string }> {
  const resp = await apiPost("updateWordStatus", {
    id: String(wordId),
    statusIndex: String(statusIndex),
    checked: checked ? "1" : "0",
  });
  if (resp.success) {
    const cache = _loadCache();
    const updatedWords = cache.words.map((w) =>
      w.id === wordId ? { ...w, statuses: w.statuses.map((s, i) => (i === statusIndex ? checked : s)) } : w
    );
    _saveCache(updatedWords, cache.categories);
  }
  return resp;
}

export async function updateWordText(wordId: string, newText: string) {
  const resp = await apiPost("updateWordText", { id: String(wordId), newText });
  if (resp.success) await _refreshAllFromServer();
  return resp;
}

export async function appendWordText(wordId: string, textToAppend: string) {
  const resp = await apiPost("appendWordText", { id: String(wordId), textToAppend });
  if (resp.success) await _refreshAllFromServer();
  return resp;
}

export async function importWords(importedWords: Word[]) {
  const resp = await apiPost("importWords", {
    words: JSON.stringify(importedWords),
  });
  if (resp.success) await _refreshAllFromServer();
  return resp;
}

export async function updateWordCategories(wordId: string, newCategoryIds: string[]) {
  const resp = await apiPost("updateWordCategories", {
    id: String(wordId),
    categoryIds: JSON.stringify(newCategoryIds),
  });
  if (resp.success) await _refreshAllFromServer();
  return resp;
}

export async function toggleWordImportance(wordId: string) {
  const resp = await apiPost("toggleWordImportance", { id: String(wordId) });
  if (resp.success) {
    const cache = _loadCache();
    const updatedWords = cache.words.map((w) =>
      w.id === wordId ? { ...w, isImportant: !w.isImportant } : w
    );
    _saveCache(updatedWords, cache.categories);
  }
  return resp;
}

export async function toggleWordExpression(wordId: string) {
  const resp = await apiPost("toggleWordExpression", { id: String(wordId) });
  if (resp.success) await _refreshAllFromServer();
  return resp;
}

export async function incrementEyeClickCount(wordId: string) {
  const resp = await apiPost("incrementEyeClickCount", { id: String(wordId) });
  // if (resp.success) await _refreshAllFromServer();
  return resp;
}

export async function addConfusingWord(wordId: string, confusingWord: string) {
  const resp = await apiPost("addConfusingWord", { id: String(wordId), confusingWord });
  if (resp.success) await _refreshAllFromServer();
  return resp;
}

export async function removeConfusingWord(wordId: string, confusingWordIndex: number) {
  const resp = await apiPost("removeConfusingWord", {
    id: String(wordId),
    confusingWordIndex: String(confusingWordIndex),
  });
  if (resp.success) await _refreshAllFromServer();
  return resp;
}

/* ---------------------- Category Actions -------------------------- */

export async function addCategory(name: string, color: string) {
  const resp = await apiPost("addCategory", { name, color });
  if (resp.success) await _refreshAllFromServer();
  return resp;
}

export async function updateCategory(category: Category) {
  const resp = await apiPost("updateCategory", {
    id: String(category.id),
    name: category.name,
    color: category.color,
  });
  if (resp.success) await _refreshAllFromServer();
  return resp;
}

export async function deleteCategory(categoryId: string) {
  const resp = await apiPost("deleteCategory", { id: String(categoryId) });
  if (resp.success) await _refreshAllFromServer();
  return resp;
}
