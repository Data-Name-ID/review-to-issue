import { useState, useMemo } from 'react';
import type { CodeComment, Repository, CommentCategory } from '../types';
import { generateMarkdownReport } from '../utils/markdownGenerator';
import { Button } from './ui';

interface MarkdownExportProps {
  comments: CodeComment[];
  repository: Repository | null;
  allFiles: Array<{ path: string; content: string }>;
  categories?: CommentCategory[];
}

export const MarkdownExport = ({ comments, repository, allFiles, categories }: MarkdownExportProps) => {
  const [copied, setCopied] = useState(false);

  // Целостный отчёт (оставлен для fallback предпросмотра без категорий)
  const markdownContent = useMemo(() => {
    if (!repository) return '';
    return generateMarkdownReport(comments, repository, allFiles, categories);
  }, [comments, repository, allFiles, categories]);

  // Разделение по категориям для предпросмотра
  const categoryPreviews = useMemo(() => {
    if (!repository) return [] as Array<{ key: string; title: string; count: number; content: string }>

    const byCat = new Map<string, { title: string; items: CodeComment[] }>();

    // Заполняем по существующим категориям
    (categories || []).forEach((cat: CommentCategory) => {
      byCat.set(cat.id, { title: `Категория: ${cat.name}` , items: [] })
    });

    // Раскладываем комментарии
    const uncategorized: CodeComment[] = []
    comments.forEach(c => {
      if (c.categoryId && byCat.has(c.categoryId)) {
        byCat.get(c.categoryId)!.items.push(c)
      } else {
        uncategorized.push(c)
      }
    })

    // Формируем секции
    const sections: Array<{ key: string; title: string; count: number; content: string }> = []
    byCat.forEach((val: { title: string; items: CodeComment[] }, key: string) => {
      if (val.items.length > 0) {
        sections.push({
          key,
          title: val.title,
          count: val.items.length,
          content: generateMarkdownReport(val.items, repository, allFiles)
        })
      }
    })

    if (uncategorized.length > 0) {
      sections.push({
        key: 'uncategorized',
        title: 'Без категории',
        count: uncategorized.length,
        content: generateMarkdownReport(uncategorized, repository, allFiles)
      })
    }

    return sections
  }, [comments, repository, allFiles, categories])

  const handleCopySection = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // no-op
    }
  };

  const handleDownloadSection = (content: string, name: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-review-${(repository?.name || 'report')}-${name}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!repository) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--gitlab-text-secondary)',
        backgroundColor: 'var(--gitlab-bg-tertiary)',
        borderRadius: '8px',
        border: '1px solid var(--gitlab-border-light)'
      }}>
        Configure repository for export
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--gitlab-text-secondary)',
        backgroundColor: 'var(--gitlab-bg-tertiary)',
        borderRadius: '8px',
        border: '1px solid var(--gitlab-border-light)'
      }}>
        <div style={{ fontSize: '16px', marginBottom: '8px' }}>
          Нет комментариев для экспорта
        </div>
      </div>
    );
  }

  if (!repository.baseUrl) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--gitlab-orange)',
        backgroundColor: 'var(--gitlab-bg-tertiary)',
        borderRadius: '8px',
        border: '1px solid var(--gitlab-orange)'
      }}>
        <div style={{ fontSize: '16px', marginBottom: '8px' }}>
          URL репозитория не указан
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Заголовок */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '15px'
      }}>
        <h3 style={{
          margin: '0',
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--gitlab-text-primary)'
        }}>
          Экспорт ({comments.length})
        </h3>
      </div>

      {/* Статистика */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--gitlab-bg-tertiary)',
          border: '1px solid var(--gitlab-border-light)',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--gitlab-orange)' }}>
            {comments.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gitlab-text-secondary)' }}>
            Комментариев
          </div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--gitlab-bg-tertiary)',
          border: '1px solid var(--gitlab-border-light)',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--gitlab-green)' }}>
            {new Set(comments.map(c => c.filePath)).size}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gitlab-text-secondary)' }}>
            Файлов
          </div>
        </div>
      </div>

      {/* Предпросмотр — на всю высоту, скролл здесь */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '0', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Разделённые предпросмотры по категориям */}
        {categoryPreviews.length > 0 ? (
          categoryPreviews.map(section => (
            <details key={section.key} style={{
              backgroundColor: 'var(--gitlab-bg-tertiary)',
              border: '1px solid var(--gitlab-border-light)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <summary style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', listStyle: 'none' }}>
                <span style={{ fontWeight: 600, color: 'var(--gitlab-text-primary)' }}>
                  {section.title} ({section.count})
                </span>
                <span style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" size="sm" onClick={() => handleCopySection(section.content)}>
                    {copied ? '✅' : '📋'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDownloadSection(section.content, section.key)}>
                    💾
                  </Button>
                </span>
              </summary>
              <div style={{
                whiteSpace: 'pre',
                overflowX: 'auto',
                fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: '13px',
                color: 'var(--gitlab-text-primary)',
                borderTop: '1px solid var(--gitlab-border-light)',
                paddingTop: '8px',
                marginTop: '8px'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre' }}>{section.content}</pre>
              </div>
            </details>
          ))
        ) : (
          // Если категорий нет — один предпросмотр целого отчёта
          <div style={{
            backgroundColor: 'var(--gitlab-bg-tertiary)',
            border: '1px solid var(--gitlab-border-light)',
            borderRadius: '8px',
            padding: '20px',
            whiteSpace: 'pre',
            overflowX: 'auto',
            fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '13px',
            color: 'var(--gitlab-text-primary)'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre' }}>{markdownContent}</pre>
          </div>
        )}
      </div>

    </div>
  );
};
