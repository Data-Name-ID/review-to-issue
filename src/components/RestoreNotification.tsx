import { Button } from './ui';

interface RestoreNotificationProps {
  repositoryName: string;
  onRestore: () => void;
  onDismiss: () => void;
  onNewRepository?: () => void;
}

export const RestoreNotification = ({ repositoryName, onRestore, onDismiss, onNewRepository }: RestoreNotificationProps) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      backgroundColor: 'var(--gitlab-bg-secondary)',
      border: '1px solid var(--gitlab-border-light)',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      maxWidth: '400px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '12px' 
      }}>
        <div style={{ fontSize: '20px' }}>📁</div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 600, 
            marginBottom: '4px',
            color: 'var(--gitlab-text-primary)'
          }}>
            Восстановить репозиторий?
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: 'var(--gitlab-text-secondary)',
            marginBottom: '12px'
          }}>
            Обнаружены данные от репозитория <strong>{repositoryName}</strong>. 
            Хотите загрузить файлы из той же папки?
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <Button 
              variant="blue" 
              size="sm" 
              onClick={onRestore}
            >
              📁 Восстановить
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onDismiss}
            >
              ❌ Пропустить
            </Button>
            {onNewRepository && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  if (confirm('Начать работу с новым репозиторием? Все данные будут удалены.')) {
                    onNewRepository();
                  }
                }}
                title="Начать с нового репозитория"
              >
                🆕 Новый
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
