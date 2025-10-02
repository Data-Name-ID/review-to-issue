import { useState, useMemo, useCallback } from 'react';
import type { CodeComment, Repository, CommentCategory } from '../types';
import { generateMarkdownReport } from '../utils/markdownGenerator';
import { Button } from './ui';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarkdownExportProps {
  comments: CodeComment[];
  repository: Repository | null;
  allFiles: Array<{ path: string; content: string }>;
  categories?: CommentCategory[];
}

interface CategorySection {
  key: string;
  title: string;
  count: number;
  content: string;
  category?: CommentCategory;
}

export const MarkdownExport = ({ comments, repository, allFiles, categories }: MarkdownExportProps) => {
  const [copiedSections, setCopiedSections] = useState<Set<string>>(new Set());
  const [previewMode, setPreviewMode] = useState<'raw' | 'rendered'>('rendered');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [weekNumber, setWeekNumber] = useState<number>(1);

  // Вспомогательные функции для группировки комментариев
  const groupCommentsByFile = useCallback((comments: CodeComment[]): Record<string, CodeComment[]> => {
    return comments.reduce((acc, comment) => {
      (acc[comment.filePath] = acc[comment.filePath] || []).push(comment);
      return acc;
    }, {} as Record<string, CodeComment[]>);
  }, []);

  const generateFileContent = useCallback((fileEntries: [string, CodeComment[]][], repository: Repository): string => {
    let content = '';
    fileEntries.forEach(([filePath, fileComments], fileIndex) => {
      content += `### ${filePath}\n\n`;
      
      // Сортируем комментарии: сначала к файлу, потом по строкам
      const sortedComments = fileComments.sort((a, b) => {
        // Сначала комментарии к файлу
        if (a.isFileComment && !b.isFileComment) return -1;
        if (!a.isFileComment && b.isFileComment) return 1;
        
        // Если оба к файлу или оба к строкам, сортируем по строкам
        if (!a.isFileComment && !b.isFileComment) {
          return a.startLine - b.startLine;
        }
        
        return 0;
      });
      
      content += generateMarkdownReport(sortedComments, repository, allFiles, undefined, false);
      
      if (fileIndex < fileEntries.length - 1) {
        content += '\n---\n\n';
      }
    });
    return content;
  }, [allFiles]);

  const groupCommentsByCategory = useCallback((comments: CodeComment[], categories: CommentCategory[] = []) => {
    const byCat = new Map<string, { title: string; items: CodeComment[] }>();
    const uncategorized: CodeComment[] = [];

    // Инициализируем категории
    categories.forEach((cat: CommentCategory) => {
      byCat.set(cat.id, { title: `Категория: ${cat.name}`, items: [] });
    });

    // Распределяем комментарии
    comments.forEach(comment => {
      if (comment.categoryId && byCat.has(comment.categoryId)) {
        byCat.get(comment.categoryId)!.items.push(comment);
      } else {
        uncategorized.push(comment);
      }
    });

    return { byCat, uncategorized };
  }, []);

  // Целостный отчёт (оставлен для fallback предпросмотра без категорий)
  const markdownContent = useMemo(() => {
    if (!repository) return '';
    return generateMarkdownReport(comments, repository, allFiles, categories);
  }, [comments, repository, allFiles, categories]);

  // Разделение по категориям для предпросмотра
  const categoryPreviews = useMemo((): CategorySection[] => {
    if (!repository) return [];

    const { byCat, uncategorized } = groupCommentsByCategory(comments, categories);
    const sections: CategorySection[] = [];

    // Обрабатываем категории с комментариями
    byCat.forEach((val, key) => {
      if (val.items.length > 0) {
        const byFile = groupCommentsByFile(val.items);
        const fileEntries = Object.entries(byFile);
        const categoryContent = generateFileContent(fileEntries, repository);
        const category = categories?.find(cat => cat.id === key);

        sections.push({
          key,
          title: val.title,
          count: val.items.length,
          content: categoryContent,
          category
        });
      }
    });

    // Обрабатываем комментарии без категории
    if (uncategorized.length > 0) {
      const byFile = groupCommentsByFile(uncategorized);
      const fileEntries = Object.entries(byFile);
      const uncategorizedContent = generateFileContent(fileEntries, repository);

      sections.push({
        key: 'uncategorized',
        title: 'Без категории',
        count: uncategorized.length,
        content: uncategorizedContent
      });
    }

    return sections;
  }, [comments, repository, categories, groupCommentsByCategory, groupCommentsByFile, generateFileContent]);

  // Обработчики событий
  const toggleSection = useCallback((sectionKey: string) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionKey)) {
        newExpanded.delete(sectionKey);
      } else {
        newExpanded.add(sectionKey);
      }
      return newExpanded;
    });
  }, []);

  const expandAllSections = useCallback(() => {
    setExpandedSections(new Set(categoryPreviews.map(s => s.key)));
  }, [categoryPreviews]);

  const collapseAllSections = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  const handleCopySection = useCallback(async (content: string, sectionKey: string, isTitle: boolean = false) => {
    try {
      let textToCopy = content;
      
      // Если это копирование названия категории, форматируем его
      if (isTitle && sectionKey.includes('-title')) {
        const categoryKey = sectionKey.replace('-title', '');
        const categoryIndex = categoryPreviews.findIndex(section => section.key === categoryKey);
        // Убираем "Категория:" из названия, если оно есть
        const cleanTitle = content.replace(/^Категория:\s*/, '');
        textToCopy = `[${weekNumber}.${categoryIndex + 1}] ${cleanTitle}`;
      }
      
      await navigator.clipboard.writeText(textToCopy);
      setCopiedSections(prev => new Set([...prev, sectionKey]));
      setTimeout(() => {
        setCopiedSections(prev => {
          const newSet = new Set(prev);
          newSet.delete(sectionKey);
          return newSet;
        });
      }, 1500);
    } catch {
      // no-op
    }
  }, [weekNumber, categoryPreviews]);

  // Константы стилей
  const styles = {
    container: { height: '100%', display: 'flex', flexDirection: 'column' as const },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
    title: { margin: '0', fontSize: '16px', fontWeight: '600', color: 'var(--gitlab-text-primary)' },
    controlPanel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
      padding: '8px',
      backgroundColor: 'var(--gitlab-bg-tertiary)',
      borderRadius: '6px',
      border: '1px solid var(--gitlab-border-light)'
    },
    divider: { width: '1px', height: '20px', backgroundColor: 'var(--gitlab-border-light)' },
    stats: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' },
    statCard: {
      padding: '12px',
      backgroundColor: 'var(--gitlab-bg-tertiary)',
      border: '1px solid var(--gitlab-border-light)',
      borderRadius: '6px',
      textAlign: 'center' as const
    },
    previewContainer: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '0', flex: 1, minHeight: 0, overflowY: 'auto' as const },
    section: {
      backgroundColor: 'var(--gitlab-bg-tertiary)',
      border: '1px solid var(--gitlab-border-light)',
      borderRadius: '8px',
      overflow: 'hidden' as const
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      padding: '12px'
    },
    sectionTitle: {
      fontWeight: 600,
      color: 'var(--gitlab-text-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    categoryDot: {
      display: 'inline-block',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      flexShrink: 0
    },
    contentContainer: { padding: '16px' },
    previewBox: {
      backgroundColor: 'var(--gitlab-bg-primary)',
      border: '1px solid var(--gitlab-border-light)',
      borderRadius: '6px',
      padding: '16px',
      maxHeight: '400px',
      overflowY: 'auto' as const
    },
    rawPreviewBox: {
      backgroundColor: 'var(--gitlab-bg-primary)',
      border: '1px solid var(--gitlab-border-light)',
      borderRadius: '6px',
      padding: '16px',
      whiteSpace: 'pre' as const,
      overflowX: 'auto' as const,
      fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: '12px',
      color: 'var(--gitlab-text-primary)',
      maxHeight: '400px',
      overflowY: 'auto' as const
    }
  } as const;

  // Компоненты состояний
  const EmptyState = ({ message, color = 'var(--gitlab-text-secondary)' }: { message: string; color?: string }) => (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      color,
      backgroundColor: 'var(--gitlab-bg-tertiary)',
      borderRadius: '8px',
      border: `1px solid ${color === 'var(--gitlab-orange)' ? 'var(--gitlab-orange)' : 'var(--gitlab-border-light)'}`
    }}>
      <div style={{ fontSize: '16px', marginBottom: '8px' }}>
        {message}
      </div>
    </div>
  );

  // Компоненты для повторяющихся элементов
  const StatCard = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <div style={styles.statCard}>
      <div style={{ fontSize: '24px', fontWeight: '600', color }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--gitlab-text-secondary)' }}>
        {label}
      </div>
    </div>
  );

  const CategoryDot = ({ color }: { color: string }) => (
    <span style={{ ...styles.categoryDot, backgroundColor: color }} />
  );

  const PreviewContent = ({ content, mode }: { content: string; mode: 'raw' | 'rendered' }) => (
    <div style={mode === 'rendered' ? styles.previewBox : styles.rawPreviewBox}>
      {mode === 'rendered' ? (
        <MarkdownRenderer content={content} />
      ) : (
        <pre style={{ margin: 0, whiteSpace: 'pre' }}>{content}</pre>
      )}
    </div>
  );

  // Ранние возвраты для состояний ошибок
  if (!repository) {
    return <EmptyState message="Configure repository for export" />;
  }

  if (comments.length === 0) {
    return <EmptyState message="Нет комментариев для экспорта" />;
  }

  if (!repository.baseUrl) {
    return <EmptyState message="URL репозитория не указан" color="var(--gitlab-orange)" />;
  }

  return (
    <div style={styles.container}>
      {/* Заголовок */}
      <div style={styles.header}>
        <h3 style={styles.title}>
          Экспорт ({comments.length})
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: 'var(--gitlab-text-secondary)' }}>
            Номер недели:
          </label>
          <input
            type="number"
            min="1"
            max="52"
            value={weekNumber}
            onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
            style={{
              width: '60px',
              padding: '4px 8px',
              border: '1px solid var(--gitlab-border-light)',
              borderRadius: '4px',
              backgroundColor: 'var(--gitlab-bg-secondary)',
              color: 'var(--gitlab-text-primary)',
              fontSize: '13px'
            }}
          />
        </div>
      </div>

      {/* Панель управления */}
      <div style={styles.controlPanel}>
        {/* Переключатель режима просмотра */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button 
            variant={previewMode === 'rendered' ? 'blue' : 'secondary'}
            size="sm"
            onClick={() => setPreviewMode('rendered')}
            title="Предпросмотр с рендерингом"
          >
            👁️
          </Button>
          <Button 
            variant={previewMode === 'raw' ? 'blue' : 'secondary'}
            size="sm"
            onClick={() => setPreviewMode('raw')}
            title="Исходный код Markdown"
          >
            📝
          </Button>
        </div>

        <div style={styles.divider} />

        {/* Управление секциями */}
        {categoryPreviews.length > 1 && (
          <>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={expandAllSections}
              title="Развернуть все секции"
            >
              ⬇️
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={collapseAllSections}
              title="Свернуть все секции"
            >
              ⬆️
            </Button>
          </>
        )}
      </div>

      {/* Статистика */}
      <div style={styles.stats}>
        <StatCard 
          value={comments.length} 
          label="Комментариев" 
          color="var(--gitlab-orange)" 
        />
        <StatCard 
          value={new Set(comments.map(c => c.filePath)).size} 
          label="Файлов" 
          color="var(--gitlab-green)" 
        />
      </div>

      {/* Предпросмотр — на всю высоту, скролл здесь */}
      <div style={styles.previewContainer}>
        {/* Разделённые предпросмотры по категориям */}
        {categoryPreviews.length > 0 ? (
          categoryPreviews.map(section => {
            const isExpanded = expandedSections.has(section.key);
            return (
              <div key={section.key} style={styles.section}>
                {/* Header */}
                <div 
                  onClick={() => toggleSection(section.key)}
                  style={{ 
                    ...styles.sectionHeader,
                    backgroundColor: isExpanded ? 'var(--gitlab-bg-secondary)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid var(--gitlab-border-light)' : 'none'
                  }}
                >
                  <span style={styles.sectionTitle}>
                    {section.category && <CategoryDot color={section.category.color} />}
                    [{weekNumber}.{categoryPreviews.findIndex(s => s.key === section.key) + 1}] {section.title.replace(/^Категория:\s*/, '')} ({section.count})
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySection(section.title, `${section.key}-title`, true);
                      }}
                      title="Скопировать название категории"
                    >
                      {copiedSections.has(`${section.key}-title`) ? '✅' : '📝'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySection(section.content, `${section.key}-content`);
                      }}
                      title="Скопировать содержимое категории"
                    >
                      {copiedSections.has(`${section.key}-content`) ? '✅' : '📋'}
                    </Button>
                  </div>
                </div>

                {/* Content */}
                {isExpanded && (
                  <div style={styles.contentContainer}>
                    <PreviewContent content={section.content} mode={previewMode} />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Если категорий нет — один предпросмотр целого отчёта
          <div style={styles.section}>
            <div style={{
              ...styles.sectionHeader,
              backgroundColor: 'var(--gitlab-bg-secondary)',
              borderBottom: '1px solid var(--gitlab-border-light)'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--gitlab-text-primary)' }}>
                📄 Code Review Report
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleCopySection(markdownContent, 'full-report')}
                  title="Скопировать Markdown"
                >
                  {copiedSections.has('full-report') ? '✅' : '📋'}
                </Button>
              </div>
            </div>
            <div style={styles.contentContainer}>
              <PreviewContent content={markdownContent} mode={previewMode} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
