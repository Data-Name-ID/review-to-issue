import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const usedColors = categories.map(c => c.color);
  
  // Если выбираем новую категорию и цвет еще не выбран, предлагаем следующий доступный
  React.useEffect(() => {
    if (selectedCategoryId === 'new' && !selectedColor) {
      setSelectedColor(getNextAvailableColor(usedColors));
    }
  }, [selectedCategoryId, selectedColor, usedColors]);

  // Сбрасываем выбранный цвет, если он стал недоступным
  React.useEffect(() => {
    if (selectedColor && usedColors.includes(selectedColor)) {
      setSelectedColor('');
    }
  }, [selectedColor, usedColors]);

  // Обновляем позицию выпадающего списка при открытии
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Обновляем позицию при открытии и при изменении размера окна
  React.useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize);
      };
    }
  }, [isOpen]);

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
          onClick={() => {
            if (!isOpen) {
              updateDropdownPosition();
            }
            setIsOpen(!isOpen);
          }}
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
            transition: 'border-color 0.2s ease'
          }}
        >
          <span>
            {selectedCategory ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: selectedCategory.color
                }} />
                {selectedCategory.name}
              </div>
            ) : selectedCategoryId === 'new' ? 'Создать новую категорию...' : placeholder}
          </span>
          <span style={{ 
            fontSize: '10px',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </button>

        {/* Выпадающий список через портал */}
        {isOpen && createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              backgroundColor: 'var(--gitlab-bg-secondary)',
              border: '1px solid var(--gitlab-border-light)',
              borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              zIndex: 99999,
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
                  gap: '8px',
                  borderTop: '1px solid var(--gitlab-border-light)'
                }}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: category.color
                }} />
                <span>{category.name}</span>
              </button>
            ))}

            {/* Опция создания новой категории */}
            {onCreateCategory && (
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
                  gap: '8px',
                  borderTop: '1px solid var(--gitlab-border-light)'
                }}
              >
                <div style={{ width: '12px', height: '12px' }} />
                <span>➕ Создать новую категорию</span>
              </button>
            )}
          </div>,
          document.body
        )}
      </div>

      {/* Форма создания новой категории */}
      {selectedCategoryId === 'new' && onCreateCategory && (
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--gitlab-bg-tertiary)',
          border: '1px solid var(--gitlab-border-light)',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <Input
            placeholder="Название категории"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{ fontSize: '13px' }}
          />

          {/* Выбор цвета */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {CATEGORY_COLOR_POOL.map((color) => {
              const isUsed = usedColors.includes(color);
              const isSelected = selectedColor === color;
              
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => !isUsed && setSelectedColor(color)}
                  disabled={isUsed}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: isSelected ? '2px solid var(--gitlab-text-primary)' : '1px solid var(--gitlab-border-light)',
                    cursor: isUsed ? 'not-allowed' : 'pointer',
                    transition: 'border-color 0.2s ease',
                    padding: 0,
                    minWidth: '24px',
                    minHeight: '24px',
                    flexShrink: 0,
                    position: 'relative',
                    opacity: isUsed ? 0.6 : 1
                  }}
                  title={isUsed ? `${color} (уже используется)` : color}
                >
                  {isUsed && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '10px',
                      color: getContrastTextColor(color),
                      textShadow: '0 0 2px rgba(0,0,0,0.8)',
                      pointerEvents: 'none'
                    }}>
                      🔒
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Предварительный просмотр */}
          {newCategoryName.trim() && selectedColor && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 8px',
              backgroundColor: 'var(--gitlab-bg-secondary)',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <span>Предварительный просмотр:</span>
              <span style={{
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
            gap: '8px',
            justifyContent: 'flex-end'
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