import type { CommentCategory, CommentTemplate, CodeComment, Repository } from '../types';

// Интерфейс для экспортируемых данных
export interface ExportData {
  version: string;
  exportDate: string;
  categories: CommentCategory[];
  templates: CommentTemplate[];
  comments?: CodeComment[];
  repository?: Repository;
}

// Функция для экспорта данных
export const exportData = (data: {
  categories: CommentCategory[];
  templates: CommentTemplate[];
  comments?: CodeComment[];
  repository?: Repository;
}): string => {
  const exportData: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    categories: data.categories,
    templates: data.templates,
    comments: data.comments,
    repository: data.repository
  };

  return JSON.stringify(exportData, null, 2);
};

// Функция для импорта данных
export const importData = (jsonString: string): ExportData => {
  try {
    const data = JSON.parse(jsonString) as ExportData;
    
    // Валидация структуры данных
    if (!data.version || !data.exportDate || !Array.isArray(data.categories) || !Array.isArray(data.templates)) {
      throw new Error('Неверный формат файла экспорта');
    }

    // Восстанавливаем Date объекты для категорий
    const categories = data.categories.map(cat => ({
      ...cat,
      createdAt: new Date(cat.createdAt)
    }));

    // Восстанавливаем Date объекты для шаблонов
    const templates = data.templates.map(template => ({
      ...template,
      createdAt: new Date(template.createdAt),
      lastUsed: template.lastUsed ? new Date(template.lastUsed) : undefined
    }));

    // Восстанавливаем Date объекты для комментариев (если есть)
    const comments = data.comments?.map(comment => ({
      ...comment,
      timestamp: new Date(comment.timestamp)
    }));

    return {
      ...data,
      categories,
      templates,
      comments
    };
  } catch (error) {
    throw new Error(`Ошибка при импорте данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
};

// Функция для скачивания файла
export const downloadFile = (content: string, filename: string, mimeType: string = 'application/json') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Функция для чтения файла
export const readFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Не удалось прочитать файл'));
      }
    };
    reader.onerror = () => reject(new Error('Ошибка при чтении файла'));
    reader.readAsText(file);
  });
};

