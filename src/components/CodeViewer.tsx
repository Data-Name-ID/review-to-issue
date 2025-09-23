import { useState, useRef, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { CodeComment } from '../types';
import { getLanguageFromFileName } from '../utils/fileUtils';

interface CodeViewerProps {
  fileName: string;
  content: string;
  comments: CodeComment[];
  onAddComment: (comment: Omit<CodeComment, 'id' | 'timestamp'>) => void;
}

interface Selection {
  start: { line: number; column: number };
  end: { line: number; column: number };
  text: string;
}

export const CodeViewer = ({ fileName, content, comments, onAddComment }: CodeViewerProps) => {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [author, setAuthor] = useState('');
  const codeRef = useRef<HTMLDivElement>(null);

  const language = getLanguageFromFileName(fileName);
  const lines = content.split('\n');

  // Обработка выделения текста
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelection(null);
      setShowCommentForm(false);
      return;
    }

    const selectedText = selection.toString();
    if (!selectedText.trim()) {
      setSelection(null);
      setShowCommentForm(false);
      return;
    }

    // Найдем номера строк выделенного текста
    const container = codeRef.current;
    if (!container) return;

    // Простой способ определить строки - поиск по содержимому
    const linesBeforeStart = content.substring(0, content.indexOf(selectedText)).split('\n');
    const startLine = linesBeforeStart.length;
    const endLine = startLine + (selectedText.split('\n').length - 1);

    const newSelection: Selection = {
      start: { line: startLine, column: 0 },
      end: { line: endLine, column: 0 },
      text: selectedText
    };

    setSelection(newSelection);
    setShowCommentForm(true);
  }, [content]);

  // Добавление комментария
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selection || !commentText.trim()) return;

    onAddComment({
      filePath: fileName,
      startLine: selection.start.line,
      endLine: selection.end.line,
      comment: commentText.trim()
    });

    // Сброс формы
    setCommentText('');
    setAuthor('');
    setShowCommentForm(false);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  // Отмена выделения
  const handleCancelComment = () => {
    setShowCommentForm(false);
    setSelection(null);
    setCommentText('');
    setAuthor('');
    window.getSelection()?.removeAllRanges();
  };


  // Кастомный стиль для подсветки строк с комментариями
  const getLineProps = (lineNumber: number) => {
    const hasComment = comments.some(c => 
      lineNumber >= c.startLine && lineNumber <= c.endLine
    );
    
    return {
      'data-line-number': lineNumber,
      style: {
        backgroundColor: hasComment ? 'rgba(255, 193, 7, 0.1)' : 'transparent',
        borderLeft: hasComment ? '3px solid #ffc107' : 'none',
        paddingLeft: hasComment ? '5px' : '8px'
      }
    };
  };

  if (!content.trim()) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#718096',
        backgroundColor: '#f7fafc',
        borderRadius: '8px'
      }}>
        📄 Выберите файл для просмотра
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Заголовок файла */}
      <div style={{
        backgroundColor: '#2d3748',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px 8px 0 0',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>📄 {fileName}</span>
        <span style={{ fontSize: '12px', opacity: 0.7 }}>
          {lines.length} строк • {language}
        </span>
      </div>

      {/* Код */}
      <div 
        ref={codeRef}
        onMouseUp={handleMouseUp}
        style={{
          position: 'relative',
          maxHeight: '600px',
          overflowY: 'auto',
          border: '1px solid #e2e8f0',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px'
        }}
      >
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          showLineNumbers={true}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '13px',
            lineHeight: '1.4'
          }}
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            color: '#6b7280',
            userSelect: 'none'
          }}
          lineProps={(lineNumber: number) => getLineProps(lineNumber)}
        >
          {content}
        </SyntaxHighlighter>
      </div>

      {/* Форма добавления комментария */}
      {showCommentForm && selection && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          padding: '20px',
          minWidth: '400px',
          maxWidth: '600px',
          zIndex: 1000
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0',
            color: '#2d3748',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            💬 Добавить комментарий
          </h3>
          
          <div style={{
            backgroundColor: '#f7fafc',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '15px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              fontSize: '12px',
              color: '#718096',
              marginBottom: '8px'
            }}>
              Выделенный код (строки {selection.start.line}-{selection.end.line}):
            </div>
            <pre style={{
              fontSize: '13px',
              color: '#2d3748',
              margin: 0,
              whiteSpace: 'pre-wrap',
              maxHeight: '120px',
              overflowY: 'auto'
            }}>
              {selection.text}
            </pre>
          </div>

          <form onSubmit={handleAddComment}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#2d3748'
              }}>
                Автор:
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ваше имя"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#2d3748'
              }}>
                Комментарий:
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Введите ваш комментарий..."
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ 
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={handleCancelComment}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Отмена
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                💾 Добавить комментарий
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Overlay для модального окна */}
      {showCommentForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={handleCancelComment}
        />
      )}
    </div>
  );
};
