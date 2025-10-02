import { memo, useEffect, useState, useRef } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface HighlightedCodeProps {
  line: string;
  fileName: string;
  lineNumber: number;
}

// Функция для определения языка по имени файла
const getLanguageFromFileName = (fileName: string): string => {
  const lowerFileName = fileName.toLowerCase();
  
  // Специальные файлы по имени
  if (lowerFileName === 'requirements.txt' || lowerFileName === 'requirements-dev.txt') {
    return 'text';
  }
  
  // Файлы в папке requirements
  if (fileName.includes('/requirements/') || 
      fileName.includes('\\requirements\\') || 
      fileName.startsWith('requirements/') ||
      fileName.includes('requirements/')) {
    return 'text';
  }
  if (lowerFileName === '.gitlab-ci.yml' || lowerFileName === 'gitlab-ci.yml') {
    return 'yaml';
  }
  if (lowerFileName === 'dockerfile' || lowerFileName.endsWith('.dockerfile')) {
    return 'dockerfile';
  }
  if (lowerFileName === 'makefile' || lowerFileName === 'gnumakefile') {
    return 'makefile';
  }
  if (lowerFileName === 'cmakelists.txt') {
    return 'cmake';
  }
  if (lowerFileName === 'package.json') {
    return 'json';
  }
  if (lowerFileName === 'composer.json') {
    return 'json';
  }
  if (lowerFileName === 'cargo.toml' || lowerFileName === 'pyproject.toml') {
    return 'toml';
  }
  
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'tsx',
    'jsx': 'jsx',
    'js': 'javascript',
    'py': 'python',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'json': 'json',
    'md': 'markdown',
    'markdown': 'markdown',
    'html': 'html',
    'htm': 'html',
    'xml': 'xml',
    'yml': 'yaml',
    'yaml': 'yaml',
    'toml': 'toml',
    'sh': 'bash',
    'bash': 'bash',
    'sql': 'sql',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'php': 'php',
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'cs': 'csharp',
    'dockerfile': 'dockerfile',
    'vue': 'vue',
    'svelte': 'svelte',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'clj': 'clojure',
    'hs': 'haskell',
    'ex': 'elixir',
    'erl': 'erlang',
    'lua': 'lua',
    'pl': 'perl',
    'r': 'r',
    'm': 'matlab',
    'jl': 'julia',
    'dart': 'dart',
  };
  
  return languageMap[ext || ''] || 'text';
};

export const HighlightedCode = memo(({ line, fileName }: Omit<HighlightedCodeProps, 'lineNumber'>) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  // Intersection Observer для ленивой подсветки
  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [isVisible]);

  const language = getLanguageFromFileName(fileName);
  const code = line || ' ';

  // Показываем обычный текст, пока не видим
  if (!isVisible) {
    return (
      <span 
        ref={elementRef}
        style={{ 
          color: 'var(--gitlab-text-primary)',
          fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: '13px',
          lineHeight: '1.5'
        }}
      >
        {code}
      </span>
    );
  }

  return (
    <span ref={elementRef}>
      <Highlight
        theme={themes.vsDark}
        code={code}
        language={language}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={className}
            style={{
              ...style,
              background: 'transparent',
              margin: 0,
              padding: 0,
              fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '13px',
              lineHeight: '1.5',
              overflow: 'visible',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </span>
  );
});

HighlightedCode.displayName = 'HighlightedCode';
