import { useState } from 'react';
import type { CodeComment, Repository, CommentCategory } from '../types';
import { generateCodeLink } from '../utils/linkUtils';
import { Button, Badge, FormActions, CategorySelector } from './ui';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getContrastTextColor } from '../utils/categoryColors';

interface CommentsPanelProps {
  comments: CodeComment[];
  repository: Repository | null;
  categories: CommentCategory[];
  onUpdateComment: (commentId: string, updates: Partial<CodeComment>) => void;
  onRemoveComment: (commentId: string) => void;
  onClearComments: () => void;
  onAddCategory?: (name: string, color: string) => string;
  onNavigateToComment?: (filePath: string, lineNumber: number) => void;
}

interface CommentItemProps {
  comment: CodeComment;
  repository: Repository | null;
  categories: CommentCategory[];
  onUpdate: (updates: Partial<CodeComment>) => void;
  onRemove: () => void;
  onAddCategory?: (name: string, color: string) => string;
  onNavigateToComment?: (filePath: string, lineNumber: number) => void;
}

const CommentItem = ({ comment, repository, categories, onUpdate, onRemove, onAddCategory, onNavigateToComment }: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment);
  const [editCategoryId, setEditCategoryId] = useState<string | 'new' | ''>(comment.categoryId || '');
  const category = comment.categoryId ? categories.find(c => c.id === comment.categoryId) : undefined;

  const handleSave = () => {
    const updates: Partial<CodeComment> = {
      comment: editText.trim()
    };
    
    if (editCategoryId && editCategoryId !== 'new') {
      updates.categoryId = editCategoryId;
    } else if (!editCategoryId) {
      updates.categoryId = undefined;
    }
    
    onUpdate(updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(comment.comment);
    setEditCategoryId(comment.categoryId || '');
    setIsEditing(false);
  };

  const startEditing = () => {
    setEditText(comment.comment);
    setEditCategoryId(comment.categoryId || '');
    setIsEditing(true);
  };

  const handleCreateCategory = (name: string, color: string) => {
    if (onAddCategory) {
      const categoryId = onAddCategory(name, color);
      setEditCategoryId(categoryId);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCodeLink = () => {
    if (!repository || !repository.baseUrl) return null;
    return generateCodeLink(
      repository,
      comment.filePath,
      '', // больше нет selectedText
      comment.startLine,
      comment.endLine
    );
  };

  return (
    <div className="gitlab-comment">
      {/* Заголовок комментария */}
      <div className="gitlab-comment-header" style={{ 
        display: 'block !important' as any,
        flexDirection: 'column !important' as any 
      }}>
        {/* Первая строка: имя файла */}
        <div style={{ 
          marginBottom: '6px'
        }}>
          <span style={{ 
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--gitlab-text-primary)',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {comment.filePath}
          </span>
        </div>
        
        {/* Вторая строка: бейдж номера строки + категория */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
          minHeight: '20px'
        }}>
          <Badge 
            variant={comment.isFileComment ? 'success' : 'secondary'}
            size="sm"
            style={{ flexShrink: 0 }}
          >
            {comment.isFileComment 
              ? 'файл'
              : comment.startLine === comment.endLine 
                ? `${comment.startLine}`
                : `${comment.startLine}-${comment.endLine}`
            }
          </Badge>
          
          {category && (
            <span style={{
              padding: '3px 8px',
              borderRadius: '12px',
              backgroundColor: category.color,
              color: getContrastTextColor(category.color),
              fontSize: '11px',
              fontWeight: 500,
              border: '1px solid var(--gitlab-border-light)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              display: 'inline-block'
            }}>
              {category.name}
            </span>
          )}
        </div>
        
        {/* Третья строка: кнопки действий */}
        <div style={{ 
          display: 'flex', 
          gap: '4px',
          justifyContent: 'flex-end'
        }}>
          {onNavigateToComment && (
            <Button
              variant="blue"
              size="sm"
              onClick={() => onNavigateToComment(comment.filePath, comment.startLine)}
              title="Перейти к комментарию в коде"
            >
              🔍
            </Button>
          )}
          {getCodeLink() && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(getCodeLink()!, '_blank')}
            >
              🔗
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={startEditing}
          >
            ✏️
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRemove}
          >
            🗑️
          </Button>
        </div>
      </div>

      {/* Комментарий */}
      {isEditing ? (
        <div className="gitlab-comment-body">
          <MarkdownEditor
            value={editText}
            onChange={setEditText}
            rows={3}
            style={{ marginBottom: '6px' }}
          />
          <CategorySelector
            categories={categories}
            selectedCategoryId={editCategoryId}
            onCategoryChange={setEditCategoryId}
            onCreateCategory={handleCreateCategory}
            placeholder="Изменить категорию комментария"
          />
          <FormActions
            onCancel={handleCancel}
            onSubmit={handleSave}
                   submitText="💾"
                   submitVariant="blue"
            cancelText="❌"
          />
        </div>
      ) : (
        <div className="gitlab-comment-body">
          <div style={{
            marginBottom: '8px'
          }}>
            <MarkdownRenderer 
              content={comment.comment}
              style={{
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            />
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--gitlab-text-secondary)'
          }}>
            {formatDate(comment.timestamp)}
          </div>
        </div>
      )}
    </div>
  );
};

export const CommentsPanel = ({ 
  comments, 
  repository,
  categories,
  onUpdateComment, 
  onRemoveComment, 
  onClearComments,
  onAddCategory,
  onNavigateToComment
}: CommentsPanelProps) => {
  // Группировка комментариев по файлам
  const commentsByFile = comments.reduce((acc, comment) => {
    if (!acc[comment.filePath]) {
      acc[comment.filePath] = [];
    }
    acc[comment.filePath].push(comment);
    return acc;
  }, {} as Record<string, CodeComment[]>);

  const totalComments = comments.length;

  if (totalComments === 0) {
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
          Комментариев пока нет
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Заголовок панели */}
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
          Комментарии ({totalComments})
        </h3>
        
               {totalComments > 0 && (
                 <Button
                   variant="secondary"
                   size="sm"
                   onClick={onClearComments}
                 >
                   🗑️
                 </Button>
               )}
      </div>

      {/* Список комментариев */}
      <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
        {Object.entries(commentsByFile).map(([filePath, fileComments]) => (
          <div key={filePath} style={{ marginBottom: '20px' }}>
            {Object.keys(commentsByFile).length > 1 && (
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--gitlab-text-secondary)',
                marginBottom: '10px',
                paddingBottom: '5px',
                borderBottom: '1px solid var(--gitlab-border-light)'
              }}>
                {filePath} ({fileComments.length})
              </div>
            )}
            
                  {fileComments
                    .sort((a, b) => a.startLine - b.startLine)
                    .map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        repository={repository}
                        categories={categories}
                        onUpdate={(updates) => onUpdateComment(comment.id, updates)}
                        onRemove={() => onRemoveComment(comment.id)}
                        onAddCategory={onAddCategory}
                        onNavigateToComment={onNavigateToComment}
                      />
                    ))}
          </div>
        ))}
      </div>
    </div>
  );
};
