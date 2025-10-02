import React, { forwardRef } from 'react';

// === TYPES ===
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'orange' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

interface SectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

interface InfoCardProps {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'danger';
  style?: React.CSSProperties;
}

// === BUTTON COMPONENT ===
export const Button: React.FC<ButtonProps> = ({ 
  variant = 'secondary', 
  size = 'md', 
  children, 
  className = '',
  style = {},
  disabled,
  ...props 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--gitlab-blue)',
          color: 'white',
          border: 'none'
        };
      case 'success':
        return {
          backgroundColor: 'var(--gitlab-green)',
          color: 'white',
          border: 'none'
        };
      case 'warning':
        return {
          backgroundColor: 'var(--gitlab-yellow)',
          color: 'var(--gitlab-text-primary)',
          border: 'none'
        };
      case 'danger':
        return {
          backgroundColor: 'var(--gitlab-red)',
          color: 'white',
          border: 'none'
        };
      case 'orange':
        return {
          backgroundColor: 'var(--gitlab-orange)',
          color: 'white',
          border: 'none'
        };
      case 'blue':
        return {
          backgroundColor: 'var(--gitlab-blue)',
          color: 'white',
          border: 'none'
        };
      case 'secondary':
      default:
        return {
          backgroundColor: 'var(--gitlab-bg-secondary)',
          color: 'var(--gitlab-text-secondary)',
          border: '1px solid var(--gitlab-border-light)'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '6px 12px',
          fontSize: '12px',
          borderRadius: '4px'
        };
      case 'lg':
        return {
          padding: '12px 24px',
          fontSize: '16px',
          borderRadius: '6px'
        };
      case 'md':
      default:
        return {
          padding: '8px 16px',
          fontSize: '14px',
          borderRadius: '4px'
        };
    }
  };

  const buttonStyle = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontWeight: '500',
    transition: 'all 0.2s ease',
    // Пользовательские стили не должны переопределять базовые размеры
    ...style,
    // Принудительно применяем размеры после пользовательских стилей
    ...getSizeStyles()
  };

  return (
    <button
      className={className}
      style={buttonStyle}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// === CARD COMPONENT ===
export const Card: React.FC<CardProps> = ({ children, className = '', style = {} }) => {
  const cardStyle = {
    backgroundColor: 'var(--gitlab-bg-tertiary)',
    border: '1px solid var(--gitlab-border-light)',
    borderRadius: '6px',
    padding: '12px',
    ...style
  };

  return (
    <div className={className} style={cardStyle}>
      {children}
    </div>
  );
};

// === INPUT COMPONENT ===
export const Input: React.FC<InputProps> = ({ label, error, className = '', style = {}, ...props }) => {
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${error ? 'var(--gitlab-red)' : 'var(--gitlab-border-light)'}`,
    borderRadius: '4px',
    fontSize: '13px',
    backgroundColor: 'var(--gitlab-bg-secondary)',
    color: 'var(--gitlab-text-primary)',
    boxSizing: 'border-box' as const,
    ...style
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--gitlab-text-primary)'
        }}>
          {label}
        </label>
      )}
      <input
        className={`gitlab-input ${className}`}
        style={inputStyle}
        {...props}
      />
      {error && (
        <div style={{
          fontSize: '12px',
          color: 'var(--gitlab-red)',
          marginTop: '4px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

// === SELECT COMPONENT ===
export const Select: React.FC<SelectProps> = ({ label, error, className = '', style = {}, children, ...props }) => {
  const selectStyle = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${error ? 'var(--gitlab-red)' : 'var(--gitlab-border-light)'}`,
    borderRadius: '4px',
    fontSize: '13px',
    backgroundColor: 'var(--gitlab-bg-secondary)',
    color: 'var(--gitlab-text-primary)',
    boxSizing: 'border-box' as const,
    ...style
  };

  return (
    <div style={{ marginBottom: '0' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--gitlab-text-primary)'
        }}>
          {label}
        </label>
      )}
      <select
        className={`gitlab-select ${className}`}
        style={selectStyle}
        {...props}
      >
        {children}
      </select>
      {error && (
        <div style={{
          fontSize: '12px',
          color: 'var(--gitlab-red)',
          marginTop: '4px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

// === TEXTAREA COMPONENT ===
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', style = {}, ...props }, ref) => {
    const textareaStyle = {
      width: '100%',
      padding: '8px 12px',
      border: `1px solid ${error ? 'var(--gitlab-red)' : 'var(--gitlab-border-light)'}`,
      borderRadius: '4px',
      fontSize: '13px',
      backgroundColor: 'var(--gitlab-bg-secondary)',
      color: 'var(--gitlab-text-primary)',
      boxSizing: 'border-box' as const,
      resize: 'vertical' as const,
      minHeight: '80px',
      ...style
    };

    return (
      <div style={{ marginBottom: '0' }}>
        {label && (
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '13px',
            fontWeight: '500',
            color: 'var(--gitlab-text-primary)'
          }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`gitlab-textarea ${className}`}
          style={textareaStyle}
          {...props}
        />
        {error && (
          <div style={{
            fontSize: '12px',
            color: 'var(--gitlab-red)',
            marginTop: '4px'
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// === BADGE COMPONENT ===
export const Badge: React.FC<BadgeProps> = ({ children, variant = 'secondary', size = 'md', style }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          color: 'var(--gitlab-green)',
          border: '1px solid rgba(34, 197, 94, 0.2)'
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: 'var(--gitlab-yellow)',
          border: '1px solid rgba(245, 158, 11, 0.2)'
        };
      case 'danger':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--gitlab-red)',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        };
      case 'info':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: 'var(--gitlab-blue)',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        };
      case 'secondary':
      default:
        return {
          backgroundColor: 'var(--gitlab-bg-secondary)',
          color: 'var(--gitlab-text-secondary)',
          border: '1px solid var(--gitlab-border-light)'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          fontSize: '11px',
          padding: '2px 6px',
          borderRadius: '3px'
        };
      case 'md':
      default:
        return {
          fontSize: '12px',
          padding: '4px 8px',
          borderRadius: '4px'
        };
    }
  };

  const badgeStyle = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    display: 'inline-block',
    fontWeight: '500',
    lineHeight: '1',
    ...style
  };

  return (
    <span style={badgeStyle}>
      {children}
    </span>
  );
};

// === SECTION COMPONENT ===
export const Section: React.FC<SectionProps> = ({ title, icon, children, className = '' }) => {
  return (
    <div className={className}>
      <h4 style={{ 
        margin: '0 0 16px 0',
        fontSize: '16px',
        color: 'var(--gitlab-text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {icon && <span>{icon}</span>}
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
      </div>
    </div>
  );
};

// === INFO CARD COMPONENT ===
export const InfoCard: React.FC<InfoCardProps> = ({ children, type = 'info', style }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid var(--gitlab-yellow)',
          borderLeftWidth: '4px'
        };
      case 'success':
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid var(--gitlab-green)',
          borderLeftWidth: '4px'
        };
      case 'danger':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--gitlab-red)',
          borderLeftWidth: '4px'
        };
      case 'info':
      default:
        return {
          backgroundColor: 'var(--gitlab-bg-primary)',
          border: '1px solid var(--gitlab-blue)',
          borderLeftWidth: '4px'
        };
    }
  };

  const cardStyle = {
    ...getTypeStyles(),
    padding: '12px',
    borderRadius: '6px',
    ...style
  };

  return (
    <div style={cardStyle}>
      <div style={{ 
        fontSize: '13px', 
        color: 'var(--gitlab-text-secondary)',
        lineHeight: '1.4'
      }}>
        {children}
      </div>
    </div>
  );
};

// === SETTING ITEM COMPONENT ===
interface SettingItemProps {
  title: string;
  description: string;
  icon?: string;
  children: React.ReactNode;
}

export const SettingItem: React.FC<SettingItemProps> = ({ title, description, icon, children }) => {
  return (
    <Card style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: '500', 
          color: 'var(--gitlab-text-primary)',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {icon && <span>{icon}</span>}
          {title}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--gitlab-text-secondary)'
        }}>
          {description}
        </div>
      </div>
      <div style={{ marginLeft: '16px' }}>
        {children}
      </div>
    </Card>
  );
};

// === FORM ACTIONS COMPONENT ===
interface FormActionsProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  cancelText?: string;
  submitText?: string;
  submitDisabled?: boolean;
  submitVariant?: ButtonProps['variant'];
}

export const FormActions: React.FC<FormActionsProps> = ({ 
  onCancel, 
  onSubmit, 
  cancelText = 'Отмена', 
  submitText = 'Сохранить',
  submitDisabled = false,
  submitVariant = 'primary'
}) => {
  return (
    <div 
      className="gitlab-form-actions"
      style={{ 
        display: 'flex', 
        gap: '8px', 
        justifyContent: 'flex-end',
        marginTop: '16px'
      }}>
      {onCancel && (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={onCancel}
        >
          {cancelText}
        </Button>
      )}
      {onSubmit && (
        <Button 
          variant={submitVariant}
          size="sm" 
          onClick={onSubmit}
          disabled={submitDisabled}
        >
          {submitText}
        </Button>
      )}
    </div>
  );
};

// Export CategorySelector
export { CategorySelector } from './CategorySelector';
