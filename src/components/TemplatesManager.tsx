import { useState, useMemo } from 'react';
import type { CommentTemplate } from '../types';
import { Button, Input } from './ui';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MarkdownEditor } from './MarkdownEditor';

interface TemplatesManagerProps {
  templates: CommentTemplate[];
  onAddTemplate: (templateData: Omit<CommentTemplate, 'id' | 'createdAt' | 'useCount'>) => void;
  onUpdateTemplate: (templateId: string, updates: Partial<Omit<CommentTemplate, 'id' | 'createdAt'>>) => void;
  onRemoveTemplate: (templateId: string) => void;
  onDuplicateTemplate: (templateId: string) => void;
}

export const TemplatesManager = ({ 
  templates, 
  onAddTemplate, 
  onUpdateTemplate, 
  onRemoveTemplate, 
  onDuplicateTemplate 
}: TemplatesManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'popular'>('all');
  const [editingTemplate, setEditingTemplate] = useState<CommentTemplate | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CommentTemplate | null>(null);

  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    name: '',
    content: ''
  });

  const filteredTemplates = useMemo(() => {
    let baseTemplates = templates;
    
    switch (selectedTab) {
      case 'popular':
        baseTemplates = [...templates]
          .sort((a, b) => b.useCount - a.useCount)
          .slice(0, 20);
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
    
    return baseTemplates.sort((a, b) => {
      // Сортировка по дате создания
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [templates, selectedTab, searchQuery]);

  const handleCreateTemplate = () => {
    if (!formData.name.trim() || !formData.content.trim()) return;

    onAddTemplate({
      name: formData.name.trim(),
      content: formData.content.trim()
    });

    // Сброс формы
    setFormData({
      name: '',
      content: ''
    });
    setShowCreateForm(false);
  };

  const handleEditTemplate = (template: CommentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content
    });
    setShowCreateForm(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !formData.name.trim() || !formData.content.trim()) return;

    onUpdateTemplate(editingTemplate.id, {
      name: formData.name.trim(),
      content: formData.content.trim()
    });

    // Сброс формы
    setEditingTemplate(null);
    setFormData({
      name: '',
      content: ''
    });
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      content: ''
    });
  };


  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <h3 style={{
          margin: '0',
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--gitlab-text-primary)'
        }}>
          📋 Шаблоны ({templates.length})
        </h3>
        <Button
          variant="blue"
          size="sm"
          onClick={() => setShowCreateForm(true)}
          title="Создать новый шаблон"
        >
          ➕
        </Button>
      </div>

      {/* Search and Tabs */}
      <div style={{ marginBottom: '12px' }}>
        <Input
          placeholder="🔍 Поиск шаблонов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: '8px', fontSize: '13px' }}
        />
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            variant={selectedTab === 'all' ? 'blue' : 'secondary'}
            size="sm"
            onClick={() => setSelectedTab('all')}
          >
            Все
          </Button>
          <Button
            variant={selectedTab === 'popular' ? 'blue' : 'secondary'}
            size="sm"
            onClick={() => setSelectedTab('popular')}
          >
            🔥
          </Button>
        </div>
      </div>

      {/* Templates List */}
      <div style={{ 
        flex: 1, 
        minHeight: 0, 
        overflowY: 'auto',
        marginBottom: '12px'
      }}>
        {filteredTemplates.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--gitlab-text-secondary)',
            padding: '20px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '14px' }}>
              {searchQuery ? 'Шаблоны не найдены' : 'Нет шаблонов'}
            </div>
          </div>
        ) : (
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
                  cursor: 'pointer'
                }}
                onClick={() => setPreviewTemplate(previewTemplate?.id === template.id ? null : template)}
              >
                {/* Template Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '6px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '500',
                      color: 'var(--gitlab-text-primary)',
                      fontSize: '13px',
                      marginBottom: '2px'
                    }}>
                      {template.name}
                    </div>
                    
                    {template.useCount > 0 && (
                      <div style={{
                        fontSize: '10px',
                        color: 'var(--gitlab-text-secondary)',
                        backgroundColor: 'var(--gitlab-bg-secondary)',
                        padding: '1px 4px',
                        borderRadius: '8px',
                        display: 'inline-block'
                      }}>
                        {template.useCount} исп.
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateTemplate(template.id);
                      }}
                      title="Дублировать"
                      style={{ padding: '2px 6px', fontSize: '10px' }}
                    >
                      📄
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTemplate(template);
                      }}
                      title="Редактировать"
                      style={{ padding: '2px 6px', fontSize: '10px' }}
                    >
                      ✏️
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Удалить шаблон "${template.name}"?`)) {
                          onRemoveTemplate(template.id);
                        }
                      }}
                      title="Удалить"
                      style={{ padding: '2px 6px', fontSize: '10px' }}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>


                {/* Preview */}
                {previewTemplate?.id === template.id && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: 'var(--gitlab-bg-primary)',
                    border: '1px solid var(--gitlab-border-light)',
                    borderRadius: '6px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    <MarkdownRenderer content={template.content} style={{ fontSize: '12px' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--gitlab-bg-secondary)',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid var(--gitlab-border-light)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h4 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--gitlab-text-primary)'
              }}>
                {editingTemplate ? '✏️ Редактировать шаблон' : '➕ Создать шаблон'}
              </h4>
              <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                ✕
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                label="Название шаблона *"
                placeholder="Например: Баг в логике"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />


              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--gitlab-text-primary)'
                }}>
                  Содержимое шаблона *
                </label>
                <MarkdownEditor
                  value={formData.content}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                  placeholder="Введите содержимое шаблона в формате Markdown..."
                  rows={8}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
                marginTop: '8px'
              }}>
                <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                  Отмена
                </Button>
                <Button
                  variant="blue"
                  size="sm"
                  onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                  disabled={!formData.name.trim() || !formData.content.trim()}
                >
                  {editingTemplate ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
