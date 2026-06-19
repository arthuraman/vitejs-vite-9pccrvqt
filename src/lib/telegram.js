export const tg = window.Telegram?.WebApp

export function getTelegramUser() {
  const user = tg?.initDataUnsafe?.user
  if (user) return user
  // Заглушка для тестирования в браузере (не в Telegram)
  return { id: 999999, first_name: 'Азамат', last_name: '', username: 'testuser' }
}

export const haptic = {
  light: () => tg?.HapticFeedback?.impactOccurred('light'),
  medium: () => tg?.HapticFeedback?.impactOccurred('medium'),
  success: () => tg?.HapticFeedback?.notificationOccurred('success'),
  error: () => tg?.HapticFeedback?.notificationOccurred('error'),
}
