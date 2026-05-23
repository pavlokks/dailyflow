# DailyFlow AI

**DailyFlow AI** - персональний вебпомічник для продуктивності, який збирає задачі, події, погоду, новини, фокус-сесії та AI-поради в одному робочому просторі. Це не просто todo-list, а невеликий командний центр дня: що заплановано, що горить, на чому сфокусуватися зараз і як швидко перетворити ціль на конкретний план.

Проєкт побудований на MERN-стеку з JWT-авторизацією, ізоляцією даних між користувачами та AI-функціями на базі Gemini з локальними fallback-сценаріями.

## Що вміє

- **Авторизація та профіль**
  Реєстрація, вхід, захищені маршрути, персональне місто для погодного контексту.

- **Задачі та проєкти**
  CRUD задач, пріоритети, дедлайни, описи, проєкти, кошик, відновлення, ручне сортування, фільтри та пошук.

- **Події**
  Особистий календар подій з редагуванням, видаленням у кошик і відновленням.

- **AI-планування**
  Генерація задач із цілі, редагування чернеток перед додаванням, вибір проєкту, дедлайни та пріоритети.

- **AI-підсумок дня**
  Короткий підсумок на основі реальних задач, подій, часу користувача і погоди.

- **AI-наступна дія**
  Рекомендація, що робити прямо зараз, з урахуванням контексту дня.

- **AI Command Center**
  Швидкі запити до помічника щодо власного плану, задач і подій.

- **Pomodoro**
  Таймер фокусу, лічильник завершених сесій і floating-віджет.

- **Dashboard**
  Налаштовувана панель віджетів: можна міняти видимість і порядок блоків.

- **Погода та новини**
  OpenWeather для погоди за містом профілю та NewsAPI для короткого новинного блоку.

## Технології

| Частина      | Стек                                              |
| ------------ | ------------------------------------------------- |
| Frontend     | React 19, Vite, React Router, Axios, lucide-react |
| Backend      | Node.js, Express, Mongoose                        |
| База даних   | MongoDB                                           |
| Авторизація  | JWT, bcrypt                                       |
| AI           | Google Gemini через `@google/genai`               |
| Зовнішні API | OpenWeather, NewsAPI                              |

## Структура

```text
DailyFlow/
  client/
    src/
      components/      # віджети, модулі, shell, форми
      hooks/           # reusable React hooks
      pages/           # сторінки маршрутизації
      services/        # axios API client
      utils/           # helpers, AI context, user-scoped storage
  server/
    config/            # MongoDB connection
    controllers/       # бізнес-логіка API
    middleware/        # auth/error middleware
    models/            # Mongoose models
    routes/            # Express routes
    services/          # AI service layer
```

## Швидкий старт

### 1. Встановити залежності

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Налаштувати backend env

Створи файл `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/dailyflow
JWT_SECRET=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite

OPENWEATHER_API_KEY=
NEWS_API_KEY=
```

Мінімально для авторизації та базових CRUD потрібні:

```env
MONGO_URI=mongodb://127.0.0.1:27017/dailyflow
JWT_SECRET=replace-with-long-random-secret
```

Якщо `GEMINI_API_KEY`, `OPENWEATHER_API_KEY` або `NEWS_API_KEY` не задані, відповідні AI/API-функції або повернуть fallback, або покажуть зрозумілу помилку в інтерфейсі.

### 3. Налаштувати frontend env, якщо треба

За замовчуванням клієнт ходить на `http://localhost:5000/api`.

Якщо API запускається на іншій адресі, створи `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Запустити сервер

```bash
cd server
npm run dev
```

API буде доступне на:

```text
http://localhost:5000
```

### 5. Запустити клієнт

В іншому терміналі:

```bash
cd client
npm run dev
```

Vite покаже локальну адресу, зазвичай:

```text
http://localhost:5173
```

## Основні маршрути

### Frontend

| Route           | Опис                          |
| --------------- | ----------------------------- |
| `/`             | Головна сторінка              |
| `/login`        | Вхід                          |
| `/register`     | Реєстрація                    |
| `/dashboard`    | Огляд дня та віджети          |
| `/tasks`        | Задачі та проєкти             |
| `/events`       | Події                         |
| `/ai-assistant` | AI-помічник і генератор задач |
| `/focus`        | Pomodoro                      |
| `/news`         | Новини                        |
| `/weather`      | Погода                        |
| `/profile`      | Профіль                       |

### Backend API

| Endpoint                 | Опис                                            |
| ------------------------ | ----------------------------------------------- |
| `/api/auth`              | Реєстрація, логін, поточний користувач, профіль |
| `/api/tasks`             | CRUD задач, кошик, reorder                      |
| `/api/projects`          | Створення й оновлення проєктів                  |
| `/api/events`            | CRUD подій і кошик                              |
| `/api/ai/generate-tasks` | Генерація задач із цілі                         |
| `/api/ai/daily-summary`  | AI-підсумок дня                                 |
| `/api/ai/next-action`    | Рекомендована наступна дія                      |
| `/api/ai/command`        | Відповідь AI-помічника                          |
| `/api/weather`           | Погода за містом користувача                    |
| `/api/news`              | Новини                                          |

## Скрипти

### Client

```bash
npm run dev      # dev server Vite
npm run build    # production build
npm run preview  # preview production build
```

### Server

```bash
npm run dev      # nodemon
npm start        # node server.js
```

## Приватність даних

DailyFlow розділяє дані за користувачем на двох рівнях:

- на backend усі задачі, події, проєкти й AI-контекст фільтруються через `req.user._id`;
- на frontend локальні кеші та UI-налаштування зберігаються в user-scoped ключах, щоб один акаунт не бачив Pomodoro-сесії, AI-підсумки чи налаштування панелі іншого акаунта в тому самому браузері.

## AI-логіка

AI-функції не працюють у вакуумі. Перед запитом DailyFlow збирає контекст користувача:

- відкриті та виконані задачі;
- дедлайни, пріоритети й проєкти;
- найближчі події;
- локальний час і timezone;
- погоду, якщо вона доступна;
- місто та ім'я користувача з профілю.

Завдяки цьому підсумок дня і наступна дія виглядають як персональна порада, а не як випадковий текст від чатбота.

## Production build

Перевірити клієнтську збірку:

```bash
cd client
npm run build
```

Запустити backend у production-режимі:

```bash
cd server
npm start
```

## Ідеї для розвитку

- інтеграція Google Calendar
- push/email-нагадування про дедлайни;
- календарний тижневий вигляд;
- темна тема;
