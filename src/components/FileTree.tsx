import { useState, useMemo, useCallback, memo } from 'react'
import type { CodeComment } from '../types'

interface FileTreeProps {
  files: Array<{ path: string; content: string }>
  comments: CodeComment[]
  currentFile: string | null
  onFileSelect: (filePath: string) => void
}

interface TreeNode {
  name: string
  path: string
  isDirectory: boolean
  children: TreeNode[]
  commentCount: number
  size?: number
}

const FileTreeItem = memo(({ 
  node, 
  level = 0, 
  currentFile, 
  onFileSelect,
  searchTerm = ''
}: { 
  node: TreeNode
  level?: number
  currentFile: string | null
  onFileSelect: (filePath: string) => void
  searchTerm?: string
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0 || level === 1 || searchTerm.length > 0)
  

  const handleClick = useCallback(() => {
    if (node.isDirectory) {
      setIsExpanded(!isExpanded)
    } else {
      onFileSelect(node.path)
    }
  }, [node.isDirectory, node.path, isExpanded, onFileSelect])

  const isActive = !node.isDirectory && currentFile === node.path
  
  // Рекурсивная функция поиска по всему дереву
  const hasMatchingChild = useCallback((node: TreeNode, term: string): boolean => {
    if (node.name.toLowerCase().includes(term.toLowerCase())) {
      return true;
    }
    
    if (node.isDirectory) {
      return node.children.some(child => hasMatchingChild(child, term));
    }
    
    return false;
  }, []);

  // Фильтрация по поиску с рекурсивным поиском
  const shouldShow = useMemo(() => {
    return searchTerm === '' || hasMatchingChild(node, searchTerm);
  }, [searchTerm, node, hasMatchingChild])

  if (!shouldShow) return null

  return (
    <div>
      <div
        className={`gitlab-file-item ${isActive ? 'active' : ''} ${node.isDirectory ? 'directory' : ''}`}
        onClick={handleClick}
        style={{ paddingLeft: `${4 + level * 10}px` }}
      >
        {node.isDirectory ? (
          <div className={`gitlab-file-expand-icon ${isExpanded ? 'expanded' : ''}`}>
            ▶
          </div>
        ) : (
          <div className="gitlab-file-expand-icon"></div>
        )}
        
        <div className="gitlab-file-name">
          {node.name}
        </div>
        
        {node.commentCount > 0 && (
          <div className="gitlab-file-comment-badge">
            {node.commentCount}
          </div>
        )}
      </div>
      
      {node.isDirectory && isExpanded && (
        <div className="gitlab-file-children">
          {node.children
            .sort((a, b) => {
              // Папки сначала, потом файлы
              if (a.isDirectory && !b.isDirectory) return -1
              if (!a.isDirectory && b.isDirectory) return 1
              return a.name.localeCompare(b.name)
            })
            .map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                level={level + 1}
                currentFile={currentFile}
                onFileSelect={onFileSelect}
                searchTerm={searchTerm}
              />
            ))}
        </div>
      )}
    </div>
  )
})

export const FileTree = ({ files, comments, currentFile, onFileSelect }: FileTreeProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  
  const { tree, stats } = useMemo(() => {
    const root: TreeNode = {
      name: 'root',
      path: '',
      isDirectory: true,
      children: [],
      commentCount: 0
    }

    // Создаем карту комментариев по файлам
    const commentCountByFile = comments.reduce((acc, comment) => {
      acc[comment.filePath] = (acc[comment.filePath] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    let totalFiles = 0
    let totalDirs = 0
    let filesWithComments = 0

    files.forEach(file => {
      const parts = file.path.split('/')
      let currentNode = root
      totalFiles++

      // Создаем путь папок
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i]
        const folderPath = parts.slice(0, i + 1).join('/')
        
        let folderNode = currentNode.children.find(
          child => child.name === folderName && child.isDirectory
        )
        
        if (!folderNode) {
          folderNode = {
            name: folderName,
            path: folderPath,
            isDirectory: true,
            children: [],
            commentCount: 0
          }
          currentNode.children.push(folderNode)
          totalDirs++
        }
        
        currentNode = folderNode
      }

      // Добавляем файл
      const fileName = parts[parts.length - 1]
      const fileCommentCount = commentCountByFile[file.path] || 0
      
      if (fileCommentCount > 0) {
        filesWithComments++
      }
      
      currentNode.children.push({
        name: fileName,
        path: file.path,
        isDirectory: false,
        children: [],
        commentCount: fileCommentCount,
        size: file.content.length
      })

      // Обновляем счетчики комментариев для родительских папок
      let node = currentNode
      while (node && node !== root) {
        node.commentCount += fileCommentCount
        // Ищем родителя
        const findParent = (searchNode: TreeNode, target: TreeNode): TreeNode | null => {
          for (const child of searchNode.children) {
            if (child === target) return searchNode
            if (child.isDirectory) {
              const found = findParent(child, target)
              if (found) return found
            }
          }
          return null
        }
        node = findParent(root, node) || root
        if (node === root) break
      }
    })

    return {
      tree: root.children,
      stats: {
        totalFiles,
        totalDirs,
        filesWithComments,
        totalComments: comments.length
      }
    }
  }, [files, comments])

  if (files.length === 0) {
    return (
      <div className="gitlab-file-tree-empty">
        Файлы не загружены
      </div>
    )
  }

  return (
    <div className="gitlab-file-tree">
      {/* Search */}
      <div className="gitlab-file-tree-search">
        <input
          type="text"
          placeholder="Поиск файлов..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* File Tree */}
      {tree
        .sort((a, b) => {
          // Папки сначала, потом файлы
          if (a.isDirectory && !b.isDirectory) return -1
          if (!a.isDirectory && b.isDirectory) return 1
          return a.name.localeCompare(b.name)
        })
        .map((node) => (
          <FileTreeItem
            key={node.path}
            node={node}
            currentFile={currentFile}
            onFileSelect={onFileSelect}
            searchTerm={searchTerm}
          />
        ))}

      {/* Stats */}
      <div className="gitlab-file-tree-stats">
        {stats.totalFiles} файлов • {stats.totalDirs} папок
        {stats.filesWithComments > 0 && (
          <> • {stats.filesWithComments} с комментариями</>
        )}
      </div>
    </div>
  )
}