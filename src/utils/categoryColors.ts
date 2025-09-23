// Красивые цвета для категорий - палитра подобрана для темной темы GitLab
export const CATEGORY_COLOR_POOL = [
  // Синие оттенки
  '#5DADE2', // Голубой
  '#3498DB', // Яркий синий
  '#2E86AB', // Темно-синий
  
  // Зеленые оттенки
  '#58D68D', // Светло-зеленый
  '#28B463', // Зеленый
  '#239B56', // Темно-зеленый
  
  // Оранжевые/желтые оттенки
  '#F7DC6F', // Светло-желтый
  '#F39C12', // Оранжевый
  '#E67E22', // Темно-оранжевый
  
  // Фиолетовые оттенки
  '#BB8FCE', // Светло-фиолетовый
  '#8E44AD', // Фиолетовый
  '#7D3C98', // Темно-фиолетовый
  
  // Розовые оттенки
  '#F1948A', // Светло-розовый
  '#E74C3C', // Красно-розовый
  '#C0392B', // Темно-красный
  
  // Серые оттенки
  '#AEB6BF', // Светло-серый
  '#85929E', // Серый
  '#5D6D7E', // Темно-серый
  
  // Дополнительные яркие цвета
  '#76D7C4', // Бирюзовый
  '#A569BD', // Лавандовый
  '#F8C471', // Персиковый
  '#82E0AA', // Мятный
];

/**
 * Получает следующий доступный цвет из пула
 * @param usedColors - уже использованные цвета
 * @returns следующий доступный цвет
 */
export const getNextAvailableColor = (usedColors: string[]): string => {
  // Находим первый неиспользованный цвет
  const availableColor = CATEGORY_COLOR_POOL.find(color => !usedColors.includes(color));
  
  // Если все цвета использованы, возвращаем случайный из пула
  if (!availableColor) {
    const randomIndex = Math.floor(Math.random() * CATEGORY_COLOR_POOL.length);
    return CATEGORY_COLOR_POOL[randomIndex];
  }
  
  return availableColor;
};

/**
 * Проверяет, является ли цвет светлым (для выбора цвета текста)
 * @param hexColor - цвет в формате HEX
 * @returns true если цвет светлый
 */
export const isLightColor = (hexColor: string): boolean => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Формула для определения яркости цвета
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

/**
 * Получает цвет текста (черный или белый) для контраста с фоном
 * @param backgroundColor - цвет фона в формате HEX
 * @returns цвет текста для контраста
 */
export const getContrastTextColor = (backgroundColor: string): string => {
  return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
};
