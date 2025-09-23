import { useState, useRef, useCallback, useEffect } from 'react';
import { Textarea } from './ui';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  style?: React.CSSProperties;
  showTemplateButton?: boolean;
  onTemplateRequest?: () => void;
}

export const MarkdownEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Введите комментарий...', 
  rows = 3,
  autoFocus = false,
  style = {},
  showTemplateButton = false,
  onTemplateRequest
}: MarkdownEditorProps) => {
  const [isPreview, setIsPreview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // История для Undo/Redo
  const addToHistory = useCallback((newValue: string) => {
    if (newValue === history[historyIndex]) return;
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    
    // Ограничиваем историю 50 записями
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [history, historyIndex, onChange]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [history, historyIndex, onChange]);

  // Автоматическое сохранение в истории
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isComposing) {
        addToHistory(value);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [value, addToHistory, isComposing]);

  // Обработка нажатий клавиш
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;
    const currentValue = textarea.value;
    const lines = currentValue.split('\n');
    
    // Находим текущую строку
    let currentLineIndex = 0;
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= selectionStart) {
        currentLineIndex = i;
        break;
      }
      charCount += lines[i].length + 1; // +1 для \n
    }
    
    const currentLine = lines[currentLineIndex];
    const lineStart = charCount;
    
    // Управление Ctrl/Cmd комбинациями
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 'b':
          e.preventDefault();
          toggleFormat('**', '**', 'жирный текст');
          break;
        case 'i':
          e.preventDefault();
          toggleFormat('*', '*', 'курсив');
          break;
        case 'k':
          e.preventDefault();
          toggleFormat('[', '](url)', 'текст ссылки');
          break;
        case '`':
          e.preventDefault();
          toggleFormat('`', '`', 'код');
          break;
        case 'e':
          e.preventDefault();
          insertCodeBlock();
          break;
        case 'd':
          e.preventDefault();
          duplicateLine();
          break;
        case '/':
          e.preventDefault();
          toggleLineComment();
          break;
        case 'a':
          e.preventDefault();
          // Выделить всё - стандартное поведение браузера
          break;
        case 'Enter':
          e.preventDefault();
          insertLineBreak();
          break;
      }
      return;
    }

    if (e.key === 'Enter') {
      // Автопродолжение списков
      const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/);
      const checkboxMatch = currentLine.match(/^(\s*)([-*+])\s+(\[[ x]\])\s/);
      const quoteMatch = currentLine.match(/^(\s*)(>+)\s/);
      
      if (checkboxMatch) {
        // Продолжение checkbox списка
        e.preventDefault();
        const [, indent, marker, checkbox] = checkboxMatch;
        
        // Если строка пустая, выходим из списка
        if (currentLine.trim() === `${marker} ${checkbox}` || currentLine.trim() === `${marker} ${checkbox} `) {
          const lineStartPos = lineStart;
          const lineEndPos = lineStart + currentLine.length;
          const newValue = currentValue.slice(0, lineStartPos) + '\n' + currentValue.slice(lineEndPos + 1);
          onChange(newValue);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStartPos + 1;
          }, 0);
          return;
        }
        
        const newCheckbox = '[ ]'; // Новый checkbox всегда пустой
        const newListItem = `\n${indent}${marker} ${newCheckbox} `;
        
        const newValue = currentValue.slice(0, selectionStart) + newListItem + currentValue.slice(selectionEnd);
        onChange(newValue);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + newListItem.length;
        }, 0);
      } else if (listMatch) {
        // Продолжение обычного списка
        e.preventDefault();
        const [, indent, marker] = listMatch;
        
        // Если текущая строка пустая, выходим из списка
        if (currentLine.trim() === `${marker}` || currentLine.trim() === `${marker} `) {
          const lineStartPos = lineStart;
          const lineEndPos = lineStart + currentLine.length;
          const newValue = currentValue.slice(0, lineStartPos) + '\n' + currentValue.slice(lineEndPos + 1);
          onChange(newValue);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStartPos + 1;
          }, 0);
          return;
        }
        
        // Продолжаем список
        let newMarker = marker;
        if (/\d+\./.test(marker)) {
          // Нумерованный список - увеличиваем номер
          const num = parseInt(marker) + 1;
          newMarker = `${num}.`;
        }
        
        const newListItem = `\n${indent}${newMarker} `;
        const newValue = currentValue.slice(0, selectionStart) + newListItem + currentValue.slice(selectionEnd);
        onChange(newValue);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + newListItem.length;
        }, 0);
      } else if (quoteMatch) {
        // Продолжение цитаты
        e.preventDefault();
        const [, indent, marker] = quoteMatch;
        
        // Если строка пустая, выходим из цитаты
        if (currentLine.trim() === marker || currentLine.trim() === `${marker} `) {
          const lineStartPos = lineStart;
          const lineEndPos = lineStart + currentLine.length;
          const newValue = currentValue.slice(0, lineStartPos) + '\n' + currentValue.slice(lineEndPos + 1);
          onChange(newValue);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStartPos + 1;
          }, 0);
          return;
        }
        
        const newQuote = `\n${indent}${marker} `;
        const newValue = currentValue.slice(0, selectionStart) + newQuote + currentValue.slice(selectionEnd);
        onChange(newValue);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + newQuote.length;
        }, 0);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      if (selectionStart === selectionEnd) {
        // Одиночная строка
        const isShift = e.shiftKey;
        
        if (isShift) {
          // Уменьшаем отступ
          if (currentLine.startsWith('  ')) {
            const newLine = currentLine.slice(2);
            const newValue = 
              currentValue.slice(0, lineStart) + 
              newLine + 
              currentValue.slice(lineStart + currentLine.length);
            onChange(newValue);
            
            setTimeout(() => {
              const newCursorPos = Math.max(lineStart, selectionStart - 2);
              textarea.selectionStart = textarea.selectionEnd = newCursorPos;
            }, 0);
          }
        } else {
          // Увеличиваем отступ
          const newLine = '  ' + currentLine;
          const newValue = 
            currentValue.slice(0, lineStart) + 
            newLine + 
            currentValue.slice(lineStart + currentLine.length);
          onChange(newValue);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
          }, 0);
        }
      } else {
        // Множественные строки
        handleMultiLineIndent(e.shiftKey);
      }
    } else if (e.key === 'Backspace') {
      // Умный backspace для списков
      if (selectionStart === selectionEnd && selectionStart > 0) {
        const beforeCursor = currentValue.slice(0, selectionStart);
        const afterCursor = currentValue.slice(selectionStart);
        
        // Проверяем, находимся ли мы в начале элемента списка
        const listStartMatch = beforeCursor.match(/(\n|^)(\s*)([-*+]|\d+\.)\s$/);
        const checkboxStartMatch = beforeCursor.match(/(\n|^)(\s*)([-*+])\s+\[[ x]\]\s$/);
        
        if (checkboxStartMatch) {
          e.preventDefault();
          const [match] = checkboxStartMatch;
          const newValue = beforeCursor.slice(0, -match.length + 1) + afterCursor;
          onChange(newValue);
          
          setTimeout(() => {
            const newPos = selectionStart - match.length + 1;
            textarea.selectionStart = textarea.selectionEnd = newPos;
          }, 0);
        } else if (listStartMatch) {
          e.preventDefault();
          const [match] = listStartMatch;
          const newValue = beforeCursor.slice(0, -match.length + 1) + afterCursor;
          onChange(newValue);
          
          setTimeout(() => {
            const newPos = selectionStart - match.length + 1;
            textarea.selectionStart = textarea.selectionEnd = newPos;
          }, 0);
        }
      }
    }
  };

  // Умная обработка отступов для множественных строк
  const handleMultiLineIndent = (isDecrease: boolean) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = value.slice(selectionStart, selectionEnd);
    const selectedLines = selectedText.split('\n');
    
    const newLines = selectedLines.map(line => {
      if (isDecrease) {
        return line.startsWith('  ') ? line.slice(2) : line;
      } else {
        return '  ' + line;
      }
    });
    
    const newSelectedText = newLines.join('\n');
    const newValue = 
      value.slice(0, selectionStart) + 
      newSelectedText + 
      value.slice(selectionEnd);
    onChange(newValue);
    
    setTimeout(() => {
      const lengthDiff = newSelectedText.length - selectedText.length;
      textarea.selectionStart = selectionStart;
      textarea.selectionEnd = selectionEnd + lengthDiff;
    }, 0);
  };

  // Вставка форматирования с проверкой существующего
  const toggleFormat = useCallback((before: string, after = '', placeholder = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    // Проверяем, не окружен ли уже текст форматированием
    const beforeText = value.substring(start - before.length, start);
    const afterText = value.substring(end, end + after.length);
    
    if (beforeText === before && afterText === after) {
      // Убираем форматирование
      const newText = 
        value.substring(0, start - before.length) + 
        selectedText + 
        value.substring(end + after.length);
      onChange(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start - before.length, end - before.length);
      }, 0);
    } else {
      // Добавляем форматирование
      const textToWrap = selectedText || placeholder;
      const newText = 
        value.substring(0, start) + 
        before + textToWrap + after + 
        value.substring(end);
      onChange(newText);
      
      setTimeout(() => {
        textarea.focus();
        const newStart = start + before.length;
        const newEnd = newStart + textToWrap.length;
        textarea.setSelectionRange(newStart, newEnd);
      }, 0);
    }
  }, [value, onChange]);

  // Вставка блока кода
  const insertCodeBlock = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const selectedText = value.substring(start, textarea.selectionEnd) || 'код здесь';
    const codeBlock = `\n\`\`\`javascript\n${selectedText}\n\`\`\`\n`;
    
    const newValue = value.substring(0, start) + codeBlock + value.substring(textarea.selectionEnd);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 4, start + 14); // Выделяем "javascript"
    }, 0);
  }, [value, onChange]);

  // Дублирование строки
  const duplicateLine = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = value.split('\n');
    
    // Находим текущую строку
    let currentLineIndex = 0;
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= start) {
        currentLineIndex = i;
        break;
      }
      charCount += lines[i].length + 1;
    }
    
    const currentLine = lines[currentLineIndex];
    const newLines = [...lines];
    newLines.splice(currentLineIndex + 1, 0, currentLine);
    
    const newValue = newLines.join('\n');
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + currentLine.length + 1, start + currentLine.length + 1);
    }, 0);
  }, [value, onChange]);

  // Комментирование строки
  const toggleLineComment = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = value.split('\n');
    
    // Находим текущую строку
    let currentLineIndex = 0;
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= start) {
        currentLineIndex = i;
        break;
      }
      charCount += lines[i].length + 1;
    }
    
    const currentLine = lines[currentLineIndex];
    const newLines = [...lines];
    
    if (currentLine.startsWith('<!-- ') && currentLine.endsWith(' -->')) {
      // Убираем комментарий
      newLines[currentLineIndex] = currentLine.slice(5, -4);
    } else {
      // Добавляем комментарий
      newLines[currentLineIndex] = `<!-- ${currentLine} -->`;
    }
    
    const newValue = newLines.join('\n');
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  // Вставка переноса строки
  const insertLineBreak = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineBreak = '  \n'; // Markdown line break
    
    const newValue = value.substring(0, start) + lineBreak + value.substring(textarea.selectionEnd);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + lineBreak.length, start + lineBreak.length);
    }, 0);
  }, [value, onChange]);

  // Кнопки панели инструментов
  const toolbarButtons = [
    ...(showTemplateButton && onTemplateRequest ? [
      { 
        label: '📋', 
        title: 'Выбрать шаблон', 
        action: onTemplateRequest 
      },
      { type: 'separator' }
    ] : []),
    { 
      label: '↶', 
      title: 'Отменить (Ctrl+Z)', 
      action: undo,
      disabled: historyIndex <= 0
    },
    { 
      label: '↷', 
      title: 'Повторить (Ctrl+Shift+Z)', 
      action: redo,
      disabled: historyIndex >= history.length - 1
    },
    { type: 'separator' },
    { label: '**B**', title: 'Жирный (Ctrl+B)', action: () => toggleFormat('**', '**', 'жирный текст') },
    { label: '*I*', title: 'Курсив (Ctrl+I)', action: () => toggleFormat('*', '*', 'курсив') },
    { label: '~~S~~', title: 'Зачеркнутый', action: () => toggleFormat('~~', '~~', 'зачеркнутый') },
    { type: 'separator' },
    { label: '`C`', title: 'Инлайн код (Ctrl+`)', action: () => toggleFormat('`', '`', 'код') },
    { label: '```', title: 'Блок кода (Ctrl+E)', action: insertCodeBlock },
    { type: 'separator' },
    { label: '🔗', title: 'Ссылка (Ctrl+K)', action: () => toggleFormat('[', '](url)', 'текст ссылки') },
    { label: '•', title: 'Список', action: () => toggleFormat('- ', '', 'элемент списка') },
    { label: '☑', title: 'Чекбокс', action: () => toggleFormat('- [ ] ', '', 'задача') },
    { label: '❝', title: 'Цитата', action: () => toggleFormat('> ', '', 'цитата') },
    { type: 'separator' },
    { label: '#', title: 'Заголовок', action: () => toggleFormat('## ', '', 'заголовок') },
    { label: '―', title: 'Разделитель', action: () => toggleFormat('\n---\n', '', '') },
  ];

  return (
    <div style={{ ...style }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        marginBottom: '6px',
        padding: '6px 8px',
        backgroundColor: 'var(--gitlab-bg-tertiary)',
        borderRadius: '6px 6px 0 0',
        borderBottom: '1px solid var(--gitlab-border-light)',
        fontSize: '12px',
        flexWrap: 'wrap'
      }}>
        {toolbarButtons.map((btn, index) => {
          if (btn.type === 'separator') {
            return (
              <div
                key={index}
                style={{
                  width: '1px',
                  height: '16px',
                  backgroundColor: 'var(--gitlab-border-light)',
                  margin: '0 4px'
                }}
              />
            );
          }
          
          return (
            <button
              key={index}
              type="button"
              onClick={btn.action}
              disabled={btn.disabled}
              title={btn.title}
              style={{
                background: 'none',
                border: 'none',
                color: btn.disabled ? 'var(--gitlab-text-muted)' : 'var(--gitlab-text-secondary)',
                cursor: btn.disabled ? 'not-allowed' : 'pointer',
                padding: '3px 6px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: '600',
                opacity: btn.disabled ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!btn.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--gitlab-bg-secondary)';
                  e.currentTarget.style.color = 'var(--gitlab-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!btn.disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--gitlab-text-secondary)';
                }
              }}
            >
              {btn.label}
            </button>
          );
        })}
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            title="Помощь по Markdown"
            style={{
              background: showHelp ? 'var(--gitlab-blue)' : 'none',
              border: 'none',
              color: showHelp ? 'white' : 'var(--gitlab-text-secondary)',
              cursor: 'pointer',
              padding: '3px 6px',
              borderRadius: '3px',
              fontSize: '11px'
            }}
            onMouseEnter={(e) => {
              if (!showHelp) {
                e.currentTarget.style.backgroundColor = 'var(--gitlab-bg-secondary)';
                e.currentTarget.style.color = 'var(--gitlab-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showHelp) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--gitlab-text-secondary)';
              }
            }}
          >
            ❓
          </button>
          
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            title={isPreview ? 'Режим редактирования' : 'Предпросмотр'}
            style={{
              background: isPreview ? 'var(--gitlab-blue)' : 'none',
              border: 'none',
              color: isPreview ? 'white' : 'var(--gitlab-text-secondary)',
              cursor: 'pointer',
              padding: '3px 6px',
              borderRadius: '3px',
              fontSize: '11px'
            }}
            onMouseEnter={(e) => {
              if (!isPreview) {
                e.currentTarget.style.backgroundColor = 'var(--gitlab-bg-secondary)';
                e.currentTarget.style.color = 'var(--gitlab-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isPreview) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--gitlab-text-secondary)';
              }
            }}
          >
            👁️
          </button>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--gitlab-bg-secondary)',
          borderLeft: '3px solid var(--gitlab-blue)',
          marginBottom: '6px',
          fontSize: '11px',
          color: 'var(--gitlab-text-secondary)',
          borderRadius: '0 6px 6px 0'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--gitlab-text-primary)' }}>
            Горячие клавиши:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: '8px' }}>
            <span><kbd>Ctrl+B</kbd> - **жирный**</span>
            <span><kbd>Ctrl+I</kbd> - *курсив*</span>
            <span><kbd>Ctrl+K</kbd> - [ссылка](url)</span>
            <span><kbd>Ctrl+`</kbd> - `код`</span>
            <span><kbd>Ctrl+E</kbd> - блок кода</span>
            <span><kbd>Ctrl+D</kbd> - дублировать строку</span>
            <span><kbd>Ctrl+Z</kbd> - отменить</span>
            <span><kbd>Ctrl+Shift+Z</kbd> - повторить</span>
            <span><kbd>Ctrl+/</kbd> - комментарий</span>
            <span><kbd>Ctrl+Enter</kbd> - перенос строки</span>
          </div>
          <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--gitlab-text-primary)' }}>
            Автоматика:
          </div>
          <div style={{ fontSize: '10px', opacity: '0.9' }}>
            💡 Enter - продолжить список/цитату • Tab/Shift+Tab - отступы • Backspace - выйти из списка
          </div>
        </div>
      )}

      {/* Editor/Preview */}
      {isPreview ? (
        <div style={{
          minHeight: `${rows * 1.5}em`,
          padding: '12px',
          backgroundColor: 'var(--gitlab-bg-primary)',
          border: '1px solid var(--gitlab-border-light)',
          borderRadius: '0 0 6px 6px',
          borderTop: 'none',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {value ? (
            <MarkdownRenderer content={value} style={{ fontSize: '13px' }} />
          ) : (
            <div style={{ 
              color: 'var(--gitlab-text-muted)', 
              fontStyle: 'italic',
              fontSize: '13px'
            }}>
              Предпросмотр появится здесь...
            </div>
          )}
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={rows}
          style={{
            borderRadius: '0 0 6px 6px',
            borderTop: 'none',
            marginBottom: '0',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: '13px',
            lineHeight: '1.5',
            resize: 'vertical'
          }}
        />
      )}
    </div>
  );
};