import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import { DatabaseService } from '../../database/database.service.js';
import { makeId } from '../../common/id.js';
import type { AuthUser } from '../../common/auth.guard.js';

// All financial numbers are converted to two decimal places on ingress; PostgreSQL
// numeric and transactional row/advisory locks remain the authority for balances.
const money = (value: unknown) => Math.round(Number(value) * 100) / 100;
const amount = (value: unknown, allowZero = false) => {
  const number = money(value);
  if (!Number.isFinite(number) || number < 0 || (!allowZero && number === 0) || number > 10_000_000) {
    throw new BadRequestException('Некоректна сума');
  }
  return number;
};
const txt = (value: unknown, max = 500) => String(value ?? '').trim().slice(0, max);
const json = (value: unknown) => JSON.stringify(value ?? {});
const activeBookingStatuses = ['new', 'pending_partner', 'confirmed', 'alternative_proposed'];
const allowedBookingStatuses = [...activeBookingStatuses, 'cancelled_by_user', 'cancelled_by_partner', 'completed', 'no_show', 'refunded'];

@Injectable()
export class PlatformService {
  constructor(private readonly db: DatabaseService) {}

  private async audit(actor: string | null, region: string | null, entity: string, id: string, action: string, data: Record<string, unknown> = {}) {
    await this.db.query('INSERT INTO audit_logs(id,actor_user_id,region_id,entity_type,entity_id,action,details) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)',
      [makeId('audit'), actor, region, entity, id, action, json(data)]);
  }

  private async placeWithRole(user: AuthUser, placeId: string, accepted: string[] = ['owner', 'manager', 'cashier']) {
    const result = await this.db.query<{
      id: string; region_id: string; organization_id: string; name: string; status: string; role: string;
    }>(`SELECT p.id,p.region_id,p.organization_id,p.name,p.status,
         CASE WHEN o.owner_user_id=$2 THEN 'owner' ELSE a.role END AS role
       FROM places p JOIN organizations o ON o.id=p.organization_id
       LEFT JOIN organization_telegram_access a ON a.organization_id=o.id
        AND a.telegram_id::text=$3 AND a.active=true
       WHERE p.id=$1 AND (o.owner_user_id=$2 OR a.role IS NOT NULL) LIMIT 1`,
      [placeId, user.id, user.telegram_id]);
    const place = result.rows[0];
    if (!place || !accepted.includes(place.role)) throw new ForbiddenException('Немає доступу до цього закладу або дії');
    return place;
  }

  private async activeBalance(userId: string, client?: { query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, any>> }> }) {
    const db = client ?? this.db;
    const result = await db.query(`SELECT COALESCE(SUM(amount),0)::numeric AS total FROM bonus_ledger
      WHERE user_id=$1 AND status='available'`, [userId]);
    return money(result.rows[0]?.total ?? 0);
  }

  private async expireCredits(userId: string) {
    await this.db.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [userId]);
      const old = await client.query(`SELECT e.id,e.amount FROM bonus_ledger e
        WHERE e.user_id=$1 AND e.entry_type='earn' AND e.expires_at<=now()
        AND NOT EXISTS (SELECT 1 FROM bonus_ledger x WHERE x.related_entry_id=e.id AND x.entry_type='expired')
        ORDER BY e.created_at`, [userId]);
      for (const credit of old.rows) {
        const balance = await this.activeBalance(userId, client);
        const debit = Math.min(Math.max(0, balance), money(credit.amount));
        if (debit > 0) await client.query(`INSERT INTO bonus_ledger(id,user_id,related_entry_id,amount,entry_type)
          VALUES($1,$2,$3,$4,'expired')`, [makeId('ledger'),userId,credit.id,-debit]);
        else await client.query(`INSERT INTO bonus_ledger(id,user_id,related_entry_id,amount,entry_type,status)
          VALUES($1,$2,$3,0,'expired','ignored')`, [makeId('ledger'),userId,credit.id]);
      }
    });
  }

  async wallet(user: AuthUser) {
    await this.expireCredits(user.id);
    const [entries, balance] = await Promise.all([
      this.db.query(`SELECT l.id,l.transaction_id,l.amount,l.entry_type,l.status,l.expires_at,l.created_at,
        p.name AS place_name FROM bonus_ledger l LEFT JOIN purchase_transactions t ON t.id=l.transaction_id
        LEFT JOIN places p ON p.id=t.place_id WHERE l.user_id=$1 AND l.status<>'ignored' ORDER BY l.created_at DESC LIMIT 100`, [user.id]),
      this.activeBalance(user.id),
    ]);
    return { balance: Math.max(0,balance), entries: entries.rows, currency: 'bonus', exchange_note: '1 бонус = 1 грн знижки; не обмінюється на гроші' };
  }

  async customerQr(user: AuthUser) {
    const token = `gt_${randomBytes(24).toString('base64url')}`;
    const hash = createHash('sha256').update(token).digest('hex');
    await this.db.query('DELETE FROM customer_qr_tokens q WHERE q.user_id=$1 AND (q.expires_at<now() OR q.consumed_at IS NOT NULL) AND NOT EXISTS (SELECT 1 FROM purchase_transactions t WHERE t.qr_token_hash=q.token_hash)', [user.id]);
    await this.db.query('INSERT INTO customer_qr_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval \'45 seconds\')', [hash,user.id]);
    await this.audit(user.id,null,'customer_qr',hash.slice(0,12),'created');
    return { token, expires_at: new Date(Date.now()+45_000).toISOString(), lifetime_seconds:45 };
  }

  private async customerForToken(token: string) {
    const hash = createHash('sha256').update(token).digest('hex');
    const result = await this.db.query<{
      user_id: string;
      expires_at: Date;
      consumed_at: Date | null;
      first_name: string | null;
      last_name: string | null;
    }>(`SELECT q.user_id,q.expires_at,q.consumed_at,u.first_name,u.last_name
      FROM customer_qr_tokens q JOIN users u ON u.id=q.user_id WHERE q.token_hash=$1`,[hash]);
    const row = result.rows[0];
    if (!row || row.consumed_at || new Date(row.expires_at).getTime() <= Date.now()) throw new BadRequestException('QR недійсний або строк дії минув');
    return { ...row, hash };
  }

  async resolveScan(user: AuthUser, body: Record<string, unknown>) {
    const place = await this.placeWithRole(user, txt(body.place_id,90));
    if(place.status !== 'approved') throw new ForbiddenException('Заклад не опубліковано');
    const qr = await this.customerForToken(txt(body.token,200));
    if(qr.user_id === user.id) throw new ForbiddenException('Власні операції заборонені');
    return { place_id: place.id, place_name:place.name, customer_name: `${qr.first_name || ''} ${qr.last_name || ''}`.trim() || 'Гість', qr_valid: true, expires_at: qr.expires_at, balance: Math.max(0,await this.activeBalance(qr.user_id)) };
  }

  async quote(user: AuthUser, body: Record<string, unknown>) {
    const place = await this.placeWithRole(user,txt(body.place_id,90));
    if(place.status !== 'approved') throw new ForbiddenException('Операції доступні після модерації');
    const qr = await this.customerForToken(txt(body.token,200));
    if(qr.user_id === user.id) throw new ForbiddenException('Самостійні операції заборонені');
    const total = amount(body.amount);
    const idempotency = txt(body.idempotency_key || makeId('quote'),120);
    const existing = await this.db.query('SELECT * FROM purchase_transactions WHERE cashier_user_id=$1 AND idempotency_key=$2', [user.id,idempotency]);
    if(existing.rows[0]) return existing.rows[0];
    const rule = await this.db.query('SELECT * FROM bonus_rules WHERE region_id=$1',[place.region_id]);
    const options = rule.rows[0] || { earn_percent:1,max_spend_percent:20,min_purchase:0 };
    if(total < Number(options.min_purchase)) throw new BadRequestException('Сума нижча за мінімальний чек');
    await this.expireCredits(qr.user_id);
    const balance = Math.max(0,await this.activeBalance(qr.user_id));
    const spend = Math.min(amount(body.spend ?? 0,true),balance,money(total*Number(options.max_spend_percent)/100));
    const cash = money(total-spend);
    const earn = money(cash*Number(options.earn_percent)/100);
    const rate = 4;
    const id = makeId('txn');
    const result = await this.db.query(`INSERT INTO purchase_transactions
       (id,user_id,cashier_user_id,place_id,region_id,qr_token_hash,amount,spent,earned,cash_due,commission,commission_rate,expires_at,idempotency_key)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now()+interval '120 seconds',$13)
       ON CONFLICT(cashier_user_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,
      [id,qr.user_id,user.id,place.id,place.region_id,qr.hash,total,spend,earn,cash,money(total*rate/100),rate,idempotency]);
    await this.audit(user.id,place.region_id,'transaction',result.rows[0].id,'quoted',{total,spend,earn});
    return result.rows[0];
  }

  async pendingCustomer(user: AuthUser) {
    const pending = await this.db.query(`SELECT t.id,t.place_id,p.name AS place_name,t.amount,t.spent,t.earned,t.cash_due,t.commission,
      t.expires_at,t.created_at,t.status FROM purchase_transactions t JOIN places p ON p.id=t.place_id
      WHERE t.user_id=$1 AND t.status='pending_customer' AND t.expires_at>now() ORDER BY t.created_at DESC`,[user.id]);
    return pending.rows;
  }

  async confirmPurchase(user: AuthUser, transactionId: string) {
    await this.expireCredits(user.id);
    const result = await this.db.transaction(async (client) => {
      const txn = await client.query(`SELECT * FROM purchase_transactions WHERE id=$1 FOR UPDATE`,[transactionId]);
      const item = txn.rows[0];
      if(!item) throw new NotFoundException('Операцію не знайдено');
      if(item.user_id !== user.id) throw new ForbiddenException('Підтвердити може тільки клієнт');
      if(item.status === 'confirmed') return item;
      if(item.status !== 'pending_customer' || new Date(item.expires_at).getTime() <= Date.now()) throw new ConflictException('Операція вже недійсна');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[user.id]);
      const token = await client.query('SELECT * FROM customer_qr_tokens WHERE token_hash=$1 FOR UPDATE',[item.qr_token_hash]);
      if(!token.rows[0] || token.rows[0].consumed_at) throw new ConflictException('QR вже використано або минув строк');
      const balance = await this.activeBalance(user.id,client);
      if(money(item.spent) > Math.max(0,balance)) throw new ConflictException('Недостатньо бонусів для списання');
      await client.query('UPDATE customer_qr_tokens SET consumed_at=now() WHERE token_hash=$1',[item.qr_token_hash]);
      if(money(item.spent)>0) await client.query(`INSERT INTO bonus_ledger(id,user_id,transaction_id,amount,entry_type) VALUES($1,$2,$3,$4,'spent')`,[makeId('ledger'),user.id,item.id,-money(item.spent)]);
      if(money(item.earned)>0) {
        const rule = await client.query('SELECT expiration_days FROM bonus_rules WHERE region_id=$1',[item.region_id]);
        const days = Number(rule.rows[0]?.expiration_days ?? 365);
        await client.query(`INSERT INTO bonus_ledger(id,user_id,transaction_id,amount,entry_type,expires_at)
          VALUES($1,$2,$3,$4,'earn',now()+($5::integer * interval '1 day'))`,[makeId('ledger'),user.id,item.id,money(item.earned),days]);
      }
      const updated = await client.query('UPDATE purchase_transactions SET status=\'confirmed\',confirmed_at=now() WHERE id=$1 RETURNING *',[item.id]);
      await client.query(`INSERT INTO audit_logs(id,actor_user_id,region_id,entity_type,entity_id,action,details)
        VALUES($1,$2,$3,'transaction',$4,'confirmed',$5::jsonb)`,[makeId('audit'),user.id,item.region_id,item.id,json({earned:item.earned,spent:item.spent})]);
      return updated.rows[0];
    });
    return result;
  }

  async declinePurchase(user: AuthUser, transactionId: string) {
    const result = await this.db.query(`UPDATE purchase_transactions SET status='declined' WHERE id=$1 AND user_id=$2 AND status='pending_customer' RETURNING id,status`,[transactionId,user.id]);
    if(!result.rows[0]) throw new ConflictException('Не можна відхилити цю операцію');
    return result.rows[0];
  }

  async refund(user: AuthUser, id: string) {
    const lookup = await this.db.query('SELECT place_id FROM purchase_transactions WHERE id=$1',[id]);
    if(!lookup.rows[0]) throw new NotFoundException('Операцію не знайдено');
    const place = await this.placeWithRole(user,lookup.rows[0].place_id,['owner','manager']);
    return this.db.transaction(async (client) => {
      const locked = await client.query('SELECT * FROM purchase_transactions WHERE id=$1 FOR UPDATE',[id]);
      const t = locked.rows[0];
      if(t.status === 'refunded') return t;
      if(t.status !== 'confirmed') throw new ConflictException('Повернення доступне лише після підтвердження');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[t.user_id]);
      if(money(t.earned)>0) await client.query(`INSERT INTO bonus_ledger(id,user_id,transaction_id,amount,entry_type) VALUES($1,$2,$3,$4,'earn_reversed')`,[makeId('ledger'),t.user_id,id,-money(t.earned)]);
      if(money(t.spent)>0) await client.query(`INSERT INTO bonus_ledger(id,user_id,transaction_id,amount,entry_type) VALUES($1,$2,$3,$4,'spent_reversed')`,[makeId('ledger'),t.user_id,id,money(t.spent)]);
      await client.query('UPDATE purchase_transactions SET status=\'refunded\',refunded_at=now() WHERE id=$1',[id]);
      await client.query(`INSERT INTO audit_logs(id,actor_user_id,region_id,entity_type,entity_id,action,details)
        VALUES($1,$2,$3,'transaction',$4,'refunded',$5::jsonb)`,[makeId('audit'),user.id,place.region_id,id,json({reverses_earned:t.earned,restores_spent:t.spent})]);
      return { ...t,status:'refunded' };
    });
  }

  async purchases(user: AuthUser, placeId?: string) {
    let rows;
    if(placeId) {
      await this.placeWithRole(user,placeId);
      rows = await this.db.query(`SELECT t.*,u.first_name AS customer_name FROM purchase_transactions t
       JOIN users u ON u.id=t.user_id WHERE t.place_id=$1 ORDER BY t.created_at DESC LIMIT 100`,[placeId]);
    } else rows = await this.db.query('SELECT * FROM purchase_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[user.id]);
    return rows.rows;
  }

  private async paymentClaims(placeId: string) {
    return (await this.db.query(`SELECT c.id,c.place_id,c.amount,c.status,c.reference,c.receipt_filename,c.receipt_mime,
      c.created_at,c.reviewed_at,c.review_comment FROM partner_settlement_payment_claims c
      WHERE c.place_id=$1 ORDER BY c.created_at DESC LIMIT 200`,[placeId])).rows;
  }

  async settlement(user: AuthUser, placeId: string) {
    const place = await this.placeWithRole(user,placeId,['owner','manager']);
    const [summary, payments, verifiedPaid] = await Promise.all([
      this.db.query(`SELECT COUNT(*) FILTER(WHERE status='confirmed')::integer AS transactions,
        COALESCE(SUM(amount) FILTER(WHERE status='confirmed'),0)::numeric AS turnover,
        COALESCE(SUM(commission) FILTER(WHERE status='confirmed'),0)::numeric AS commission_due,
        COALESCE(SUM(spent) FILTER(WHERE status='confirmed'),0)::numeric AS bonus_compensation_due
        FROM purchase_transactions WHERE place_id=$1`,[placeId]),
      this.paymentClaims(placeId),
      this.db.query(`SELECT COALESCE(SUM(amount),0) AS total FROM partner_settlement_payment_claims WHERE place_id=$1 AND status='approved'`,[placeId]),
    ]);
    const commission = money(summary.rows[0]?.commission_due ?? 0);
    const compensation = money(summary.rows[0]?.bonus_compensation_due ?? 0);
    const paid = money(verifiedPaid.rows[0]?.total ?? 0);
    const balance = money(commission-compensation-paid);
    const transactions = (await this.db.query(`SELECT t.id,t.created_at,t.confirmed_at,t.status,t.amount,t.commission,t.commission_rate,t.spent,
      u.first_name AS customer_name FROM purchase_transactions t JOIN users u ON u.id=t.user_id
      WHERE t.place_id=$1 ORDER BY t.created_at DESC LIMIT 500`,[placeId])).rows;
    return {place_id:place.id,place_name:place.name,...summary.rows[0],confirmed_transactions:Number(summary.rows[0]?.transactions||0),net_due:money(commission-compensation),
      paid_commission:paid,balance_due:balance,transactions,payments,
      notice:'Сплачено лише за підтвердженими фінансовим оператором заявками; подання заявки не є оплатою.'};
  }

  async submitSettlementPayment(user: AuthUser, body: Record<string,unknown>) {
    const place = await this.placeWithRole(user,txt(body.place_id,90),['owner','manager']);
    const amountValue = amount(body.amount);
    const reference=txt(body.reference,120);
    if(reference.length<5) throw new BadRequestException('Вкажіть номер або призначення реального платежу (від 5 символів)');
    const filename=txt(body.receipt_filename,150);
    const mime=txt(body.receipt_mime,60);
    const raw=txt(body.receipt_base64,3_000_000);
    if(!raw || !['image/jpeg','image/png','application/pdf'].includes(mime) || !filename)
      throw new BadRequestException('Додайте квитанцію JPG, PNG або PDF');
    if(!/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) throw new BadRequestException('Пошкоджений файл квитанції');
    const receipt=Buffer.from(raw,'base64');
    if(receipt.length>2*1024*1024 || receipt.length<100) throw new BadRequestException('Розмір квитанції має бути від 100 байт до 2 МБ');
    if((mime==='application/pdf' && receipt.subarray(0,4).toString()!=='%PDF') ||
      (mime==='image/png' && receipt.subarray(0,4).toString('hex')!=='89504e47') ||
      (mime==='image/jpeg' && receipt.subarray(0,3).toString('hex')!=='ffd8ff'))
      throw new BadRequestException('Вміст файлу не відповідає формату');
    const current=await this.settlement(user,place.id);
    if(amountValue>Math.max(0,current.balance_due)+0.001) throw new BadRequestException('Сума перевищує поточну заборгованість');
    if(current.payments.some((p:Record<string,unknown>)=>p.status==='pending')) throw new ConflictException('Попередня заявка ще на перевірці');
    const id=makeId('payment');
    let added;
    try { added=await this.db.query(`INSERT INTO partner_settlement_payment_claims
      (id,place_id,region_id,created_by_user_id,amount,reference,receipt_filename,receipt_mime,receipt_bytes,receipt_sha256)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id,place_id,amount,status,reference,receipt_filename,created_at`,
      [id,place.id,place.region_id,user.id,amountValue,reference,filename,mime,receipt,createHash('sha256').update(receipt).digest('hex')]);
    } catch (error) {
      if ((error as {code?:string})?.code==='23505') throw new ConflictException('Цей платіж уже подано або попередня заявка ще перевіряється');
      throw error;
    }
    await this.audit(user.id,place.region_id,'partner_payment',id,'submitted',{amount:amountValue,reference});
    return added.rows[0];
  }

  async adminPaymentClaims() {
    return (await this.db.query(`SELECT c.id,c.place_id,p.name AS place_name,c.amount,c.status,c.reference,c.receipt_filename,
      c.receipt_mime,c.created_at,c.reviewed_at,c.review_comment
      FROM partner_settlement_payment_claims c JOIN places p ON p.id=c.place_id
      ORDER BY CASE WHEN c.status='pending' THEN 0 ELSE 1 END,c.created_at DESC LIMIT 300`)).rows;
  }

  async adminPaymentReceipt(id:string) {
    const result=await this.db.query('SELECT receipt_filename,receipt_mime,receipt_bytes FROM partner_settlement_payment_claims WHERE id=$1',[id]);
    if(!result.rows[0]) throw new NotFoundException('Квитанцію не знайдено');
    const r=result.rows[0];
    return {filename:r.receipt_filename,mime:r.receipt_mime,base64:(r.receipt_bytes as Buffer).toString('base64')};
  }

  async moderateSettlementPayment(id:string,status:string,comment:string) {
    if(!['approved','rejected'].includes(status)) throw new BadRequestException('Некоректний статус');
    return this.db.transaction(async(client)=>{
      const claim=(await client.query('SELECT * FROM partner_settlement_payment_claims WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(!claim) throw new NotFoundException('Заявку не знайдено');
      if(claim.status!=='pending') throw new ConflictException('Заявка вже оброблена');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[claim.place_id]);
      if(status==='approved') {
        const due=(await client.query(`SELECT
          COALESCE(SUM(t.commission-t.spent) FILTER(WHERE t.status='confirmed'),0) AS earned
          FROM purchase_transactions t WHERE t.place_id=$1`,[claim.place_id])).rows[0];
        const other=(await client.query(`SELECT COALESCE(SUM(amount),0) AS paid FROM partner_settlement_payment_claims
          WHERE place_id=$1 AND status='approved'`,[claim.place_id])).rows[0];
        if(money(claim.amount)>money(money(due?.earned)-money(other?.paid))+0.001)
          throw new ConflictException('Заявлена сума перевищує фактичний несплачений борг');
      }
      const updated=(await client.query(`UPDATE partner_settlement_payment_claims SET status=$2,review_comment=$3,reviewed_at=now()
        WHERE id=$1 RETURNING id,place_id,status,amount,reference,reviewed_at`,[id,status,txt(comment,500)])).rows[0];
      await client.query(`INSERT INTO audit_logs(id,actor_type,region_id,entity_type,entity_id,action,details)
        VALUES($1,'admin',$2,'partner_payment',$3,$4,$5::jsonb)`,[makeId('audit'),claim.region_id,id,status,json({amount:claim.amount,reference:claim.reference,comment:txt(comment,500)})]);
      return updated;
    });
  }

  async resources(placeId: string) {
    const result = await this.db.query(`SELECT r.* FROM booking_resources r JOIN places p ON p.id=r.place_id
      WHERE p.id=$1 AND p.status='approved' AND r.active=true ORDER BY r.name`,[placeId]);
    return result.rows;
  }

  async partnerResources(user: AuthUser,placeId: string) {
    await this.placeWithRole(user,placeId);
    return (await this.db.query('SELECT * FROM booking_resources WHERE place_id=$1 ORDER BY created_at',[placeId])).rows;
  }

  async saveResource(user: AuthUser, body: Record<string, unknown>) {
    const place = await this.placeWithRole(user,txt(body.place_id,90),['owner','manager']);
    const resourceId = txt(body.id,90) || makeId('resource');
    const name = txt(body.name,160);
    if(!name) throw new BadRequestException('Укажіть ресурс');
    const duration = Number(body.duration_minutes ?? 60);
    const capacity = Number(body.capacity ?? 1);
    if(!Number.isInteger(duration)||duration<15||duration>1440||!Number.isInteger(capacity)||capacity<1||capacity>100) throw new BadRequestException('Некоректна тривалість/місткість');
    const result = await this.db.query(`INSERT INTO booking_resources(id,place_id,name,capacity,duration_minutes,buffer_minutes,price,working_hours,active)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)
      ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,capacity=EXCLUDED.capacity,duration_minutes=EXCLUDED.duration_minutes,
      buffer_minutes=EXCLUDED.buffer_minutes,price=EXCLUDED.price,working_hours=EXCLUDED.working_hours,active=EXCLUDED.active
      WHERE booking_resources.place_id=EXCLUDED.place_id RETURNING *`,
      [resourceId,place.id,name,capacity,duration,Math.max(0,Number(body.buffer_minutes ?? 0)),amount(body.price ?? 0,true),json(body.working_hours),body.active !== false]);
    if(!result.rows[0]) throw new ForbiddenException('Чужий ресурс');
    await this.audit(user.id,place.region_id,'resource',resourceId,'saved');
    return result.rows[0];
  }

  async availability(placeId: string,date: string) {
    if(!/^\d{4}-\d\d-\d\d$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) throw new BadRequestException('Укажіть дату YYYY-MM-DD');
    const resources = await this.resources(placeId);
    const bookings = await this.db.query(`SELECT id,resource_id,starts_at,ends_at FROM bookings WHERE place_id=$1
      AND starts_at < ($2::date+interval '1 day') AND ends_at>$2::date AND status=ANY($3::text[])`,[placeId,date,activeBookingStatuses]);
    return { date, resources, occupied:bookings.rows, timezone:'Europe/Kyiv', note:'Доступно зараз — лише якщо слот не зайнятий; для графіка перевіряйте години партнера' };
  }

  async newBooking(user: AuthUser,body: Record<string,unknown>,manual=false) {
    const resourceId=txt(body.resource_id,90);
    const item=await this.db.query(`SELECT r.*,p.region_id,p.status AS place_status FROM booking_resources r JOIN places p ON p.id=r.place_id WHERE r.id=$1`,[resourceId]);
    const resource=item.rows[0];
    if(!resource || !resource.active) throw new NotFoundException('Ресурс не знайдено');
    if(!manual && resource.place_status !== 'approved') throw new ForbiddenException('Заклад неактивний');
    if(manual) await this.placeWithRole(user,resource.place_id,['owner','manager']);
    const start=new Date(txt(body.starts_at,50));
    if(Number.isNaN(start.getTime()) || start.getTime() < Date.now()-60_000) throw new BadRequestException('Оберіть майбутній час');
    const end=new Date(start.getTime() + Number(resource.duration_minutes)*60_000);
    const people=Number(body.party_size ?? 1);
    if(!Number.isInteger(people)||people<1||people>Number(resource.capacity)) throw new BadRequestException('Кількість гостей перевищує місткість');
    const phone=txt(body.phone,40);
    if(!manual && !/^\+?\d[\d\s()\-]{7,19}$/.test(phone)) throw new BadRequestException('Укажіть контактний телефон');
    const id=makeId('booking');
    const result=await this.db.transaction(async(client)=>{
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[resourceId]);
      const busy=await client.query(`SELECT id FROM bookings WHERE resource_id=$1 AND status=ANY($4::text[])
        AND starts_at < ($3::timestamptz+($5::integer * interval '1 minute'))
        AND ends_at+($5::integer * interval '1 minute')>$2::timestamptz LIMIT 1`,
        [resourceId,start.toISOString(),end.toISOString(),activeBookingStatuses,resource.buffer_minutes]);
      if(busy.rows.length) throw new ConflictException('Час уже зайнятий. Оберіть інший слот');
      const created=await client.query(`INSERT INTO bookings(id,resource_id,place_id,region_id,user_id,created_by_user_id,
        starts_at,ends_at,party_size,price,client_name,phone,comment,status,source)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
        [id,resourceId,resource.place_id,resource.region_id,manual?null:user.id,user.id,start.toISOString(),end.toISOString(),people,resource.price,
        txt(body.client_name,120),phone || null,txt(body.comment,1000),manual?'confirmed':'pending_partner',manual?'partner_manual':'tourist']);
      return created.rows[0];
    });
    await this.audit(user.id,resource.region_id,'booking',id,manual?'manual_created':'requested');
    return result;
  }

  async bookings(user: AuthUser,placeId?:string) {
    if(placeId) await this.placeWithRole(user,placeId);
    const response=await this.db.query(`SELECT b.*,p.name AS place_name,r.name AS resource_name FROM bookings b
      JOIN places p ON p.id=b.place_id JOIN booking_resources r ON r.id=b.resource_id
      WHERE ${placeId ? 'b.place_id=$1':'b.user_id=$1'} ORDER BY b.starts_at DESC LIMIT 150`,[placeId || user.id]);
    return response.rows;
  }

  async bookingStatus(user: AuthUser,id:string,status:string) {
    if(!allowedBookingStatuses.includes(status)) throw new BadRequestException('Недопустимий статус');
    const result=await this.db.query('SELECT * FROM bookings WHERE id=$1',[id]);
    const booking=result.rows[0];
    if(!booking) throw new NotFoundException('Бронювання не знайдено');
    const byCustomer=booking.user_id===user.id;
    if(byCustomer) {
      if(status!=='cancelled_by_user'||!['new','pending_partner','confirmed'].includes(booking.status)) throw new ForbiddenException('Клієнт може лише скасувати активне бронювання');
    } else await this.placeWithRole(user,booking.place_id,['owner','manager']);
    if(['cancelled_by_user','cancelled_by_partner','completed','refunded'].includes(booking.status)) throw new ConflictException('Бронювання вже завершено');
    if(status==='completed' && booking.status!=='confirmed') throw new ConflictException('Спершу підтвердіть бронювання');
    const updated=await this.db.query('UPDATE bookings SET status=$2,updated_at=now() WHERE id=$1 RETURNING *',[id,status]);
    await this.audit(user.id,booking.region_id,'booking',id,'status_changed',{from:booking.status,to:status});
    return updated.rows[0];
  }

  async reviewEligibility(user:AuthUser,placeId?:string) {
    const bookings=await this.db.query(`SELECT b.id,b.place_id,p.name AS place_name,b.starts_at AS visited_at,'verified_booking' AS verification
      FROM bookings b JOIN places p ON p.id=b.place_id
      LEFT JOIN review_entries v ON v.booking_id=b.id
      WHERE b.user_id=$1 AND b.status='completed' AND v.id IS NULL ${placeId?'AND b.place_id=$2':''}
      ORDER BY b.starts_at DESC LIMIT 30`,placeId?[user.id,placeId]:[user.id]);
    const transactions=await this.db.query(`SELECT t.id,t.place_id,p.name AS place_name,t.confirmed_at AS visited_at,'verified_purchase' AS verification
      FROM purchase_transactions t JOIN places p ON p.id=t.place_id
      LEFT JOIN review_entries v ON v.transaction_id=t.id
      WHERE t.user_id=$1 AND t.status='confirmed' AND v.id IS NULL ${placeId?'AND t.place_id=$2':''}
      ORDER BY t.confirmed_at DESC LIMIT 30`,placeId?[user.id,placeId]:[user.id]);
    return { bookings:bookings.rows,transactions:transactions.rows };
  }

  async review(user:AuthUser,body:Record<string,unknown>) {
    const bookingId=txt(body.booking_id,90),transactionId=txt(body.transaction_id,90);
    if(Boolean(bookingId)===Boolean(transactionId)) throw new BadRequestException('Потрібна одна підтверджена подія');
    const rating=Number(body.rating);
    if(!Number.isInteger(rating)||rating<1||rating>5) throw new BadRequestException('Оцінка 1–5');
    const evidence=bookingId
      ? await this.db.query(`SELECT place_id FROM bookings WHERE id=$1 AND user_id=$2 AND status='completed'`,[bookingId,user.id])
      : await this.db.query(`SELECT place_id FROM purchase_transactions WHERE id=$1 AND user_id=$2 AND status='confirmed'`,[transactionId,user.id]);
    if(!evidence.rows[0]) throw new ForbiddenException('Відгук можливий тільки після підтвердженої взаємодії');
    const id=makeId('review');
    try {
      const added=await this.db.query(`INSERT INTO review_entries(id,place_id,user_id,booking_id,transaction_id,rating,text,verification)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[id,evidence.rows[0].place_id,user.id,bookingId||null,transactionId||null,rating,txt(body.text,3000),bookingId?'verified_booking':'verified_purchase']);
      await this.audit(user.id,null,'review',id,'submitted');
      return added.rows[0];
    }catch(error){ if(String(error).includes('duplicate key')) throw new ConflictException('Відгук на цю подію вже залишено'); throw error; }
  }

  async reviews(placeId:string) {
    return (await this.db.query(`SELECT v.id,v.place_id,v.rating,v.text,v.verification,v.partner_reply,v.created_at,
      u.first_name AS author FROM review_entries v JOIN users u ON u.id=v.user_id
      JOIN places p ON p.id=v.place_id WHERE v.place_id=$1 AND v.status='approved' AND p.status='approved'
      ORDER BY v.created_at DESC LIMIT 100`,[placeId])).rows;
  }

  async moderatedReviews(regionId?:string) {
    return (await this.db.query(`SELECT v.*,p.name AS place_name,p.region_id FROM review_entries v JOIN places p ON p.id=v.place_id
      WHERE ($1::text IS NULL OR p.region_id=$1) ORDER BY CASE WHEN v.status='pending' THEN 0 ELSE 1 END,v.created_at DESC LIMIT 500`,[regionId||null])).rows;
  }

  async moderateReview(id:string,status:string,comment:string) {
    if(!['approved','rejected','pending'].includes(status)) throw new BadRequestException('Некоректний статус');
    return this.db.transaction(async(client)=>{
      const prev=await client.query('SELECT place_id,status FROM review_entries WHERE id=$1 FOR UPDATE',[id]);
      if(!prev.rows[0]) throw new NotFoundException('Відгук не знайдено');
      const updated=await client.query('UPDATE review_entries SET status=$2,moderation_comment=$3,updated_at=now() WHERE id=$1 RETURNING *',[id,status,comment]);
      await client.query(`UPDATE places SET rating=COALESCE((SELECT AVG(rating) FROM review_entries WHERE place_id=$1 AND status='approved'),0),
        review_count=(SELECT COUNT(*) FROM review_entries WHERE place_id=$1 AND status='approved'),updated_at=now() WHERE id=$1`,[prev.rows[0].place_id]);
      await client.query(`INSERT INTO audit_logs(id,actor_type,entity_type,entity_id,action,details)
        VALUES($1,'admin','review',$2,'moderated',$3::jsonb)`,[makeId('audit'),id,json({status,comment})]);
      return updated.rows[0];
    });
  }

  async respondReview(user:AuthUser,id:string,text:string) {
    const result=await this.db.query('SELECT place_id FROM review_entries WHERE id=$1',[id]);
    if(!result.rows[0]) throw new NotFoundException('Відгук не знайдено');
    const place=await this.placeWithRole(user,result.rows[0].place_id,['owner','manager']);
    const response=await this.db.query('UPDATE review_entries SET partner_reply=$2,updated_at=now() WHERE id=$1 RETURNING *',[id,txt(text,1500)]);
    await this.audit(user.id,place.region_id,'review',id,'partner_replied');
    return response.rows[0];
  }

  async hotelRequest(user:AuthUser,body:Record<string,unknown>) {
    const placeId=txt(body.place_id,90);
    const result=await this.db.query("SELECT id,region_id,category_slug,status FROM places WHERE id=$1",[placeId]);
    if(!result.rows[0]||result.rows[0].status!=='approved'||result.rows[0].category_slug!=='hotel') throw new BadRequestException('Недоступний готель');
    const kind=txt(body.request_type,70);
    if(!['cleaning','towels','breakfast','checkout','pool','sauna','transfer','other'].includes(kind)) throw new BadRequestException('Невідома послуга');
    const id=makeId('request');
    const request=await this.db.query(`INSERT INTO hotel_requests(id,place_id,user_id,request_type,room,note)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[id,placeId,user.id,kind,txt(body.room,30)||null,txt(body.note,1000)]);
    await this.audit(user.id,result.rows[0].region_id,'hotel_request',id,'created');
    return request.rows[0];
  }

  async hotelRequests(user:AuthUser,placeId:string) {
    await this.placeWithRole(user,placeId);
    return (await this.db.query(`SELECT r.*,u.first_name AS visitor FROM hotel_requests r
      JOIN users u ON u.id=r.user_id WHERE r.place_id=$1 ORDER BY r.created_at DESC LIMIT 100`,[placeId])).rows;
  }

  async hotelRequestStatus(user:AuthUser,id:string,status:string) {
    if(!['new','accepted','in_progress','completed','rejected'].includes(status)) throw new BadRequestException('Некоректний статус');
    const row=await this.db.query('SELECT place_id FROM hotel_requests WHERE id=$1',[id]);
    if(!row.rows[0]) throw new NotFoundException('Запит не знайдено');
    const place=await this.placeWithRole(user,row.rows[0].place_id,['owner','manager']);
    const changed=await this.db.query('UPDATE hotel_requests SET status=$2,updated_at=now() WHERE id=$1 RETURNING *',[id,status]);
    await this.audit(user.id,place.region_id,'hotel_request',id,'status_changed',{status});
    return changed.rows[0];
  }

  async plans(user:AuthUser) {
    return (await this.db.query('SELECT * FROM trip_plans WHERE user_id=$1 ORDER BY updated_at DESC',[user.id])).rows;
  }

  async savePlan(user:AuthUser,body:Record<string,unknown>) {
    const id=txt(body.id,90)||makeId('plan');
    const title=txt(body.title,150)||'Мій план';
    if(!Array.isArray(body.days)||body.days.length>5) throw new BadRequestException('План має містити від 1 до 5 днів');
    const region=txt(body.region_id,90)||null;
    const query=await this.db.query(`INSERT INTO trip_plans(id,user_id,region_id,title,criteria,days) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb)
      ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,criteria=EXCLUDED.criteria,days=EXCLUDED.days,updated_at=now()
      WHERE trip_plans.user_id=EXCLUDED.user_id RETURNING *`,[id,user.id,region,title,json(body.criteria),json(body.days)]);
    if(!query.rows[0]) throw new ForbiddenException('Чужий план');
    return query.rows[0];
  }

  async ambassador(user:AuthUser) {
    const result=await this.db.query(`SELECT a.id,a.code,a.region_id,a.reward_amount,a.active,
      COUNT(at.id)::integer AS total,
      COUNT(at.id) FILTER(WHERE at.status='approved')::integer AS valid,
      COUNT(at.id) FILTER(WHERE at.status='pending')::integer AS pending
      FROM ambassadors a LEFT JOIN ambassador_attributions at ON at.ambassador_id=a.id WHERE a.user_id=$1
      GROUP BY a.id`,[user.id]);
    return result.rows[0] || null;
  }

  async registerAmbassador(user:AuthUser,body:Record<string,unknown>) {
    const code=txt(body.code || `amb_${randomBytes(5).toString('hex')}`,48).toLowerCase();
    if(!/^[a-z0-9_-]{5,48}$/.test(code)) throw new BadRequestException('Код має бути латинкою, 5–48 символів');
    const result=await this.db.query(`INSERT INTO ambassadors(id,user_id,code,region_id) VALUES($1,$2,$3,$4)
      ON CONFLICT(user_id) DO UPDATE SET user_id=EXCLUDED.user_id RETURNING *`,[makeId('amb'),user.id,code,txt(body.region_id,80)||null]);
    return result.rows[0];
  }

  async attribute(user:AuthUser,startParam:string) {
    const code=txt(startParam.replace(/^amb_/,''),48);
    const ref=await this.db.query('SELECT * FROM ambassadors WHERE code=$1 OR code=$2',[startParam,`amb_${code}`]);
    const ambassador=ref.rows[0];
    if(!ambassador || !ambassador.active || ambassador.user_id===user.id) return { attributed:false,reason:'invalid_or_self' };
    const id=makeId('attr');
    const result=await this.db.query(`INSERT INTO ambassador_attributions(id,user_id,ambassador_id,campaign_id,source,eligible_after)
      VALUES($1,$2,$3,$4,$5,now()+interval '7 days')
      ON CONFLICT(user_id) DO NOTHING RETURNING *`,[id,user.id,ambassador.id,null,'telegram_startapp']);
    return { attributed: Boolean(result.rows[0]), first_touch:result.rows[0]||null };
  }

  async exportPersonalData(user:AuthUser) {
    const get = async (sql:string) => (await this.db.query(sql,[user.id])).rows;
    const [profile,favorites,bookings,transactions,ledger,reviews,plans,attribution] = await Promise.all([
      get('SELECT id,telegram_id::text,telegram_username,first_name,last_name,selected_language,phone,consent,created_at FROM users WHERE id=$1'),
      get('SELECT place_id,created_at FROM favorites WHERE user_id=$1'),
      get('SELECT id,place_id,starts_at,ends_at,party_size,status,created_at FROM bookings WHERE user_id=$1'),
      get('SELECT id,place_id,amount,spent,earned,status,created_at FROM purchase_transactions WHERE user_id=$1'),
      get('SELECT id,amount,entry_type,status,expires_at,created_at FROM bonus_ledger WHERE user_id=$1'),
      get('SELECT id,place_id,rating,text,status,created_at FROM review_entries WHERE user_id=$1'),
      get('SELECT id,title,criteria,days,created_at FROM trip_plans WHERE user_id=$1'),
      get('SELECT ambassador_id,source,status,created_at FROM ambassador_attributions WHERE user_id=$1'),
    ]);
    await this.audit(user.id,null,'privacy',user.id,'data_exported');
    return {exported_at:new Date().toISOString(),profile:profile[0]||null,favorites,bookings,transactions,ledger,reviews,plans,attribution};
  }

  async deleteAccount(user:AuthUser) {
    // Keep pseudonymous financial records for legally required accounting retention.
    // Remove direct identifiers and sessions; a future Telegram login creates a fresh account.
    await this.db.transaction(async(client)=>{
      await client.query('DELETE FROM user_sessions WHERE user_id=$1',[user.id]);
      await client.query('DELETE FROM favorites WHERE user_id=$1',[user.id]);
      await client.query('DELETE FROM external_favorites WHERE user_id=$1',[user.id]);
      await client.query('DELETE FROM trip_plans WHERE user_id=$1',[user.id]);
      await client.query('DELETE FROM customer_qr_tokens WHERE user_id=$1 AND NOT EXISTS (SELECT 1 FROM purchase_transactions t WHERE t.qr_token_hash=customer_qr_tokens.token_hash)',[user.id]);
      await client.query(`UPDATE users SET telegram_id=NULL,telegram_username=NULL,first_name=NULL,last_name=NULL,
        photo_url=NULL,phone=NULL,selected_language='uk',consent='{}'::jsonb,updated_at=now() WHERE id=$1`,[user.id]);
      await client.query("UPDATE bookings SET phone=NULL,client_name='',comment='' WHERE user_id=$1",[user.id]);
      await client.query("UPDATE hotel_requests SET note='',room=NULL WHERE user_id=$1",[user.id]);
      await client.query("UPDATE review_entries SET text='' WHERE user_id=$1",[user.id]);
      await client.query(`INSERT INTO audit_logs(id,actor_type,entity_type,entity_id,action,details)
        VALUES($1,'privacy','user',$2,'anonymized','{}'::jsonb)`,[makeId('audit'),user.id]);
    });
    return {ok:true,message:'Профіль знеособлено, сесії відкликано; бухгалтерські записи збережено відповідно до строків обліку'};
  }

  async adminClients() {
    return (await this.db.query(`SELECT u.id,u.telegram_id::text,u.telegram_username,u.first_name,u.last_name,u.phone,u.created_at,u.last_active_at,
      COALESCE((SELECT SUM(l.amount) FROM bonus_ledger l WHERE l.user_id=u.id AND l.status='available'),0) AS balance,
      COALESCE((SELECT SUM(l.amount) FROM bonus_ledger l WHERE l.user_id=u.id AND l.entry_type='earn' AND l.status='available'),0) AS earned,
      COALESCE((SELECT -SUM(l.amount) FROM bonus_ledger l WHERE l.user_id=u.id AND l.entry_type='spent' AND l.status='available'),0) AS spent,
      (SELECT COUNT(*)::integer FROM purchase_transactions t WHERE t.user_id=u.id AND t.status='confirmed') AS purchases,
      (SELECT COUNT(*)::integer FROM bookings b WHERE b.user_id=u.id) AS bookings,
      (SELECT COUNT(*)::integer FROM review_entries r WHERE r.user_id=u.id) AS reviews,
      (SELECT COUNT(*)::integer FROM activity_events e WHERE e.user_id=u.id) AS events
      FROM users u WHERE u.telegram_id IS NOT NULL ORDER BY u.last_active_at DESC LIMIT 1000`)).rows;
  }

  async adminClient(id: string) {
    const profile = (await this.db.query(`SELECT id,telegram_id::text,telegram_username,first_name,last_name,phone,selected_language,created_at,last_active_at
      FROM users WHERE id=$1 AND telegram_id IS NOT NULL`,[id])).rows[0];
    if(!profile) throw new NotFoundException('Клієнта не знайдено');
    const [ledger,activity,bookings,purchases,reviews,balanceRows] = await Promise.all([
      this.db.query(`SELECT l.id,l.amount,l.entry_type,l.status,l.expires_at,l.created_at,p.name place_name FROM bonus_ledger l
        LEFT JOIN purchase_transactions t ON t.id=l.transaction_id LEFT JOIN places p ON p.id=t.place_id
        WHERE l.user_id=$1 ORDER BY l.created_at DESC LIMIT 100`,[id]),
      this.db.query(`SELECT e.id,e.event_type,e.created_at,p.name place_name FROM activity_events e
        LEFT JOIN places p ON p.id=e.place_id WHERE e.user_id=$1 ORDER BY e.created_at DESC LIMIT 100`,[id]),
      this.db.query(`SELECT id,starts_at,ends_at,status,price FROM bookings WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,[id]),
      this.db.query(`SELECT id,created_at,amount,spent,earned,status FROM purchase_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,[id]),
      this.db.query(`SELECT id,rating,status,created_at FROM review_entries WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,[id]),
      this.db.query(`SELECT COALESCE(SUM(amount),0) AS balance FROM bonus_ledger WHERE user_id=$1 AND status='available'`,[id]),
    ]);
    return { ...profile, ledger:ledger.rows, activity:activity.rows, bookings:bookings.rows, purchases:purchases.rows,reviews:reviews.rows,
      balance:Number(balanceRows.rows[0]?.balance||0) };
  }

  async adminPartnerSummary(placeId:string) {
    const [purchases,bookings,events,totals] = await Promise.all([
      this.db.query(`SELECT id,created_at,status,amount,commission,spent,earned FROM purchase_transactions
        WHERE place_id=$1 ORDER BY created_at DESC LIMIT 100`,[placeId]),
      this.db.query(`SELECT id,created_at,starts_at,status,party_size,price FROM bookings
        WHERE place_id=$1 ORDER BY created_at DESC LIMIT 100`,[placeId]),
      this.db.query(`SELECT id,created_at,event_type FROM activity_events
        WHERE place_id=$1 ORDER BY created_at DESC LIMIT 100`,[placeId]),
      this.db.query(`SELECT
        (SELECT COUNT(*)::integer FROM bookings WHERE place_id=$1) AS bookings_count,
        (SELECT COUNT(*)::integer FROM purchase_transactions WHERE place_id=$1 AND status='confirmed') AS confirmed_purchases,
        (SELECT COALESCE(SUM(amount),0) FROM purchase_transactions WHERE place_id=$1 AND status='confirmed') AS turnover,
        (SELECT COALESCE(SUM(commission),0) FROM purchase_transactions WHERE place_id=$1 AND status='confirmed') AS commission_due,
        (SELECT COALESCE(SUM(spent),0) FROM purchase_transactions WHERE place_id=$1 AND status='confirmed') AS compensation_due`,[placeId]),
    ]);
    const t=totals.rows[0]||{};
    return {purchases:purchases.rows,bookings:bookings.rows,events:events.rows,
      confirmed_purchases:Number(t.confirmed_purchases||0),bookings_count:Number(t.bookings_count||0),
      turnover:Number(t.turnover||0),commission_due:Number(t.commission_due||0),compensation_due:Number(t.compensation_due||0),
      net_due:Number(t.commission_due||0)-Number(t.compensation_due||0)};
  }

  async adminSettlements() {
    return (await this.db.query(`SELECT p.id AS place_id,p.name,p.region_id,r.name AS region_name,c.name AS category_name,
      COUNT(t.id) FILTER(WHERE t.status='confirmed')::integer AS transactions,
      COALESCE(SUM(t.amount) FILTER(WHERE t.status='confirmed'),0) AS turnover,
      COALESCE(SUM(t.commission) FILTER(WHERE t.status='confirmed'),0) AS commission_due,
      COALESCE(SUM(t.spent) FILTER(WHERE t.status='confirmed'),0) AS compensation_due,
      COALESCE(SUM(t.commission-t.spent) FILTER(WHERE t.status='confirmed'),0) AS net_due,
      COALESCE((SELECT SUM(c.amount) FROM partner_settlement_payment_claims c WHERE c.place_id=p.id AND c.status='approved'),0) AS paid_commission,
      COALESCE(SUM(t.commission-t.spent) FILTER(WHERE t.status='confirmed'),0)-
        COALESCE((SELECT SUM(c.amount) FROM partner_settlement_payment_claims c WHERE c.place_id=p.id AND c.status='approved'),0) AS balance_due
      FROM places p JOIN regions r ON r.id=p.region_id JOIN categories c ON c.slug=p.category_slug
      LEFT JOIN purchase_transactions t ON t.place_id=p.id
      WHERE p.organization_id IS NOT NULL GROUP BY p.id,p.name,p.region_id,r.name,c.name ORDER BY p.name`)).rows;
  }

  async adminAnalytics(regionId?:string) {
    const region=regionId||null;
    const [events,places,bookings,transactions,clients,bonuses,series,categories,locations,topPartners] = await Promise.all([
      this.db.query(`SELECT event_type,COUNT(*)::integer AS count FROM activity_events WHERE ($1::text IS NULL OR region_id=$1) GROUP BY event_type`,[region]),
      this.db.query(`SELECT status,COUNT(*)::integer AS count FROM places WHERE ($1::text IS NULL OR region_id=$1) AND organization_id IS NOT NULL GROUP BY status`,[region]),
      this.db.query(`SELECT status,COUNT(*)::integer AS count FROM bookings WHERE ($1::text IS NULL OR region_id=$1) GROUP BY status`,[region]),
      this.db.query(`SELECT status,COUNT(*)::integer AS count, COALESCE(SUM(amount),0) AS turnover FROM purchase_transactions WHERE ($1::text IS NULL OR region_id=$1) GROUP BY status`,[region]),
      this.db.query(`SELECT COUNT(*)::integer AS total,COUNT(*) FILTER(WHERE u.created_at>=now()-interval '30 days')::integer AS new_clients,
        COUNT(*) FILTER(WHERE u.last_active_at>=now()-interval '30 days')::integer AS active_clients FROM users u WHERE u.telegram_id IS NOT NULL AND ($1::text IS NULL OR EXISTS(SELECT 1 FROM activity_events e WHERE e.user_id=u.id AND e.region_id=$1))`,[region]),
      this.db.query(`SELECT COALESCE(SUM(l.amount) FILTER(WHERE l.entry_type='earn'),0) AS earned,
        COALESCE(-SUM(l.amount) FILTER(WHERE l.entry_type='spent'),0) AS spent FROM bonus_ledger l
        WHERE ($1::text IS NULL OR EXISTS(SELECT 1 FROM purchase_transactions t WHERE t.id=l.transaction_id AND t.region_id=$1))`,[region]),
      this.db.query(`SELECT TO_CHAR(date_trunc('day',created_at),'YYYY-MM-DD') AS day,COALESCE(SUM(amount),0) AS amount
        FROM purchase_transactions WHERE status='confirmed' AND created_at>=now()-interval '30 days'
        AND ($1::text IS NULL OR region_id=$1) GROUP BY 1 ORDER BY 1`,[region]),
      this.db.query(`SELECT c.name,COALESCE(SUM(t.amount),0) AS amount FROM purchase_transactions t
        JOIN places p ON p.id=t.place_id JOIN categories c ON c.slug=p.category_slug WHERE t.status='confirmed'
        AND ($1::text IS NULL OR t.region_id=$1) GROUP BY c.name ORDER BY amount DESC`,[region]),
      this.db.query(`SELECT r.name,COUNT(*)::integer AS total FROM places p JOIN regions r ON r.id=p.region_id
        WHERE p.organization_id IS NOT NULL AND ($1::text IS NULL OR p.region_id=$1) GROUP BY r.name ORDER BY total DESC`,[region]),
      this.db.query(`SELECT p.name,COALESCE(SUM(t.amount),0) AS turnover FROM purchase_transactions t
        JOIN places p ON p.id=t.place_id WHERE t.status='confirmed' AND ($1::text IS NULL OR t.region_id=$1)
        GROUP BY p.id,p.name ORDER BY turnover DESC LIMIT 10`,[region]),
    ]);
    return { region_id:region,events:events.rows,places:places.rows,bookings:bookings.rows,transactions:transactions.rows,
      clients:clients.rows[0],bonuses:bonuses.rows[0],series:series.rows,categories:categories.rows,locations:locations.rows,top_partners:topPartners.rows };
  }

  async auditLog(regionId?:string) {
    return (await this.db.query(`SELECT * FROM audit_logs WHERE ($1::text IS NULL OR region_id=$1) ORDER BY created_at DESC LIMIT 250`,[regionId||null])).rows;
  }
}
