import type { CodeComment, Repository, CommentCategory, CommentTemplate } from '../types';

// Ключи для localStorage
export const STORAGE_KEYS = {
  REPOSITORY: 'code-review-repository',
  COMMENTS: 'code-review-comments',
  CURRENT_FILE: 'code-review-current-file',
  SIDEBAR_WIDTH: 'code-review-sidebar-width',
  SHOW_SIDEBAR: 'code-review-show-sidebar',
  ACTIVE_PANEL: 'code-review-active-panel',
  VIRTUALIZATION_ENABLED: 'code-review-virtualization-enabled',
  DEBUG_MODE: 'code-review-debug-mode',
  PENDING_URL: 'code-review-pending-url',
  LAST_DIRECTORY_HANDLE: 'code-review-last-directory-handle',
  ALL_FILES: 'code-review-all-files',
  NEW_REPOSITORY_FLAG: 'code-review-new-repository-flag',
  CATEGORIES: 'code-review-categories',
  TEMPLATES: 'code-review-templates'
} as const;

// Безопасное чтение из localStorage
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Безопасная запись в localStorage
export const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error writing ${key} to localStorage:`, error);
  }
};

// Удаление из localStorage
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing ${key} from localStorage:`, error);
  }
};

// Очистка всех данных приложения
export const clearAppStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    // Не удаляем категории — они должны сохраняться между репозиториями
    if (key !== STORAGE_KEYS.CATEGORIES) {
      removeFromStorage(key);
    }
  });
};

// Специфичные функции для типов данных
export const saveRepository = (repository: Repository | null): void => {
  setToStorage(STORAGE_KEYS.REPOSITORY, repository);
};

export const loadRepository = (): Repository | null => {
  return getFromStorage<Repository | null>(STORAGE_KEYS.REPOSITORY, null);
};

export const saveComments = (comments: CodeComment[]): void => {
  setToStorage(STORAGE_KEYS.COMMENTS, comments);
};

export const loadComments = (): CodeComment[] => {
  const comments = getFromStorage<CodeComment[]>(STORAGE_KEYS.COMMENTS, []);
  // Восстанавливаем Date объекты
  return comments.map(comment => ({
    ...comment,
    timestamp: new Date(comment.timestamp)
  }));
};

export const saveCurrentFile = (currentFile: string | null): void => {
  setToStorage(STORAGE_KEYS.CURRENT_FILE, currentFile);
};

export const loadCurrentFile = (): string | null => {
  return getFromStorage<string | null>(STORAGE_KEYS.CURRENT_FILE, null);
};

export const saveSidebarWidth = (width: number): void => {
  setToStorage(STORAGE_KEYS.SIDEBAR_WIDTH, width);
};

export const loadSidebarWidth = (): number => {
  return getFromStorage<number>(STORAGE_KEYS.SIDEBAR_WIDTH, 500);
};

export const saveShowSidebar = (show: boolean): void => {
  setToStorage(STORAGE_KEYS.SHOW_SIDEBAR, show);
};

export const loadShowSidebar = (): boolean => {
  return getFromStorage<boolean>(STORAGE_KEYS.SHOW_SIDEBAR, true);
};

export const saveActivePanel = (panel: 'files' | 'comments' | 'export' | 'templates'): void => {
  setToStorage(STORAGE_KEYS.ACTIVE_PANEL, panel);
};

export const loadActivePanel = (): 'files' | 'comments' | 'export' | 'templates' => {
  return getFromStorage<'files' | 'comments' | 'export' | 'templates'>(STORAGE_KEYS.ACTIVE_PANEL, 'files');
};

export const saveVirtualizationEnabled = (enabled: boolean): void => {
  setToStorage(STORAGE_KEYS.VIRTUALIZATION_ENABLED, enabled);
};

export const loadVirtualizationEnabled = (): boolean => {
  return getFromStorage<boolean>(STORAGE_KEYS.VIRTUALIZATION_ENABLED, true);
};

export const saveDebugMode = (enabled: boolean): void => {
  setToStorage(STORAGE_KEYS.DEBUG_MODE, enabled);
};

export const loadDebugMode = (): boolean => {
  return getFromStorage<boolean>(STORAGE_KEYS.DEBUG_MODE, false);
};

export const savePendingUrl = (pendingUrl: {baseUrl: string; defaultBranch: string} | null): void => {
  setToStorage(STORAGE_KEYS.PENDING_URL, pendingUrl);
};

export const loadPendingUrl = (): {baseUrl: string; defaultBranch: string} | null => {
  return getFromStorage<{baseUrl: string; defaultBranch: string} | null>(STORAGE_KEYS.PENDING_URL, null);
};

export const saveAllFiles = (allFiles: Array<{ path: string; content: string }>): void => {
  setToStorage(STORAGE_KEYS.ALL_FILES, allFiles);
};

export const loadAllFiles = (): Array<{ path: string; content: string }> => {
  return getFromStorage<Array<{ path: string; content: string }>>(STORAGE_KEYS.ALL_FILES, []);
};

// Сохранение информации о последней выбранной папке (только путь)
export const saveLastDirectoryPath = (directoryPath: string): void => {
  setToStorage(STORAGE_KEYS.LAST_DIRECTORY_HANDLE, directoryPath);
};

export const loadLastDirectoryPath = (): string | null => {
  return getFromStorage<string | null>(STORAGE_KEYS.LAST_DIRECTORY_HANDLE, null);
};

// Флаг для отслеживания намеренного создания нового репозитория
export const setNewRepositoryFlag = (isNew: boolean): void => {
  setToStorage(STORAGE_KEYS.NEW_REPOSITORY_FLAG, isNew);
};

export const isNewRepositoryFlag = (): boolean => {
  return getFromStorage<boolean>(STORAGE_KEYS.NEW_REPOSITORY_FLAG, false);
};

export const clearNewRepositoryFlag = (): void => {
  removeFromStorage(STORAGE_KEYS.NEW_REPOSITORY_FLAG);
};

// Работа с категориями комментариев
export interface StoredCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string; // сохраняем как строку ISO
}

// Удаляем дублирующий интерфейс - используем из types
// export interface CommentCategory

export const saveCategories = (categories: CommentCategory[]): void => {
  const payload: StoredCategory[] = categories.map(c => ({
    id: c.id,
    name: c.name,
    color: c.color,
    createdAt: c.createdAt.toISOString()
  }));
  setToStorage(STORAGE_KEYS.CATEGORIES, payload);
};

export const loadCategories = (): CommentCategory[] => {
  const stored = getFromStorage<StoredCategory[]>(STORAGE_KEYS.CATEGORIES, []);
  return stored.map(s => ({
    id: s.id,
    name: s.name,
    color: s.color,
    createdAt: new Date(s.createdAt)
  }));
};

// === COMMENT TEMPLATES ===

interface StoredTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  lastUsed?: string;
  useCount: number;
}

export const saveTemplates = (templates: CommentTemplate[]): void => {
  const payload: StoredTemplate[] = templates.map(t => ({
    id: t.id,
    name: t.name,
    content: t.content,
    createdAt: t.createdAt.toISOString(),
    lastUsed: t.lastUsed?.toISOString(),
    useCount: t.useCount
  }));
  setToStorage(STORAGE_KEYS.TEMPLATES, payload);
};

export const loadTemplates = (): CommentTemplate[] => {
  const stored = getFromStorage<StoredTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
  return stored.map(s => ({
    id: s.id,
    name: s.name,
    content: s.content,
    createdAt: new Date(s.createdAt),
    lastUsed: s.lastUsed ? new Date(s.lastUsed) : undefined,
    useCount: s.useCount
  }));
};
