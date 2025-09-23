import { useState } from 'react';
import type { CodeComment, Repository, CommentCategory } from '../types';
import { generateCodeLink } from '../utils/linkUtils';
import { Button, Badge, Textarea, FormActions } from './ui';
import { getContrastTextColor } from '../utils/categoryColors';

interface CommentsPanelProps {
  comments: CodeComment[];
  repository: Repository | null;
  categories: CommentCategory[];
  onUpdateComment: (commentId: string, updates: Partial<CodeComment>) => void;
  onRemoveComment: (commentId: string) => void;
  onClearComments: () => void;
}

interface CommentItemProps {
  comment: CodeComment;
  repository: Repository | null;
  categories: CommentCategory[];
  onUpdate: (updates: Partial<CodeComment>) => void;
  onRemove: () => void;
}

const CommentItem = ({ comment, repository, categories, onUpdate, onRemove }: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment);
  const category = comment.categoryId ? categories.find(c => c.id === comment.categoryId) : undefined;

  const handleSave = () => {
    onUpdate({
      comment: editText.trim()
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(comment.comment);
    setIsEditing(false);
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
      <div className="gitlab-comment-header">
        <div className="d-flex align-center gap-2">
          <span style={{ 
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--gitlab-text-primary)'
          }}>
            {comment.filePath}
          </span>
                 <Badge 
                   variant={comment.isFileComment ? 'success' : 'secondary'}
                   size="sm"
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
              marginLeft: '6px',
              padding: '3px 8px',
              borderRadius: '12px',
              backgroundColor: category.color,
              color: getContrastTextColor(category.color),
              fontSize: '11px',
              fontWeight: 500,
              border: '1px solid var(--gitlab-border-light)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              {category.name}
            </span>
          )}
        </div>
        
               <div className="gitlab-comment-actions">
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
                   onClick={() => setIsEditing(!isEditing)}
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
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            style={{ marginBottom: '12px' }}
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
            fontSize: '14px',
            color: 'var(--gitlab-text-primary)',
            lineHeight: '1.5',
            marginBottom: '8px',
            whiteSpace: 'pre-wrap'
          }}>
            {comment.comment}
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
  onClearComments 
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
                      />
                    ))}
          </div>
        ))}
      </div>
    </div>
  );
};
