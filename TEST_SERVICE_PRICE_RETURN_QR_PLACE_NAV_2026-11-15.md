# Gid Tourist — price type scroll + QR venue navigation (2026-11-15)

## Fixes
- Price type selection in new and edited service preserves the position of the “Тип ціни” field when returning, including when a price field appears/disappears. Draft hydration no longer overwrites the selected type with defaults.
- A large venue with inline base64 service photos no longer causes `QuotaExceededError` while writing its selected-place preview to sessionStorage. Stored preview is deliberately small; full place is retrieved using its ID. In-memory current venue remains intact.
- A fresh QR context sets the selected venue to that QR venue and clears prior venue selections; later intentional navigation from catalog can select any other place.

## Manual tests (Telegram Mini App)
1. Open partner service creation, scroll to “Тип ціни”, choose “Діапазон цін”; check the form returns to the same field and selected value remains. Repeat for editing an existing service.
2. Scan the venue QR for Puri Chveni with several service photos; open **Де поїсти → Пурі Чвені**. It must open the actual venue detail rather than stay on the list or fall back to the default screen.
3. Open **Про заклад → Послуги закладу** from the QR context; ensure it shows Puri Chveni's real services. Open the venue from the food category and repeat.
4. With an existing earlier selected venue in sessionStorage, open Puri Chveni QR in the same WebView and verify the new QR replaces it.
5. Test a venue with a dozen photos; browsing must still work even when sessionStorage quota is exhausted.

## Verification limits
No access to production Telegram/WebView or live PostgreSQL/Railway. TypeScript syntax and static/regression checks are run locally; test the actual deployed routes after pushing. No SQL migration is needed.
