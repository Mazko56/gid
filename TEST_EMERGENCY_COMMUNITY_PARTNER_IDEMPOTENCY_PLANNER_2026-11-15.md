# Gid Tourist — перевірка чотирьох виправлень

## Розгортання

1. Оновити **Frontend** і **Backend** з цього архіву.
2. Якщо в Railway Backend змінна `DB_AUTO_MIGRATE` не дорівнює `false`, `schema.ts` автоматично додає nullable-поле `emergency_services.phone` при старті. Інакше **перед деплоєм Backend** виконати в Railway PostgreSQL:

```sql
ALTER TABLE emergency_services ADD COLUMN IF NOT EXISTS phone text;
```

Це також записано в `backend/migrations/2026-11-15-emergency-service-phone.sql`. Команда не змінює наявні контакти або телефони.

## 1. Халепа

- У редакторі **Адмінка → Редактор сторінок → Халепа?** для відповідного регіону вибрати корисний сервіс і встановити **Телефон для дзвінка**. Зберегти.
- На туристичному екрані служба з номером натискається та відкриває системний набір `tel:`. Служба без номера **не створює вигаданого дзвінка** й не є активною кнопкою.
- В окремому блоці **Екстрені контакти** натиснути на телефон 112 або на фактично внесений телефон. Повинен відкритися екран набору телефону (поведінка зовнішнього dialer залежить від пристрою й дозволів Telegram WebView).

**Read-only SQL**:
```sql
SELECT s.region_id, r.name AS region, s.title, s.phone, s.active
FROM emergency_services s JOIN regions r ON r.id=s.region_id
WHERE s.deleted_at IS NULL ORDER BY r.name,s.title;
```

## 2. Спільнота

- В Адмінка → Контент / QR → Telegram-спільнота вибрати **той самий регіон**, що й у QR туриста, та ввести `https://t.me/actual_username`.
- Зберегти. Відкрити «Спільнота» туристом. Кнопка повинна бути темно-зеленою, з білим текстом та активною; при натисканні відкривається Telegram.
- Перевірити звичайний GPS-запуск без QR: для нього береться найближчий зареєстрований регіон із координат, за наявності дозволу геолокації.

**Read-only SQL**:
```sql
SELECT id,name,community_url FROM regions WHERE active=true ORDER BY name;
```

## 3. Партнери

- У **Новий партнер** заповнити дані, двічі швидко натиснути «Зберегти й розмістити» або натиснути повторно після появи картки QR — має створитися тільки **один** заклад.
- Повторна відправка API з тим самим `creation_request_id` повертає вже існуючого партнера. SQL використовує `pg_advisory_xact_lock` для одночасних запитів.
- **Адмінка → Партнери** → кнопка видалення (урна). Підтвердити архівування. Заклад пропадає з публічного каталогу та QR відключається. Історичні бронювання, покупки, відгуки і записи статистики залишаються в PostgreSQL.
- Архівування блокується, якщо є майбутні активні бронювання або незавершені підтвердження клієнтських покупок. **Не використовуйте `DELETE FROM places` у Railway**.

**Read-only SQL** для існуючих дублів:
```sql
SELECT p.name, p.address, count(*) AS total,
       array_agg(p.id ORDER BY p.created_at) AS place_ids
FROM places p
WHERE p.status<>'archived' AND p.organization_id IS NOT NULL
GROUP BY p.name,p.address HAVING count(*)>1 ORDER BY total DESC;
```

**Read-only SQL** для архівованих:
```sql
SELECT p.id,p.name,p.status,COUNT(q.id) FILTER(WHERE q.active) AS active_qrs
FROM places p LEFT JOIN qr_points q ON q.place_id=p.id
WHERE p.status='archived' GROUP BY p.id,p.name,p.status;
```

## 4. Реальний планувальник

- За QR закладу категорії `rest` або `entertainment` вибрати **Активний відпочинок**. Принаймні один схвалений, доступний за відстанню заклад тепер має потрапити в маршрут, навіть якщо лише він один підходить до параметрів і знаходиться в точці QR.
- Вибір разом із іншими інтересами не має приховувати відповідну активність.
- Якщо в базі немає жодного реального місця, яке відповідає основній категорії, радіусу, часу роботи і відомим несумісностям, маршрут може бути порожнім — вигадані зупинки не додаються.
- Незаповнені атрибути доступності/харчування не мають автоматично виключати заклад; але це **не означає**, що ці властивості підтверджені. Перед відвідуванням їх слід уточнювати.

**Read-only SQL**:
```sql
SELECT id,name,category_slug,subcategory,lat,lng,status,work_hours,attributes
FROM places WHERE status='approved' AND category_slug IN ('rest','entertainment')
ORDER BY updated_at DESC LIMIT 40;
```

## Локальні перевірки

З кореневої папки проєкту:

```cmd
node test_planner_engine.cjs
node test_partner_emergency_planner_updates.cjs
```

Повна NestJS та Next.js production-збірка, реальні дзвінки з Telegram і реальна PostgreSQL потребують перевірки після деплою. В ізольованих тестах **не використовувалися** робочі токени, адреси або база даних.
