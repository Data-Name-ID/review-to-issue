import { useState, useMemo } from 'react';
import type { CommentTemplate } from '../types';
import { Button, Input } from './ui';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TemplateSelectorProps {
  templates: CommentTemplate[];
  onSelectTemplate: (content: string) => void;
  onClose: () => void;
  style?: React.CSSProperties;
}

export const TemplateSelector = ({ 
  templates, 
  onSelectTemplate, 
  onClose, 
  style = {} 
}: TemplateSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'popular' | 'recent'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<CommentTemplate | null>(null);

  // Фильтрация шаблонов
  const filteredTemplates = useMemo(() => {
    let baseTemplates = templates;
    
    switch (selectedTab) {
      case 'popular':
        baseTemplates = [...templates]
          .sort((a, b) => b.useCount - a.useCount)
          .slice(0, 10);
        break;
      case 'recent':
        baseTemplates = [...templates]
          .filter(t => t.lastUsed)
          .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
          .slice(0, 10);
        break;
      default:
        baseTemplates = templates;
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      baseTemplates = baseTemplates.filter(template => 
        template.name.toLowerCase().includes(lowerQuery) ||
        template.content.toLowerCase().includes(lowerQuery)
      );
    }
    
    return baseTemplates;
  }, [templates, selectedTab, searchQuery]);


  const handleTemplateSelect = (template: CommentTemplate) => {
    onSelectTemplate(template.content);
    onClose();
  };


  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    }}>
      <div style={{
        backgroundColor: 'var(--gitlab-bg-secondary)',
        borderRadius: '12px',
        padding: '0',
        maxWidth: '900px',
        width: '90%',
        maxHeight: '80vh',
        border: '1px solid var(--gitlab-border-light)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--gitlab-border-light)',
          backgroundColor: 'var(--gitlab-bg-tertiary)'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--gitlab-text-primary)'
          }}>
            🎯 Выбор шаблона
          </h3>
          <Button variant="secondary" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Search and Tabs */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--gitlab-border-light)',
          backgroundColor: 'var(--gitlab-bg-tertiary)'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <Input
              placeholder="🔍 Поиск шаблонов по названию или содержимому..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '14px' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant={selectedTab === 'all' ? 'blue' : 'secondary'}
              size="sm"
              onClick={() => setSelectedTab('all')}
            >
              📋 Все ({templates.length})
            </Button>
            <Button
              variant={selectedTab === 'popular' ? 'blue' : 'secondary'}
              size="sm"
              onClick={() => setSelectedTab('popular')}
            >
              🔥 Популярные
            </Button>
            <Button
              variant={selectedTab === 'recent' ? 'blue' : 'secondary'}
              size="sm"
              onClick={() => setSelectedTab('recent')}
            >
              ⏰ Недавние
            </Button>
          </div>
        </div>

        {/* Content */}
        <div style={{ 
          display: 'flex', 
          flex: 1, 
          minHeight: 0 
        }}>
          {/* Templates List */}
          <div style={{
            flex: previewTemplate ? '0 0 350px' : '1',
            overflowY: 'auto',
            padding: '16px',
            borderRight: previewTemplate ? '1px solid var(--gitlab-border-light)' : 'none'
          }}>
            {filteredTemplates.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: 'var(--gitlab-text-secondary)',
                padding: '40px 20px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  Шаблоны не найдены
                </div>
                <div style={{ fontSize: '14px' }}>
                  Попробуйте изменить поисковый запрос
                </div>
              </div>
            ) : (
              // Простой список шаблонов
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    style={{
                      padding: '12px',
                      backgroundColor: previewTemplate?.id === template.id 
                        ? 'var(--gitlab-blue-light)' 
                        : 'var(--gitlab-bg-tertiary)',
                      border: `1px solid ${previewTemplate?.id === template.id 
                        ? 'var(--gitlab-blue)' 
                        : 'var(--gitlab-border-light)'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setPreviewTemplate(template)}
                    onDoubleClick={() => handleTemplateSelect(template)}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '6px'
                    }}>
                      <div style={{
                        fontWeight: '500',
                        color: 'var(--gitlab-text-primary)',
                        fontSize: '14px'
                      }}>
                        {template.name}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {template.useCount > 0 && (
                          <span style={{
                            fontSize: '11px',
                            color: 'var(--gitlab-text-secondary)',
                            backgroundColor: 'var(--gitlab-bg-secondary)',
                            padding: '2px 6px',
                            borderRadius: '10px'
                          }}>
                            {template.useCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {previewTemplate && (
            <div style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--gitlab-bg-primary)'
            }}>
              {/* Preview Header */}
              <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--gitlab-border-light)',
                backgroundColor: 'var(--gitlab-bg-secondary)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--gitlab-text-primary)'
                  }}>
                    {previewTemplate.name}
                  </h4>
                  
                  <Button
                    variant="blue"
                    size="sm"
                    onClick={() => handleTemplateSelect(previewTemplate)}
                  >
                    📌 Использовать
                  </Button>
                </div>
                
                {previewTemplate.useCount > 0 && (
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--gitlab-text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Использован {previewTemplate.useCount} раз
                  </div>
                )}
              </div>

              {/* Preview Content */}
              <div style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto'
              }}>
                <MarkdownRenderer content={previewTemplate.content} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--gitlab-border-light)',
          backgroundColor: 'var(--gitlab-bg-tertiary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--gitlab-text-secondary)'
          }}>
            💡 Двойной клик или Enter для быстрого выбора
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
