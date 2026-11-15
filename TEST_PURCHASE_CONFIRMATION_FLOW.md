# Gid Tourist — check QR checkout and Telegram confirmation

## Scope
- First customer QR remains valid for a *new scan* only for 45 seconds.
- When the correct cashier scans it in time, the server reserves that QR for the same cashier and place for **5 minutes** for filling in the receipt. This time is **not shown** in the partner interface. Wrong cashier/venue still cannot use it.
- A created `pending_customer` purchase remains available until the customer confirms or declines it. There is no automatic 120-second rejection. On confirmation, bonuses and commissions are written once.
- A Telegram service message with an **Open and confirm** Mini App button is queued when a quote is created. It works even if the customer has closed the Mini App, but **Telegram will only deliver it if the customer already started the bot or granted bot write permission**. Messages are sent proactively when the purchase is created; detecting the exact moment the Mini App closes is not reliable.

## Deployment prerequisites
1. Deploy the **backend** and **frontend** from the same commit. Both services must build successfully.
2. If `DB_AUTO_MIGRATE=false`, apply `backend/migrations/2026-11-14-purchase-qr-lease-persistent-confirmation.sql` once **on staging first**. If auto-migrate is enabled, backend initialization runs the additive SQL from `schema.ts`.
3. In Railway **Backend / Variables**, set `TELEGRAM_BOT_TOKEN` (same bot as authentication) and `FRONTEND_APP_URL` to the **actual frontend HTTPS origin**, e.g. `https://your-frontend.up.railway.app`, without a route. The alternative `ALLOWED_ORIGINS` is only a fallback.
4. In Telegram open a private chat with that bot and send `/start`, or in the Mini App customer QR page tap **Allow purchase notifications** and grant permission. Telegram may refuse delivery to users who did neither.
5. Ensure the **bot** is running and registered with its actual token; the backend uses Telegram Bot API directly for the outgoing service notification.

## Acceptance tests — do not run against real customers/transactions
1. Open a QR from venue A as test customer. Immediately scan the customer dynamic QR from an authorized cashier at venue A. Verify camera disappears and partner sees form.
2. Fill out sum and bonus spend *after more than 45 seconds but before 5 minutes from the scan*. Creating the quote must succeed. There is no visible 5-minute countdown.
3. Scan a code for venue A using venue B cashier. It must be rejected. Another cashier cannot hijack an ongoing scan lease.
4. After 5 minutes of an unresolved scan, quote submission must ask to scan a new QR (do not weaken the original QR single-use requirement).
5. With a valid new quote, leave the customer Mini App closed for 3 minutes. In the client’s Telegram private chat verify a message with amount, venue and **Open and confirm** button, if the customer granted bot permission.
6. Open the link in Telegram. The pending purchase must still be visible. Confirm it. Balance, bonus ledger and commission must change **exactly once**.
7. Confirming the same purchase again must not create duplicate ledger entries. Customer decline must remove a request from pending, without applying bonuses.
8. If Telegram delivery is blocked, the purchase must still be present after returning to `/tourist/purchase-confirmation` inside Mini App.
9. On partner screen, old filler texts above the form / below fields / below purchase results must be absent.

## Non-destructive Railway PostgreSQL checks (read-only)
```sql
SELECT id,place_id,status,expires_at,created_at,confirmed_at
  FROM purchase_transactions ORDER BY created_at DESC LIMIT 10;

SELECT left(token_hash,12) AS qr_hash_prefix,scan_claimed_at,scan_expires_at,
       scan_claimed_by_user_id,scan_claimed_place_id
  FROM customer_qr_tokens WHERE scan_claimed_at IS NOT NULL
  ORDER BY scan_claimed_at DESC LIMIT 10;

SELECT transaction_id,status,attempts,next_attempt_at,sent_at,last_error
  FROM purchase_telegram_outbox ORDER BY created_at DESC LIMIT 10;
```

The outbox's `sent` state means Telegram API accepted the message, not that the human opened it. `unavailable` means no linked Telegram account or Telegram bot refused delivery (for example, user has not started the bot). If no notification is sent, check both the bot permission and Railway **Backend** variables.

## Important safety constraints
- No bypass of identity, venue matching, the 45-second initial QR scan, or idempotency was added.
- There is no promise that Telegram can message an account that never started the bot or declined permissions.
- The pending purchase is a *request*, not completed revenue. Financial ledger entries are committed only after the authenticated customer confirms.
- A closed Mini App cannot be detected reliably; the Telegram message is scheduled when the partner submits the quote instead of waiting for a close event.
