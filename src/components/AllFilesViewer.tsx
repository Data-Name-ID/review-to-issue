import React, { useState, memo, useEffect, useRef, useCallback, useMemo } from 'react';
import type { CodeComment, CommentCategory, CommentTemplate } from '../types';
import { HighlightedCode } from './HighlightedCode';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MarkdownEditor } from './MarkdownEditor';
import { TemplateSelector } from './TemplateSelector';
import { Button, Textarea, FormActions, CategorySelector } from './ui';
import { getContrastTextColor } from '../utils/categoryColors';
import { getFileIcon as getFileIconUtil } from '../utils/fileIcons';

interface AllFilesViewerProps {
  files: Array<{ path: string; content: string }>;
  comments: CodeComment[];
  categories?: CommentCategory[];
  templates?: CommentTemplate[];
  onAddCategory?: (name: string, color: string) => string;
  onUseTemplate?: (templateId: string) => string;
  onAddComment: (comment: Omit<CodeComment, 'id' | 'timestamp'>) => void;
  onUpdateComment: (commentId: string, updates: Partial<CodeComment>) => void;
  onDeleteComment: (commentId: string) => void;
  scrollToFile?: string | null;
  onScrollComplete?: () => void;
  currentFile?: string | null;
  onCurrentFileChange?: (filePath: string | null) => void;
  virtualizationEnabled: boolean;
  debugMode: boolean;
}

interface FileViewerProps {
  file: { path: string; content: string };
  comments: CodeComment[];
  categories: CommentCategory[];
  templates: CommentTemplate[];
  onAddCategory?: (name: string, color: string) => string;
  onTemplateRequest?: (editorId: string) => void;
  onAddComment: (comment: Omit<CodeComment, 'id' | 'timestamp'>) => void;
  onUpdateComment: (commentId: string, updates: Partial<CodeComment>) => void;
  onDeleteComment: (commentId: string) => void;
  isHighlighted?: boolean;
  fileIndex: number;
  currentFile?: string | null;
}

interface FileStubProps {
  file: { path: string; content: string };
  comments: CodeComment[];
  fileIndex: number;
  savedHeight?: number; // Сохраненная высота оригинального файла
}

// Заглушка для виртуализированных файлов
const FileStub = memo(({ file, comments, fileIndex, savedHeight }: FileStubProps) => {
  const lines = file.content.split('\n');
  const fileComments = comments.filter(c => c.filePath === file.path);
  const hasComments = fileComments.length > 0;
  
  // Используем сохраненную высоту или приблизительный расчет
  const actualHeight = savedHeight || Math.min(56 + lines.length * 20 + 24, 800);
  
  
  const getFileIcon = (fileName: string) => {
    return getFileIconUtil(fileName, false);
  };

  return (
    <div 
      data-file-index={fileIndex}
      id={`file-${file.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
      className="gitlab-code-container virtualized-file-stub"
      style={{ 
        marginBottom: '24px',
        height: `${actualHeight}px`, // Точная высота вместо minHeight
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--gitlab-bg-tertiary)',
        border: '1px solid var(--gitlab-border-light)',
        borderRadius: '8px',
        opacity: 0.5
      }}
    >
      {/* Заглушка header */}
      <div className="gitlab-code-header" style={{ backgroundColor: 'var(--gitlab-bg-secondary)' }}>
        <div className="d-flex align-center gap-2">
          {React.createElement(getFileIcon(file.path), {
            size: 16,
            style: { color: 'var(--gitlab-text-secondary)' }
          })}
          <span style={{ color: 'var(--gitlab-text-secondary)' }}>{file.path}</span>
        </div>
        <div className="d-flex align-center gap-3 text-secondary" style={{ fontSize: '12px' }}>
          <span>{lines.length} строк</span>
          {hasComments && (
            <span style={{
              backgroundColor: 'var(--gitlab-orange)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px'
            }}>
              {fileComments.length}
            </span>
          )}
        </div>
      </div>
      
      {/* Заглушка контента */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--gitlab-text-muted)',
        fontSize: '12px',
        gap: '6px'
      }}>
        <div style={{
          padding: '8px 16px',
          backgroundColor: 'var(--gitlab-bg-secondary)',
          borderRadius: '6px',
          border: '1px solid var(--gitlab-border-light)'
        }}>
          📄 Файл свернут для производительности
        </div>
      </div>
    </div>
  );
});

const FileViewer = memo(({ file, comments, categories, templates, onAddCategory, onTemplateRequest, onAddComment, onUpdateComment, onDeleteComment, isHighlighted, fileIndex, currentFile }: FileViewerProps) => {
  const [selectedLines, setSelectedLines] = useState<{ start: number; end: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [showNewCommentForm, setShowNewCommentForm] = useState<number | null>(null);
  const [showFileCommentForm, setShowFileCommentForm] = useState(false);
  const [fileCommentText, setFileCommentText] = useState('');
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false);

  // Категории теперь приходят как props

  // Выбор категории для нового комментария
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'new' | ''>('');

  // Выбор категории при редактировании
  const [editCategoryId, setEditCategoryId] = useState<string | 'new' | ''>('');

  // Выбор категории для файлового комментария
  const [fileCategoryId, setFileCategoryId] = useState<string | 'new' | ''>('');
  
  // Позиция курсора для вставки шаблонов
  const [cursorPosition, setCursorPosition] = useState<{ start: number; end: number } | null>(null);
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);

  // Постоянно отслеживаем позицию курсора
  useEffect(() => {
    const handleSelectionChange = () => {
      const activeElement = document.activeElement as HTMLTextAreaElement;
      if (activeElement && activeElement.tagName === 'TEXTAREA' && activeElement.dataset.editorId) {
        const editorId = activeElement.dataset.editorId;
        const position = {
          start: activeElement.selectionStart,
          end: activeElement.selectionEnd
        };
        setActiveEditorId(editorId);
        setCursorPosition(position);
      }
    };

    // Отслеживаем изменения выделения
    document.addEventListener('selectionchange', handleSelectionChange);
    
    // Также отслеживаем клики и фокус
    document.addEventListener('click', handleSelectionChange);
    document.addEventListener('focusin', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('click', handleSelectionChange);
      document.removeEventListener('focusin', handleSelectionChange);
    };
  }, []);

  // Функции для работы с шаблонами
  const handleTemplateRequest = useCallback((editorId: string) => {
    onTemplateRequest?.(editorId);
  }, [onTemplateRequest]);

  // Оптимизация: ограничиваем большие файлы
  const lines = file.content.split('\n');
  const MAX_LINES = 1000; // Показываем максимум 1000 строк для производительности
  const displayLines = lines.slice(0, MAX_LINES);
  const isFileTruncated = lines.length > MAX_LINES;
  
  const fileComments = comments.filter(c => c.filePath === file.path);

  // Функция для вставки текста в место курсора
  const insertTextAtCursor = useCallback((text: string, setter: (value: string) => void, currentValue: string, position?: { start: number; end: number } | null, editorId?: string) => {
    if (position) {
      // Используем сохраненную позицию курсора
      const newValue = currentValue.substring(0, position.start) + text + currentValue.substring(position.end);
      setter(newValue);
      
      // Устанавливаем курсор после вставленного текста
      setTimeout(() => {
        let targetElement: HTMLTextAreaElement | null = null;
        
        if (editorId) {
          // Ищем textarea по ID
          const textarea = document.querySelector(`textarea[data-editor-id="${editorId}"]`) as HTMLTextAreaElement;
          if (textarea) {
            targetElement = textarea;
          }
        }
        
        if (!targetElement) {
          // Fallback: ищем активный textarea
          targetElement = document.activeElement as HTMLTextAreaElement;
        }
        
        if (targetElement && targetElement.tagName === 'TEXTAREA') {
          targetElement.focus();
          targetElement.setSelectionRange(position.start + text.length, position.start + text.length);
        }
      }, 0);
    } else {
      // Fallback: находим активный textarea
      const activeElement = document.activeElement as HTMLTextAreaElement;
      if (activeElement && activeElement.tagName === 'TEXTAREA') {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
        setter(newValue);
        
        // Устанавливаем курсор после вставленного текста
        setTimeout(() => {
          activeElement.focus();
          activeElement.setSelectionRange(start + text.length, start + text.length);
        }, 0);
      } else {
        // Если нет активного textarea, просто добавляем в конец
        setter(currentValue + text);
      }
    }
  }, []);

  // Обработчик вставки шаблонов
  useEffect(() => {
    const handleInsertTemplate = (event: CustomEvent<{ editorId: string; content: string }>) => {
      const { editorId, content } = event.detail;
      
      // Используем активный редактор и позицию курсора
      const currentEditorId = activeEditorId || editorId;
      const currentPosition = cursorPosition;
      
      if (currentEditorId === `file-comment-${file.path}`) {
        insertTextAtCursor(content, setFileCommentText, fileCommentText, currentPosition, currentEditorId);
      } else if (currentEditorId.startsWith(`new-comment-${file.path}-`)) {
        insertTextAtCursor(content, setNewCommentText, newCommentText, currentPosition, currentEditorId);
      } else if (currentEditorId.startsWith(`edit-comment-`)) {
        insertTextAtCursor(content, setEditText, editText, currentPosition, currentEditorId);
      }
    };

    window.addEventListener('insertTemplate', handleInsertTemplate as EventListener);
    
    return () => {
      window.removeEventListener('insertTemplate', handleInsertTemplate as EventListener);
    };
  }, [file.path, fileCommentText, newCommentText, editText, insertTextAtCursor, cursorPosition, activeEditorId]);

  const getFileIcon = (fileName: string) => {
    return getFileIconUtil(fileName, false);
  };

  const isMarkdownFile = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext === 'md' || ext === 'markdown' || fileName.toLowerCase().includes('readme');
  };

  const isReadmeFile = (filePath: string) => {
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';
    const readmePatterns = [
      /^readme\.md$/i,
      /^readme\.markdown$/i,
      /^readme\.txt$/i,
      /^readme$/i
    ];
    return readmePatterns.some(pattern => pattern.test(fileName));
  };

  const handleMouseDown = (lineNumber: number) => {
    setSelectedLines({ start: lineNumber, end: lineNumber });
    setIsSelecting(true);
  };

  const handleMouseEnter = (lineNumber: number) => {
    if (isSelecting && selectedLines) {
      setSelectedLines({
        start: selectedLines.start,
        end: lineNumber
      });
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    if (selectedLines) {
      const endLine = Math.max(selectedLines.start, selectedLines.end);
      setShowNewCommentForm(endLine);
      setNewCommentText('');
      setSelectedCategoryId('');
    }
  };

  const handleAddComment = () => {
    if (newCommentText.trim() && selectedLines) {
      const startLine = Math.min(selectedLines.start, selectedLines.end);
      const endLine = Math.max(selectedLines.start, selectedLines.end);
      
      let categoryId: string | undefined = undefined;
      if (selectedCategoryId && selectedCategoryId !== 'new') {
        categoryId = selectedCategoryId;
      }

      onAddComment({
        filePath: file.path,
        startLine: startLine,
        endLine: endLine,
        comment: newCommentText.trim(),
        ...(categoryId ? { categoryId } : {})
      });
      setNewCommentText('');
      setShowNewCommentForm(null);
      setSelectedLines(null);
      setSelectedCategoryId('');
    }
  };

  const handleCreateCategory = (name: string, color: string) => {
    if (onAddCategory) {
      const categoryId = onAddCategory(name, color);
      setSelectedCategoryId(categoryId);
    }
  };

  const handleEditComment = (commentId: string, newText: string) => {
    const updates: Partial<CodeComment> = {};
    if (newText.trim()) updates.comment = newText.trim();
    // Обновление категории при редактировании
    if (editCategoryId && editCategoryId !== 'new') {
      updates.categoryId = editCategoryId;
    }
    
    onUpdateComment(commentId, updates);
    setEditingComment(null);
    setEditText('');
    setEditCategoryId('');
  };

  const handleEditCreateCategory = (name: string, color: string) => {
    if (onAddCategory) {
      const categoryId = onAddCategory(name, color);
      setEditCategoryId(categoryId);
    }
  };

  const startEditComment = (comment: CodeComment) => {
    setEditingComment(comment.id);
    setEditText(comment.comment);
    setEditCategoryId(comment.categoryId || '');
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditText('');
    setEditCategoryId('');
  };

  const isLineSelected = (lineNumber: number) => {
    if (!selectedLines) return false;
    const start = Math.min(selectedLines.start, selectedLines.end);
    const end = Math.max(selectedLines.start, selectedLines.end);
    return lineNumber >= start && lineNumber <= end;
  };

  const getLineComments = useCallback((lineNumber: number) => {
    return fileComments.filter(c => !c.isFileComment && lineNumber >= c.startLine && lineNumber <= c.endLine);
  }, [fileComments]);
  
  const getFileComments = useCallback(() => {
    return fileComments.filter(c => c.isFileComment);
  }, [fileComments]);
  
  const handleAddFileComment = useCallback(() => {
    if (fileCommentText.trim()) {
      onAddComment({
        filePath: file.path,
        startLine: 1,
        endLine: lines.length,
        comment: fileCommentText.trim(),
        isFileComment: true,
        categoryId: fileCategoryId && fileCategoryId !== 'new' ? fileCategoryId : undefined
      });
      setFileCommentText('');
      setFileCategoryId('');
      setShowFileCommentForm(false);
    }
  }, [fileCommentText, fileCategoryId, file.path, lines.length, onAddComment]);

  const handleFileCreateCategory = (name: string, color: string) => {
    if (onAddCategory) {
      const categoryId = onAddCategory(name, color);
      setFileCategoryId(categoryId);
    }
  };


  return (
    <div 
      data-file-index={fileIndex}
      id={`file-${file.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
      className={`gitlab-code-container ${isHighlighted ? 'highlighted' : ''} ${currentFile === file.path ? 'selected' : ''}`} 
      style={{ 
        marginBottom: '24px',
        transition: 'box-shadow 0.3s ease, border-left 0.3s ease',
        ...(isHighlighted && {
          boxShadow: '0 0 0 2px var(--gitlab-orange)',
          borderRadius: '8px'
        }),
        ...(currentFile === file.path && {
          borderLeft: '4px solid var(--gitlab-blue)',
          backgroundColor: 'rgba(31, 117, 203, 0.02)'
        })
      }}
    >
      {/* GitLab File Header */}
      <div className="gitlab-code-header">
        <div className="d-flex align-center gap-2">
          {React.createElement(getFileIcon(file.path), {
            size: 16,
            style: { color: 'var(--gitlab-text-secondary)' }
          })}
          <span style={{
            ...(isReadmeFile(file.path) && {
              fontWeight: '600',
              color: 'var(--gitlab-blue)'
            })
          }}>
            {file.path}
            {isReadmeFile(file.path) && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 6px',
                backgroundColor: 'var(--gitlab-blue)',
                color: 'white',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                README
              </span>
            )}
          </span>
          {isMarkdownFile(file.path) && (
            <Button
              variant={isMarkdownPreview ? 'blue' : 'secondary'}
              size="sm"
              onClick={() => setIsMarkdownPreview(!isMarkdownPreview)}
              title={isMarkdownPreview ? 'Показать исходный код' : 'Показать предпросмотр'}
              style={{ marginLeft: '8px' }}
            >
              {isMarkdownPreview ? '📝' : '👁️'}
            </Button>
          )}
        </div>
        <div className="d-flex align-center gap-3 text-secondary" style={{ fontSize: '12px' }}>
          <span>
            {isFileTruncated ? `${displayLines.length} из ${lines.length} строк` : `${lines.length} строк`}
          </span>
          {fileComments.filter(c => !c.isFileComment).length > 0 && (
            <span style={{
              backgroundColor: 'var(--gitlab-orange)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px'
            }}>
              {fileComments.filter(c => !c.isFileComment).length}
            </span>
          )}
          {getFileComments().length > 0 && (
            <span style={{
              backgroundColor: 'var(--gitlab-green)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px'
            }}>
              файл: {getFileComments().length}
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFileCommentForm(!showFileCommentForm)}
            title="Комментировать весь файл"
          >
                   💬
          </Button>
        </div>
      </div>

      {/* Форма комментирования файла */}
      {showFileCommentForm && (
        <div className="gitlab-comment" style={{ margin: '0', borderRadius: '0', borderTop: 'none' }}>
          <div className="gitlab-comment-header">
            <span>Комментарий ко всему файлу</span>
          </div>
          <div className="gitlab-comment-body">
          <MarkdownEditor
            value={fileCommentText}
            onChange={setFileCommentText}
            placeholder="Введите комментарий ко всему файлу..."
            autoFocus
            rows={5}
            showTemplateButton={templates && templates.length > 0}
            onTemplateRequest={() => handleTemplateRequest(`file-comment-${file.path}`)}
            editorId={`file-comment-${file.path}`}
            style={{ marginBottom: '6px' }}
          />
          <CategorySelector
            categories={categories}
            selectedCategoryId={fileCategoryId}
            onCategoryChange={setFileCategoryId}
            onCreateCategory={handleFileCreateCategory}
            placeholder="Категория (опционально)"
          />
            <FormActions
              onCancel={() => {
                setShowFileCommentForm(false);
                setFileCommentText('');
                setFileCategoryId('');
              }}
              onSubmit={handleAddFileComment}
              submitText="➕"
              submitVariant="blue"
              submitDisabled={!fileCommentText.trim()}
            />
          </div>
        </div>
      )}

      {/* Отображение комментариев к файлу */}
      {getFileComments().map((comment) => {
        const category = comment.categoryId ? categories.find(c => c.id === comment.categoryId) : undefined;
        return (
          <div key={comment.id} className="gitlab-comment" style={{ margin: '0', borderRadius: '0', borderTop: 'none' }}>
            <div className="gitlab-comment-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span>Комментарий к файлу</span>
                {/* Категория в заголовке */}
                {category && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '10px',
                    backgroundColor: category.color,
                    color: getContrastTextColor(category.color),
                    fontSize: '10px',
                    fontWeight: 500,
                    border: '1px solid var(--gitlab-border-light)'
                  }}>
                    {category.name}
                  </span>
                )}
              </div>
              <div className="gitlab-comment-actions">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => startEditComment(comment)}
                >
                  ✏️
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onDeleteComment(comment.id)}
                >
                  🗑️
                </Button>
              </div>
            </div>
          
          {editingComment === comment.id ? (
            <div className="gitlab-comment-body">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                style={{ marginBottom: '0' }}
              />
              <CategorySelector
                categories={categories}
                selectedCategoryId={editCategoryId}
                onCategoryChange={setEditCategoryId}
                onCreateCategory={handleEditCreateCategory}
                placeholder="Категория (не выбрано)"
              />
              <FormActions
                onCancel={cancelEdit}
                onSubmit={() => handleEditComment(comment.id, editText)}
                submitText="💾"
                submitVariant="blue"
                submitDisabled={!editText.trim()}
              />
            </div>
          ) : (
            <div className="gitlab-comment-body">
              <MarkdownRenderer 
                content={comment.comment}
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              />
            </div>
          )}
          </div>
        );
      })}

      {/* GitLab Code Block */}
      {isMarkdownFile(file.path) && isMarkdownPreview ? (
        <div style={{
          backgroundColor: 'var(--gitlab-code-bg)',
          padding: '16px',
          maxWidth: '100%',
          overflow: 'auto'
        }}>
          <MarkdownRenderer content={file.content} />
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--gitlab-code-bg)',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
        {displayLines.map((line, index) => {
          const lineNumber = index + 1;
          const lineComments = getLineComments(lineNumber);
          const hasComments = lineComments.length > 0;
          const isSelected = isLineSelected(lineNumber);
          
          return (
            <div key={lineNumber}>
              {/* GitLab Code Line */}
              <div className={`gitlab-code-line ${isSelected ? 'selected' : ''} ${hasComments ? 'has-comment' : ''}`}>
                {/* Line Number - Interactive for comments */}
                <div 
                  className="gitlab-code-line-number"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleMouseDown(lineNumber);
                  }}
                  onMouseEnter={() => {
                    if (isSelecting) {
                      handleMouseEnter(lineNumber);
                    }
                  }}
                  onMouseUp={handleMouseUp}
                  style={{ 
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  {lineNumber}
                </div>
                
                {/* Code Content - Selectable for copying */}
                <div 
                  className="gitlab-code-content"
                  style={{ 
                    userSelect: 'text',
                    cursor: 'text'
                  }}
                >
                  <HighlightedCode 
                    line={line}
                    fileName={file.path}
                  />
                </div>
              </div>

              {/* GitLab Comment Form */}
              {showNewCommentForm === lineNumber && (
                <div className="gitlab-comment">
                  <div className="gitlab-comment-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedLines && (
                        <span>
                          Комментарий{' '}
                          {Math.min(selectedLines.start, selectedLines.end) === Math.max(selectedLines.start, selectedLines.end)
                            ? `${Math.min(selectedLines.start, selectedLines.end)}`
                            : `${Math.min(selectedLines.start, selectedLines.end)}-${Math.max(selectedLines.start, selectedLines.end)}`
                          }
                        </span>
                      )}
                      {/* Предпросмотр выбранной категории */}
                      {selectedCategoryId && selectedCategoryId !== 'new' && (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: categories.find(c => c.id === selectedCategoryId)?.color || '#ccc',
                          color: getContrastTextColor(categories.find(c => c.id === selectedCategoryId)?.color || '#ccc'),
                          fontSize: '10px',
                          fontWeight: 500,
                          border: '1px solid var(--gitlab-border-light)'
                        }}>
                          {categories.find(c => c.id === selectedCategoryId)?.name || ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="gitlab-comment-body">
                    <MarkdownEditor
                      value={newCommentText}
                      onChange={setNewCommentText}
                      placeholder="Введите ваш комментарий..."
                      autoFocus
                      rows={5}
                      showTemplateButton={templates && templates.length > 0}
                      onTemplateRequest={() => handleTemplateRequest(`new-comment-${file.path}-${lineNumber}`)}
                      editorId={`new-comment-${file.path}-${lineNumber}`}
                      style={{ marginBottom: '6px' }}
                    />
                    <CategorySelector
                      categories={categories}
                      selectedCategoryId={selectedCategoryId}
                      onCategoryChange={setSelectedCategoryId}
                      onCreateCategory={handleCreateCategory}
                      placeholder="Категория (опционально)"
                    />
                    <FormActions
                      onCancel={() => {
                        setShowNewCommentForm(null);
                        setNewCommentText('');
                        setSelectedLines(null);
                      }}
                      onSubmit={handleAddComment}
                      submitText="➕"
                      submitVariant="blue"
                      submitDisabled={!newCommentText.trim()}
                    />
                  </div>
                </div>
              )}

              {/* GitLab Existing Comments */}
              {lineComments
                .filter(comment => comment.endLine === lineNumber) // Показываем только на последней строке диапазона
                .map((comment) => {
                  const isRange = comment.startLine !== comment.endLine;
                  const category = comment.categoryId ? categories.find(c => c.id === comment.categoryId) : undefined;
                  return (
                          <div key={comment.id} className="gitlab-comment">
                            <div className="gitlab-comment-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <span>
                                  {isRange ? `${comment.startLine}-${comment.endLine}` : `${comment.startLine}`}
                                </span>
                                {/* Категория в заголовке */}
                                {category && (
                                  <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '10px',
                                    backgroundColor: category.color,
                                    color: getContrastTextColor(category.color),
                                    fontSize: '10px',
                                    fontWeight: 500,
                                    border: '1px solid var(--gitlab-border-light)'
                                  }}>
                                    {category.name}
                                  </span>
                                )}
                              </div>
                              <div className="gitlab-comment-actions">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => startEditComment(comment)}
                                >
                                  ✏️
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => onDeleteComment(comment.id)}
                                >
                                  🗑️
                                </Button>
                              </div>
                            </div>
                      
                      {editingComment === comment.id ? (
                        <div className="gitlab-comment-body">
                          <MarkdownEditor
                            value={editText}
                            onChange={setEditText}
                            rows={5}
                            style={{ marginBottom: '6px' }}
                            showTemplateButton={templates && templates.length > 0}
                            onTemplateRequest={() => handleTemplateRequest(`edit-comment-${comment.id}`)}
                            editorId={`edit-comment-${comment.id}`}
                          />
                          <CategorySelector
                            categories={categories}
                            selectedCategoryId={editCategoryId}
                            onCategoryChange={setEditCategoryId}
                            onCreateCategory={handleEditCreateCategory}
                            placeholder="Категория (не выбрано)"
                          />
                          <FormActions
                            onCancel={cancelEdit}
                            onSubmit={() => handleEditComment(comment.id, editText)}
                            submitText="💾"
                            submitVariant="blue"
                            submitDisabled={!editText.trim()}
                          />
                        </div>
                        ) : (
                          <div className="gitlab-comment-body">
                            <MarkdownRenderer 
                              content={comment.comment}
                              style={{
                                fontSize: '14px',
                                lineHeight: '1.5'
                              }}
                            />
                          </div>
                        )}
                    </div>
                  );
                })}
            </div>
          );
        })}
        
        {/* Уведомление об обрезании файла */}
        {isFileTruncated && (
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--gitlab-bg-tertiary)',
            border: '1px solid var(--gitlab-border-light)',
            borderRadius: '6px',
            margin: '8px',
            textAlign: 'center',
            color: 'var(--gitlab-text-secondary)',
            fontSize: '14px'
          }}>
            📄 Показаны первые {MAX_LINES} из {lines.length} строк для оптимизации производительности
          </div>
        )}
      </div>
      )}

    </div>
  );
});

export const AllFilesViewer = ({ files, comments, categories, templates, onAddCategory, onUseTemplate, onAddComment, onUpdateComment, onDeleteComment, scrollToFile, onScrollComplete, currentFile, onCurrentFileChange, virtualizationEnabled, debugMode }: AllFilesViewerProps) => {
  // Сортируем файлы: README файлы в начале, затем остальные
  const sortedFiles = useMemo(() => {
    const isReadmeFile = (filePath: string) => {
      const fileName = filePath.split('/').pop()?.toLowerCase() || '';
      const readmePatterns = [
        /^readme\.md$/i,
        /^readme\.markdown$/i,
        /^readme\.txt$/i,
        /^readme$/i
      ];
      return readmePatterns.some(pattern => pattern.test(fileName));
    };

    return [...files].sort((a, b) => {
      const aIsReadme = isReadmeFile(a.path);
      const bIsReadme = isReadmeFile(b.path);
      
      // README файлы в начале
      if (aIsReadme && !bIsReadme) return -1;
      if (!aIsReadme && bIsReadme) return 1;
      
      // Остальные файлы по алфавиту
      return a.path.localeCompare(b.path);
    });
  }, [files]);

  const [highlightedFile, setHighlightedFile] = useState<string | null>(null);
  const [visibleFileCount, setVisibleFileCount] = useState(20); // Начинаем с 20 файлов
  const [virtualizedFiles, setVirtualizedFiles] = useState<Set<number>>(new Set()); // Индексы файлов для показа заглушек
  const [pendingUnloadFiles, setPendingUnloadFiles] = useState<Set<number>>(new Set()); // Файлы ожидающие выгрузки
  
  // Состояние для селектора шаблонов
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [activeCommentEditor, setActiveCommentEditor] = useState<string | null>(null); // ID активного редактора
  const [fileHeights, setFileHeights] = useState<Map<number, number>>(new Map()); // Сохраненные высоты файлов

  // Функция для проверки видимости файла
  const isFileVisible = useCallback((filePath: string): boolean => {
    const fileId = `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const element = document.getElementById(fileId);
    
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Файл считается видимым, если хотя бы 30% его высоты видно на экране
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const threshold = element.offsetHeight * 0.3;
    
    return visibleHeight >= threshold && rect.bottom > 0 && rect.top < windowHeight;
  }, []);

  // Обработчик скролла для сброса выбора файла
  useEffect(() => {
    if (!currentFile || !onCurrentFileChange) return;

    const handleScroll = () => {
      // Проверяем видимость текущего выбранного файла
      if (!isFileVisible(currentFile)) {
        onCurrentFileChange(null); // Сбрасываем выбор
      }
    };

    // Добавляем обработчик с дебаунсом
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 150);
    };

    window.addEventListener('scroll', debouncedHandleScroll);
    
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
      clearTimeout(timeoutId);
    };
  }, [currentFile, onCurrentFileChange, isFileVisible]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Функция для загрузки больше файлов
  const loadMoreFiles = useCallback(() => {
    setVisibleFileCount(prev => Math.min(prev + 20, files.length));
  }, [files.length]);

  // Функции для работы с шаблонами
  const handleTemplateRequest = useCallback((editorId: string) => {
    setActiveCommentEditor(editorId);
    setShowTemplateSelector(true);
  }, []);

  const handleTemplateSelect = useCallback((content: string, templateId?: string) => {
    if (activeCommentEditor && onUseTemplate && templateId) {
      // Обновляем счетчик использования шаблона
      onUseTemplate(templateId);
      
      // Используем глобальный хук для обновления содержимого активного редактора
      const event = new CustomEvent('insertTemplate', {
        detail: { editorId: activeCommentEditor, content }
      });
      window.dispatchEvent(event);
    }
    setShowTemplateSelector(false);
    setActiveCommentEditor(null);
  }, [activeCommentEditor, onUseTemplate]);

  const handleTemplateSelectorClose = useCallback(() => {
    setShowTemplateSelector(false);
    setActiveCommentEditor(null);
  }, []);


  // Функция сохранения высоты файла перед виртуализацией
  const saveFileHeight = useCallback((fileIndex: number) => {
    const element = document.querySelector(`[data-file-index="${fileIndex}"]`);
    if (element && !element.classList.contains('virtualized-file-stub')) {
      const height = element.getBoundingClientRect().height;
      setFileHeights(prev => {
        const newMap = new Map(prev);
        newMap.set(fileIndex, height);
        return newMap;
      });
    }
  }, []);

  // Принудительная виртуализация всех файлов кроме видимых
  // (удалено) forceVirtualizeAll — не используется

  // Виртуализация файлов с умной предзагрузкой и отложенной выгрузкой
  useEffect(() => {
    if (!virtualizationEnabled || !containerRef.current || files.length === 0 || visibleFileCount <= 15) {
      // Если виртуализация отключена или файлов мало - очищаем виртуализированные
      setVirtualizedFiles(new Set());
      setFileHeights(new Map()); // Очищаем сохраненные высоты
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    const unloadDelays = new Map<number, ReturnType<typeof setTimeout>>(); // Отложенная выгрузка
    
    // Observer для предзагрузки - большая зона
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const fileIndex = parseInt(entry.target.getAttribute('data-file-index') || '0');
          
          if (entry.isIntersecting) {
            // Файл в зоне предзагрузки - загружаем заранее
            const delay = unloadDelays.get(fileIndex);
            if (delay) {
              clearTimeout(delay); // Отменяем отложенную выгрузку
              unloadDelays.delete(fileIndex);
              setPendingUnloadFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(fileIndex);
                return newSet;
              });
            }
            
            setVirtualizedFiles(prev => {
              if (prev.has(fileIndex)) {
                const newSet = new Set(prev);
                newSet.delete(fileIndex);
                return newSet;
              }
              return prev;
            });
          }
        });
      },
      { 
        root: null,
        rootMargin: '1500px', // Очень большая зона предзагрузки - файлы загружаются заранее
        threshold: 0
      }
    );
    
    // Observer для выгрузки - меньшая зона
    const unloadObserver = new IntersectionObserver(
      (entries) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          entries.forEach((entry) => {
            const fileIndex = parseInt(entry.target.getAttribute('data-file-index') || '0');
            
            if (!entry.isIntersecting) {
              // Файл вышел из зоны выгрузки - отложенная выгрузка через 3 секунды
              if (!unloadDelays.has(fileIndex)) {
                const delay = setTimeout(() => {
                  // Сохраняем высоту перед виртуализацией
                  saveFileHeight(fileIndex);
                  
                  setVirtualizedFiles(prev => {
                    if (!prev.has(fileIndex)) {
                      const newSet = new Set(prev);
                      newSet.add(fileIndex);
                      return newSet;
                    }
                    return prev;
                  });
                  unloadDelays.delete(fileIndex);
                  setPendingUnloadFiles(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(fileIndex);
                    return newSet;
                  });
                }, 3000); // Выгрузка через 3 секунды
                
                unloadDelays.set(fileIndex, delay);
                setPendingUnloadFiles(prev => {
                  const newSet = new Set(prev);
                  newSet.add(fileIndex);
                  return newSet;
                });
              }
            } else {
              // Файл вернулся в зону выгрузки - отменяем отложенную выгрузку
              const delay = unloadDelays.get(fileIndex);
              if (delay) {
                clearTimeout(delay);
                unloadDelays.delete(fileIndex);
                setPendingUnloadFiles(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(fileIndex);
                  return newSet;
                });
              }
            }
          });
          
        }, 200); // Дебаунс для стабильности
      },
      { 
        root: null,
        rootMargin: '600px', // Меньшая зона выгрузки
        threshold: 0
      }
    );

    // Функция для подключения observer'ов ко всем файлам
    const connectObservers = () => {
      if (!containerRef.current) return;
      
      const fileElements = containerRef.current.querySelectorAll('[data-file-index]');
           fileElements.forEach(element => {
             preloadObserver.observe(element);
             unloadObserver.observe(element);
           });
    };

    // Быстрая инициализация
    const observerTimeoutId = setTimeout(connectObservers, 50);
    
    // Переподключаем observers при изменении DOM (когда файлы переключаются между заглушками и полными)
    const mutationObserver = new MutationObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(connectObservers, 100);
    });
    
    if (containerRef.current) {
      mutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-file-index']
      });
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(observerTimeoutId);
      
      // Очищаем все отложенные выгрузки
      unloadDelays.forEach(delay => clearTimeout(delay));
      unloadDelays.clear();
      setPendingUnloadFiles(new Set());
      
      preloadObserver.disconnect();
      unloadObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [files.length, visibleFileCount, virtualizationEnabled, saveFileHeight]);

  // Запасной механизм на scroll с умной предзагрузкой
  useEffect(() => {
    if (!virtualizationEnabled || visibleFileCount <= 15) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;
    const unloadTimers = new Map<number, ReturnType<typeof setTimeout>>();
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const preloadViewport = {
          top: window.scrollY - 1500, // Большой буфер для предзагрузки
          bottom: window.scrollY + window.innerHeight + 1500
        };
        
        const unloadViewport = {
          top: window.scrollY - 600, // Меньший буфер для выгрузки
          bottom: window.scrollY + window.innerHeight + 600
        };
        
        // Проверяем каждый файл
        for (let i = 0; i < Math.min(visibleFileCount, sortedFiles.length); i++) {
          const element = document.querySelector(`[data-file-index="${i}"]`);
          if (element) {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top + window.scrollY;
            const elementBottom = rect.bottom + window.scrollY;
            
            // Предзагрузка: если файл в большой зоне - загружаем немедленно
            if (elementTop < preloadViewport.bottom && elementBottom > preloadViewport.top) {
              // Отменяем запланированную выгрузку
              const timer = unloadTimers.get(i);
              if (timer) {
                clearTimeout(timer);
                unloadTimers.delete(i);
              }
              
              // Загружаем если еще не загружен
              setVirtualizedFiles(prev => {
                if (prev.has(i)) {
                  const newSet = new Set(prev);
                  newSet.delete(i);
                  return newSet;
                }
                return prev;
              });
            }
            // Выгрузка: если файл вне маленькой зоны - планируем выгрузку с задержкой
            else if (elementBottom < unloadViewport.top || elementTop > unloadViewport.bottom) {
              if (!unloadTimers.has(i)) {
                const timer = setTimeout(() => {
                  // Сохраняем высоту перед виртуализацией
                  saveFileHeight(i);
                  
                  setVirtualizedFiles(prev => {
                    if (!prev.has(i)) {
                      const newSet = new Set(prev);
                      newSet.add(i);
                      return newSet;
                    }
                    return prev;
                  });
                  unloadTimers.delete(i);
                }, 2000); // 2 секунды задержки
                
                unloadTimers.set(i, timer);
              }
            }
          }
        }
      }, 100); // Быстрый отклик для scroll
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Запускаем сразу для текущего состояния
    handleScroll();

    return () => {
      clearTimeout(scrollTimeout);
      // Очищаем все таймеры выгрузки
      unloadTimers.forEach(timer => clearTimeout(timer));
      unloadTimers.clear();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [virtualizationEnabled, visibleFileCount, files.length, saveFileHeight]);

  // Автоматическая подгрузка при достижении сентинела
  useEffect(() => {
    if (!sentinelRef.current || visibleFileCount >= files.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMoreFiles();
        }
      },
      { rootMargin: '500px' } // Загружаем заранее
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [visibleFileCount, files.length, loadMoreFiles]);

  // Сброс счетчика файлов при изменении списка файлов
  useEffect(() => {
    if (files.length > 0 && visibleFileCount > files.length) {
      setVisibleFileCount(Math.min(20, files.length));
    }
  }, [files.length, visibleFileCount]);
  
  useEffect(() => {
    if (scrollToFile) {
      // Найдем индекс файла в списке
      const fileIndex = files.findIndex(file => file.path === scrollToFile);
      
      if (fileIndex !== -1) {
        // Если файл находится за пределами видимого диапазона, увеличим счетчик
        if (fileIndex >= visibleFileCount) {
          setVisibleFileCount(fileIndex + 10);
        }
        
        // Убираем файл из виртуализированных для принудительной загрузки
        if (virtualizedFiles.has(fileIndex)) {
          setVirtualizedFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(fileIndex);
            return newSet;
          });
        }
        
        // Небольшая задержка для обновления DOM
        setTimeout(() => {
          const fileId = `file-${scrollToFile.replace(/[^a-zA-Z0-9]/g, '-')}`;
          const element = document.getElementById(fileId);
          
          if (element) {
            // Подсвечиваем файл
            setHighlightedFile(scrollToFile);
            
            // Плавно прокручиваем к файлу
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
            
            // Убираем подсветку через 2 секунды
            setTimeout(() => {
              setHighlightedFile(null);
            }, 2000);
            
            // Уведомляем родительский компонент о завершении скролла
            if (onScrollComplete) {
              onScrollComplete();
            }
          }
        }, 150);
      }
    }
  }, [scrollToFile, files, visibleFileCount, virtualizedFiles, onScrollComplete]);

  if (files.length === 0) {
    return (
      <div style={{
        padding: '60px 40px',
        textAlign: 'center',
        backgroundColor: 'var(--gitlab-bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--gitlab-border-light)',
        maxWidth: '100%',
        overflow: 'hidden'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📄</div>
        <h3 className="text-primary" style={{
          fontSize: '20px',
          fontWeight: '600',
          margin: '0 0 12px 0'
        }}>
          Файлы не загружены
        </h3>
        <p className="text-secondary" style={{
          fontSize: '16px',
          margin: '0'
        }}>
          Выберите файл в боковой панели для просмотра
        </p>
      </div>
    );
  }

    return (
      <div ref={containerRef} style={{ maxWidth: '100%', overflow: 'hidden' }}>

        {/* Закрепленная дебаг панель */}
        {debugMode && files.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            backgroundColor: 'var(--gitlab-bg-secondary)',
            border: '1px solid var(--gitlab-border-light)',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '12px',
            color: 'var(--gitlab-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '280px',
            maxWidth: '350px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ 
              fontWeight: '600', 
              color: 'var(--gitlab-text-primary)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📊 Debug Panel
              <div style={{
                fontSize: '10px',
                backgroundColor: 'var(--gitlab-blue)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '10px'
              }}>
                {virtualizationEnabled ? 'VIRTUAL' : 'DIRECT'}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>📂 Всего файлов:</span>
              <span style={{ fontWeight: '600' }}>{files.length}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>👁️ Видимых:</span>
              <span style={{ fontWeight: '600' }}>{Math.min(visibleFileCount, files.length)}</span>
            </div>
            
            {virtualizationEnabled && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>✅ Загружено:</span>
                  <span style={{ fontWeight: '600', color: 'var(--gitlab-green)' }}>
                    {visibleFileCount - virtualizedFiles.size}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>📦 Свернуто:</span>
                  <span style={{ fontWeight: '600', color: 'var(--gitlab-orange)' }}>
                    {virtualizedFiles.size}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>⏳ Ожидают выгрузки:</span>
                  <span style={{ fontWeight: '600', color: 'var(--gitlab-blue)' }}>
                    {pendingUnloadFiles.size}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>💾 Сохранено высот:</span>
                  <span style={{ fontWeight: '600' }}>{fileHeights.size}</span>
                </div>
              </>
            )}
            
            <div style={{ 
              marginTop: '8px', 
              paddingTop: '8px', 
              borderTop: '1px solid var(--gitlab-border-light)',
              fontSize: '11px',
              color: 'var(--gitlab-text-muted)'
            }}>
              📈 Производительность: {virtualizationEnabled ? 'Оптимизировано' : 'Все загружено'}
            </div>
          </div>
        )}

        {sortedFiles.slice(0, visibleFileCount).map((file, index) => {
          const isVirtualized = virtualizationEnabled && virtualizedFiles.has(index);
          
          return isVirtualized ? (
            <FileStub
              key={`stub-${file.path}`}
              file={file}
              comments={comments}
              fileIndex={index}
              savedHeight={fileHeights.get(index)} // Передаем сохраненную высоту
            />
          ) : (
            <FileViewer
              key={file.path}
              file={file}
              comments={comments}
              categories={categories || []}
              templates={templates || []}
              onAddCategory={onAddCategory}
              onTemplateRequest={handleTemplateRequest}
              onAddComment={onAddComment}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              isHighlighted={highlightedFile === file.path}
              fileIndex={index}
              currentFile={currentFile}
            />
          );
        })}
      
      {/* Сентинел для автоматической подгрузки */}
      {visibleFileCount < files.length && (
        <div 
          ref={sentinelRef}
          style={{
            padding: '20px',
            textAlign: 'center',
            backgroundColor: 'var(--gitlab-bg-tertiary)',
            border: '1px solid var(--gitlab-border-light)',
            borderRadius: '8px',
            margin: '20px 0',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gitlab-text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="loading-spinner" style={{
              width: '16px',
              height: '16px',
              border: '2px solid var(--gitlab-border-light)',
              borderTop: '2px solid var(--gitlab-orange)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Загрузка файлов... ({visibleFileCount} из {sortedFiles.length})
          </div>
        </div>
      )}
      
      {/* Дополнительная кнопка для ручной загрузки */}
      {visibleFileCount < sortedFiles.length && (
        <div style={{
          padding: '10px 20px',
          textAlign: 'center'
        }}>
          <Button
            variant="secondary"
            onClick={loadMoreFiles}
          >
            📂+
          </Button>
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector
          templates={templates || []}
          onSelectTemplate={handleTemplateSelect}
          onClose={handleTemplateSelectorClose}
        />
      )}
    </div>
  );
};
