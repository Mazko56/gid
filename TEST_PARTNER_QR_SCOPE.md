# Gid Tourist — partner QR scanning acceptance checks (14 Nov 2026)

Scope: partner checkout, customer QR context and partner QR statistics. This patch does not reset real transactions or bonuses.

## Before deployment

- Frontend: `npm ci && npx tsc --noEmit --pretty false && npm run build`.
- Backend: `cd backend && npm ci && npm run build`.
- Deploy **Backend and Frontend**, not only Frontend.
- If `DB_AUTO_MIGRATE=false`, execute `backend/migrations/2026-11-14-scope-customer-qr-and-scan-stats.sql` in the target database *before* deploying Backend. This SQL only adds two nullable columns and indexes.
- If `DB_AUTO_MIGRATE` is enabled, the same changes are additive in `SCHEMA_SQL`.

## Read-only PostgreSQL checks

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name='customer_qr_tokens'
  AND column_name IN ('context_region_id','context_place_id')
ORDER BY column_name;

SELECT indexname FROM pg_indexes
WHERE tablename='activity_events' AND indexname IN ('idx_activity_place_type','idx_partner_qr_scans_unique');

SELECT p.id,p.name,p.region_id,
 (SELECT COUNT(*) FROM activity_events e WHERE e.place_id=p.id AND e.event_type='qr_scanned') AS entry_qr_opens,
 (SELECT COUNT(*) FROM activity_events e WHERE e.place_id=p.id AND e.event_type='partner_customer_qr_scanned') AS customer_qr_scans
FROM places p ORDER BY p.name LIMIT 25;
```

## Staging / isolated test accounts only

1. Open a real entry QR for **venue A**, open tourist profile -> "Мій QR". Confirm the QR screen names venue A.
2. On authorized partner A cashier, scan it. The camera disappears and the full-screen form appears. Enter a valid test amount and bonus spend; press **Підтвердити**. The partner sees the pending status (not completed) until the customer confirms. Check the partner's transaction list.
3. Create a *fresh* QR from venue A entry and try scanning at authorized **venue B** (even within the same region). The API must return 403, the form must not open and no transaction must be created.
4. Open a region-only entry QR and try a partner in a different region. The API must return 403. A partner in the same region remains eligible (region context cannot identify an individual establishment).
5. With partner A accepted QR, customer rejects the pending quote. The partner screen should show rejection, not a confirmed payment. With a fresh QR create another quote and have the customer accept; partner screen should automatically update to confirmed.
6. Check "Сканування QR клієнтів" in partner statistics (successful unique resolves) separately from "Відкриття QR закладу" (visitor openings) and "Підтверджені операції". Repeating the same scan resolution for the same token at the same venue must not add a second scan.
7. Press "Відхилити" on the pre-quote form: return to camera without creating a pending transaction. Press "Сканувати наступний" on the result screen: open camera with reset state. Press "Закрити": return to partner dashboard.
8. Test on Telegram Android and iOS at 320–430px widths, with keyboard open. Camera must release after recognition; buttons should be reachable by scrolling. Test camera denied and invalid QR retry.

## Security and product limits

The context is checked **server-side** during scan resolve and quote. A QR context reflects the scanned entry QR, **not** verified physical GPS presence. Entry QR for a particular venue restricts the customer token to that venue; entry QR for a region restricts it to that region. Direct app launches without an entry QR still issue unrestricted customer QR tokens: the operator's real scan plus separate customer confirmation form the intended general-use flow. If requiring a named venue for *every* purchase, a separate venue-selection / check-in protocol is necessary before issuing tokens.

The counters report different events. QR entry opens are based on recorded app events, not independent physical proof of scanning. For confirmed transactions, use the financial ledger as the source of truth.
