import React from 'react';
import {
  // Основные иконки файлов и папок
  Folder,
  FolderOpen,
  File,
  FileText,
  FileImage,
  FileJson,
  FileArchive,
  FileSpreadsheet,
  
  // Специальные папки
  Package,
  GitBranch,
  Code,
  Globe,
  Palette,
  Image,
  BookOpen,
  TestTube,
  Building,
  BarChart3,
  Settings,
  Wrench,
  Layers,
  Database,
  RefreshCw,
  Sprout,
  Globe2,
  Trash2,
  HardDrive,
  Lock,
  
  // Языки программирования - более понятные иконки
  Coffee,        // Java
  Zap,           // JavaScript
  Shield,        // TypeScript
  Circle,        // Python
  Square,        // C/C++
  Triangle,      // Go
  Hexagon,       // Rust
  Heart,         // PHP
  Diamond,       // Ruby
  Star,          // Swift
  Octagon,       // Kotlin
  Smile,         // Scala
  Frown,         // Clojure
  Meh,           // Haskell
  Check,         // Elixir
  X,             // Erlang
  Plus,          // Lua
  Minus,         // Perl
  AlertCircle,   // R
  AlertTriangle, // MATLAB
  Info,          // Julia
  HelpCircle,    // Dart
  Hash,          // C#
  
  // Web технологии
  Eye,           // Vue
  Search,        // Svelte
  
  // Системные файлы
  Terminal,      // Shell scripts
  Volume2,       // Audio
  Video,         // Video files
  Play,          // Executables
  EyeOff,        // Hidden files
} from 'lucide-react';

// Константы для типов папок
const FOLDER_TYPES = {
  // Основные папки проекта
  NODE_MODULES: 'node_modules',
  GIT: '.git',
  GITHUB: '.github',
  VSCODE: '.vscode',
  SRC: 'src',
  PUBLIC: 'public',
  ASSETS: 'assets',
  IMAGES: 'images',
  DOCS: 'docs',
  TESTS: ['tests', 'test'] as string[],
  DIST: ['dist', 'build'] as string[],
  COVERAGE: 'coverage',
  LOGS: 'logs',
  CONFIG: ['config', 'configs'] as string[],
  SCRIPTS: 'scripts',
  UTILS: 'utils',
  COMPONENTS: 'components',
  PAGES: 'pages',
  STYLES: 'styles',
  STATIC: 'static',
  TEMPLATES: 'templates',
  MIGRATIONS: 'migrations',
  SEEDS: 'seeds',
  FIXTURES: 'fixtures',
  LOCALES: ['locales', 'i18n', 'translations'] as string[],
  VENDOR: 'vendor',
  LIB: 'lib',
  BIN: ['bin', 'sbin'] as string[],
  ETC: 'etc',
  VAR: 'var',
  TMP: ['tmp', 'temp'] as string[],
  CACHE: 'cache',
  BACKUP: ['backup', 'backups'] as string[],
  DATA: 'data',
  DATABASE: ['database', 'db'] as string[],
};

// Константы для типов файлов
const FILE_TYPES = {
  // Специальные файлы
  README: ['README.md', 'readme.md'] as string[],
  PACKAGE_JSON: 'package.json',
  DOCKERFILE: 'Dockerfile',
  GITIGNORE: '.gitignore',
  ENV: '.env',
  LICENSE: 'LICENSE',
  CHANGELOG: 'CHANGELOG.md',
  
  // Расширения языков программирования
  JAVASCRIPT: ['js', 'jsx'] as string[],
  TYPESCRIPT: ['ts', 'tsx'] as string[],
  PYTHON: ['py', 'pyc', 'pyo'] as string[],
  JAVA: ['java', 'class', 'jar'] as string[],
  C_CPP: ['c', 'cpp', 'cc', 'cxx', 'h', 'hpp'] as string[],
  CSHARP: ['cs'] as string[],
  GO: ['go'] as string[],
  RUST: ['rs'] as string[],
  PHP: ['php'] as string[],
  RUBY: ['rb'] as string[],
  SWIFT: ['swift'] as string[],
  KOTLIN: ['kt'] as string[],
  SCALA: ['scala'] as string[],
  CLOJURE: ['clj'] as string[],
  HASKELL: ['hs'] as string[],
  ELIXIR: ['ex'] as string[],
  ERLANG: ['erl'] as string[],
  LUA: ['lua'] as string[],
  PERL: ['pl'] as string[],
  R: ['r'] as string[],
  MATLAB: ['m'] as string[],
  JULIA: ['jl'] as string[],
  DART: ['dart'] as string[],
  
  // Web технологии
  HTML: ['html', 'htm'] as string[],
  CSS: ['css', 'scss', 'sass', 'less'] as string[],
  VUE: ['vue'] as string[],
  SVELTE: ['svelte'] as string[],
  
  // Конфигурационные файлы
  JSON: ['json'] as string[],
  XML: ['xml'] as string[],
  YAML: ['yaml', 'yml'] as string[],
  MARKDOWN: ['md', 'markdown'] as string[],
  SQL: ['sql'] as string[],
  SHELL: ['sh', 'bash', 'zsh', 'fish', 'ps1'] as string[],
  DOCKER: ['dockerfile'] as string[],
  CONFIG: ['ini', 'conf', 'config', 'toml'] as string[],
  
  // Медиа файлы
  IMAGES: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'] as string[],
  AUDIO: ['mp3', 'wav', 'flac', 'aac', 'ogg'] as string[],
  VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'] as string[],
  
  // Документы
  ARCHIVES: ['zip', 'tar', 'gz', 'rar', '7z'] as string[],
  DOCUMENTS: ['pdf', 'doc', 'docx', 'txt', 'rtf'] as string[],
  SPREADSHEETS: ['xls', 'xlsx', 'csv'] as string[],
  PRESENTATIONS: ['ppt', 'pptx'] as string[],
  FONTS: ['ttf', 'otf', 'woff', 'woff2'] as string[],
  
  // Системные файлы
  EXECUTABLES: ['exe', 'app', 'deb', 'rpm'] as string[],
  CERTIFICATES: ['pem', 'crt', 'key', 'p12'] as string[],
  DATABASES: ['db', 'sqlite', 'sqlite3', 'mdb', 'accdb'] as string[],
  BACKUP: ['bak', 'backup', 'old'] as string[],
  TEMPORARY: ['tmp', 'temp', 'swp', 'swo'] as string[],
  LOGS: ['log'] as string[],
  LOCK: ['lock'] as string[],
};

// Функция для проверки, содержит ли массив значение
const includes = (arr: string | string[], value: string): boolean => {
  return Array.isArray(arr) ? arr.includes(value) : arr === value;
};

// Функция для получения иконки папки по её содержимому
export const getFolderIcon = (
  folderName: string, 
  children: Array<{ name: string; isDirectory: boolean }> = []
): React.ComponentType<any> => {
  // Специальные папки проекта
  if (folderName === FOLDER_TYPES.NODE_MODULES) return Package;
  if (folderName === FOLDER_TYPES.GIT) return GitBranch;
  if (folderName === FOLDER_TYPES.GITHUB) return Code;
  if (folderName === FOLDER_TYPES.VSCODE) return Code;
  if (folderName === FOLDER_TYPES.SRC) return FolderOpen;
  if (folderName === FOLDER_TYPES.PUBLIC) return Globe;
  if (folderName === FOLDER_TYPES.ASSETS) return Palette;
  if (folderName === FOLDER_TYPES.IMAGES) return Image;
  if (folderName === FOLDER_TYPES.DOCS) return BookOpen;
  if (includes(FOLDER_TYPES.TESTS, folderName)) return TestTube;
  if (includes(FOLDER_TYPES.DIST, folderName)) return Building;
  if (folderName === FOLDER_TYPES.COVERAGE) return BarChart3;
  if (folderName === FOLDER_TYPES.LOGS) return FileText;
  if (includes(FOLDER_TYPES.CONFIG, folderName)) return Settings;
  if (folderName === FOLDER_TYPES.SCRIPTS) return Wrench;
  if (folderName === FOLDER_TYPES.UTILS) return Wrench;
  if (folderName === FOLDER_TYPES.COMPONENTS) return Layers;
  if (folderName === FOLDER_TYPES.PAGES) return FileText;
  if (folderName === FOLDER_TYPES.STYLES) return Palette;
  if (folderName === FOLDER_TYPES.STATIC) return Folder;
  if (folderName === FOLDER_TYPES.TEMPLATES) return FileText;
  if (folderName === FOLDER_TYPES.MIGRATIONS) return RefreshCw;
  if (folderName === FOLDER_TYPES.SEEDS) return Sprout;
  if (folderName === FOLDER_TYPES.FIXTURES) return TestTube;
  if (includes(FOLDER_TYPES.LOCALES, folderName)) return Globe2;
  if (folderName === FOLDER_TYPES.VENDOR) return Package;
  if (folderName === FOLDER_TYPES.LIB) return BookOpen;
  if (includes(FOLDER_TYPES.BIN, folderName)) return Wrench;
  if (folderName === FOLDER_TYPES.ETC) return Settings;
  if (folderName === FOLDER_TYPES.VAR) return BarChart3;
  if (includes(FOLDER_TYPES.TMP, folderName)) return Trash2;
  if (folderName === FOLDER_TYPES.CACHE) return HardDrive;
  if (includes(FOLDER_TYPES.BACKUP, folderName)) return HardDrive;
  if (folderName === FOLDER_TYPES.DATA) return HardDrive;
  if (includes(FOLDER_TYPES.DATABASE, folderName)) return Database;
  
  // Определяем тип папки по содержимому
  const hasPackageJson = children.some(child => child.name === 'package.json');
  const hasDockerfile = children.some(child => child.name === 'Dockerfile');
  const hasReadme = children.some(child => 
    child.name.toLowerCase().includes('readme')
  );
  const hasConfigFiles = children.some(child => 
    child.name.endsWith('.json') || 
    child.name.endsWith('.yaml') || 
    child.name.endsWith('.yml') || 
    child.name.endsWith('.toml') ||
    child.name.endsWith('.ini') ||
    child.name.endsWith('.conf')
  );
  const hasImageFiles = children.some(child => 
    child.name.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)
  );
  const hasDocumentFiles = children.some(child => 
    child.name.match(/\.(md|txt|pdf|doc|docx)$/i)
  );
  
  if (hasPackageJson) return Package;
  if (hasDockerfile) return Package;
  if (hasReadme) return BookOpen;
  if (hasConfigFiles) return Settings;
  if (hasImageFiles) return Image;
  if (hasDocumentFiles) return BookOpen;
  
  return Folder;
};

// Функция для получения иконки файла по его имени
export const getFileIcon = (
  fileName: string, 
  isDirectory: boolean = false, 
  children: Array<{ name: string; isDirectory: boolean }> = []
): React.ComponentType<any> => {
  if (isDirectory) {
    return getFolderIcon(fileName, children);
  }
  
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  // Специальные файлы
  if (includes(FILE_TYPES.README, fileName)) return BookOpen;
  if (fileName === FILE_TYPES.PACKAGE_JSON) return Package;
  if (fileName === FILE_TYPES.DOCKERFILE) return Package;
  if (fileName === FILE_TYPES.GITIGNORE) return EyeOff;
  if (fileName.startsWith(FILE_TYPES.ENV)) return Lock;
  if (fileName === FILE_TYPES.LICENSE) return FileText;
  if (fileName === FILE_TYPES.CHANGELOG) return FileText;
  
  // Проверяем расширение файла
  if (!ext) return File;
  
  // Языки программирования
  if (includes(FILE_TYPES.JAVASCRIPT, ext)) return Zap;
  if (includes(FILE_TYPES.TYPESCRIPT, ext)) return Shield;
  if (includes(FILE_TYPES.PYTHON, ext)) return Circle;
  if (includes(FILE_TYPES.JAVA, ext)) return Coffee;
  if (includes(FILE_TYPES.C_CPP, ext)) return Square;
  if (includes(FILE_TYPES.CSHARP, ext)) return Hash;
  if (includes(FILE_TYPES.GO, ext)) return Triangle;
  if (includes(FILE_TYPES.RUST, ext)) return Hexagon;
  if (includes(FILE_TYPES.PHP, ext)) return Heart;
  if (includes(FILE_TYPES.RUBY, ext)) return Diamond;
  if (includes(FILE_TYPES.SWIFT, ext)) return Star;
  if (includes(FILE_TYPES.KOTLIN, ext)) return Octagon;
  if (includes(FILE_TYPES.SCALA, ext)) return Smile;
  if (includes(FILE_TYPES.CLOJURE, ext)) return Frown;
  if (includes(FILE_TYPES.HASKELL, ext)) return Meh;
  if (includes(FILE_TYPES.ELIXIR, ext)) return Check;
  if (includes(FILE_TYPES.ERLANG, ext)) return X;
  if (includes(FILE_TYPES.LUA, ext)) return Plus;
  if (includes(FILE_TYPES.PERL, ext)) return Minus;
  if (includes(FILE_TYPES.R, ext)) return AlertCircle;
  if (includes(FILE_TYPES.MATLAB, ext)) return AlertTriangle;
  if (includes(FILE_TYPES.JULIA, ext)) return Info;
  if (includes(FILE_TYPES.DART, ext)) return HelpCircle;
  
  // Web технологии
  if (includes(FILE_TYPES.HTML, ext)) return Globe;
  if (includes(FILE_TYPES.CSS, ext)) return Palette;
  if (includes(FILE_TYPES.VUE, ext)) return Eye;
  if (includes(FILE_TYPES.SVELTE, ext)) return Search;
  
  // Конфигурационные файлы
  if (includes(FILE_TYPES.JSON, ext)) return FileJson;
  if (includes(FILE_TYPES.XML, ext)) return FileText;
  if (includes(FILE_TYPES.YAML, ext)) return FileText;
  if (includes(FILE_TYPES.MARKDOWN, ext)) return FileText;
  if (includes(FILE_TYPES.SQL, ext)) return Database;
  if (includes(FILE_TYPES.SHELL, ext)) return Terminal;
  if (includes(FILE_TYPES.DOCKER, ext)) return Package;
  if (includes(FILE_TYPES.CONFIG, ext)) return Settings;
  
  // Медиа файлы
  if (includes(FILE_TYPES.IMAGES, ext)) return FileImage;
  if (includes(FILE_TYPES.AUDIO, ext)) return Volume2;
  if (includes(FILE_TYPES.VIDEO, ext)) return Video;
  
  // Документы
  if (includes(FILE_TYPES.ARCHIVES, ext)) return FileArchive;
  if (includes(FILE_TYPES.DOCUMENTS, ext)) return FileText;
  if (includes(FILE_TYPES.SPREADSHEETS, ext)) return FileSpreadsheet;
  if (includes(FILE_TYPES.PRESENTATIONS, ext)) return FileText;
  if (includes(FILE_TYPES.FONTS, ext)) return FileText;
  
  // Системные файлы
  if (includes(FILE_TYPES.EXECUTABLES, ext)) return Play;
  if (includes(FILE_TYPES.CERTIFICATES, ext)) return Shield;
  if (includes(FILE_TYPES.DATABASES, ext)) return Database;
  if (includes(FILE_TYPES.BACKUP, ext)) return HardDrive;
  if (includes(FILE_TYPES.TEMPORARY, ext)) return Trash2;
  if (includes(FILE_TYPES.LOGS, ext)) return FileText;
  if (includes(FILE_TYPES.LOCK, ext)) return Lock;
  
  return File;
};