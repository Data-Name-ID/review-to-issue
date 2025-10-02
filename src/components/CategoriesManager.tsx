import { useState, useMemo } from 'react';
import type { CommentCategory } from '../types';
import { Button, Input, FormActions } from './ui';
import { getContrastTextColor } from '../utils/categoryColors';

interface CategoriesManagerProps {
  categories: CommentCategory[];
  onAddCategory: (name: string, color: string) => string;
  onUpdateCategory: (categoryId: string, updates: Partial<Pick<CommentCategory, 'name' | 'color'>>) => void;
  onRemoveCategory: (categoryId: string) => void;
}

export const CategoriesManager = ({ 
  categories, 
  onAddCategory, 
  onUpdateCategory, 
  onRemoveCategory 
}: CategoriesManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<CommentCategory | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6' // Синий по умолчанию
  });

  // Предустановленные цвета - более различимые
  const presetColors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#e11d48',
    '#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669',
    '#0891b2', '#2563eb', '#7c3aed', '#c026d3', '#be185d',
    '#991b1b', '#9a3412', '#92400e', '#365314', '#14532d',
    '#0c4a6e', '#1e40af', '#5b21b6', '#86198f', '#9d174d'
  ];

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    
    const lowerQuery = searchQuery.toLowerCase();
    return categories.filter(category => 
      category.name.toLowerCase().includes(lowerQuery)
    );
  }, [categories, searchQuery]);

  const handleCreateCategory = () => {
    if (!formData.name.trim()) return;

    onAddCategory(formData.name.trim(), formData.color);
    
    // Сброс формы
    setFormData({
      name: '',
      color: '#3b82f6'
    });
    setShowCreateForm(false);
  };

  const handleEditCategory = (category: CommentCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color
    });
    setShowCreateForm(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !formData.name.trim()) return;

    onUpdateCategory(editingCategory.id, {
      name: formData.name.trim(),
      color: formData.color
    });

    // Сброс формы
    setEditingCategory(null);
    setFormData({
      name: '',
      color: '#3b82f6'
    });
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      color: '#3b82f6'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
          🏷️ Категории ({categories.length})
        </h3>
        <Button
          variant="blue"
          size="sm"
          onClick={() => setShowCreateForm(true)}
          title="Создать новую категорию"
        >
          ➕
        </Button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '12px' }}>
        <Input
          placeholder="🔍 Поиск категорий..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ fontSize: '13px' }}
        />
      </div>

      {/* Categories List */}
      <div style={{ 
        flex: 1, 
        minHeight: 0, 
        overflowY: 'auto',
        marginBottom: '12px'
      }}>
        {filteredCategories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--gitlab-text-secondary)',
            padding: '20px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏷️</div>
            <div style={{ fontSize: '14px' }}>
              {searchQuery ? 'Категории не найдены' : 'Нет категорий'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredCategories.map(category => (
              <div
                key={category.id}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--gitlab-bg-tertiary)',
                  border: '1px solid var(--gitlab-border-light)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                {/* Category Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {/* Color Badge */}
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: category.color,
                      border: '2px solid var(--gitlab-border-light)',
                      flexShrink: 0
                    }}
                    title={`Цвет: ${category.color}`}
                  />
                  
                  {/* Category Name */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '500',
                      color: 'var(--gitlab-text-primary)',
                      fontSize: '13px',
                      marginBottom: '2px'
                    }}>
                      {category.name}
                    </div>
                    
                    <div style={{
                      fontSize: '10px',
                      color: 'var(--gitlab-text-secondary)'
                    }}>
                      Создана: {formatDate(category.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                    title="Редактировать"
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                  >
                    ✏️
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Удалить категорию "${category.name}"?`)) {
                        onRemoveCategory(category.id);
                      }
                    }}
                    title="Удалить"
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                  >
                    🗑️
                  </Button>
                </div>
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
            maxWidth: '500px',
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
                {editingCategory ? '✏️ Редактировать категорию' : '➕ Создать категорию'}
              </h4>
              <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                ✕
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                label="Название категории *"
                placeholder="Например: Критический баг"
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
                  Цвет категории *
                </label>
                
                {/* Color Preview */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: formData.color,
                      border: '2px solid var(--gitlab-border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getContrastTextColor(formData.color),
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  >
                    Aa
                  </div>
                  
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3b82f6"
                    style={{ flex: 1 }}
                  />
                </div>

                {/* Preset Colors */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '4px'
                }}>
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: color,
                        border: formData.color === color ? '3px solid var(--gitlab-blue)' : '2px solid var(--gitlab-border-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getContrastTextColor(color),
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                      title={color}
                    >
                      {formData.color === color ? '✓' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <FormActions
                onCancel={handleCancelEdit}
                onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
                submitText={editingCategory ? 'Сохранить' : 'Создать'}
                submitVariant="blue"
                cancelText="Отмена"
                submitDisabled={!formData.name.trim()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
