import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../../database/database.service.js';

type SettingsSection = 'general' | 'company' | 'partners' | 'notifications';
type SettingValue = string | boolean | number | Record<string, unknown> | unknown[] | null;

const ALLOWED: Record<SettingsSection, readonly string[]> = {
  general: ['show_archived_partners','show_inactive_clients','auto_refresh','allow_partner_registration','require_partner_approval','allow_partner_edits','display_partner_rating','show_hints','maintenance_mode','log_retention_months','archive_retention_months','logo_url','primary_color','secondary_color'],
  company: ['legal_name','tax_id','address','iban','bank','vat_payer','vat_rate'],
  partners: ['commission_rate','category_commissions','auto_assign_commission','show_partner_commission','show_partner_debt','minimum_order','commission_duration_days'],
  notifications: ['email','phone','telegram','push_endpoint','email_enabled','sms_enabled','telegram_enabled','push_enabled','daily_summary','daily_time','weekly_summary','weekly_day','quiet_hours','quiet_start','quiet_end'],
};

function sanitize(section:SettingsSection, patch:unknown):Record<string,SettingValue> {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new BadRequestException('Очікується об’єкт налаштувань');
  const object = patch as Record<string,unknown>;
  if (Object.keys(object).length > 50) throw new BadRequestException('Забагато полів');
  const result:Record<string,SettingValue> = {};
  for (const [key,value] of Object.entries(object)) {
    if (!ALLOWED[section].includes(key)) throw new BadRequestException(`Недозволене поле: ${key}`);
    if (section === 'general' && key === 'logo_url' && typeof value === 'string') {
      if (value.length > 200000) throw new BadRequestException('Логотип завеликий');
      if (value !== '' && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value) && !/^https:\/\/[^\s]{1,2000}$/i.test(value)) throw new BadRequestException('Некоректний логотип');
      result[key] = value;
    } else if (typeof value === 'string') {
      if (value.length > 4000) throw new BadRequestException(`Завелике поле: ${key}`);
      result[key] = value.trim();
    } else if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
      result[key] = value;
    } else if (section === 'partners' && key === 'category_commissions') {
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 200) throw new BadRequestException('Некоректні комісії категорій');
      const rates:Record<string,number> = {};
      for (const [category,raw] of Object.entries(value)) {
        const parsed = Number(raw);
        if (!/^[a-z0-9_-]{1,80}$/i.test(category) || raw === '' || !Number.isFinite(parsed) || parsed < 0 || parsed > 100) throw new BadRequestException('Комісія має бути від 0 до 100');
        rates[category] = parsed;
      }
      result[key] = rates;
    } else if (value === null) result[key] = null;
    else throw new BadRequestException(`Некоректне значення: ${key}`);
  }
  if (section === 'partners' && Object.hasOwn(result,'commission_rate')) {
    const v = result.commission_rate;
    if (v !== '' && (typeof v !== 'number' && typeof v !== 'string' || !Number.isFinite(Number(v)) || Number(v)<0 || Number(v)>100)) throw new BadRequestException('Комісія має бути від 0 до 100%');
  }
  return result;
}

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly db:DatabaseService) {}

  async snapshot() {
    const [settings,regions,categories,statuses,bonusRules,admins,sessions] = await Promise.all([
      this.db.query<{section:string;config:Record<string,unknown>;updated_at:string}>('SELECT section,config,updated_at FROM admin_settings ORDER BY section'),
      this.db.query<{id:string;name:string;active:boolean;places_count:number}>(`SELECT r.id,r.name,r.active,COUNT(p.id) FILTER (WHERE p.organization_id IS NOT NULL)::int AS places_count
        FROM regions r LEFT JOIN places p ON p.region_id=r.id GROUP BY r.id,r.name,r.active ORDER BY r.name`),
      this.db.query<{slug:string;name:string;active:boolean;places_count:number}>(`SELECT c.slug,c.name,c.active,COUNT(p.id) FILTER (WHERE p.organization_id IS NOT NULL)::int AS places_count
        FROM categories c LEFT JOIN places p ON p.category_slug=c.slug GROUP BY c.slug,c.name,c.active ORDER BY c.name`),
      this.db.query<{status:string;count:number}>(`SELECT status,COUNT(*)::int AS count FROM places WHERE organization_id IS NOT NULL GROUP BY status ORDER BY status`),
      this.db.query<{region_id:string;region_name:string;earn_percent:number|string;max_spend_percent:number|string;expiration_days:number;min_purchase:number|string;updated_at:string}>(`SELECT b.region_id,r.name AS region_name,b.earn_percent,b.max_spend_percent,b.expiration_days,b.min_purchase,b.updated_at FROM bonus_rules b JOIN regions r ON r.id=b.region_id ORDER BY r.name`),
      this.db.query<{id:string;first_name:string|null;last_name:string|null;telegram_username:string|null;role:string}>(`SELECT id,first_name,last_name,telegram_username,role FROM users WHERE role IN ('admin','superadmin') ORDER BY created_at DESC LIMIT 100`),
      this.db.query<{user_id:string;created_at:string;expires_at:string}>(`SELECT s.user_id,s.created_at,s.expires_at FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE u.role IN ('admin','superadmin') AND s.expires_at>now() ORDER BY s.created_at DESC LIMIT 100`),
    ]);
    const values:Record<string,Record<string,unknown>> = {};
    for (const row of settings.rows) values[row.section] = row.config;
    return {
      values, regions:regions.rows, categories:categories.rows, partner_statuses:statuses.rows,
      bonus_rules:bonusRules.rows, admin_users:admins.rows, admin_sessions:sessions.rows,
      security_runtime: {admin_key_configured:Boolean(process.env.ADMIN_API_KEY), auth_mode:'ADMIN_API_KEY'},
    };
  }

  async update(section:string, body:{values?:unknown}) {
    if (!Object.hasOwn(ALLOWED,section)) throw new BadRequestException('Невідомий розділ налаштувань');
    const patch = sanitize(section as SettingsSection,body?.values);
    if (!Object.keys(patch).length) throw new BadRequestException('Немає змін для збереження');
    const result = await this.db.query<{config:Record<string,unknown>}>(`INSERT INTO admin_settings(section,config) VALUES($1,$2::jsonb)
      ON CONFLICT(section) DO UPDATE SET config=admin_settings.config || EXCLUDED.config,updated_at=now() RETURNING config`,[section,JSON.stringify(patch)]);
    await this.db.query(`INSERT INTO audit_logs(id,actor_type,entity_type,entity_id,action,details) VALUES($1,'admin_key','settings',$2,'updated',$3::jsonb)`,
      [randomUUID(),section,JSON.stringify({fields:Object.keys(patch)})]);
    return {section,values:result.rows[0].config};
  }

  async updateBonusRule(id:string,body:Record<string,unknown>) {
    const keys=['earn_percent','max_spend_percent','expiration_days','min_purchase'];
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k=>!keys.includes(k))) throw new BadRequestException('Некоректні параметри бонусів');
    if (keys.some(k => body[k]===undefined || body[k]===null || body[k]==='')) throw new BadRequestException('Заповніть усі правила бонусів');
    const earn=Number(body.earn_percent),spend=Number(body.max_spend_percent),days=Number(body.expiration_days),minimum=Number(body.min_purchase);
    if (![earn,spend,days,minimum].every(Number.isFinite) || earn<0 || earn>100 || spend<0 || spend>100 || !Number.isInteger(days) || days<1 || days>3650 || minimum<0 || minimum>9999999999) throw new BadRequestException('Значення правил бонусів поза допустимими межами');
    const result = await this.db.query(`UPDATE bonus_rules SET earn_percent=$2,max_spend_percent=$3,expiration_days=$4,min_purchase=$5,updated_at=now() WHERE region_id=$1 RETURNING *`,[id,earn,spend,days,minimum]);
    if (!result.rows[0]) throw new NotFoundException('Правила бонусів регіону не знайдено');
    await this.db.query(`INSERT INTO audit_logs(id,actor_type,region_id,entity_type,entity_id,action,details) VALUES($1,'admin_key',$2,'bonus_rules',$2,'updated',$3::jsonb)`,[randomUUID(),id,JSON.stringify({earn_percent:earn,max_spend_percent:spend,expiration_days:days,min_purchase:minimum})]);
    return result.rows[0];
  }

  async revokeSession(userId:string) {
    const result = await this.db.query(`DELETE FROM user_sessions s USING users u WHERE s.user_id=$1 AND s.user_id=u.id AND u.role='admin' RETURNING s.user_id`,[userId]);
    if (!result.rowCount) throw new NotFoundException('Активну сесію адміністратора не знайдено');
    await this.db.query(`INSERT INTO audit_logs(id,actor_type,entity_type,entity_id,action,details) VALUES($1,'admin_key','admin_session',$2,'revoked','{}'::jsonb)`,[randomUUID(),userId]);
    return {revoked:true};
  }
}
