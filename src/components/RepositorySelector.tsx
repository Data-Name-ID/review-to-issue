import { useState, useEffect } from 'react';
import type { Repository, WindowWithFileSystemAPI } from '../types';
import { Button, Input, Section, SettingItem, FormActions, Badge } from './ui';

interface RepositorySelectorProps {
  repository: Repository | null;
  onRepositorySelect: () => void;
  onRepositoryUrlSet: (baseUrl: string, defaultBranch: string) => void;
  isLoading: boolean;
  onClose?: () => void; // Функция для закрытия модального окна
  allFilesCount?: number; // Количество загруженных файлов
  isSettingsModal?: boolean; // Является ли это модальным окном настроек
  pendingUrl?: {baseUrl: string; defaultBranch: string} | null; // URL до создания репозитория
}

export const RepositorySelector = ({ 
  repository, 
  onRepositorySelect, 
  onRepositoryUrlSet,
  isLoading,
  onClose,
  allFilesCount = 0,
  isSettingsModal = false,
  pendingUrl
}: RepositorySelectorProps) => {
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [urlSaved, setUrlSaved] = useState(!!repository?.baseUrl || !!pendingUrl); // Отслеживаем, что URL был сохранен

  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (baseUrl.trim()) {
      onRepositoryUrlSet(baseUrl.trim(), defaultBranch.trim());
      setShowUrlForm(false);
      setUrlSaved(true); // Отмечаем, что URL был сохранен
    }
  };

  const handleRepositorySelect = () => {
    onRepositorySelect();
  };

  // Автоматически закрываем модальное окно после успешной загрузки файлов
  // Только если это не модальное окно настроек
  useEffect(() => {
    if (repository && !isLoading && allFilesCount > 0 && onClose && !isSettingsModal) {
      // Закрываем модальное окно только если это не модальное окно настроек
      onClose();
    }
  }, [repository, isLoading, allFilesCount, onClose, isSettingsModal]);

  // Инициализируем состояния при монтировании компонента
  useEffect(() => {
    if (repository?.baseUrl) {
      setBaseUrl(repository.baseUrl);
      setUrlSaved(true);
    } else if (pendingUrl?.baseUrl) {
      setBaseUrl(pendingUrl.baseUrl);
      setUrlSaved(true);
    }
    
    if (repository?.defaultBranch) {
      setDefaultBranch(repository.defaultBranch);
    } else if (pendingUrl?.defaultBranch) {
      setDefaultBranch(pendingUrl.defaultBranch);
    }
  }, [repository?.baseUrl, repository?.defaultBranch, pendingUrl?.baseUrl, pendingUrl?.defaultBranch]); // Включаем все зависимости

  // Обновляем baseUrl и defaultBranch при изменении repository или pendingUrl
  useEffect(() => {
    if (repository?.baseUrl) {
      setBaseUrl(repository.baseUrl);
      setUrlSaved(true);
    } else if (pendingUrl?.baseUrl) {
      setBaseUrl(pendingUrl.baseUrl);
      setUrlSaved(true);
    } else {
      setUrlSaved(false);
    }
    
    if (repository?.defaultBranch) {
      setDefaultBranch(repository.defaultBranch);
    } else if (pendingUrl?.defaultBranch) {
      setDefaultBranch(pendingUrl.defaultBranch);
    }
  }, [repository, pendingUrl]);

  // Удалена неиспользуемая переменная isConfigured

  return (
    <Section title="Настройки репозитория" icon="📁">
      {/* URL Configuration - First Step */}
      <SettingItem
        title="URL репозитория"
        description="Укажите ссылку на удаленный репозиторий для генерации ссылок на код"
        icon="🔗"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          {(repository?.baseUrl || pendingUrl?.baseUrl || baseUrl) && (
            <div style={{ 
              maxWidth: '180px', 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '11px'
            }}>
              <Badge variant="success" size="sm">
              ✅ {(() => {
                const fullUrl = repository?.baseUrl || pendingUrl?.baseUrl || baseUrl;
                if (!fullUrl) return '';
                
                // Более агрессивное обрезание для длинных URL
                const cleaned = fullUrl.replace(/^https?:\/\/(www\.)?/, '');
                if (cleaned.length <= 25) return cleaned;
                
                // Берем начало и конец URL
                const start = cleaned.substring(0, 12);
                const end = cleaned.substring(cleaned.length - 8);
                return `${start}...${end}`;
              })()}
              </Badge>
            </div>
          )}
          
          <Button
            variant={repository?.baseUrl || pendingUrl?.baseUrl || baseUrl ? "success" : "blue"}
            size="sm"
            onClick={() => setShowUrlForm(!showUrlForm)}
            style={{ minWidth: "80px" }}
          >
                   {repository?.baseUrl || pendingUrl?.baseUrl || baseUrl ? "✏️" : "🔗"}
          </Button>
        </div>
      </SettingItem>

      {/* Repository Selection - Second Step */}
      {(repository?.baseUrl || pendingUrl?.baseUrl || urlSaved) && (
        <SettingItem
          title="Локальный репозиторий"
          description="Выберите папку репозитория для ревью"
          icon="📂"
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "8px",
            }}
          >
            {repository && (
              <Badge variant="success" size="sm">
                ✅ {repository.name}
              </Badge>
            )}

            {/* Hidden input for fallback */}
            <input
              type="file"
              id="directory-picker"
              {...({ webkitdirectory: "" } as Record<string, string>)}
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  (window as WindowWithFileSystemAPI).handleDirectoryFallback?.(
                    files
                  );
                }
              }}
            />

            <Button
              variant={repository ? "secondary" : "blue"}
              size="sm"
              onClick={handleRepositorySelect}
              disabled={isLoading}
              style={{ minWidth: "80px" }}
            >
                   {isLoading
                     ? "⏳"
                     : repository
                     ? "✏️"
                     : "📁"}
            </Button>
          </div>
        </SettingItem>
      )}

      {/* URL Form */}
      {showUrlForm && (
        <form onSubmit={handleSubmitUrl}>
          <Input
            label="URL репозитория"
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://gitlab.crja72.ru/django/2024/autumn/course/students/282461-mihasokolovilich-course-1187"
            required
          />

          <Input
            label="Основная ветка"
            type="text"
            value={defaultBranch}
            onChange={(e) => setDefaultBranch(e.target.value)}
            placeholder="main"
            required
          />

                 <FormActions
                   onCancel={() => setShowUrlForm(false)}
                   onSubmit={() => handleSubmitUrl({ preventDefault: () => {} } as React.FormEvent)}
                   submitText="💾"
                   submitVariant="blue"
                   cancelText="❌"
                 />
        </form>
      )}
    </Section>
  );
};
