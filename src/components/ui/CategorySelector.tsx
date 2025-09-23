import React, { useState } from 'react';
import type { CommentCategory } from '../../types';
import { CATEGORY_COLOR_POOL, getNextAvailableColor, getContrastTextColor } from '../../utils/categoryColors';
import { Button, Input } from './index';

interface CategorySelectorProps {
  categories: CommentCategory[];
  selectedCategoryId: string | 'new' | '';
  onCategoryChange: (categoryId: string | 'new' | '') => void;
  onCreateCategory?: (name: string, color: string) => void;
  placeholder?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
  onCreateCategory,
  placeholder = "Выберите категорию"
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  const usedColors = categories.map(c => c.color);
  
  // Если выбираем новую категорию и цвет еще не выбран, предлагаем следующий доступный
  React.useEffect(() => {
    if (selectedCategoryId === 'new' && !selectedColor) {
      setSelectedColor(getNextAvailableColor(usedColors));
    }
  }, [selectedCategoryId, selectedColor, usedColors]);

  const handleCreateCategory = () => {
    if (newCategoryName.trim() && selectedColor && onCreateCategory) {
      onCreateCategory(newCategoryName.trim(), selectedColor);
      setNewCategoryName('');
      setSelectedColor('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Основной селектор */}
      <div style={{ position: 'relative' }}>
        <select
          value={selectedCategoryId}
          onChange={(e) => onCategoryChange(e.target.value as 'new' | string)}
          style={{
            width: '100%',
            backgroundColor: 'var(--gitlab-bg-secondary)',
            color: 'var(--gitlab-text-primary)',
            border: '1px solid var(--gitlab-border-light)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '13px',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3E%3Cpath fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            backgroundSize: '12px',
            paddingRight: '30px'
          }}
        >
          <option value="">{placeholder}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
          <option value="new">➕ Новая категория...</option>
        </select>

        {/* Предпросмотр выбранной категории */}
        {selectedCategoryId && selectedCategoryId !== 'new' && (
          <div style={{
            position: 'absolute',
            right: '30px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: categories.find(c => c.id === selectedCategoryId)?.color || '#ccc',
            border: '1px solid var(--gitlab-border-light)',
            pointerEvents: 'none'
          }} />
        )}
      </div>

      {/* Форма создания новой категории */}
      {selectedCategoryId === 'new' && (
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--gitlab-bg-tertiary)',
          border: '1px solid var(--gitlab-border-light)',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--gitlab-text-secondary)',
            fontWeight: 600,
            marginBottom: '4px'
          }}>
            Создание новой категории
          </div>

          {/* Поле названия */}
          <Input
            placeholder="Название категории"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{ fontSize: '13px' }}
          />

          {/* Выбор цвета */}
          <div>
            <div style={{
              fontSize: '11px',
              color: 'var(--gitlab-text-secondary)',
              marginBottom: '6px'
            }}>
              Цвет категории:
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              {CATEGORY_COLOR_POOL.slice(0, 12).map((color) => { // Показываем первые 12 цветов
                const isUsed = usedColors.includes(color);
                const isSelected = selectedColor === color;
                
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => !isUsed && setSelectedColor(color)}
                    disabled={isUsed}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: color,
                      border: isSelected ? '2px solid var(--gitlab-blue)' : '1px solid var(--gitlab-border-light)',
                      cursor: isUsed ? 'not-allowed' : 'pointer',
                      opacity: isUsed ? 0.3 : 1,
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                    title={isUsed ? 'Цвет уже используется' : `Выбрать цвет ${color}`}
                  >
                    {isSelected && (
                      <span style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: getContrastTextColor(color),
                        fontSize: '12px'
                      }}>
                        ✓
                      </span>
                    )}
                    {isUsed && (
                      <span style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: getContrastTextColor(color),
                        fontSize: '10px'
                      }}>
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Предпросмотр новой категории */}
          {newCategoryName.trim() && selectedColor && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 8px',
              backgroundColor: 'var(--gitlab-bg-secondary)',
              border: '1px solid var(--gitlab-border-light)',
              borderRadius: '4px',
              fontSize: '11px'
            }}>
              <span style={{ color: 'var(--gitlab-text-secondary)' }}>Предпросмотр:</span>
              <span style={{
                display: 'inline-block',
                padding: '2px 6px',
                borderRadius: '10px',
                backgroundColor: selectedColor,
                color: getContrastTextColor(selectedColor),
                fontSize: '11px',
                border: '1px solid var(--gitlab-border-light)'
              }}>
                {newCategoryName.trim()}
              </span>
            </div>
          )}

          {/* Действия */}
          <div style={{
            display: 'flex',
            gap: '6px',
            justifyContent: 'flex-end',
            marginTop: '4px'
          }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onCategoryChange('');
                setNewCategoryName('');
                setSelectedColor('');
              }}
            >
              Отмена
            </Button>
            <Button
              variant="blue"
              size="sm"
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || !selectedColor}
            >
              Создать
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
