import type { FileNode } from '../types';

// Функция для чтения содержимого папки через File API
export const readDirectory = async (directoryHandle: FileSystemDirectoryHandle): Promise<FileNode[]> => {
  const nodes: FileNode[] = [];
  
  for await (const [name, handle] of (directoryHandle as any).entries()) {
    if (handle.kind === 'directory') {
      const children = await readDirectory(handle);
      nodes.push({
        name,
        path: name,
        isDirectory: true,
        children: children
      });
    } else {
      // Фильтруем ненужные файлы
      if (!shouldIgnoreFile(name)) {
        nodes.push({
          name,
          path: name,
          isDirectory: false
        });
      }
    }
  }
  
  return nodes.sort((a, b) => {
    // Папки сначала, потом файлы, внутри каждой группы - алфавитный порядок
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
};

// Функция для чтения содержимого файла
export const readFile = async (fileHandle: FileSystemFileHandle): Promise<string> => {
  const file = await fileHandle.getFile();
  return await file.text();
};

// Функция для проверки, нужно ли игнорировать файл
const shouldIgnoreFile = (fileName: string): boolean => {
  const ignoredExtensions = ['.exe', '.dll', '.so', '.dylib', '.bin', '.img', '.iso'];
  const ignoredFiles = ['.DS_Store', 'Thumbs.db', 'desktop.ini'];
  const ignoredPrefixes = ['.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', 'coverage'];
  
  // Проверяем расширения
  if (ignoredExtensions.some(ext => fileName.toLowerCase().endsWith(ext))) {
    return true;
  }
  
  // Проверяем конкретные файлы
  if (ignoredFiles.includes(fileName)) {
    return true;
  }
  
  // Проверяем префиксы
  if (ignoredPrefixes.some(prefix => fileName.startsWith(prefix))) {
    return true;
  }
  
  return false;
};

// Определяем язык файла по расширению
export const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'ps1': 'powershell',
    'dockerfile': 'docker',
    'Dockerfile': 'docker',
    'vue': 'vue',
    'svelte': 'svelte'
  };
  
  return languageMap[extension || ''] || 'text';
};
