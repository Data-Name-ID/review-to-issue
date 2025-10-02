import type { CodeComment, Repository, CommentCategory } from '../types';
import { generateCodeLink } from './linkUtils';

// Функция для определения языка программирования по расширению файла
const getLanguageFromFilePath = (filePath: string): string => {
  const fileName = filePath.split('/').pop()?.toLowerCase() || '';
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  // Специальные файлы по имени
  if (fileName === 'dockerfile' || fileName.startsWith('dockerfile.')) {
    return 'dockerfile';
  }
  if (fileName === 'makefile' || fileName === 'makefile.am' || fileName === 'makefile.in') {
    return 'makefile';
  }
  if (fileName === 'gemfile' || fileName === 'rakefile') {
    return 'ruby';
  }
  if (fileName === 'package.json' || fileName === 'composer.json' || fileName === 'tsconfig.json') {
    return 'json';
  }
  if (fileName === '.gitignore' || fileName === '.dockerignore') {
    return 'gitignore';
  }
  
  // Python специфические файлы
  if (fileName === 'pipfile' || fileName === 'pipfile.lock') {
    return 'toml';
  }
  if (fileName === 'requirements.txt' || fileName === 'requirements-dev.txt' || fileName === 'requirements-prod.txt') {
    return 'text'; // pip requirements
  }
  if (fileName === 'setup.py' || fileName === 'setup.cfg' || fileName === 'pyproject.toml') {
    return fileName.endsWith('.toml') ? 'toml' : 'python';
  }
  if (fileName === 'manage.py' || fileName === 'wsgi.py' || fileName === 'asgi.py') {
    return 'python';
  }
  if (fileName === 'conftest.py' || fileName.startsWith('test_') || fileName.endsWith('_test.py')) {
    return 'python';
  }
  if (fileName === 'settings.py' || fileName === 'urls.py' || fileName === 'models.py' || fileName === 'views.py' || fileName === 'forms.py' || fileName === 'admin.py') {
    return 'python';
  }
  if (fileName === '__init__.py' || fileName === '__main__.py') {
    return 'python';
  }
  if (fileName === 'poetry.lock') {
    return 'text';
  }
  if (fileName === 'conda.yaml' || fileName === 'conda.yml' || fileName === 'environment.yaml' || fileName === 'environment.yml') {
    return 'yaml';
  }
  if (fileName === 'tox.ini' || fileName === 'pytest.ini' || fileName === '.flake8' || fileName === '.pylintrc') {
    return 'ini';
  }
  if (fileName === '.pre-commit-config.yaml' || fileName === '.github') {
    return 'yaml';
  }
  
  // Django специфические файлы
  if (fileName.includes('migrations') && fileName.endsWith('.py')) {
    return 'python';
  }
  if (fileName === 'locale' || fileName.endsWith('.po') || fileName.endsWith('.pot')) {
    return 'text'; // Gettext files
  }
  
  // Flask/FastAPI файлы
  if (fileName === 'app.py' || fileName === 'main.py' || fileName === 'run.py') {
    return 'python';
  }
  
  // Celery и другие задачи
  if (fileName === 'celery.py' || fileName === 'tasks.py' || fileName.startsWith('celery_')) {
    return 'python';
  }
  
  // Конфигурационные файлы веб-серверов (часто в Python проектах)
  if (fileName === 'nginx.conf' || fileName === 'gunicorn.conf.py' || fileName === 'uwsgi.ini') {
    return fileName.endsWith('.py') ? 'python' : (fileName.endsWith('.ini') ? 'ini' : 'nginx');
  }
  
  // Ansible (часто используется с Python)
  if (fileName.endsWith('.yml') && (fileName.includes('playbook') || fileName.includes('ansible'))) {
    return 'yaml';
  }
  
  // Docker Compose (часто в Python проектах)
  if (fileName.startsWith('docker-compose') && (fileName.endsWith('.yml') || fileName.endsWith('.yaml'))) {
    return 'yaml';
  }
  
  // Kubernetes/Helm (тоже частые в Python проектах)
  if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) {
    if (fileName.includes('deployment') || fileName.includes('service') || fileName.includes('ingress') || 
        fileName.includes('configmap') || fileName.includes('secret') || fileName.includes('helm')) {
      return 'yaml';
    }
  }
  
  // Scrapy файлы
  if (fileName === 'scrapy.cfg' || fileName.includes('spiders') || fileName.includes('middlewares')) {
    return fileName.endsWith('.py') ? 'python' : 'ini';
  }
  
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
    case 'pyw':
    case 'pyx': // Cython
    case 'pxd': // Cython header
    case 'pyi': // Python stub files
      return 'python';
    case 'ipynb': // Jupyter notebooks
      return 'json'; // Jupyter notebooks are JSON files
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'c':
      return 'c';
    case 'cs':
      return 'csharp';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'kt':
      return 'kotlin';
    case 'swift':
      return 'swift';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'scss':
    case 'sass':
      return 'scss';
    case 'less':
      return 'less';
    case 'json':
      return 'json';
    case 'xml':
      return 'xml';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'toml':
      return 'toml';
    case 'ini':
    case 'cfg':
    case 'conf':
      return 'ini';
    case 'env':
    case 'dotenv':
      return 'bash'; // Environment files
    case 'txt':
      return 'text';
    case 'log':
      return 'text';
    case 'rst': // reStructuredText (часто используется в Python документации)
      return 'rst';
    case 'jinja':
    case 'jinja2':
    case 'j2':
      return 'jinja2'; // Jinja templates
    case 'template':
    case 'tmpl':
      return 'text';
    case 'sh':
    case 'bash':
      return 'bash';
    case 'ps1':
      return 'powershell';
    case 'sql':
      return 'sql';
    case 'md':
      return 'markdown';
    case 'dockerfile':
      return 'dockerfile';
    case 'vue':
      return 'vue';
    case 'svelte':
      return 'svelte';
    case 'r':
      return 'r';
    case 'scala':
      return 'scala';
    case 'clj':
    case 'cljs':
      return 'clojure';
    case 'ex':
    case 'exs':
      return 'elixir';
    case 'erl':
      return 'erlang';
    case 'hs':
      return 'haskell';
    case 'ml':
      return 'ocaml';
    case 'dart':
      return 'dart';
    case 'lua':
      return 'lua';
    case 'perl':
    case 'pl':
      return 'perl';
    default:
      return 'text';
  }
};

// Основная функция генерации простого markdown
export const generateMarkdownReport = (
  comments: CodeComment[],
  repository: Repository,
  allFiles?: Array<{ path: string; content: string }>,
  categories?: CommentCategory[]
): string => {
  if (!repository || comments.length === 0) {
    return '';
  }

  let markdown = '';

  // Функция для получения кода из файла
  const getCodeFromFile = (filePath: string, startLine: number, endLine: number): string => {
    if (!allFiles) return '';
    
    const file = allFiles.find(f => f.path === filePath);
    if (!file) return '';
    
    const lines = file.content.split('\n');
    const selectedLines = lines.slice(startLine - 1, endLine);
    return selectedLines.join('\n');
  };

  const renderCommentsForFile = (filePath: string, fileComments: CodeComment[]) => {
    let block = '';
    block += `### ${filePath}\n\n`;

    const fileCommentsForFile = fileComments.filter(c => c.isFileComment);
    const lineComments = fileComments.filter(c => !c.isFileComment);
    const allComments = [...fileCommentsForFile, ...lineComments.sort((a, b) => a.startLine - b.startLine)];

    allComments.forEach((comment, index) => {
      if (comment.isFileComment) {
        const codeLink = generateCodeLink(
          repository,
          comment.filePath,
          '',
          1,
          1
        );
        block += `**Комментарий к файлу:** [Перейти к файлу](${codeLink})\n\n`;
        block += `${comment.comment}\n\n`;
      } else {
        const codeLink = generateCodeLink(
          repository,
          comment.filePath,
          '',
          comment.startLine,
          comment.endLine
        );
        const codeSnippet = getCodeFromFile(comment.filePath, comment.startLine, comment.endLine);
        const lineInfo = comment.startLine === comment.endLine 
          ? `Строка ${comment.startLine}`
          : `Строки ${comment.startLine}-${comment.endLine}`;
        block += `**${lineInfo}:** [Перейти к коду](${codeLink})\n\n`;
        if (codeSnippet.trim()) {
          const language = getLanguageFromFilePath(comment.filePath);
          block += `\`\`\`${language}\n`;
          block += codeSnippet;
          block += '\n```\n\n';
        }
        block += `${comment.comment}\n\n`;
      }
      
      // Добавляем разделитель только если это не последний комментарий
      if (index < allComments.length - 1) {
        block += `---\n\n`;
      }
    });
    return block;
  };

  // Если даны категории — группируем по ним, иначе как раньше по файлам
  if (categories && categories.length > 0) {
    const commentsByCategory: Record<string, CodeComment[]> = {};
    const uncategorized: CodeComment[] = [];

    comments.forEach(c => {
      if (c.categoryId) {
        commentsByCategory[c.categoryId] = commentsByCategory[c.categoryId] || [];
        commentsByCategory[c.categoryId].push(c);
      } else {
        uncategorized.push(c);
      }
    });

    // Порядок категорий согласно списку categories
    categories.forEach(cat => {
      const list = commentsByCategory[cat.id];
      if (!list || list.length === 0) return;
      // Группируем по файлам внутри категории
      const byFile = list.reduce((acc, comment) => {
        (acc[comment.filePath] = acc[comment.filePath] || []).push(comment);
        return acc;
      }, {} as Record<string, CodeComment[]>);

      Object.entries(byFile).forEach(([filePath, fileComments]) => {
        markdown += renderCommentsForFile(filePath, fileComments);
      });
    });

    if (uncategorized.length > 0) {
      const byFile = uncategorized.reduce((acc, comment) => {
        (acc[comment.filePath] = acc[comment.filePath] || []).push(comment);
        return acc;
      }, {} as Record<string, CodeComment[]>);
      Object.entries(byFile).forEach(([filePath, fileComments]) => {
        markdown += renderCommentsForFile(filePath, fileComments);
      });
    }
  } else {
    // Старое поведение — группируем по файлам
    const commentsByFile = comments.reduce((acc, comment) => {
      if (!acc[comment.filePath]) {
        acc[comment.filePath] = [];
      }
      acc[comment.filePath].push(comment);
      return acc;
    }, {} as Record<string, CodeComment[]>);

    Object.entries(commentsByFile).forEach(([filePath, fileComments]) => {
      markdown += renderCommentsForFile(filePath, fileComments);
    });
  }

  return markdown;
};
