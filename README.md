# MedBook — запись к врачу онлайн

Веб-приложение для онлайн-записи к врачу. Проект состоит из React/Vite-клиента и Express/SQLite API.

## Стек

| Часть | Технология |
| --- | --- |
| Фронтенд | React 18 + Vite |
| Стили | Tailwind CSS + SCSS |
| Бэкенд | Node.js + Express |
| База данных | SQLite (`sqlite3`) |
| Авторизация | JWT access token + refresh token в HttpOnly cookie |
| UI | Heroicons |

## Быстрый старт

### Требования

- Node.js 18+
- npm 9+

### 1. Запустить сервер

```bash
cd server
npm install
npm run dev
```

Сервер стартует на `http://localhost:5000`.

Если база пустая, в development-режиме демо-данные будут созданы автоматически.
При необходимости можно пересоздать их вручную:

```bash
cd server
node db/seed.js
```

### 2. Запустить клиент

```bash
cd client
npm install
npm run dev
```

Клиент стартует на `http://localhost:5173`.

## Переменные окружения

Файл: `server/.env`

```env
PORT=5000
JWT_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
NODE_ENV=development
```

Дополнительно можно задать:

- `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `PUBLIC_SITE_URL=https://medbook.local`
- `AUTO_SEED_DEMO_DATA=true`

## Демо-аккаунт

- Email: `demo@medbook.ru`
- Пароль: `demo1234`

## Основные возможности

- каталог врачей с поиском, фильтрами и сортировкой
- страница врача с доступными датами, слотами и отзывами
- регистрация и вход через JWT + refresh cookie
- запись и отмена приёма
- личный кабинет и напоминания о ближайших приёмах

## API

| Метод | Маршрут | Назначение | Доступ |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Регистрация | Публичный |
| POST | `/api/auth/login` | Вход | Публичный |
| POST | `/api/auth/refresh` | Обновление access token | Cookie |
| POST | `/api/auth/logout` | Выход | Авторизованный пользователь |
| GET | `/api/auth/me` | Текущий пользователь | JWT |
| GET | `/api/doctors` | Список врачей | Публичный |
| GET | `/api/doctors/specialties` | Список специальностей | Публичный |
| GET | `/api/doctors/:id` | Профиль врача | Публичный |
| GET | `/api/doctors/:id/dates` | Доступные даты | Публичный |
| GET | `/api/doctors/:id/slots` | Доступные слоты | Публичный |
| POST | `/api/appointments` | Создать запись | JWT |
| GET | `/api/appointments/my` | Мои записи | JWT |
| DELETE | `/api/appointments/:id` | Отменить запись | JWT |
| GET | `/api/reminders` | Напоминания | JWT |

## Безопасность

Короткое описание исправлений и текущих защит находится в [docs/security/VULNERABILITIES.md](docs/security/VULNERABILITIES.md).
