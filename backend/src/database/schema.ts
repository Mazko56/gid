export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS regions (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  name_en text,
  name_pl text,
  center_lat double precision NOT NULL,
  center_lng double precision NOT NULL,
  community_url text,
  emergency_verified_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  telegram_id bigint UNIQUE,
  telegram_username text,
  first_name text,
  last_name text,
  photo_url text,
  language_code text,
  selected_language text NOT NULL DEFAULT 'uk',
  role text NOT NULL DEFAULT 'tourist',
  phone text,
  consent jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS emergency_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);

CREATE TABLE IF NOT EXISTS categories (
  slug text PRIMARY KEY,
  name text NOT NULL,
  name_en text,
  name_pl text,
  sort_order integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  subcategories jsonb NOT NULL DEFAULT '[]'::jsonb,
  filter_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  owner_user_id text REFERENCES users(id) ON DELETE SET NULL,
  region_id text REFERENCES regions(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS places (
  id text PRIMARY KEY,
  organization_id text REFERENCES organizations(id) ON DELETE SET NULL,
  region_id text NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  category_slug text NOT NULL REFERENCES categories(slug) ON DELETE RESTRICT,
  subcategory text,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  phone text,
  telegram text,
  website text,
  image_url text,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  price_level integer,
  work_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  moderation_comment text,
  created_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_places_region_category_status ON places(region_id, category_slug, status);
CREATE INDEX IF NOT EXISTS idx_places_geo ON places(lat, lng);

CREATE TABLE IF NOT EXISTS place_tags (
  place_id text NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  tag text NOT NULL,
  PRIMARY KEY(place_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_place_tags_tag ON place_tags(tag);

CREATE TABLE IF NOT EXISTS qr_points (
  id text PRIMARY KEY,
  start_param text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'entry_point',
  source text NOT NULL DEFAULT 'hotel',
  region_id text NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  place_id text REFERENCES places(id) ON DELETE SET NULL,
  campaign_id text,
  ambassador_id text,
  active boolean NOT NULL DEFAULT true,
  created_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qr_points_start ON qr_points(start_param, active);


CREATE TABLE IF NOT EXISTS organization_telegram_access (
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  telegram_id bigint NOT NULL,
  role text NOT NULL DEFAULT 'owner',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id, telegram_id)
);
CREATE INDEX IF NOT EXISTS idx_org_tg_access_telegram ON organization_telegram_access(telegram_id, active);

CREATE TABLE IF NOT EXISTS favorites (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id text NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, place_id)
);

CREATE TABLE IF NOT EXISTS external_favorites (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id text NOT NULL,
  place_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, place_id)
);

CREATE TABLE IF NOT EXISTS activity_events (
  id text PRIMARY KEY,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  region_id text REFERENCES regions(id) ON DELETE SET NULL,
  place_id text REFERENCES places(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_user_created ON activity_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id text PRIMARY KEY,
  region_id text NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  note text NOT NULL DEFAULT '',
  phone text,
  lat double precision,
  lng double precision,
  tone text NOT NULL DEFAULT 'green',
  sort_order integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_emergency_region ON emergency_contacts(region_id, active, sort_order);

CREATE TABLE IF NOT EXISTS emergency_services (
  id text PRIMARY KEY,
  region_id text NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  title text NOT NULL,
  note text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT 'green',
  icon text NOT NULL DEFAULT 'custom',
  sort_order integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE emergency_services ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_emergency_services_region ON emergency_services(region_id, active, sort_order);

CREATE TABLE IF NOT EXISTS hot_offers (
  id text PRIMARY KEY,
  region_id text NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  place_id text REFERENCES places(id) ON DELETE SET NULL,
  category_slug text,
  category_label text NOT NULL DEFAULT '',
  title text NOT NULL,
  discount text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  detail text NOT NULL DEFAULT '',
  validity text NOT NULL DEFAULT '',
  badge text NOT NULL DEFAULT '',
  badge_tone text NOT NULL DEFAULT 'green',
  image_url text,
  valid_from timestamptz,
  valid_until timestamptz,
  sort_order integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Partner hot offers require explicit moderation; old admin offers remain approved.
ALTER TABLE hot_offers ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved';
ALTER TABLE hot_offers ADD COLUMN IF NOT EXISTS moderation_comment text NOT NULL DEFAULT '';
ALTER TABLE hot_offers ADD COLUMN IF NOT EXISTS terms text NOT NULL DEFAULT '';
ALTER TABLE hot_offers ADD COLUMN IF NOT EXISTS submitted_by_user_id text REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_hot_offers_review_queue ON hot_offers(moderation_status,region_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hot_offers_region ON hot_offers(region_id, active, sort_order, valid_until);

CREATE TABLE IF NOT EXISTS page_content (
  region_id text NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  page_key text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(region_id, page_key)
);

CREATE TABLE IF NOT EXISTS app_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='restore-default-emergency-services-20260907-v2') THEN
    UPDATE emergency_services
    SET active=true, deleted_at=NULL, updated_at=now()
    WHERE id IN ('private-doctor','pharmacy','car-service','tow-truck','veterinarian');
    INSERT INTO app_migrations(id) VALUES ('restore-default-emergency-services-20260907-v2');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS place_type_templates (
  id text PRIMARY KEY,
  category_slug text NOT NULL REFERENCES categories(slug) ON DELETE CASCADE,
  place_type text NOT NULL,
  label text NOT NULL,
  default_title text,
  default_description text,
  default_services jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_slug, place_type)
);
ALTER TABLE place_type_templates ADD COLUMN IF NOT EXISTS default_title text;
ALTER TABLE place_type_templates ADD COLUMN IF NOT EXISTS default_description text;
ALTER TABLE place_type_templates ADD COLUMN IF NOT EXISTS default_amenities jsonb NOT NULL DEFAULT '[]'::jsonb;

-- PRD modules: resources, bookings, signed ephemeral customer QR, immutable bonus ledger,
-- two-party payment confirmation, verified reviews, trip plans and referral attribution.
CREATE TABLE IF NOT EXISTS booking_resources (
  id text PRIMARY KEY, place_id text NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  name text NOT NULL, capacity integer NOT NULL DEFAULT 1 CHECK(capacity > 0),
  duration_minutes integer NOT NULL DEFAULT 60 CHECK(duration_minutes > 0),
  buffer_minutes integer NOT NULL DEFAULT 0 CHECK(buffer_minutes >= 0),
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK(price >= 0),
  working_hours jsonb NOT NULL DEFAULT '{}'::jsonb, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resources_place ON booking_resources(place_id,active);
CREATE TABLE IF NOT EXISTS bookings (
  id text PRIMARY KEY, resource_id text NOT NULL REFERENCES booking_resources(id),
  place_id text NOT NULL REFERENCES places(id), region_id text NOT NULL REFERENCES regions(id),
  user_id text REFERENCES users(id), created_by_user_id text REFERENCES users(id),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  party_size integer NOT NULL DEFAULT 1 CHECK(party_size BETWEEN 1 AND 100),
  price numeric(12,2) NOT NULL DEFAULT 0, client_name text NOT NULL DEFAULT '',
  phone text, comment text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending_partner', source text NOT NULL DEFAULT 'tourist',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(resource_id,starts_at,ends_at,status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS customer_qr_tokens (
  token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL, consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customer_qr_expiry ON customer_qr_tokens(expires_at);
CREATE TABLE IF NOT EXISTS bonus_rules (
  region_id text PRIMARY KEY REFERENCES regions(id),
  earn_percent numeric(6,3) NOT NULL DEFAULT 1 CHECK(earn_percent BETWEEN 0 AND 100),
  max_spend_percent numeric(6,3) NOT NULL DEFAULT 20 CHECK(max_spend_percent BETWEEN 0 AND 100),
  expiration_days integer NOT NULL DEFAULT 365 CHECK(expiration_days BETWEEN 1 AND 3650),
  min_purchase numeric(12,2) NOT NULL DEFAULT 0 CHECK(min_purchase >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS purchase_transactions (
  id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id),
  cashier_user_id text NOT NULL REFERENCES users(id),
  place_id text NOT NULL REFERENCES places(id), region_id text NOT NULL REFERENCES regions(id),
  qr_token_hash text NOT NULL UNIQUE REFERENCES customer_qr_tokens(token_hash),
  amount numeric(12,2) NOT NULL CHECK(amount > 0),
  spent numeric(12,2) NOT NULL DEFAULT 0 CHECK(spent >= 0),
  earned numeric(12,2) NOT NULL DEFAULT 0 CHECK(earned >= 0),
  cash_due numeric(12,2) NOT NULL CHECK(cash_due >= 0),
  commission numeric(12,2) NOT NULL DEFAULT 0,
  commission_rate numeric(6,3) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending_customer',
  expires_at timestamptz NOT NULL, confirmed_at timestamptz,
  refunded_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text NOT NULL, UNIQUE(cashier_user_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON purchase_transactions(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_place ON purchase_transactions(place_id,created_at DESC);
CREATE TABLE IF NOT EXISTS bonus_ledger (
  id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id),
  transaction_id text REFERENCES purchase_transactions(id),
  related_entry_id text UNIQUE REFERENCES bonus_ledger(id),
  amount numeric(12,2) NOT NULL CHECK(amount <> 0 OR entry_type='expired'),
  entry_type text NOT NULL, status text NOT NULL DEFAULT 'available',
  expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(transaction_id,entry_type)
);
CREATE INDEX IF NOT EXISTS idx_bonus_ledger_user ON bonus_ledger(user_id,created_at DESC);
-- Claims from partner are not recognized as paid until an admin explicitly verifies them.
CREATE TABLE IF NOT EXISTS partner_settlement_payment_claims (
  id text PRIMARY KEY,
  place_id text NOT NULL REFERENCES places(id),
  region_id text NOT NULL REFERENCES regions(id),
  created_by_user_id text NOT NULL REFERENCES users(id),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reference text NOT NULL,
  receipt_filename text NOT NULL,
  receipt_mime text NOT NULL,
  receipt_bytes bytea NOT NULL,
  receipt_sha256 text NOT NULL,
  review_comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_partner_claims_place ON partner_settlement_payment_claims(place_id,status,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_partner_claim_pending ON partner_settlement_payment_claims(place_id) WHERE status='pending';
CREATE UNIQUE INDEX IF NOT EXISTS uq_partner_claim_reference ON partner_settlement_payment_claims(place_id,reference);

CREATE TABLE IF NOT EXISTS review_entries (
  id text PRIMARY KEY, place_id text NOT NULL REFERENCES places(id),
  user_id text NOT NULL REFERENCES users(id),
  booking_id text UNIQUE REFERENCES bookings(id),
  transaction_id text UNIQUE REFERENCES purchase_transactions(id),
  rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),
  text text NOT NULL DEFAULT '', verification text NOT NULL,
  status text NOT NULL DEFAULT 'pending', moderation_comment text,
  partner_reply text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK((booking_id IS NOT NULL) <> (transaction_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_reviews_place_status ON review_entries(place_id,status);
CREATE TABLE IF NOT EXISTS trip_plans (
  id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  region_id text REFERENCES regions(id), title text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb, days jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS hotel_requests (
  id text PRIMARY KEY, place_id text NOT NULL REFERENCES places(id),
  user_id text NOT NULL REFERENCES users(id),
  request_type text NOT NULL, room text, note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ambassadors (
  id text PRIMARY KEY, user_id text NOT NULL UNIQUE REFERENCES users(id),
  code text NOT NULL UNIQUE, region_id text REFERENCES regions(id),
  active boolean NOT NULL DEFAULT true, reward_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ambassador_attributions (
  id text PRIMARY KEY, user_id text NOT NULL UNIQUE REFERENCES users(id),
  ambassador_id text NOT NULL REFERENCES ambassadors(id),
  campaign_id text, source text, first_action_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  eligible_after timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY, actor_user_id text REFERENCES users(id),
  actor_type text NOT NULL DEFAULT 'user', region_id text REFERENCES regions(id),
  entity_type text NOT NULL, entity_id text NOT NULL, action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type,entity_id,created_at DESC);
INSERT INTO bonus_rules(region_id) SELECT id FROM regions ON CONFLICT DO NOTHING;
`;

export const SEED_SQL = `
INSERT INTO regions (id, slug, name, name_en, name_pl, center_lat, center_lng, community_url)
VALUES ('region-tatariv', 'tatariv', 'Татарів', 'Tatariv', 'Tatarów', 48.34535, 24.57855, NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, center_lat = EXCLUDED.center_lat, center_lng = EXCLUDED.center_lng;

INSERT INTO categories (slug, name, name_en, name_pl, sort_order, subcategories, filter_config) VALUES
('hotel','Про заклад','About place','O obiekcie',10,'[]'::jsonb,'{}'::jsonb),
('food','Де поїсти','Food','Gdzie zjeść',20,'["Українська кухня","Неукраїнська кухня","Фаст фуд","Кавʼярні"]'::jsonb,'{"rating":true,"price":true,"open_now":true,"kids":true}'::jsonb),
('shop','Де купити','Shopping','Zakupy',30,'["Продовольчі","Промтовари","Сувеніри","Аптеки"]'::jsonb,'{"rating":true,"distance":true,"open_now":true}'::jsonb),
('rest','Де відпочити','Relax','Wypoczynek',40,'["Чани","Сауни","Басейни","Масаж","Походи","Екскурсії"]'::jsonb,'{"rating":true,"price":true,"open_now":true}'::jsonb),
('entertainment','Розваги','Entertainment','Rozrywka',50,'["Джипи","Квадроцикли","Рафтинг","Зіплайн","Для дітей","Коні"]'::jsonb,'{"rating":true,"price":true,"kids":true}'::jsonb),
('transfer','Трансфер','Transfer','Transfer',60,'["Таксі","Автостанції","Парковки","Оренда авто","Заправки"]'::jsonb,'{"distance":true,"open_now":true}'::jsonb),
('nature','Природа','Nature','Natura',65,'["Гори","Річки","Водоспади","Озера","Оглядові точки","Печери","Ліси"]'::jsonb,'{"distance":true}'::jsonb),
('useful','Корисне','Useful','Przydatne',66,'["Банкомати","Обмін валют","Пошта","Лікарні","Туалети","Wi‑Fi","Поліція","Інформаційні центри"]'::jsonb,'{"distance":true,"open_now":true}'::jsonb),
('emergency','Халепа?','Emergency','Pomoc',70,'[]'::jsonb,'{}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO place_type_templates (id,category_slug,place_type,label,default_title,default_description,default_services,default_amenities,fields,sort_order) VALUES
('tpl-hotel','hotel','Готель','Готель','Новий готель','Комфортний готель для відпочинку гостей. Додайте короткий опис розташування, номерів та головних переваг.','["Сніданок","Прибирання","Сауна","Басейн","Трансфер"]'::jsonb,'["Номери","Паркінг","Wi‑Fi","Сніданок"]'::jsonb,'{"room_count":"Кількість номерів","opened_year":"Рік відкриття","languages":"Мови обслуговування","accommodation_type":"Тип розміщення"}'::jsonb,10),
('tpl-guesthouse','hotel','Садиба','Садиба','Нова садиба','Затишна садиба для відпочинку. Опишіть умови проживання, територію та головні переваги.','["Сніданок","Мангал","Чан","Трансфер"]'::jsonb,'["Номери","Паркінг","Wi‑Fi","Мангал"]'::jsonb,'{"room_count":"Кількість кімнат","opened_year":"Рік відкриття","languages":"Мови обслуговування","accommodation_type":"Тип розміщення"}'::jsonb,20),
('tpl-restaurant','food','Ресторан','Ресторан','Новий ресторан','Ресторан із власною кухнею та атмосферою. Опишіть кухню, формат закладу й особливі пропозиції.','["Основне меню","Сніданки","Доставка","Їжа з собою","Дитяче меню"]'::jsonb,'["Меню","Паркінг","Wi‑Fi","Дитяче меню"]'::jsonb,'{"capacity":"Кількість посадкових місць","average_check":"Середній чек","cuisine":"Кухня","languages":"Мови обслуговування"}'::jsonb,10),
('tpl-cafe','food','Кафе','Кафе','Нове кафе','Кафе для сніданків, кави та зустрічей. Додайте інформацію про меню, формат і особливості.','["Кава","Десерти","Сніданки","Їжа з собою"]'::jsonb,'["Кава","Wi‑Fi","Їжа з собою","Десерти"]'::jsonb,'{"capacity":"Кількість посадкових місць","average_check":"Середній чек","cuisine":"Тип кухні","languages":"Мови обслуговування"}'::jsonb,20),
('tpl-bar','food','Бар','Бар','Новий бар','Бар із напоями та закусками. Опишіть формат, атмосферу, кухню або події.','["Напої","Закуски","Жива музика"]'::jsonb,'["Напої","Wi‑Fi","Жива музика"]'::jsonb,'{"capacity":"Кількість місць","average_check":"Середній чек","format":"Формат закладу","languages":"Мови обслуговування"}'::jsonb,30),
('tpl-shop','shop','Магазин','Магазин','Новий магазин','Магазин товарів для туристів і місцевих мешканців. Вкажіть основний асортимент та умови покупки.','["Продаж у магазині","Самовивіз"]'::jsonb,'["Оплата карткою","Паркінг","Самовивіз"]'::jsonb,'{"store_format":"Формат магазину","assortment":"Основний асортимент","delivery":"Доставка / самовивіз","payment_methods":"Способи оплати"}'::jsonb,10),
('tpl-souvenir','shop','Сувенірна крамниця','Сувенірна крамниця','Нова сувенірна крамниця','Сувеніри, подарунки та локальні товари. Опишіть асортимент і особливі вироби.','["Сувеніри","Подарунки","Локальні товари"]'::jsonb,'["Подарунки","Локальні товари","Оплата карткою"]'::jsonb,'{"assortment":"Основний асортимент","local_goods":"Локальні товари","delivery":"Доставка / самовивіз","payment_methods":"Способи оплати"}'::jsonb,20),
('tpl-pharmacy','shop','Аптека','Аптека','Нова аптека','Аптека та товари для здоровʼя. Додайте графік, формат роботи й доступні сервіси.','["Ліки","Товари для здоровʼя"]'::jsonb,'["Ліки","Оплата карткою","Самовивіз"]'::jsonb,'{"format":"Формат аптеки","delivery":"Доставка / самовивіз","payment_methods":"Способи оплати","languages":"Мови обслуговування"}'::jsonb,30),
('tpl-spa','rest','SPA / сауна','SPA / сауна','Новий SPA / сауна','Місце для відпочинку й відновлення. Опишіть формати процедур, місткість і умови відвідування.','["Сауна","Чан","Масаж","Басейн"]'::jsonb,'["SPA","Паркінг","Рушники","Душ"]'::jsonb,'{"capacity":"Місткість","duration":"Тривалість сеансу","price_info":"Вартість","languages":"Мови обслуговування"}'::jsonb,10),
('tpl-excursion','rest','Екскурсії','Екскурсії','Нова екскурсія','Екскурсійна послуга для туристів. Опишіть маршрут, тривалість, складність та формат групи.','["Екскурсія","Гід","Трансфер"]'::jsonb,'["Гід","Трансфер","Групи"]'::jsonb,'{"duration":"Тривалість","group_size":"Розмір групи","difficulty":"Складність","languages":"Мови проведення"}'::jsonb,20),
('tpl-entertainment','entertainment','Активний відпочинок','Активний відпочинок','Нова активність','Активний відпочинок та враження. Опишіть формат, рівень складності, сезонність і вимоги до гостей.','["Квадроцикли","Рафтинг","Зіплайн","Джип-тур"]'::jsonb,'["Активності","Паркінг","Інструктор"]'::jsonb,'{"age_limit":"Вікові обмеження","duration":"Тривалість","difficulty":"Рівень складності","season":"Сезонність"}'::jsonb,10),
('tpl-transfer','transfer','Трансфер / таксі','Трансфер / таксі','Новий трансфер','Трансфер або таксі для гостей регіону. Вкажіть тип транспорту, місткість і зону роботи.','["Трансфер","Таксі","Оренда авто"]'::jsonb,'["Трансфер","Багаж","Дитяче крісло"]'::jsonb,'{"vehicle_type":"Тип транспорту","capacity":"Місткість","service_area":"Зона роботи","languages":"Мови водія"}'::jsonb,10)
ON CONFLICT (category_slug,place_type) DO UPDATE SET label=EXCLUDED.label,default_title=EXCLUDED.default_title,default_description=EXCLUDED.default_description,default_services=EXCLUDED.default_services,default_amenities=EXCLUDED.default_amenities,fields=EXCLUDED.fields,sort_order=EXCLUDED.sort_order,updated_at=now();

-- Remove only the historical demo points that shipped with the prototype.
-- Real partner/admin-created places use generated IDs and are never touched here.
DELETE FROM qr_points WHERE id='qr-girskyi-zatyshok' OR start_param='hotel-girskyi-zatyshok';
DELETE FROM places
WHERE organization_id IS NULL AND id = ANY(ARRAY[
  'place-girskyi-zatyshok','food-hutsulshchyna','food-kolyba','food-pizza','food-coffee',
  'shop-smak','shop-souvenir','shop-pharmacy','shop-home','rest-tub','rest-sauna','rest-pool','rest-massage',
  'fun-jeep','fun-quad','fun-rafting','fun-zipline','transfer-taxi','transfer-bus','transfer-gas','transfer-parking'
]::text[]);

INSERT INTO qr_points(id,start_param,type,source,region_id,place_id) VALUES('qr-public-tatariv','guide-tatariv','entry_point','public','region-tatariv',NULL) ON CONFLICT (start_param) DO NOTHING;

INSERT INTO emergency_contacts (id, region_id, type, title, note, phone, tone, sort_order) VALUES
('em-112','region-tatariv','emergency','Єдиний номер допомоги','Поліція · швидка · рятувальники','112','red',10),
('em-103','region-tatariv','ambulance','Швидка допомога','Цілодобово','103','red',20),
('em-102','region-tatariv','police','Поліція','Допомога та правопорядок','102','blue',30),
('em-101','region-tatariv','rescue','ДСНС / рятувальники','Пожежі · аварії · надзвичайні ситуації','101','orange',40),
('em-mountain','region-tatariv','rescue','Гірські рятувальники','Яремче, найближчий пост','+380673421868','green',50)
ON CONFLICT (id) DO NOTHING;

INSERT INTO emergency_services (id,region_id,title,note,tone,icon,sort_order) VALUES
('private-doctor','region-tatariv','Приватний лікар','Консультація','green','doctor',10),
('pharmacy','region-tatariv','Аптека','Пошук аптек','green','pharmacy',20),
('car-service','region-tatariv','СТО','Автосервіси','purple','repair',30),
('tow-truck','region-tatariv','Евакуатор','Допомога','orange','tow',40),
('veterinarian','region-tatariv','Ветеринар','Допомога тваринам','blue','vet',50)
ON CONFLICT (id) DO NOTHING;

UPDATE regions SET emergency_verified_at=COALESCE(emergency_verified_at, now()) WHERE id='region-tatariv';

INSERT INTO page_content(region_id,page_key,content) VALUES
('region-tatariv','emergency','{"badge":"SOS","title":"Халепа?","subtitle":"Швидка допомога та корисні контакти","hero_kicker":"Не хвилюйтеся","hero_title":"Знайдемо допомогу","hero_text":"Екстрені та перевірені контакти для вашої безпеки."}'::jsonb),
('region-tatariv','hot_offers','{"discount_label":"до","discount_value":"-30%","title":"Вигідні пропозиції\\nдля вашого відпочинку","subtitle":"Спеціальні знижки\\nвід перевірених партнерів 💚","search_placeholder":"Пошук місць, маршрутів, активностей...","section_title":"Пропозиції поруч","banner_image_url":""}'::jsonb)
ON CONFLICT (region_id,page_key) DO NOTHING;
`;
