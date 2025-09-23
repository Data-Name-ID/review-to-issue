import { useState, useEffect, useCallback } from 'react'
import { useProjectState } from './hooks/useProjectState'
import { RepositorySelector } from './components/RepositorySelector'
import { AllFilesViewer } from './components/AllFilesViewer'
import { CommentsPanel } from './components/CommentsPanel'
import { MarkdownExport } from './components/MarkdownExport'
import { FileTree } from './components/FileTree'
import { RestoreNotification } from './components/RestoreNotification'
import { TemplatesManager } from './components/TemplatesManager'
import { Button, Section, SettingItem, InfoCard } from './components/ui'
import { 
  saveCurrentFile, 
  loadCurrentFile, 
  saveSidebarWidth, 
  loadSidebarWidth,
  saveShowSidebar, 
  loadShowSidebar,
  saveActivePanel, 
  loadActivePanel,
  saveVirtualizationEnabled, 
  loadVirtualizationEnabled,
  saveDebugMode, 
  loadDebugMode
} from './utils/localStorage'
import './App.css'

function App() {
  const [currentFile, setCurrentFile] = useState<string | null>(() => loadCurrentFile())
  const [scrollToFile, setScrollToFile] = useState<string | null>(null)

  // Функция для выбора файла с автоматическим скроллом
  const handleFileSelect = useCallback((filePath: string) => {
    setCurrentFile(filePath)
    setScrollToFile(filePath)
  }, [])

  // Функция для перехода к комментарию
  const handleNavigateToComment = useCallback((filePath: string, lineNumber: number) => {
    setCurrentFile(filePath)
    setScrollToFile(filePath)
    
    // НЕ переключаемся на вкладку файлов - остаемся на текущей вкладке (комментарии)
    // Но прокручиваем основную область просмотра к нужному файлу
    
    // Небольшая задержка для прокрутки к конкретной строке
    setTimeout(() => {
      const lineElement = document.querySelector(`[data-line-number="${lineNumber}"]`);
      if (lineElement) {
        lineElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 500);
  }, [])
  const [showSidebar, setShowSidebar] = useState(() => loadShowSidebar())
  const [isMobileView, setIsMobileView] = useState(false)
  const [showRepoSettings, setShowRepoSettings] = useState(false)
  const [activePanel, setActivePanel] = useState<'files' | 'comments' | 'export' | 'templates'>(() => {
    const loaded = loadActivePanel() as 'files' | 'comments' | 'export' | 'templates' | 'readme';
    // Если загружена старая вкладка 'readme', используем 'files'
    return loaded === 'readme' ? 'files' : loaded;
  })
  const [sidebarWidth, setSidebarWidth] = useState(() => loadSidebarWidth())
  const [isResizing, setIsResizing] = useState(false)
  // Настройки производительности
  const [virtualizationEnabled, setVirtualizationEnabled] = useState(() => loadVirtualizationEnabled())
  const [debugMode, setDebugMode] = useState(() => loadDebugMode())
  
  const {
    repository,
    comments,
    allFiles,
    isLoading,
    pendingUrl,
    shouldPromptRestore,
    categories,
    templates,
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
    addTemplate,
    updateTemplate,
    removeTemplate,
    useTemplate,
    duplicateTemplate
  } = useProjectState()

  // Проверка размера экрана
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768)
      if (window.innerWidth <= 768) {
        setShowSidebar(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Обновление CSS переменной ширины сайдбара
  useEffect(() => {
    document.documentElement.style.setProperty('--gitlab-sidebar-width', `${sidebarWidth}px`)
  }, [sidebarWidth])


  // Автосохранение состояний в localStorage
  useEffect(() => {
    saveCurrentFile(currentFile)
  }, [currentFile])

  useEffect(() => {
    saveSidebarWidth(sidebarWidth)
  }, [sidebarWidth])

  useEffect(() => {
    saveShowSidebar(showSidebar)
  }, [showSidebar])

  useEffect(() => {
    saveActivePanel(activePanel)
  }, [activePanel])

  useEffect(() => {
    saveVirtualizationEnabled(virtualizationEnabled)
  }, [virtualizationEnabled])

  useEffect(() => {
    saveDebugMode(debugMode)
  }, [debugMode])

  // Обработчики для изменения размера сайдбара
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = e.clientX
      if (newWidth >= 500 && newWidth <= 800) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])


  // Показываем начальный экран если нет файлов (папка не выбрана)
  if (allFiles.length === 0) {
    return (
      <div className="d-flex align-center justify-center" style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: '500px', width: '100%', padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
              Code Review
            </h1>
          </div>
          <RepositorySelector
            repository={repository}
            onRepositorySelect={selectRepository}
            onRepositoryUrlSet={setRepositoryUrl}
            isLoading={isLoading}
            onClose={undefined} // На главном экране нет модального окна
            allFilesCount={allFiles.length}
            isSettingsModal={false} // На главном экране это не модальное окно
            pendingUrl={pendingUrl}
          />
        </div>
      </div>
    )
  }

  return (
      <div>
      {/* Restore Notification */}
      {shouldPromptRestore && repository && (
        <RestoreNotification
          repositoryName={repository.name}
          onRestore={restoreLastDirectory}
          onDismiss={dismissRestore}
          onNewRepository={startNewRepository}
        />
      )}

      {/* GitLab Header */}
      <header className="gitlab-header d-flex align-center justify-between px-3">
        <div className="d-flex align-center gap-4 flex-1">
          {/* Menu Toggle убран - теперь на сайдбаре */}
          
          {/* Logo and Project Info */}
          <div className="d-flex align-center gap-3">
            <div className="gitlab-header-logo">
              📄
            </div>
            <div className="gitlab-header-info">
              <h1 className="gitlab-header-title">
                Code Review Tool
              </h1>
              {repository && (
                <div className="gitlab-header-subtitle">
                  {repository.name}
                  {repository.baseUrl && (
                    <span className="gitlab-header-host">
                      • {new URL(repository.baseUrl).hostname}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Current File Breadcrumb */}
          {currentFile && (
            <div className="gitlab-header-breadcrumb">
              <span className="gitlab-breadcrumb-separator">/</span>
              <span className="gitlab-breadcrumb-file">
                {currentFile}
              </span>
            </div>
          )}
          
        </div>
        
        {/* Action Buttons */}
        <div className="d-flex align-center gap-2">
          {/* Project Stats */}
          {repository && (
            <div className="gitlab-header-stats">
              <div className="gitlab-stat-item" title="Файлов в репозитории">
                <span className="gitlab-stat-icon">📁</span>
                <span className="gitlab-stat-value">{allFiles.length}</span>
              </div>
              <div className="gitlab-stat-item" title="Комментариев">
                <span className="gitlab-stat-icon gitlab-stat-icon-orange">💬</span>
                <span className="gitlab-stat-value">{comments.length}</span>
              </div>
              <div className="gitlab-stat-item" title="Все данные сохраняются автоматически в localStorage">
                <span className="gitlab-stat-icon gitlab-stat-icon-green">💾</span>
                <span className="gitlab-stat-value gitlab-stat-text">АВТО</span>
              </div>
              {comments.length > 0 && (
                <div className="gitlab-stat-item" title="Файлов с комментариями">
                  <span className="gitlab-stat-icon gitlab-stat-icon-green">📊</span>
                  <span className="gitlab-stat-value">
                    {new Set(comments.map(c => c.filePath)).size}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Settings Button */}
          <Button
            variant={repository?.baseUrl ? 'success' : 'blue'}
            size="sm"
            onClick={() => setShowRepoSettings(true)}
            title="Настройки репозитория"
          >
            {repository?.baseUrl ? '⚙️' : '🔧'}
          </Button>

          {/* New Repository Button */}
          {repository && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (confirm('Вы уверены, что хотите начать работу с новым репозиторием? Все текущие данные будут удалены.')) {
                  startNewRepository();
                }
              }}
              title="Начать работу с новым репозиторием"
            >
              🆕
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Overlay */}
      {isMobileView && showSidebar && (
        <div 
          className="gitlab-mobile-overlay"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Универсальная кнопка toggle сайдбара */}
      {!isMobileView && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowSidebar(!showSidebar)}
          style={{
            position: 'fixed',
            top: '58px',
            left: showSidebar ? `${sidebarWidth - 15}px` : '10px',
            width: '30px',
            height: '30px',
            padding: '0',
            zIndex: '1002',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'left 0.3s ease'
          }}
          title={showSidebar ? "Скрыть боковую панель" : "Показать боковую панель"}
        >
          {showSidebar ? '◀' : '▶'}
        </Button>
      )}

      {/* GitLab Sidebar */}
      <aside className={`gitlab-sidebar ${isMobileView && showSidebar ? 'open' : ''} ${!isMobileView && !showSidebar ? 'hidden' : ''}`}>

        {/* Sidebar Resizer */}
        {!isMobileView && showSidebar && (
          <div
            className="gitlab-sidebar-resizer"
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Sidebar Header */}
        <div className="gitlab-sidebar-header">
          <div className="d-flex justify-between align-center mb-3">
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gitlab-text-primary)' }}>
              Проект
            </h3>
            <div className="d-flex align-center gap-2">
              {/* Mobile Close Button - только для мобильных */}
              {isMobileView && (
                <button
                  onClick={() => setShowSidebar(false)}
                  className="btn-secondary btn-sm"
                >
                  ✕
                </button>
              )}
            </div>
      </div>
          
          {/* Panel Tabs */}
          <div className="gitlab-panel-tabs">
            <button
              onClick={() => setActivePanel('files')}
              className={`gitlab-panel-tab ${activePanel === 'files' ? 'active' : ''}`}
            >
              Файлы
            </button>
            <button
              onClick={() => setActivePanel('comments')}
              className={`gitlab-panel-tab ${activePanel === 'comments' ? 'active' : ''}`}
            >
              Комментарии {comments.length > 0 && `(${comments.length})`}
            </button>
           <button
               onClick={() => setActivePanel('export')}
               className={`gitlab-panel-tab ${activePanel === 'export' ? 'active' : ''}`}
             >
               Экспорт
            </button>
            <button
              onClick={() => setActivePanel('templates')}
              className={`gitlab-panel-tab ${activePanel === 'templates' ? 'active' : ''}`}
            >
              Шаблоны {templates.length > 0 && `(${templates.length})`}
            </button>
           </div>
        </div>

        {/* Sidebar Content */}
        <div className="gitlab-sidebar-content">
          {activePanel === 'files' && (
            <FileTree
              files={allFiles}
              comments={comments}
              currentFile={currentFile}
              onFileSelect={handleFileSelect}
            />
          )}

          {activePanel === 'comments' && (
            <div style={{ padding: '16px' }}>
              <CommentsPanel
                comments={comments}
                repository={repository}
                categories={categories}
                onUpdateComment={updateComment}
                onRemoveComment={removeComment}
                onClearComments={clearComments}
                onAddCategory={addCategory}
                onNavigateToComment={handleNavigateToComment}
              />
            </div>
          )}

          {activePanel === 'export' && (
            <div style={{ padding: '16px' }}>
              <MarkdownExport
                comments={comments}
                repository={repository}
                allFiles={allFiles}
                categories={categories}
              />
            </div>
          )}

          {activePanel === 'templates' && (
            <div style={{ padding: '16px' }}>
              <TemplatesManager
                templates={templates}
                onAddTemplate={addTemplate}
                onUpdateTemplate={updateTemplate}
                onRemoveTemplate={removeTemplate}
                onDuplicateTemplate={duplicateTemplate}
              />
            </div>
          )}
        </div>
      </aside>

      {/* GitLab Main Content */}
      <main className={`gitlab-main ${!showSidebar ? 'sidebar-hidden' : ''}`}>
        <div className="gitlab-content">
        {/* Breadcrumbs */}
        <div className="gitlab-breadcrumbs">
          <span className="gitlab-breadcrumb-item">
            {repository?.name || 'Repository'}
          </span>
          {currentFile && (
            <>
              <span className="gitlab-breadcrumb-separator">/</span>
              <span style={{ color: 'var(--gitlab-text-primary)' }}>
                {currentFile}
              </span>
            </>
          )}
        </div>

        {/* File Content */}
        <div className="p-4">
            <AllFilesViewer
              files={allFiles}
              comments={comments}
              categories={categories}
              templates={templates}
              onAddCategory={addCategory}
              onUseTemplate={useTemplate}
              onAddComment={addComment}
              onUpdateComment={updateComment}
              onDeleteComment={removeComment}
              scrollToFile={scrollToFile}
              onScrollComplete={() => setScrollToFile(null)}
              currentFile={currentFile}
              onCurrentFileChange={setCurrentFile}
              virtualizationEnabled={virtualizationEnabled}
              debugMode={debugMode}
            />
        </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showRepoSettings && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowRepoSettings(false)}
        >
          <div 
            className="fade-in"
            style={{
              backgroundColor: 'var(--gitlab-bg-secondary)',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '1px solid var(--gitlab-border-light)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
                  <div className="d-flex justify-between align-center mb-3">
                    <h3>Настройки репозитория</h3>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowRepoSettings(false)}
                    >
                      ✕
                    </Button>
            </div>

            <RepositorySelector
              repository={repository}
              onRepositorySelect={selectRepository}
              onRepositoryUrlSet={(baseUrl, defaultBranch) => {
                setRepositoryUrl(baseUrl, defaultBranch);
                setShowRepoSettings(false);
              }}
              isLoading={isLoading}
              onClose={() => setShowRepoSettings(false)}
              allFilesCount={allFiles.length}
              isSettingsModal={true}
              pendingUrl={pendingUrl}
            />

            {/* Divider */}
            <div style={{
              height: '1px',
              backgroundColor: 'var(--gitlab-border-light)',
              margin: '24px 0'
            }}></div>

            {/* Performance Settings */}
            <Section title="Настройки производительности" icon="⚙️">
              {/* Virtualization Toggle */}
              <SettingItem
                title="Виртуализация"
                description="Автоматически оптимизировать большие репозитории загрузкой/выгрузкой файлов"
                icon="📁"
              >
                <Button
                  variant={virtualizationEnabled ? 'success' : 'danger'}
                  size="sm"
                  onClick={() => setVirtualizationEnabled(!virtualizationEnabled)}
                  style={{ minWidth: '60px' }}
                >
                  {virtualizationEnabled ? 'ON' : 'OFF'}
                </Button>
              </SettingItem>

              {/* Debug Mode Toggle */}
              <SettingItem
                title="Режим отладки"
                description="Показать панель статистики производительности для отладки"
                icon="🐛"
              >
                <Button
                  variant={debugMode ? 'blue' : 'secondary'}
                  size="sm"
                  onClick={() => setDebugMode(!debugMode)}
                  style={{ minWidth: '60px' }}
                >
                  {debugMode ? 'ON' : 'OFF'}
                </Button>
              </SettingItem>


              {/* Performance Info */}
              <InfoCard type="info">
                💡 <strong>Совет:</strong> Включите виртуализацию для репозиториев с 50+ файлами. 
                Режим отладки показывает статистику производительности в реальном времени.
              </InfoCard>
            </Section>
          </div>
        </div>
      )}
      </div>
  )
}

export default App
