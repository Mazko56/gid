import { translateKnownLabel, type TouristLanguage } from "./tourist-i18n";

const interfaceLabels: Record<string, {en:string;pl:string}> = {
  "Фото не завантажилось": {
    "en": "Photo failed to load",
    "pl": "Nie udało się załadować zdjęcia"
  },
  "Активних пропозицій за цим фільтром немає": {
    "en": "No active offers match this filter",
    "pl": "Brak aktywnych ofert dla tego filtra"
  },
  "Термін дії": {
    "en": "Valid until",
    "pl": "Termin ważności"
  },
  "Статус": {
    "en": "Status",
    "pl": "Status"
  },
  "Перевірено партнером": {
    "en": "Verified by partner",
    "pl": "Zweryfikowano przez partnera"
  },
  "Про пропозицію": {
    "en": "About this offer",
    "pl": "O ofercie"
  },
  "Ексклюзивно": {
    "en": "Exclusive",
    "pl": "Ekskluzywnie"
  },
  "Поруч": {
    "en": "Nearby",
    "pl": "W pobliżu"
  },
  "Перевірено": {
    "en": "Verified",
    "pl": "Zweryfikowano"
  },
  "Партнер Gid Tourist": {
    "en": "Gid Tourist partner",
    "pl": "Partner Gid Tourist"
  },
  "4.9 · 126 відгуків": {
    "en": "4.9 · 126 reviews",
    "pl": "4,9 · 126 opinii"
  },
  "Скористатися пропозицією": {
    "en": "Use this offer",
    "pl": "Skorzystaj z oferty"
  },
  "Побудувати маршрут": {
    "en": "Get directions",
    "pl": "Wyznacz trasę"
  },
  "Скасування бронювання": {
    "en": "Booking cancellation",
    "pl": "Anulowanie rezerwacji"
  },
  "Інші умови": {
    "en": "Other conditions",
    "pl": "Inne warunki"
  },
  "Послуги закладу": {
    "en": "Venue services",
    "pl": "Usługi obiektu"
  },
  "Зателефонувати": {
    "en": "Call",
    "pl": "Zadzwoń"
  },
  "Зателефонувати щодо послуги": {
    "en": "Call about the service",
    "pl": "Zadzwoń w sprawie usługi"
  },
  "Перевірити можливість бронювання": {
    "en": "Check booking availability",
    "pl": "Sprawdź dostępność rezerwacji"
  },
  "Завантажуємо послуги закладу…": {
    "en": "Loading services…",
    "pl": "Ładowanie usług…"
  },
  "На цей момент заклад ще не додав послуг.": {
    "en": "This place has not added any services yet.",
    "pl": "Ten obiekt nie dodał jeszcze usług."
  },
  "Забронювати": {
    "en": "Book",
    "pl": "Zarezerwuj"
  },
  "Тільки послуги, додані партнером": {
    "en": "Only partner-added services",
    "pl": "Tylko usługi dodane przez partnera"
  },
  "Бронювання": {
    "en": "Booking",
    "pl": "Rezerwacja"
  },
  "Оберіть вільний ресурс і час": {
    "en": "Choose an available service and time",
    "pl": "Wybierz dostępną usługę i godzinę"
  },
  "Онлайн-бронювання ще не налаштоване цим партнером. Скористайтеся контактом у картці закладу.": {
    "en": "Online booking is not yet available at this place. Contact the partner directly.",
    "pl": "Rezerwacja online nie jest jeszcze dostępna. Skontaktuj się bezpośrednio z partnerem."
  },
  "Тривалість": {
    "en": "Duration",
    "pl": "Czas trwania"
  },
  "Місткість": {
    "en": "Capacity",
    "pl": "Pojemność"
  },
  "Вартість": {
    "en": "Price",
    "pl": "Cena"
  },
  "Кількість осіб": {
    "en": "Number of guests",
    "pl": "Liczba osób"
  },
  "Телефон для звʼязку": {
    "en": "Contact phone",
    "pl": "Telefon kontaktowy"
  },
  "Коментар (необовʼязково)": {
    "en": "Comment (optional)",
    "pl": "Komentarz (opcjonalnie)"
  },
  "Запит надіслано": {
    "en": "Request sent",
    "pl": "Wysłano zgłoszenie"
  },
  "Бронювання очікує на підтвердження партнера.": {
    "en": "Your booking is awaiting partner confirmation.",
    "pl": "Rezerwacja oczekuje na potwierdzenie partnera."
  },
  "Усі мої бронювання": {
    "en": "All my bookings",
    "pl": "Wszystkie moje rezerwacje"
  },
  "Скасувати": {
    "en": "Cancel",
    "pl": "Anuluj"
  },
  "Переглянути мій план": {
    "en": "View my plan",
    "pl": "Zobacz mój plan"
  },
  "До профілю": {
    "en": "Back to profile",
    "pl": "Do profilu"
  },
  "Мої бронювання": {
    "en": "My bookings",
    "pl": "Moje rezerwacje"
  },
  "Історія заявок та їхній стан": {
    "en": "History and status of requests",
    "pl": "Historia i status zgłoszeń"
  },
  "Завантаження…": {
    "en": "Loading…",
    "pl": "Ładowanie…"
  },
  "Ви ще не створювали бронювань. Відкрийте заклад і оберіть «Забронювати».": {
    "en": "You have no bookings yet. Open a place and select Book.",
    "pl": "Nie masz jeszcze rezerwacji. Otwórz obiekt i wybierz Zarezerwuj."
  },
  "Початок": {
    "en": "Start",
    "pl": "Początek"
  },
  "Завершення": {
    "en": "End",
    "pl": "Koniec"
  },
  "2 дорослих · 1 дитина": {
    "en": "2 adults · 1 child",
    "pl": "2 dorosłych · 1 dziecko"
  },
  "3 дні": {
    "en": "3 days",
    "pl": "3 dni"
  },
  "Сімейний · природа · SPA": {
    "en": "Family · nature · SPA",
    "pl": "Rodzina · natura · SPA"
  },
  "Власне авто": {
    "en": "Own car",
    "pl": "Własny samochód"
  },
  "Ми підібрали 3 варіанти": {
    "en": "We found 3 options",
    "pl": "Znaleźliśmy 3 propozycje"
  },
  "Ще 2 варіанти плану": {
    "en": "2 more plan options",
    "pl": "2 kolejne propozycje planu"
  },
  "Поділитися": {
    "en": "Share",
    "pl": "Udostępnij"
  },
  "Зберегти план": {
    "en": "Save plan",
    "pl": "Zapisz plan"
  },
  "Мій план": {
    "en": "My plan",
    "pl": "Mój plan"
  },
  "Відвідано": {
    "en": "Visited",
    "pl": "Odwiedzone"
  },
  "Порада дня": {
    "en": "Tip of the day",
    "pl": "Wskazówka dnia"
  },
  "Візьміть дощовик — у горах погода мінлива.": {
    "en": "Take a raincoat — mountain weather can change quickly.",
    "pl": "Weź płaszcz przeciwdeszczowy — pogoda w górach szybko się zmienia."
  },
  "Створимо Ваш": {
    "en": "Let's create your",
    "pl": "Stwórzmy Twój"
  },
  "оптимальний план відпочинку": {
    "en": "perfect holiday plan",
    "pl": "idealny plan wypoczynku"
  },
  "Відповідайте на кілька запитань і ми підберемо найкращий сценарій відпочинку для вас.": {
    "en": "Answer a few questions and we'll suggest the best holiday plan for you.",
    "pl": "Odpowiedz na kilka pytań, a zaproponujemy najlepszy plan wypoczynku."
  },
  "Експрес-опитування": {
    "en": "Quick questionnaire",
    "pl": "Szybka ankieta"
  },
  "1–2 хв": {
    "en": "1–2 min",
    "pl": "1–2 min"
  },
  "6 коротких запитань": {
    "en": "6 quick questions",
    "pl": "6 krótkich pytań"
  },
  "Швидко та зручно": {
    "en": "Quick and easy",
    "pl": "Szybko i wygodnie"
  },
  "Ідеально для швидкого планування": {
    "en": "Great for quick planning",
    "pl": "Idealne do szybkiego planowania"
  },
  "Розширене опитування": {
    "en": "Detailed questionnaire",
    "pl": "Rozszerzona ankieta"
  },
  "3–5 хв": {
    "en": "3–5 min",
    "pl": "3–5 min"
  },
  "більше деталей і точніший план": {
    "en": "more details and a more accurate plan",
    "pl": "więcej szczegółów i dokładniejszy plan"
  },
  "Глибше розуміння ваших побажань": {
    "en": "A better understanding of your preferences",
    "pl": "Lepsze poznanie Twoich preferencji"
  },
  "Точніший план під ваш стиль відпочинку": {
    "en": "A plan tailored to your travel style",
    "pl": "Plan dopasowany do Twojego stylu podróży"
  },
  "Почати": {
    "en": "Start",
    "pl": "Rozpocznij"
  },
  "Хто подорожує?": {
    "en": "Who is travelling?",
    "pl": "Kto podróżuje?"
  },
  "Оберіть склад вашої компанії": {
    "en": "Choose who is travelling",
    "pl": "Wybierz uczestników podróży"
  },
  "На скільки днів?": {
    "en": "For how many days?",
    "pl": "Na ile dni?"
  },
  "Тривалість вашої подорожі": {
    "en": "Duration of your trip",
    "pl": "Długość podróży"
  },
  "Де ви зупинились?": {
    "en": "Where are you staying?",
    "pl": "Gdzie się zatrzymujesz?"
  },
  "Змінити": {
    "en": "Change",
    "pl": "Zmień"
  },
  "Який відпочинок вам підходить?": {
    "en": "What kind of holiday suits you?",
    "pl": "Jaki wypoczynek Ci odpowiada?"
  },
  "Оберіть головний настрій подорожі": {
    "en": "Choose your preferred travel style",
    "pl": "Wybierz preferowany styl podróży"
  },
  "Як ви пересуваєтесь?": {
    "en": "How will you travel?",
    "pl": "Jak będziesz się poruszać?"
  },
  "Підсумок побажань": {
    "en": "Your preferences",
    "pl": "Podsumowanie preferencji"
  },
  "Перевірте дані перед створенням плану": {
    "en": "Review your choices before creating a plan",
    "pl": "Sprawdź wybory przed utworzeniem planu"
  },
  "Компанія": {
    "en": "Group",
    "pl": "Grupa"
  },
  "Відпочинок": {
    "en": "Holiday",
    "pl": "Wypoczynek"
  },
  "Пересування": {
    "en": "Transport",
    "pl": "Transport"
  },
  "Бюджет": {
    "en": "Budget",
    "pl": "Budżet"
  },
  "до 5 000 ₴ / день": {
    "en": "up to 5,000 UAH / day",
    "pl": "do 5000 UAH / dzień"
  },
  "Змінити відповіді": {
    "en": "Edit answers",
    "pl": "Zmień odpowiedzi"
  },
  "Розкажіть про вашу компанію": {
    "en": "Tell us about your group",
    "pl": "Opowiedz o grupie"
  },
  "Вік дітей": {
    "en": "Children's ages",
    "pl": "Wiek dzieci"
  },
  "4 роки": {
    "en": "4 years",
    "pl": "4 lata"
  },
  "10 років": {
    "en": "10 years",
    "pl": "10 lat"
  },
  "Додати вік": {
    "en": "Add age",
    "pl": "Dodaj wiek"
  },
  "На який період створити план?": {
    "en": "What period should we plan for?",
    "pl": "Na jaki okres stworzyć plan?"
  },
  "Оберіть тривалість та зручний час": {
    "en": "Select duration and preferred time",
    "pl": "Wybierz długość i dogodny czas"
  },
  "Час доби, який вам зручний": {
    "en": "Preferred time of day",
    "pl": "Preferowana pora dnia"
  },
  "Де ви перебуваєте?": {
    "en": "Where are you?",
    "pl": "Gdzie jesteś?"
  },
  "Вкажіть точку для пошуку місць поруч": {
    "en": "Set a point to find nearby places",
    "pl": "Wskaż punkt do wyszukiwania miejsc w pobliżu"
  },
  "Поточне місце (за QR)": {
    "en": "Current place (via QR)",
    "pl": "Obecna lokalizacja (z QR)"
  },
  "Радіус для пошуку локацій": {
    "en": "Search radius",
    "pl": "Promień wyszukiwania"
  },
  "1 км": {
    "en": "1 km",
    "pl": "1 km"
  },
  "12 км": {
    "en": "12 km",
    "pl": "12 km"
  },
  "18 км": {
    "en": "18 km",
    "pl": "18 km"
  },
  "22 км": {
    "en": "22 km",
    "pl": "22 km"
  },
  "Який відпочинок вам подобається?": {
    "en": "What activities do you enjoy?",
    "pl": "Jaki wypoczynek lubisz?"
  },
  "Можна обрати декілька напрямів": {
    "en": "You can choose several options",
    "pl": "Możesz wybrać kilka opcji"
  },
  "Що вам не подобається?": {
    "en": "What would you rather avoid?",
    "pl": "Czego wolisz unikać?"
  },
  "Перепади висоти": {
    "en": "Steep elevation changes",
    "pl": "Duże różnice wysokości"
  },
  "Багатолюдні місця": {
    "en": "Crowded places",
    "pl": "Zatłoczone miejsca"
  },
  "Довгі переїзди": {
    "en": "Long drives",
    "pl": "Długie przejazdy"
  },
  "Темп і активність": {
    "en": "Pace and activity",
    "pl": "Tempo i aktywność"
  },
  "Оберіть комфортний ритм подорожі": {
    "en": "Choose your travel pace",
    "pl": "Wybierz tempo podróży"
  },
  "Фізичне навантаження": {
    "en": "Physical activity",
    "pl": "Aktywność fizyczna"
  },
  "Обмеження та побажання": {
    "en": "Needs and preferences",
    "pl": "Ograniczenia i preferencje"
  },
  "Маленькі діти": {
    "en": "Small children",
    "pl": "Małe dzieci"
  },
  "Без крутих підйомів": {
    "en": "No steep climbs",
    "pl": "Bez stromych podejść"
  },
  "Без дощу": {
    "en": "No rain",
    "pl": "Bez deszczu"
  },
  "Додати": {
    "en": "Add",
    "pl": "Dodaj"
  },
  "Транспорт і бюджет": {
    "en": "Transport and budget",
    "pl": "Transport i budżet"
  },
  "Останні деталі для точного підбору": {
    "en": "A few final details for a better match",
    "pl": "Ostatnie szczegóły dla lepszego dopasowania"
  },
  "Як пересуваєтесь?": {
    "en": "How will you get around?",
    "pl": "Jak będziesz się poruszać?"
  },
  "Максимальний час у дорозі": {
    "en": "Maximum travel time",
    "pl": "Maksymalny czas przejazdu"
  },
  "Бюджет на день (орієнтовно)": {
    "en": "Approximate daily budget",
    "pl": "Przybliżony budżet dzienny"
  },
  "Харчування": {
    "en": "Food preferences",
    "pl": "Preferencje żywieniowe"
  },
  "Місцева кухня": {
    "en": "Local cuisine",
    "pl": "Lokalna kuchnia"
  },
  "Вегетаріанське": {
    "en": "Vegetarian",
    "pl": "Wegetariańskie"
  },
  "Без обмежень": {
    "en": "No restrictions",
    "pl": "Bez ograniczeń"
  },
  "Ваші бонуси": {
    "en": "Your bonuses",
    "pl": "Twoje bonusy"
  },
  "балів": {
    "en": "points",
    "pl": "punktów"
  },
  "Нарахування": {
    "en": "Earned",
    "pl": "Naliczono"
  },
  "Списання": {
    "en": "Redeemed",
    "pl": "Wykorzystano"
  },
  "Історія операцій": {
    "en": "Transaction history",
    "pl": "Historia transakcji"
  },
  "Операцій поки немає": {
    "en": "No transactions yet",
    "pl": "Brak transakcji"
  },
  "1 бонус = 1 грн знижки. Бонуси не передаються між користувачами та не виводяться грошима.": {
    "en": "1 bonus = 1 UAH discount. Bonuses cannot be transferred or withdrawn as cash.",
    "pl": "1 punkt = 1 UAH zniżki. Punktów nie można przenosić ani wypłacać w gotówce."
  },
  "Створюємо QR...": {
    "en": "Creating QR...",
    "pl": "Tworzenie kodu QR..."
  },
  "Мій QR": {
    "en": "My QR",
    "pl": "Mój QR"
  },
  "Для нарахування або списання бонусів": {
    "en": "To earn or redeem bonus points",
    "pl": "Do naliczania lub wykorzystania punktów"
  },
  "Оновлюємо код…": {
    "en": "Refreshing code…",
    "pl": "Odświeżanie kodu…"
  },
  "Покажіть код працівнику закладу": {
    "en": "Show this code to a staff member",
    "pl": "Pokaż kod pracownikowi obiektu"
  },
  "Код одноразовий і оновлюється автоматично": {
    "en": "The code is single-use and refreshes automatically",
    "pl": "Kod jest jednorazowy i odświeża się automatycznie"
  },
  "Діє ще": {
    "en": "Valid for",
    "pl": "Ważny jeszcze"
  },
  "Не передавайте QR іншим. Операцію потрібно підтвердити на цьому пристрої.": {
    "en": "Do not share your QR. Confirm the transaction on this device.",
    "pl": "Nie udostępniaj kodu QR. Potwierdź transakcję na tym urządzeniu."
  },
  "Перевірити підтвердження": {
    "en": "Check confirmation",
    "pl": "Sprawdź potwierdzenie"
  },
  "Підтвердження": {
    "en": "Confirmation",
    "pl": "Potwierdzenie"
  },
  "Перевірте деталі операції": {
    "en": "Review the transaction details",
    "pl": "Sprawdź szczegóły transakcji"
  },
  "Запит на підтвердження покупки": {
    "en": "Purchase confirmation request",
    "pl": "Prośba o potwierdzenie zakupu"
  },
  "Сума покупки": {
    "en": "Purchase amount",
    "pl": "Kwota zakupu"
  },
  "Списання бонусів": {
    "en": "Bonus redemption",
    "pl": "Wykorzystane punkty"
  },
  "До сплати грошима": {
    "en": "Cash/card payment",
    "pl": "Do zapłaty gotówką lub kartą"
  },
  "Буде нараховано": {
    "en": "You will earn",
    "pl": "Zostanie naliczone"
  },
  "Підтвердити операцію": {
    "en": "Confirm transaction",
    "pl": "Potwierdź transakcję"
  },
  "Відхилити": {
    "en": "Decline",
    "pl": "Odrzuć"
  },
  "Перейти до бонусів": {
    "en": "Go to bonuses",
    "pl": "Przejdź do punktów"
  },
  "Ваш відгук": {
    "en": "Your review",
    "pl": "Twoja opinia"
  },
  "Після підтвердженого візиту": {
    "en": "After a verified visit",
    "pl": "Po potwierdzonej wizycie"
  },
  "Перевірений візит": {
    "en": "Verified visit",
    "pl": "Potwierdzona wizyta"
  },
  "Відгук доступний лише після завершеного бронювання або підтвердженої QR-покупки.": {
    "en": "You can review a place only after a completed booking or verified QR purchase.",
    "pl": "Możesz dodać opinię dopiero po zakończonej rezerwacji lub potwierdzonym zakupie QR."
  },
  "Як вам заклад?": {
    "en": "How was your visit?",
    "pl": "Jak oceniasz obiekt?"
  },
  "Розкажіть про враження": {
    "en": "Tell us about your experience",
    "pl": "Opowiedz o wrażeniach"
  },
  "Відгук відправлено на модерацію": {
    "en": "Review submitted for moderation",
    "pl": "Opinia wysłana do moderacji"
  },
  "Опублікувати відгук": {
    "en": "Submit review",
    "pl": "Dodaj opinię"
  },
  "Нова локація": {
    "en": "New place",
    "pl": "Nowe miejsce"
  },
  "Додати місце": {
    "en": "Add place",
    "pl": "Dodaj miejsce"
  },
  "Поділіться корисним місцем — після перевірки воно зʼявиться у «Гід турист».": {
    "en": "Share a useful place. After moderation, it will appear in Gid Tourist.",
    "pl": "Podziel się ciekawym miejscem. Po moderacji pojawi się w Gid Tourist."
  },
  "Модерація": {
    "en": "Moderation",
    "pl": "Moderacja"
  },
  "Основна інформація": {
    "en": "Basic information",
    "pl": "Podstawowe informacje"
  },
  "Назва та категорія місця": {
    "en": "Place name and category",
    "pl": "Nazwa i kategoria miejsca"
  },
  "Назва локації": {
    "en": "Place name",
    "pl": "Nazwa miejsca"
  },
  "Категорія": {
    "en": "Category",
    "pl": "Kategoria"
  },
  "Де знаходиться": {
    "en": "Location",
    "pl": "Lokalizacja"
  },
  "Вкажіть точку та адресу": {
    "en": "Set a point and address",
    "pl": "Wskaż punkt i adres"
  },
  "Обрати на мапі": {
    "en": "Choose on map",
    "pl": "Wybierz na mapie"
  },
  "Адреса": {
    "en": "Address",
    "pl": "Adres"
  },
  "Фото та опис": {
    "en": "Photos and description",
    "pl": "Zdjęcia i opis"
  },
  "Допоможіть туристам зрозуміти, що тут цікавого": {
    "en": "Tell tourists what makes this place interesting",
    "pl": "Opisz turystom, co jest tu interesującego"
  },
  "До 6 фото · JPG, PNG або WEBP": {
    "en": "Up to 6 photos · JPG, PNG or WEBP",
    "pl": "Do 6 zdjęć · JPG, PNG lub WEBP"
  },
  "Короткий опис": {
    "en": "Short description",
    "pl": "Krótki opis"
  },
  "Контакти": {
    "en": "Contacts",
    "pl": "Kontakty"
  },
  "необовʼязково": {
    "en": "optional",
    "pl": "opcjonalnie"
  },
  "Якщо місце має контакти або сайт": {
    "en": "If the place has contact details or a website",
    "pl": "Jeśli miejsce ma dane kontaktowe lub stronę"
  },
  "Перед публікацією ми перевіримо локацію.": {
    "en": "We will verify the place before publishing.",
    "pl": "Przed publikacją zweryfikujemy to miejsce."
  },
  "Це допомагає уникати дублів та некоректних місць.": {
    "en": "This prevents duplicates and inaccurate places.",
    "pl": "To pozwala uniknąć duplikatów i błędnych lokalizacji."
  },
  "Назад до профілю": {
    "en": "Back to profile",
    "pl": "Wróć do profilu"
  },
  "Оберіть точку": {
    "en": "Choose a point",
    "pl": "Wybierz punkt"
  },
  "На цій мапі немає закладів поруч — лише карта і ваша обрана точка.": {
    "en": "This map shows only your selected point, not nearby places.",
    "pl": "Ta mapa pokazuje tylko wybrany punkt, a nie pobliskie obiekty."
  },
  "Обрати цю точку": {
    "en": "Use this point",
    "pl": "Wybierz ten punkt"
  },
  "Видалити мій обліковий запис": {
    "en": "Delete my account",
    "pl": "Usuń moje konto"
  },
  "Послуга від: Гірський затишок": {
    "en": "Service by: Hirskyi Zatyshok",
    "pl": "Usługa: Hirskyi Zatyshok"
  },
  "Гірський затишок": {
    "en": "Hirskyi Zatyshok",
    "pl": "Hirskyi Zatyshok"
  },
  "Готель «Гірський затишок»": {
    "en": "Hirskyi Zatyshok Hotel",
    "pl": "Hotel Hirskyi Zatyshok"
  },
  "вул. Незалежності, 15Б, Татарів": {
    "en": "Nezalezhnosti St 15B, Tatariv",
    "pl": "ul. Niepodległości 15B, Tatarów"
  },
  "Татарів, вул. Незалежності, 15Б": {
    "en": "Tatariv, Nezalezhnosti St 15B",
    "pl": "Tatarów, ul. Niepodległości 15B"
  },
  "Ресурс": {
    "en": "Resource",
    "pl": "Zasób"
  },
  "Дата": {
    "en": "Date",
    "pl": "Data"
  },
  "Вільний час": {
    "en": "Available time",
    "pl": "Wolne terminy"
  },
  "Зайнято": {
    "en": "Unavailable",
    "pl": "Zajęte"
  },
  "хв": {
    "en": "min",
    "pl": "min"
  },
  "гостей": {
    "en": "guests",
    "pl": "gości"
  },
  "Уточнити": {
    "en": "Ask for details",
    "pl": "Zapytaj o szczegóły"
  },
  "Надсилаємо...": {
    "en": "Sending...",
    "pl": "Wysyłanie..."
  },
  "Підтвердити бронювання": {
    "en": "Confirm booking",
    "pl": "Potwierdź rezerwację"
  },
  "У цьому закладі ще не додано ресурси для онлайн-бронювання": {
    "en": "This place has no bookable services yet",
    "pl": "Ten obiekt nie dodał jeszcze usług do rezerwacji"
  },
  "Не вдалося створити бронювання": {
    "en": "Could not create a booking",
    "pl": "Nie udało się utworzyć rezerwacji"
  },
  "Бронювання послуги": {
    "en": "Service booking",
    "pl": "Rezerwacja usługi"
  },
  "Оберіть заклад у каталозі": {
    "en": "Choose a place in the directory",
    "pl": "Wybierz obiekt z katalogu"
  },
  "Заклад": {
    "en": "Place",
    "pl": "Obiekt"
  },
  "Не вдалося завантажити бронювання": {
    "en": "Could not load bookings",
    "pl": "Nie udało się wczytać rezerwacji"
  },
  "Скасувати бронювання?": {
    "en": "Cancel this booking?",
    "pl": "Anulować rezerwację?"
  },
  "Не вдалося скасувати": {
    "en": "Could not cancel",
    "pl": "Nie udało się anulować"
  },
  "Очікує підтвердження": {
    "en": "Awaiting confirmation",
    "pl": "Oczekuje na potwierdzenie"
  },
  "Підтверджено": {
    "en": "Confirmed",
    "pl": "Potwierdzono"
  },
  "Завершено": {
    "en": "Completed",
    "pl": "Zakończono"
  },
  "Скасовано вами": {
    "en": "Cancelled by you",
    "pl": "Anulowano przez Ciebie"
  },
  "Відхилено закладом": {
    "en": "Declined by place",
    "pl": "Odrzucono przez obiekt"
  },
  "Не відвідано": {
    "en": "Not attended",
    "pl": "Nieobecność"
  },
  "Нове": {
    "en": "New",
    "pl": "Nowe"
  },
  "Списано бонусів": {
    "en": "Bonuses spent",
    "pl": "Wykorzystane bonusy"
  },
  "Нараховано бонусів": {
    "en": "Bonuses earned",
    "pl": "Przyznane bonusy"
  },
  "QR активний": {
    "en": "QR active",
    "pl": "Kod QR aktywny"
  },
  "Оновлення QR": {
    "en": "Updating QR",
    "pl": "Aktualizacja kodu QR"
  },
  "бонусів": {
    "en": "bonuses",
    "pl": "bonusów"
  },
  "Операцію підтверджено. Баланс оновлено.": {
    "en": "Transaction confirmed. Balance updated.",
    "pl": "Transakcja potwierdzona. Saldo zaktualizowane."
  },
  "Поки немає операцій на підтвердження. Цей екран перевіряється автоматично.": {
    "en": "No transactions awaiting confirmation. This screen refreshes automatically.",
    "pl": "Brak transakcji do potwierdzenia. Ten ekran odświeża się automatycznie."
  },
  "Крок": {
    "en": "Step",
    "pl": "Krok"
  },
  "Назад": {
    "en": "Back",
    "pl": "Wstecz"
  },
  "Далі": {
    "en": "Next",
    "pl": "Dalej"
  },
  "Я сам / сама": {
    "en": "Just me",
    "pl": "Podróżuję samodzielnie"
  },
  "Пара": {
    "en": "Couple",
    "pl": "Para"
  },
  "Сім’я з дітьми": {
    "en": "Family with children",
    "pl": "Rodzina z dziećmi"
  },
  "Друзі": {
    "en": "Friends",
    "pl": "Przyjaciele"
  },
  "Велика компанія": {
    "en": "Large group",
    "pl": "Duża grupa"
  },
  "Романтичний": {
    "en": "Romantic",
    "pl": "Romantyczny"
  },
  "Активний": {
    "en": "Active",
    "pl": "Aktywny"
  },
  "Сімейний": {
    "en": "Family",
    "pl": "Rodzinny"
  },
  "Дорослі": {
    "en": "Adults",
    "pl": "Dorośli"
  },
  "Діти": {
    "en": "Children",
    "pl": "Dzieci"
  },
  "1 день": {
    "en": "1 day",
    "pl": "1 dzień"
  },
  "2 дні": {
    "en": "2 days",
    "pl": "2 dni"
  },
  "4–5 днів": {
    "en": "4–5 days",
    "pl": "4–5 dni"
  },
  "Вказати дати": {
    "en": "Choose dates",
    "pl": "Wybierz daty"
  },
  "Інші дати": {
    "en": "Other dates",
    "pl": "Inne daty"
  },
  "Таксі / трансфер": {
    "en": "Taxi / transfer",
    "pl": "Taksówka / transfer"
  },
  "Пішки": {
    "en": "Walking",
    "pl": "Pieszo"
  },
  "Збалансований": {
    "en": "Balanced",
    "pl": "Zrównoważony"
  },
  "Більше активності": {
    "en": "More activities",
    "pl": "Więcej aktywności"
  },
  "Спокійний сімейний": {
    "en": "Relaxed family trip",
    "pl": "Spokojny rodzinny wyjazd"
  },
  "3 дні · рекомендовано": {
    "en": "3 days · recommended",
    "pl": "3 dni · polecane"
  },
  "3 дні · альтернативний": {
    "en": "3 days · alternative",
    "pl": "3 dni · alternatywa"
  },
  "Обрано": {
    "en": "Selected",
    "pl": "Wybrano"
  },
  "Обрати": {
    "en": "Choose",
    "pl": "Wybierz"
  },
  "Ваші варіанти готові": {
    "en": "Your options are ready",
    "pl": "Twoje propozycje są gotowe"
  },
  "Ваш план готовий 🎉": {
    "en": "Your plan is ready 🎉",
    "pl": "Twój plan jest gotowy 🎉"
  },
  "Ми підібрали три сценарії під ваші побажання": {
    "en": "We created three options for your preferences",
    "pl": "Przygotowaliśmy trzy propozycje według Twoich preferencji"
  },
  "Персональний план на 3 дні": {
    "en": "Personal 3-day plan",
    "pl": "Indywidualny plan na 3 dni"
  },
  "День 1": {
    "en": "Day 1",
    "pl": "Dzień 1"
  },
  "День 2": {
    "en": "Day 2",
    "pl": "Dzień 2"
  },
  "День 3": {
    "en": "Day 3",
    "pl": "Dzień 3"
  },
  "День": {
    "en": "Day",
    "pl": "Dzień"
  },
  "Ранок": {
    "en": "Morning",
    "pl": "Rano"
  },
  "Вечір": {
    "en": "Evening",
    "pl": "Wieczór"
  },
  "Заселення та вечір у Татарові": {
    "en": "Arrival and evening in Tatariv",
    "pl": "Przyjazd i wieczór w Tatarowie"
  },
  "Поселення в готелі": {
    "en": "Hotel check-in",
    "pl": "Zameldowanie w hotelu"
  },
  "Вечеря з місцевою кухнею": {
    "en": "Dinner with local cuisine",
    "pl": "Kolacja z lokalną kuchnią"
  },
  "Легка вечірня прогулянка": {
    "en": "Relaxing evening walk",
    "pl": "Spokojny wieczorny spacer"
  },
  "Гори та карпатські враження": {
    "en": "Mountains and Carpathian experiences",
    "pl": "Góry i karpackie atrakcje"
  },
  "Маршрут до оглядового місця": {
    "en": "Walk to a viewpoint",
    "pl": "Trasa do punktu widokowego"
  },
  "Обід у гірській колибі": {
    "en": "Lunch in a mountain restaurant",
    "pl": "Obiad w górskiej kolibie"
  },
  "Відпочинок у чані": {
    "en": "Hot tub relaxation",
    "pl": "Relaks w balii kąpielowej"
  },
  "Відновлення і місцеві смаки": {
    "en": "Relaxation and local flavours",
    "pl": "Relaks i lokalne smaki"
  },
  "Ранковий SPA": {
    "en": "Morning spa",
    "pl": "Poranne SPA"
  },
  "Купівля сувенірів": {
    "en": "Souvenir shopping",
    "pl": "Zakup pamiątek"
  },
  "Кава перед виїздом": {
    "en": "Coffee before departure",
    "pl": "Kawa przed wyjazdem"
  },
  "24 травня": {
    "en": "24 May",
    "pl": "24 maja"
  },
  "25 травня": {
    "en": "25 May",
    "pl": "25 maja"
  },
  "26 травня": {
    "en": "26 May",
    "pl": "26 maja"
  },
  "Озеро Несамовите": {
    "en": "Nesamovyte Lake",
    "pl": "Jezioro Nesamowyte"
  },
  "Водоспад Гук": {
    "en": "Huk Waterfall",
    "pl": "Wodospad Huk"
  },
  "Полонина Кукул": {
    "en": "Kukul Mountain Meadow",
    "pl": "Połonina Kukul"
  },
  "Скелі Довбуша": {
    "en": "Dovbush Rocks",
    "pl": "Skały Dobosza"
  },
  "Готово": {
    "en": "Done",
    "pl": "Gotowe"
  },
  "Редагувати": {
    "en": "Edit",
    "pl": "Edytuj"
  },
  "дорослих": {
    "en": "adults",
    "pl": "dorosłych"
  },
  "дитина": {
    "en": "child",
    "pl": "dziecko"
  },
  "природа": {
    "en": "nature",
    "pl": "natura"
  },
  "Економний": {
    "en": "Budget",
    "pl": "Ekonomiczny"
  },
  "Середній": {
    "en": "Standard",
    "pl": "Średni"
  },
  "Комфорт": {
    "en": "Comfort",
    "pl": "Komfort"
  },
  "до 1 500 ₴": {
    "en": "up to UAH 1,500",
    "pl": "do 1 500 UAH"
  },
  "1 500–3 500 ₴": {
    "en": "UAH 1,500–3,500",
    "pl": "1 500–3 500 UAH"
  },
  "від 3 500 ₴": {
    "en": "from UAH 3,500",
    "pl": "od 3 500 UAH"
  },
  "Помірне": {
    "en": "Moderate",
    "pl": "Umiarkowane"
  },
  "5 км": {
    "en": "5 km",
    "pl": "5 km"
  },
  "15 км": {
    "en": "15 km",
    "pl": "15 km"
  },
  "30 км": {
    "en": "30 km",
    "pl": "30 km"
  },
  "50 км": {
    "en": "50 km",
    "pl": "50 km"
  },
  "до 1 год": {
    "en": "up to 1 hour",
    "pl": "do 1 godz."
  },
  "1–3 год": {
    "en": "1–3 hours",
    "pl": "1–3 godz."
  },
  "3–5 год": {
    "en": "3–5 hours",
    "pl": "3–5 godz."
  },
  "Більше 5 год": {
    "en": "Over 5 hours",
    "pl": "Ponad 5 godz."
  },
  "Єдиний номер допомоги": {
    "en": "Emergency number",
    "pl": "Numer alarmowy"
  },
  "Поліція · швидка · рятувальники": {
    "en": "Police · ambulance · rescue",
    "pl": "Policja · pogotowie · ratownicy"
  },
  "Швидка допомога": {
    "en": "Ambulance",
    "pl": "Pogotowie"
  },
  "Цілодобово": {
    "en": "24/7",
    "pl": "Całodobowo"
  },
  "Допомога та правопорядок": {
    "en": "Assistance and public safety",
    "pl": "Pomoc i bezpieczeństwo"
  },
  "ДСНС / рятувальники": {
    "en": "Fire and rescue",
    "pl": "Straż pożarna i ratownictwo"
  },
  "Пожежі · аварії · надзвичайні ситуації": {
    "en": "Fire · accidents · emergencies",
    "pl": "Pożary · wypadki · sytuacje awaryjne"
  },
  "Гірські рятувальники": {
    "en": "Mountain rescue",
    "pl": "Ratownictwo górskie"
  },
  "Яремче, найближчий пост": {
    "en": "Yaremche, nearest rescue post",
    "pl": "Jaremcze, najbliższy posterunek"
  },
  "Карта рекомендованих закладів": {
    "en": "Map of recommended places",
    "pl": "Mapa polecanych miejsc"
  },
  "Показати моє місцезнаходження": {
    "en": "Show my location",
    "pl": "Pokaż moją lokalizację"
  },
  "Фото недоступне": {
    "en": "Photo unavailable",
    "pl": "Zdjęcie niedostępne"
  },
  "QR-код": {
    "en": "QR code",
    "pl": "Kod QR"
  },
  "Дата бронювання": {
    "en": "Booking date",
    "pl": "Data rezerwacji"
  },
  "Редагувати план": {
    "en": "Edit itinerary",
    "pl": "Edytuj plan"
  },
  "Інформація": {
    "en": "Information",
    "pl": "Informacje"
  },
  "Вибрати дату": {
    "en": "Choose date",
    "pl": "Wybierz datę"
  },
  "Змінити назву": {
    "en": "Rename",
    "pl": "Zmień nazwę"
  },
  "Видалити локацію": {
    "en": "Remove place",
    "pl": "Usuń miejsce"
  },
  "Дії": {
    "en": "Actions",
    "pl": "Działania"
  },
  "Назад до послуг": {
    "en": "Back to services",
    "pl": "Wróć do usług"
  },
  "Додати в улюблені": {
    "en": "Add to favorites",
    "pl": "Dodaj do ulubionych"
  },
  "Деталі послуги": {
    "en": "Service details",
    "pl": "Szczegóły usługi"
  },
  "Послуги не вдалося завантажити": {
    "en": "Could not load services",
    "pl": "Nie udało się załadować usług"
  },
  "Години роботи": {
    "en": "Opening hours",
    "pl": "Godziny otwarcia"
  },
  "Послуга закладу": {
    "en": "Venue service",
    "pl": "Usługa obiektu"
  },
  "Безкоштовно": {
    "en": "Free",
    "pl": "Bezpłatnie"
  },
  "За запитом": {
    "en": "On request",
    "pl": "Na zapytanie"
  },
  "Від ": {
    "en": "From ",
    "pl": "Od "
  },
  "Наприклад, оглядовий майданчик Ягідна": {
    "en": "For example, Yahidna viewpoint",
    "pl": "Np. punkt widokowy Jahidna"
  },
  "вул., номер, населений пункт": {
    "en": "Street, number, town",
    "pl": "Ulica, numer, miejscowość"
  },
  "Що варто знати про це місце, чим воно цікаве, коли краще відвідати...": {
    "en": "What makes this place special, and when is the best time to visit?",
    "pl": "Co warto wiedzieć o tym miejscu i kiedy najlepiej je odwiedzić?"
  },
  "Телефон": {
    "en": "Phone",
    "pl": "Telefon"
  },
  "Сайт або соцмережа": {
    "en": "Website or social media",
    "pl": "Strona internetowa lub media społecznościowe"
  },
  "Видалити фото": {
    "en": "Remove photo",
    "pl": "Usuń zdjęcie"
  },
  "Вибір точки на мапі": {
    "en": "Choose a point on the map",
    "pl": "Wybierz punkt na mapie"
  },
  "Локацію надіслано на модерацію. Після перевірки вона зʼявиться у гіді.": {
    "en": "Place submitted for review. It will appear in the guide after approval.",
    "pl": "Miejsce wysłano do moderacji. Po zatwierdzeniu pojawi się w przewodniku."
  },
  "Не вдалося надіслати локацію": {
    "en": "Failed to submit place",
    "pl": "Nie udało się przesłać miejsca"
  },
  "Оберіть відвідування": {
    "en": "Choose a visit",
    "pl": "Wybierz wizytę"
  },
  "зірок": {
    "en": "stars",
    "pl": "gwiazdek"
  },
  "Що сподобалось? Що можна покращити?": {
    "en": "What did you like? What could be improved?",
    "pl": "Co Ci się podobało? Co można poprawić?"
  }
};

export function touristInterfaceText(language: TouristLanguage, uk: string): string {
  if (language === "uk") return uk;
  return interfaceLabels[uk]?.[language] || translateKnownLabel(language,uk);
}
