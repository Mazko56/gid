# Gid Tourist — перевірка контактів усіх міст, QR та реального планувальника

## Перед запуском на Railway

**Неруйнівна міграція, обов'язкова до першого запуску нового Backend, якщо `DB_AUTO_MIGRATE=false`:**

```sql
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT false;
ALTER TABLE emergency_services ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT false;
ALTER TABLE qr_points ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
```

Якщо автоматична ініціалізація схеми ввімкнена (`DB_AUTO_MIGRATE` не дорівнює `false`), Backend додає ці поля самостійно. Зміни не видаляють дані. Потрібен успішний деплой Backend та Frontend.

## 1. Номери «Халепа?»

- Адмінпанель → Контент / QR → Редактор «Халепа?» → обрати конкретне місто (наприклад Кривий Ріг), створити/відредагувати номер екстреного контакту та корисного сервісу.
- Позначка **Для всіх міст** — один запис показуватиметься в кожному місті. Без позначки він доступний лише у вибраному місті.
- У режимі **Усі міста** список показує і локальні, і загальні записи. Можна створити загальний контакт без вибору міста вручну, або локальний, обравши місто.
- Турист → «Халепа?» → натиснути контакт чи корисний сервіс із номером — відкривається телефонний набір `tel:`. Номер без відповідних даних у БД **не вигадується**.
- На Android/iOS `tel:` має оброблятись системним додатком для дзвінків. Десктопний браузер може не мати телефонного обробника — це не збій API.
- Протестувати запуск QR з двох різних міст і без QR (GPS/вибране місто) та відсутність чужих локальних номерів.

**Безпечні SQL-перевірки:**

```sql
SELECT r.name, ec.title, ec.phone, ec.is_global
FROM emergency_contacts ec JOIN regions r ON r.id=ec.region_id
WHERE ec.active ORDER BY ec.is_global DESC, r.name, ec.title;

SELECT r.name, es.title, es.phone, es.is_global, es.active
FROM emergency_services es JOIN regions r ON r.id=es.region_id
WHERE es.deleted_at IS NULL ORDER BY es.is_global DESC, r.name, es.title;
```

## 2. Видалення QR

- Адмінпанель → Контент / QR → QR точки → **Видалити** у рядку або **QR** → **Видалити QR**.
- Підтвердити дію: QR зникає зі списку й більше не відкриває контекст. Попередні записи та статистика не видаляються.
- Якщо видалено `partner_access`, старий QR партнерського входу більше не діє — це очікувано. Перед видаленням такого коду впевнитись, що є альтернативний вхід.

```sql
SELECT id, start_param, type, active, deleted_at
FROM qr_points ORDER BY created_at DESC LIMIT 30;
```

## 3. Планувальник

- У PostgreSQL мають бути заклади зі статусом `approved` з коректними `lat`, `lng` і категоріями `rest`, `entertainment`, `food` (або іншими реальними тегами/назвами, що відповідають обраним інтересам).
- Запустити QR готелю, вибрати місто Кривий Ріг (~47 км), радіус 100 км, активний відпочинок + їжа, день/час, автомобіль.
- План повинен підібрати хоча б одну справжню відповідну локацію. Якщо є кілька доступних — намагатиметься врахувати обидва інтереси.
- Прив'язка до міста перевіряється за ID **або географічною близькістю до його центру**. Перший переїзд до явно обраного міста може перевищити бажаний час: оцінка показується туристу і це пояснюється під результатом. Для подальших переїздів максимальний час дотримується; явна заборона довгих переїздів дотримується на всіх етапах.
- Якщо початок надто пізно, існує обмеження відкритих годин або невідповідність іншим обов'язковим вимогам, інтерфейс показує пояснення замість неправдивої заяви «у базі немає закладів».

**Безпечна SQL-перевірка реальних локацій:**

```sql
SELECT p.id, p.name, p.status, p.category_slug, p.subcategory,
       r.name AS region_name, p.lat, p.lng, p.price_level
FROM places p JOIN regions r ON r.id=p.region_id
WHERE p.status='approved' AND (p.category_slug IN ('rest','entertainment','food')
       OR lower(p.name) LIKE '%актив%')
ORDER BY r.name,p.name LIMIT 100;
```

**Автотести в ZIP:** `node test_city_wide_emergency_qr_planner.cjs`, `node test_planner_engine.cjs`. Це ізольована перевірка; швидкість Railway, інтеграція з живою PostgreSQL та повна збірка Next/Nest перевіряються окремо.
