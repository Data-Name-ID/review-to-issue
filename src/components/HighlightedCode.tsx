import { memo, useEffect, useState, useRef } from 'react';
import { highlightLine, mapFileExtensionToLanguage } from '../utils/syntaxHighlighter';

interface HighlightedCodeProps {
  line: string;
  fileName: string;
  lineNumber: number;
}

export const HighlightedCode = memo(({ line, fileName }: Omit<HighlightedCodeProps, 'lineNumber'>) => {
  const [highlightedHTML, setHighlightedHTML] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
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
      { rootMargin: '100px' } // Начинаем подсветку заранее
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [isVisible]);

  // Подсветка только когда элемент видим
  useEffect(() => {
    if (!isVisible) return;

    const highlightAsync = async () => {
      try {
        setIsLoading(true);
        const language = mapFileExtensionToLanguage(fileName);
        const highlighted = await highlightLine(line || ' ', language);
        setHighlightedHTML(highlighted);
      } catch (error) {
        console.warn('Failed to highlight code:', error);
        setHighlightedHTML(line || ' ');
      } finally {
        setIsLoading(false);
      }
    };

    highlightAsync();
  }, [isVisible, line, fileName]);

  // Показываем обычный текст, пока не видим или загружается
  if (!isVisible || isLoading) {
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
        {line || ' '}
      </span>
    );
  }

  return (
    <span 
      ref={elementRef}
      dangerouslySetInnerHTML={{ __html: highlightedHTML }}
      style={{ 
        fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '13px',
        lineHeight: '1.5'
      }}
    />
  );
});

HighlightedCode.displayName = 'HighlightedCode';
