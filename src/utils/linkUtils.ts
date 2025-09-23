import type { Repository } from '../types';

// Генерация ссылки на участок кода в репозитории GitLab
export const generateGitLabCodeLink = (
  repository: Repository,
  filePath: string,
  selectedText: string,
  startLine?: number,
  endLine?: number
): string => {
  const encodedFilePath = encodeURIComponent(filePath);
  const encodedText = encodeURIComponent(selectedText);
  
  let link = `${repository.baseUrl}/-/blob/${repository.defaultBranch}/${encodedFilePath}?ref_type=heads`;
  
  if (selectedText.trim()) {
    link += `#:~:text=${encodedText}`;
  } else if (startLine) {
    if (endLine && endLine !== startLine) {
      link += `#L${startLine}-${endLine}`;
    } else {
      link += `#L${startLine}`;
    }
  }
  
  return link;
};

// Генерация ссылки на GitHub (для поддержки разных платформ)
export const generateGitHubCodeLink = (
  repository: Repository,
  filePath: string,
  startLine?: number,
  endLine?: number
): string => {
  const encodedFilePath = encodeURIComponent(filePath);
  
  let link = `${repository.baseUrl}/blob/${repository.defaultBranch}/${encodedFilePath}`;
  
  if (startLine) {
    if (endLine && endLine !== startLine) {
      link += `#L${startLine}-L${endLine}`;
    } else {
      link += `#L${startLine}`;
    }
  }
  
  return link;
};

// Определение типа платформы по URL
export const detectGitPlatform = (baseUrl: string): 'gitlab' | 'github' | 'unknown' => {
  if (baseUrl.includes('gitlab') || baseUrl.includes('git.kts.tech')) {
    return 'gitlab';
  } else if (baseUrl.includes('github')) {
    return 'github';
  }
  return 'unknown';
};

// Генерация ссылки в зависимости от платформы
export const generateCodeLink = (
  repository: Repository,
  filePath: string,
  selectedText: string,
  startLine?: number,
  endLine?: number
): string => {
  const platform = detectGitPlatform(repository.baseUrl);
  
  switch (platform) {
    case 'gitlab':
      return generateGitLabCodeLink(repository, filePath, selectedText, startLine, endLine);
    case 'github':
      return generateGitHubCodeLink(repository, filePath, startLine, endLine);
    default:
      return generateGitLabCodeLink(repository, filePath, selectedText, startLine, endLine);
  }
};

// Экранирование специальных символов для markdown
// Экранирование специальных символов для markdown
export const escapeMarkdown = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/`/g, '\\`')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
};
