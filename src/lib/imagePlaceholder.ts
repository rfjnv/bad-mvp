/**
 * Однопиксельный серый плейсхолдер под все фото товаров.
 * Пока картинка грузится, вместо пустого белого прямоугольника
 * видна та же подложка, что и у панелей интерфейса.
 *
 * Строка захардкожена (а не собирается через Buffer), чтобы константу
 * можно было импортировать и в клиентских компонентах.
 */
export const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmMmYzZjUiLz48L3N2Zz4=";
