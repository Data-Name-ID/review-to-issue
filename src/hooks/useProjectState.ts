import React, { useState, useCallback, useEffect } from 'react';
import type { ProjectState, CodeComment, Repository, WindowWithFileSystemAPI, CommentCategory } from '../types';
import { readFile } from '../utils/fileUtils';
import { 
  saveRepository, 
  loadRepository, 
  saveComments, 
  loadComments, 
  savePendingUrl,
  loadPendingUrl,
  saveAllFiles,
  loadAllFiles,
  saveLastDirectoryPath,
  loadLastDirectoryPath,
  clearAppStorage,
  setNewRepositoryFlag,
  isNewRepositoryFlag,
  clearNewRepositoryFlag,
  saveCategories,
  loadCategories
} from '../utils/localStorage';

export const useProjectState = () => {
  const [state, setState] = useState<ProjectState>(() => ({
    repository: loadRepository(),
    currentFile: null,
    fileContent: '',
    comments: loadComments(),
    isLoading: false
  }));

  const [allFiles, setAllFiles] = useState<Array<{ path: string; content: string }>>(() => loadAllFiles());
  
  // Отдельное состояние для хранения URL до создания репозитория
  const [pendingUrl, setPendingUrl] = useState<{baseUrl: string; defaultBranch: string} | null>(() => loadPendingUrl());
  
  // Состояние для отображения предложения восстановить последнюю папку
  const [shouldPromptRestore, setShouldPromptRestore] = useState(false);

  // Категории комментариев (не очищаются при сбросе репозитория)
  const [categories, setCategories] = useState<CommentCategory[]>(() => loadCategories());

  // Автоматическое сохранение в localStorage при изменении состояния
  useEffect(() => {
    saveRepository(state.repository);
  }, [state.repository]);

  useEffect(() => {
    saveComments(state.comments);
  }, [state.comments]);

  useEffect(() => {
    savePendingUrl(pendingUrl);
  }, [pendingUrl]);

  useEffect(() => {
    saveAllFiles(allFiles);
  }, [allFiles]);

  // Сохраняем категории отдельно
  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  // Проверка при загрузке страницы - есть ли данные для восстановления
  useEffect(() => {
    const lastPath = loadLastDirectoryPath();
    const hasRepository = state.repository !== null;
    const hasFiles = allFiles.length > 0;
    const isNewRepo = isNewRepositoryFlag();
    
    // Показываем уведомление только если:
    // 1. Есть сохраненный путь к папке (была работа с репозиторием)
    // 2. Есть информация о репозитории (название, URL)
    // 3. НЕТ файлов (контент потерялся)
    // 4. НЕ установлен флаг нового репозитория (не намеренное создание нового)
    if (lastPath && hasRepository && !hasFiles && !isNewRepo) {
      setShouldPromptRestore(true);
    }
    
    // Очищаем флаг нового репозитория после проверки, если файлы уже загружены
    if (hasFiles && isNewRepo) {
      clearNewRepositoryFlag();
    }
  }, [state.repository, allFiles.length]); // Отслеживаем изменения репозитория и количества файлов

  // Функция для фильтрации файлов - теперь включаем все файлы кроме служебных папок
  const shouldIncludeFile = useCallback((filePath: string): boolean => {
    const ignoredPaths = ['.git/', 'node_modules/', '.DS_Store', 'Thumbs.db'];
    
    // Проверяем только служебные пути - все остальное включаем
    return !ignoredPaths.some(ignored => filePath.includes(ignored));
  }, []);
  
  // Функция для определения текстового файла
  const isTextFile = useCallback((filePath: string): boolean => {
    const fileName = filePath.split('/').pop() || '';
    const textExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.go', '.rs', 
      '.html', '.htm', '.css', '.scss', '.sass', '.less', '.json', '.xml', '.yaml', '.yml', 
      '.md', '.txt', '.sql', '.sh', '.bash', '.ps1', '.vue', '.svelte', '.dart', '.kt', '.swift',
      '.dockerfile', '.env', '.gitignore', '.gitattributes', '.editorconfig', '.prettierrc', 
      '.eslintrc', '.babelrc', '.config', '.conf', '.ini', '.toml', '.lock', '.log'
    ];
    
    // Проверяем расширение или файлы без расширения (могут быть конфигурационными)
    return textExtensions.some(ext => fileName.toLowerCase().endsWith(ext)) || 
           !fileName.includes('.') ||
           ['README', 'LICENSE', 'CHANGELOG', 'Dockerfile', 'Makefile'].includes(fileName);
  }, []);

  // Функция для загрузки всех файлов из FileSystemDirectoryHandle
  const loadFilesFromDirectory = useCallback(async (dirHandle: FileSystemDirectoryHandle) => {
    try {
      const allFilesData: Array<{ path: string; content: string }> = [];
      
      const loadFilesRecursively = async (handle: FileSystemDirectoryHandle, currentPath: string = '') => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for await (const [name, fileHandle] of (handle as any).entries()) {
          const fullPath = currentPath ? `${currentPath}/${name}` : name;
          
          if (fileHandle.kind === 'directory') {
            await loadFilesRecursively(fileHandle, fullPath);
          } else if (shouldIncludeFile(fullPath)) {
            try {
              if (isTextFile(fullPath)) {
                const content = await readFile(fileHandle);
                allFilesData.push({ path: fullPath, content });
              } else {
                // Для бинарных файлов добавляем специальное сообщение
                const file = await fileHandle.getFile();
                const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
                const content = `# Бинарный файл\n\nФайл не может быть отображен как текст.\n\n**Тип:** ${file.type || 'неизвестный'}\n**Размер:** ${sizeInMB} MB\n**Дата изменения:** ${new Date(file.lastModified).toLocaleString('ru-RU')}`;
                allFilesData.push({ path: fullPath, content });
              }
            } catch (error) {
              console.warn(`Не удалось прочитать файл ${fullPath}:`, error);
              // Добавляем файл с сообщением об ошибке
              allFilesData.push({ 
                path: fullPath, 
                content: `# Ошибка чтения файла\n\nНе удалось прочитать файл: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
              });
            }
          }
        }
      };
      
      await loadFilesRecursively(dirHandle);
      
      // Сортируем файлы по пути
      allFilesData.sort((a, b) => a.path.localeCompare(b.path));
      
      setAllFiles(allFilesData);
      console.log(`Загружено ${allFilesData.length} файлов`);
    } catch (error) {
      console.error('Ошибка при загрузке всех файлов:', error);
    }
  }, [shouldIncludeFile, isTextFile]);

  // Функция для загрузки файлов из File[] (fallback)
  const loadFilesFromFileList = useCallback(async (files: File[]) => {
    try {
      const allFilesData: Array<{ path: string; content: string }> = [];
      
      for (const file of files) {
        const pathParts = file.webkitRelativePath.split('/');
        const relativePath = pathParts.slice(1).join('/');
        
        if (relativePath && shouldIncludeFile(relativePath)) {
          try {
            if (isTextFile(relativePath)) {
              const content = await file.text();
              allFilesData.push({ path: relativePath, content });
            } else {
              // Для бинарных файлов добавляем специальное сообщение
              const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
              const content = `# Бинарный файл\n\nФайл не может быть отображен как текст.\n\n**Тип:** ${file.type || 'неизвестный'}\n**Размер:** ${sizeInMB} MB\n**Дата изменения:** ${new Date(file.lastModified).toLocaleString('ru-RU')}`;
              allFilesData.push({ path: relativePath, content });
            }
          } catch (error) {
            console.warn(`Не удалось прочитать файл ${relativePath}:`, error);
            // Добавляем файл с сообщением об ошибке
            allFilesData.push({ 
              path: relativePath, 
              content: `# Ошибка чтения файла\n\nНе удалось прочитать файл: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
            });
          }
        }
      }
      
      // Сортируем файлы по пути
      allFilesData.sort((a, b) => a.path.localeCompare(b.path));
      
      setAllFiles(allFilesData);
      console.log(`Загружено ${allFilesData.length} файлов`);
    } catch (error) {
      console.error('Ошибка при загрузке файлов:', error);
    }
  }, [shouldIncludeFile, isTextFile]);

  // Функция для обработки выбора папки через fallback метод
  const handleDirectoryFallback = useCallback(async (files: File[]) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
           // Создаем объект репозитория
           const repositoryName = files[0]?.webkitRelativePath.split('/')[0] || 'Unknown';
           const repository: Repository = {
             name: repositoryName,
             rootPath: repositoryName,
             baseUrl: pendingUrl?.baseUrl || '', // Используем сохраненный URL
             defaultBranch: pendingUrl?.defaultBranch || 'main'
           };
           
           // Сохраняем путь к последней папке
           saveLastDirectoryPath(repositoryName);
           
           // Очищаем временный URL
           setPendingUrl(null);
      
      setState(prev => ({
        ...prev,
        repository,
        isLoading: false
      }));
      
           // Загружаем все файлы
           await loadFilesFromFileList(files);
           
           // Очищаем флаг нового репозитория после успешной загрузки файлов
           clearNewRepositoryFlag();
      
    } catch (error) {
      console.error('Ошибка при обработке файлов:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [loadFilesFromFileList, pendingUrl]);

  // Выбор папки репозитория
  const selectRepository = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Проверяем поддержку File System Access API
      if ('showDirectoryPicker' in window) {
        try {
          const dirHandle = await (window as WindowWithFileSystemAPI).showDirectoryPicker?.();
          if (!dirHandle) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
          }
          
               // Создаем объект репозитория
               const repository: Repository = {
                 name: dirHandle.name,
                 rootPath: dirHandle.name,
                 baseUrl: pendingUrl?.baseUrl || '', // Используем сохраненный URL
                 defaultBranch: pendingUrl?.defaultBranch || 'main'
               };
               
               // Сохраняем путь к последней папке
               saveLastDirectoryPath(dirHandle.name);
               
               // Очищаем временный URL
               setPendingUrl(null);
               
               setState(prev => ({
                 ...prev,
                 repository,
                 isLoading: false
               }));
               
               // Загружаем все файлы
               await loadFilesFromDirectory(dirHandle);
               
               // Очищаем флаг нового репозитория после успешной загрузки файлов
               clearNewRepositoryFlag();
          
        } catch (error) {
          console.error('Ошибка при выборе папки через File System Access API:', error);
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        // Fallback: используем input[type="file"] с webkitdirectory
        setState(prev => ({ ...prev, isLoading: false }));
        const input = document.getElementById('directory-picker') as HTMLInputElement;
        if (input) {
          input.click();
        }
      }
      
    } catch (error) {
      console.error('Ошибка при выборе папки:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [loadFilesFromDirectory, pendingUrl]);

  // Функция для восстановления последней папки
  const restoreLastDirectory = useCallback(async () => {
    const lastPath = loadLastDirectoryPath();
    if (lastPath && state.repository) {
      setShouldPromptRestore(false);
      // Очищаем флаг нового репозитория при восстановлении
      clearNewRepositoryFlag();
      // Просто запускаем обычный selectRepository
      await selectRepository();
    }
  }, [selectRepository, state.repository]);

  // Функция для отклонения восстановления
  const dismissRestore = useCallback(() => {
    setShouldPromptRestore(false);
  }, []);

  // Функция для начала работы с новым репозиторием
  const startNewRepository = useCallback(() => {
    // Устанавливаем флаг намеренного создания нового репозитория
    setNewRepositoryFlag(true);
    
    // Очищаем все данные из localStorage
    clearAppStorage();
    
    // Восстанавливаем флаг после очистки (так как clearAppStorage удаляет всё)
    setNewRepositoryFlag(true);
    
    // Сбрасываем все состояния
    setState({
      repository: null,
      currentFile: null,
      fileContent: '',
      comments: [],
      isLoading: false
    });
    
    setAllFiles([]);
    setPendingUrl(null);
    setShouldPromptRestore(false);
    
    // Перезагружаем страницу для полного сброса
    window.location.reload();
  }, []);

  // Установка базового URL репозитория
  const setRepositoryUrl = useCallback((baseUrl: string, defaultBranch: string = 'main') => {
    if (state.repository) {
      // Если репозиторий уже существует, обновляем его URL
      setState(prev => ({
        ...prev,
        repository: prev.repository ? {
          ...prev.repository,
          baseUrl,
          defaultBranch
        } : null
      }));
    } else {
      // Если репозиторий еще не создан, сохраняем URL во временное состояние
      setPendingUrl({ baseUrl, defaultBranch });
    }
  }, [state.repository]);

  // Добавление комментария
  const addComment = useCallback((comment: Omit<CodeComment, 'id' | 'timestamp'>) => {
    const newComment: CodeComment = {
      ...comment,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    
    setState(prev => ({
      ...prev,
      comments: [...prev.comments, newComment]
    }));
  }, []);

  // Удаление комментария
  const removeComment = useCallback((commentId: string) => {
    setState(prev => ({
      ...prev,
      comments: prev.comments.filter(c => c.id !== commentId)
    }));
  }, []);

  // Редактирование комментария
  const updateComment = useCallback((commentId: string, updates: Partial<CodeComment>) => {
    setState(prev => ({
      ...prev,
      comments: prev.comments.map(c => 
        c.id === commentId ? { ...c, ...updates } : c
      )
    }));
  }, []);

  // Очистка всех комментариев
  const clearComments = useCallback(() => {
    setState(prev => ({
      ...prev,
      comments: []
    }));
  }, []);

  // Создание/обновление/удаление категорий
  const addCategory = useCallback((name: string, color: string) => {
    const newCategory: CommentCategory = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color,
      createdAt: new Date()
    };
    setCategories(prev => [...prev, newCategory]);
    return newCategory.id;
  }, []);

  const updateCategory = useCallback((categoryId: string, updates: Partial<Pick<CommentCategory, 'name' | 'color'>>) => {
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updates } : c));
  }, []);

  const removeCategory = useCallback((categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    // Удаляем привязку категории у комментариев
    setState(prev => ({
      ...prev,
      comments: prev.comments.map(c => c.categoryId === categoryId ? { ...c, categoryId: undefined } : c)
    }));
  }, []);

  // Устанавливаем глобальную функцию для fallback обработки
  React.useEffect(() => {
    (window as WindowWithFileSystemAPI).handleDirectoryFallback = handleDirectoryFallback;
    
    return () => {
      delete (window as WindowWithFileSystemAPI).handleDirectoryFallback;
    };
  }, [handleDirectoryFallback]);

  return {
    // Состояние
    ...state,
    allFiles,
    pendingUrl, // Добавляем pendingUrl для использования в компонентах
    shouldPromptRestore,
    categories,
    
    // Действия
    selectRepository,
    setRepositoryUrl,
    addComment,
    removeComment,
    updateComment,
    clearComments,
    restoreLastDirectory,
    dismissRestore,
    startNewRepository,
    addCategory,
    updateCategory,
    removeCategory,
  };
};
