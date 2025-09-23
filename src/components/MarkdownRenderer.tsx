import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  style?: React.CSSProperties;
}

export const MarkdownRenderer = ({ content, style }: MarkdownRendererProps) => {
  return (
    <div 
      style={{
        color: 'var(--gitlab-text-primary)',
        lineHeight: '1.6',
        ...style
      }}
      className="markdown-content"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Стилизация заголовков
          h1: ({ children }) => (
            <h1 style={{ 
              fontSize: '1.5em', 
              fontWeight: '600', 
              marginBottom: '16px',
              borderBottom: '2px solid var(--gitlab-border-light)',
              paddingBottom: '8px'
            }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ 
              fontSize: '1.3em', 
              fontWeight: '600', 
              marginBottom: '12px',
              marginTop: '24px'
            }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ 
              fontSize: '1.1em', 
              fontWeight: '600', 
              marginBottom: '8px',
              marginTop: '16px'
            }}>
              {children}
            </h3>
          ),
          // Стилизация кода
          code: ({ children, className }) => {
            const isInline = !className;
            return (
              <code
                style={{
                  backgroundColor: isInline ? 'var(--gitlab-bg-tertiary)' : 'transparent',
                  padding: isInline ? '2px 4px' : '0',
                  borderRadius: isInline ? '3px' : '0',
                  fontSize: '0.9em',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace'
                }}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre style={{
              backgroundColor: 'var(--gitlab-code-bg)',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid var(--gitlab-border-light)',
              overflow: 'auto',
              fontSize: '0.9em',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace'
            }}>
              {children}
            </pre>
          ),
          // Стилизация ссылок
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--gitlab-blue)',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
              onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
            >
              {children}
            </a>
          ),
          // Стилизация таблиц
          table: ({ children }) => (
            <table style={{
              borderCollapse: 'collapse',
              width: '100%',
              marginBottom: '16px',
              fontSize: '0.9em'
            }}>
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th style={{
              border: '1px solid var(--gitlab-border-light)',
              padding: '8px 12px',
              backgroundColor: 'var(--gitlab-bg-secondary)',
              fontWeight: '600',
              textAlign: 'left'
            }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{
              border: '1px solid var(--gitlab-border-light)',
              padding: '8px 12px'
            }}>
              {children}
            </td>
          ),
          // Стилизация списков
          ul: ({ children }) => (
            <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: '20px', marginBottom: '16px' }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: '4px' }}>
              {children}
            </li>
          ),
          // Стилизация блок-цитат
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: '4px solid var(--gitlab-blue)',
              paddingLeft: '16px',
              margin: '16px 0',
              fontStyle: 'italic',
              color: 'var(--gitlab-text-secondary)'
            }}>
              {children}
            </blockquote>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
