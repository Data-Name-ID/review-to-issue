import React, { useState, useRef, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const usedColors = categories.map(c => c.color);
  
  // Если выбираем новую категорию и цвет еще не выбран, предлагаем следующий доступный
  React.useEffect(() => {
    if (selectedCategoryId === 'new' && !selectedColor) {
      setSelectedColor(getNextAvailableColor(usedColors));
    }
  }, [selectedCategoryId, selectedColor, usedColors]);

  // Закрытие выпадающего списка при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateCategory = () => {
    if (newCategoryName.trim() && selectedColor && onCreateCategory) {
      onCreateCategory(newCategoryName.trim(), selectedColor);
      setNewCategoryName('');
      setSelectedColor('');
      setIsOpen(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Кастомный селектор */}
      <div style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            backgroundColor: 'var(--gitlab-bg-secondary)',
            color: 'var(--gitlab-text-primary)',
            border: '1px solid var(--gitlab-border-light)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedCategory ? (
              <>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: selectedCategory.color,
                    border: '1px solid var(--gitlab-border-light)',
                    flexShrink: 0
                  }}
                />
                <span>{selectedCategory.name}</span>
              </>
            ) : (
              <span style={{ color: 'var(--gitlab-text-secondary)' }}>{placeholder}</span>
            )}
          </div>
          <span style={{ 
            fontSize: '10px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}>
            ▼
          </span>
        </button>

        {/* Выпадающий список */}
        {isOpen && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'var(--gitlab-bg-secondary)',
              border: '1px solid var(--gitlab-border-light)',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto',
              marginTop: '2px'
            }}
          >
            {/* Опция "Без категории" */}
            <button
              type="button"
              onClick={() => {
                onCategoryChange('');
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: selectedCategoryId === '' ? 'var(--gitlab-blue-light)' : 'transparent',
                color: 'var(--gitlab-text-primary)',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div style={{ width: '12px', height: '12px' }} />
              <span>Без категории</span>
            </button>

            {/* Категории */}
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onCategoryChange(category.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: selectedCategoryId === category.id ? 'var(--gitlab-blue-light)' : 'transparent',
                  color: 'var(--gitlab-text-primary)',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: category.color,
                    border: '1px solid var(--gitlab-border-light)',
                    flexShrink: 0
                  }}
                />
                <span>{category.name}</span>
              </button>
            ))}

            {/* Разделитель */}
            <div style={{
              height: '1px',
              backgroundColor: 'var(--gitlab-border-light)',
              margin: '4px 0'
            }} />

            {/* Опция создания новой категории */}
            <button
              type="button"
              onClick={() => {
                onCategoryChange('new');
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: selectedCategoryId === 'new' ? 'var(--gitlab-blue-light)' : 'transparent',
                color: 'var(--gitlab-text-primary)',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div style={{ width: '12px', height: '12px' }} />
              <span>➕ Новая категория...</span>
            </button>
          </div>
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
