export interface CodeComment {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  comment: string;
  timestamp: Date;
  isFileComment?: boolean; // true если это комментарий ко всему файлу
  categoryId?: string; // категория замечания
}

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export interface Repository {
  name: string;
  rootPath: string;
  baseUrl: string; // например: https://git.kts.tech/mailru-nonstandart/max-front
  defaultBranch: string; // например: main
}

export interface ProjectState {
  repository: Repository | null;
  currentFile: string | null;
  fileContent: string;
  comments: CodeComment[];
  isLoading: boolean;
}

// Дополнительные типы для браузерных API
export interface WindowWithFileSystemAPI extends Window {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  handleDirectoryFallback?: (files: File[]) => void;
}

export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: Record<string, FileTreeNode>;
}

// Категория замечаний
export interface CommentCategory {
  id: string;
  name: string;
  color: string; // HEX или CSS цвет
  createdAt: Date;
}

// Шаблон комментария (снипет)
export interface CommentTemplate {
  id: string;
  name: string;
  content: string; // markdown содержимое
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}
