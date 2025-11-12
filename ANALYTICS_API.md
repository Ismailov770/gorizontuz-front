# Analytics API Documentation

## Обзор

API аналитики предоставляет детальную статистику по статьям с возможностью фильтрации по различным временным периодам.

## Эндпоинты

### 1. Аналитика статей с фильтрацией по периодам

**Эндпоинт:** `GET /api/analytics/articles`

**Параметры:**
- `period` (optional) - Временной период для фильтрации
  - `today` - За сегодня
  - `week` - За неделю (последние 7 дней)
  - `month` - За месяц (последние 30 дней)  
  - `year` - За год (последние 365 дней)
  - `all` - За все время (по умолчанию)

**Пример запроса:**
```http
GET /api/analytics/articles?period=month
```

**Структура ответа:**
```json
{
  "articles": [
    {
      "id": 1,
      "title": "Название статьи",
      "slug": "nazvanie-stati",
      "imageUrl": "/api/files/image.jpg",
      "viewCount": 150,        // Просмотры за выбранный период
      "viewsToday": 5,         // Просмотры за сегодня
      "viewsThisWeek": 25,     // Просмотры за неделю
      "viewsThisMonth": 80,    // Просмотры за месяц
      "author": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "createdAt": "2025-11-12T10:00:00"
      },
      "createdAt": "2025-11-12T10:00:00",
      "publishedAt": "2025-11-12T10:00:00",
      "published": true
    }
  ],
  "totalArticles": 10,       // Общее количество статей
  "totalViews": 1500         // Сумма просмотров за выбранный период
}
```

**Особенности:**
- Статьи отсортированы по убыванию просмотров за выбранный период
- Поле `viewCount` содержит количество просмотров за выбранный период
- Детальная статистика (сегодня/неделя/месяц) всегда присутствует
- Для периода `all` используется оптимизированный запрос из поля `viewCount` статьи

### 2. Аналитика конкретной статьи

**Эндпоинт:** `GET /api/analytics/articles/{id}`

**Пример запроса:**
```http
GET /api/analytics/articles/1
```

### 3. Общая аналитика дашборда

**Эндпоинт:** `GET /api/analytics/dashboard`

**Пример запроса:**
```http
GET /api/analytics/dashboard
```

## Использование во фронтенде

### React пример

```jsx
const [period, setPeriod] = useState('all');
const [analytics, setAnalytics] = useState(null);

const fetchAnalytics = async (selectedPeriod) => {
  const response = await fetch(`/api/analytics/articles?period=${selectedPeriod}`);
  const data = await response.json();
  setAnalytics(data);
};

useEffect(() => {
  fetchAnalytics(period);
}, [period]);

// Компонент фильтров
const PeriodFilters = () => {
  const periods = [
    { value: 'today', label: 'За сегодня' },
    { value: 'week', label: 'За неделю' },
    { value: 'month', label: 'За месяц' },
    { value: 'year', label: 'За год' },
    { value: 'all', label: 'За все время' }
  ];

  return (
    <div className="period-filters">
      {periods.map(p => (
        <button 
          key={p.value}
          onClick={() => setPeriod(p.value)}
          className={period === p.value ? 'active' : ''}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};
```

### Таблица статей

```jsx
const ArticlesTable = ({ articles }) => (
  <table>
    <thead>
      <tr>
        <th>Статья</th>
        <th>Автор</th>
        <th>Просмотры за период</th>
        <th>Сегодня</th>
        <th>Неделя</th>
        <th>Месяц</th>
        <th>Статус</th>
      </tr>
    </thead>
    <tbody>
      {articles.map(article => (
        <tr key={article.id}>
          <td>
            <div className="article-info">
              {article.imageUrl && (
                <img src={article.imageUrl} alt="" className="article-thumb" />
              )}
              <span>{article.title}</span>
            </div>
          </td>
          <td>{article.author?.username}</td>
          <td><strong>{article.viewCount}</strong></td>
          <td>{article.viewsToday}</td>
          <td>{article.viewsThisWeek}</td>
          <td>{article.viewsThisMonth}</td>
          <td>
            {article.published ? '✅ Опубликовано' : '📝 Черновик'}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
```

## Производительность

- Для периода `all` используется поле `viewCount` из таблицы статей (быстрее)
- Для остальных периодов выполняются запросы к таблице `article_views`
- Рекомендуется добавить пагинацию для большого количества статей
- Индексы на `article_id` и `viewed_at` в таблице `article_views` обеспечивают быструю фильтрацию

## Безопасность

- Все эндпоинты аналитики требуют роль `ROLE_ADMIN`
- Используйте JWT токен в заголовке `Authorization: Bearer <token>`
