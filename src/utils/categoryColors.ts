// Максимально контрастные и различимые цвета для категорий
export const CATEGORY_COLOR_POOL = [
  // Основные яркие цвета
  '#ff0000', // Чистый красный
  '#ff8000', // Оранжевый
  '#ffff00', // Желтый
  '#00ff00', // Лайм
  '#00ffff', // Циан
  '#0080ff', // Голубой
  '#0000ff', // Синий
  '#8000ff', // Фиолетовый
  '#ff00ff', // Пурпурный
  '#ff0080', // Розовый
  
  // Дополнительные контрастные цвета
  '#ff4000', // Красно-оранжевый
  '#ffbf00', // Золотой
  '#80ff00', // Желто-зеленый
  '#00ff80', // Зелено-циан
  '#00ffbf', // Циан-зеленый
  '#0080ff', // Сине-циан
  '#4000ff', // Сине-фиолетовый
  '#8000ff', // Фиолетовый
  '#bf00ff', // Пурпурно-фиолетовый
  '#ff00bf', // Пурпурно-розовый
  
  // Темные контрастные цвета
  '#cc0000', // Темно-красный
  '#cc6600', // Темно-оранжевый
  '#cccc00', // Темно-желтый
  '#00cc00', // Темно-зеленый
  '#00cccc', // Темно-циан
  '#0066cc', // Темно-синий
  '#6600cc', // Темно-фиолетовый
  '#cc00cc', // Темно-пурпурный
  '#cc0066', // Темно-розовый
  
  // Специальные цвета
  '#ff6b6b', // Коралловый
  '#4ecdc4', // Бирюзовый
  '#45b7d1', // Небесно-голубой
  '#96ceb4', // Мятный
  '#feca57', // Солнечный
  '#ff9ff3', // Розово-лавандовый
  '#54a0ff', // Королевский синий
  '#5f27cd', // Индиго
  '#00d2d3', // Бирюзово-зеленый
  '#ff9f43', // Персиковый
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
  
  // Улучшенная формула для определения яркости цвета
  // Учитывает восприятие яркости человеческим глазом
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
  
  // Для ярких цветов используем более высокий порог
  return brightness > 180;
};

/**
 * Получает цвет текста (черный или белый) для контраста с фоном
 * @param backgroundColor - цвет фона в формате HEX
 * @returns цвет текста для контраста
 */
export const getContrastTextColor = (backgroundColor: string): string => {
  return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
};
