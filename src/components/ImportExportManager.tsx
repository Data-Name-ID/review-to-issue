import { useState, useRef } from 'react';
import type { CommentCategory, CommentTemplate, CodeComment, Repository } from '../types';
import { Button, Section, InfoCard } from './ui';
import { exportData, importData, downloadFile, readFile } from '../utils/importExport';

interface ImportExportManagerProps {
  categories: CommentCategory[];
  templates: CommentTemplate[];
  comments: CodeComment[];
  repository: Repository | null;
  onImportCategories: (categories: CommentCategory[]) => void;
  onImportTemplates: (templates: CommentTemplate[]) => void;
  onImportComments?: (comments: CodeComment[]) => void;
  onImportRepository?: (repository: Repository) => void;
}

export const ImportExportManager = ({
  categories,
  templates,
  comments,
  repository,
  onImportCategories,
  onImportTemplates,
  onImportComments,
  onImportRepository
}: ImportExportManagerProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Экспорт всех данных
  const handleExportAll = () => {
    const data = exportData({
      categories,
      templates,
      comments,
      repository: repository || undefined
    });
    
    const filename = `code-review-export-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(data, filename);
  };

  // Экспорт только категорий и шаблонов
  const handleExportSettings = () => {
    const data = exportData({
      categories,
      templates
    });
    
    const filename = `code-review-settings-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(data, filename);
  };

  // Обработка импорта файла
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const content = await readFile(file);
      const importedData = importData(content);

      // Импортируем категории
      if (importedData.categories.length > 0) {
        onImportCategories(importedData.categories);
      }

      // Импортируем шаблоны
      if (importedData.templates.length > 0) {
        onImportTemplates(importedData.templates);
      }

      // Импортируем комментарии (если есть и функция предоставлена)
      if (importedData.comments && importedData.comments.length > 0 && onImportComments) {
        onImportComments(importedData.comments);
      }

      // Импортируем репозиторий (если есть и функция предоставлена)
      if (importedData.repository && onImportRepository) {
        onImportRepository(importedData.repository);
      }

      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert('Данные успешно импортированы!');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      <Section title="Импорт и экспорт" icon="📁">
        {/* Экспорт */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px', 
            fontWeight: '600',
            color: 'var(--gitlab-text-primary)'
          }}>
            Экспорт данных
          </h4>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="blue"
              size="sm"
              onClick={handleExportAll}
              disabled={isImporting}
            >
              📤 Экспорт всех данных
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportSettings}
              disabled={isImporting}
            >
              ⚙️ Экспорт настроек
            </Button>
          </div>
          
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--gitlab-text-secondary)',
            marginTop: '8px'
          }}>
            <div>• <strong>Все данные:</strong> категории, шаблоны, комментарии, репозиторий</div>
            <div>• <strong>Настройки:</strong> только категории и шаблоны</div>
          </div>
        </div>

        {/* Импорт */}
        <div>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px', 
            fontWeight: '600',
            color: 'var(--gitlab-text-primary)'
          }}>
            Импорт данных
          </h4>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
            
            <Button
              variant="success"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? '⏳ Импорт...' : '📥 Импорт из файла'}
            </Button>
          </div>

          {importError && (
            <InfoCard type="danger" style={{ marginTop: '8px' }}>
              ❌ {importError}
            </InfoCard>
          )}

          <div style={{ 
            fontSize: '12px', 
            color: 'var(--gitlab-text-secondary)',
            marginTop: '8px'
          }}>
            <div>• Поддерживаются файлы экспорта в формате JSON</div>
            <div>• Импортируемые данные будут добавлены к существующим</div>
            <div>• Категории и шаблоны с одинаковыми ID будут обновлены</div>
          </div>
        </div>

        {/* Статистика */}
        <div style={{ 
          marginTop: '20px',
          padding: '12px',
          backgroundColor: 'var(--gitlab-bg-tertiary)',
          borderRadius: '6px',
          border: '1px solid var(--gitlab-border-light)'
        }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '13px', 
            fontWeight: '600',
            color: 'var(--gitlab-text-primary)'
          }}>
            Текущие данные
          </h4>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px',
            fontSize: '12px',
            color: 'var(--gitlab-text-secondary)'
          }}>
            <div>📂 Категории: {categories.length}</div>
            <div>📋 Шаблоны: {templates.length}</div>
            <div>💬 Комментарии: {comments.length}</div>
            <div>🏗️ Репозиторий: {repository ? '✓' : '✗'}</div>
          </div>
        </div>
      </Section>
    </div>
  );
};

