/* eslint-disable */
// @ts-nocheck
import Prism from 'prismjs';

// Базовые языки включены по умолчанию
import 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';

// Динамически загружаемые языки
const languageLoaders: Record<string, () => Promise<any>> = {
  typescript: () => import('prismjs/components/prism-typescript'),
  tsx: () => import('prismjs/components/prism-tsx'),
  jsx: () => import('prismjs/components/prism-jsx'),
  python: () => import('prismjs/components/prism-python'),
  css: () => import('prismjs/components/prism-css'),
  scss: () => import('prismjs/components/prism-scss'),
  sass: () => import('prismjs/components/prism-sass'),
  json: () => import('prismjs/components/prism-json'),
  markdown: () => import('prismjs/components/prism-markdown'),
  html: () => import('prismjs/components/prism-markup'),
  xml: () => import('prismjs/components/prism-markup'),
  yaml: () => import('prismjs/components/prism-yaml'),
  bash: () => import('prismjs/components/prism-bash'),
  sql: () => import('prismjs/components/prism-sql'),
  dockerfile: () => import('prismjs/components/prism-docker'),
  go: () => import('prismjs/components/prism-go'),
  rust: () => import('prismjs/components/prism-rust'),
  java: () => import('prismjs/components/prism-java'),
  php: () => import('prismjs/components/prism-php'),
  c: () => import('prismjs/components/prism-c'),
  cpp: () => import('prismjs/components/prism-cpp'),
  csharp: () => import('prismjs/components/prism-csharp'),
};

const loadedLanguages = new Set<string>(['javascript', 'js', 'clike']);

export const mapFileExtensionToLanguage = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'ts': return 'typescript';
    case 'tsx': return 'tsx';
    case 'jsx': return 'jsx';
    case 'js': return 'javascript';
    case 'py': return 'python';
    case 'css': return 'css';
    case 'scss': return 'scss';
    case 'sass': return 'sass';
    case 'json': return 'json';
    case 'md': case 'markdown': return 'markdown';
    case 'html': case 'htm': return 'html';
    case 'xml': return 'xml';
    case 'yml': case 'yaml': return 'yaml';
    case 'sh': case 'bash': return 'bash';
    case 'sql': return 'sql';
    case 'go': return 'go';
    case 'rs': return 'rust';
    case 'java': return 'java';
    case 'php': return 'php';
    case 'c': return 'c';
    case 'cpp': case 'cc': case 'cxx': return 'cpp';
    case 'cs': return 'csharp';
    case 'dockerfile': return 'dockerfile';
    default: return 'javascript'; // fallback
  }
};

export const ensureLanguageLoaded = async (language: string): Promise<void> => {
  if (loadedLanguages.has(language)) {
    return;
  }

  const loader = languageLoaders[language];
  if (loader) {
    try {
      await loader();
      loadedLanguages.add(language);
    } catch (error) {
      console.warn(`Failed to load Prism language: ${language}`, error);
    }
  }
};

export const highlightCode = async (code: string, language: string): Promise<string> => {
  // Убеждаемся, что язык загружен
  await ensureLanguageLoaded(language);
  
  // Проверяем, что грамматика доступна
  const grammar = Prism.languages[language];
  if (!grammar) {
    // Fallback на JavaScript если язык не найден
    return Prism.highlight(code, Prism.languages.javascript, 'javascript');
  }
  
  return Prism.highlight(code, grammar, language);
};

// Утилита для подсветки отдельной строки (более производительно для больших файлов)
export const highlightLine = async (line: string, language: string): Promise<string> => {
  await ensureLanguageLoaded(language);
  
  const grammar = Prism.languages[language];
  if (!grammar) {
    return Prism.highlight(line, Prism.languages.javascript, 'javascript');
  }
  
  return Prism.highlight(line, grammar, language);
};
