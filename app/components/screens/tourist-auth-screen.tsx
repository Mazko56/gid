"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, LogIn, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useTouristRuntime } from "../../lib/tourist-runtime";
import { tr } from "../../lib/tourist-i18n";

/** Only displayed after an explicit logout or account deletion. First Telegram/QR visits keep automatic auth. */
export function TouristAuthScreen() {
  const runtime = useTouristRuntime();
  const lang = runtime.language;
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      if (mode === "register") await runtime.registerWithPhone(name, phone, password);
      else await runtime.loginWithPhone(phone, password);
      setPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tr(lang, "Не вдалося виконати вхід", "Sign-in failed", "Logowanie nie powiodło się"));
    } finally {
      setPending(false);
    }
  };

  const telegramLogin = async () => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await runtime.loginWithTelegram();
      setPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tr(lang, "Вхід через Telegram недоступний", "Telegram sign-in unavailable", "Logowanie Telegram jest niedostępne"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="tourist-screen gt-screen gt-account-auth">
      <main className="gt-account-auth__content">
        <span className="gt-account-auth__brand"><ShieldCheck size={26} /></span>
        <h1>{mode === "login" ? tr(lang, "Вхід до Гіда туриста", "Sign in to Tourist Guide", "Zaloguj się do Przewodnika") : tr(lang, "Створити обліковий запис", "Create an account", "Utwórz konto")}</h1>
        <p>{tr(lang, "Ви вийшли з облікового запису. Увійдіть через Telegram або за номером телефону.", "You signed out. Continue with Telegram or your phone number.", "Wylogowano. Zaloguj się przez Telegram lub numer telefonu.")}</p>

        <div className="gt-account-auth__tabs" role="group" aria-label={tr(lang, "Спосіб входу", "Account mode", "Tryb konta")}>
          <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => { setMode("login"); setError(""); }}>{tr(lang, "Вхід", "Sign in", "Logowanie")}</button>
          <button type="button" className={mode === "register" ? "is-active" : ""} onClick={() => { setMode("register"); setError(""); }}>{tr(lang, "Реєстрація", "Register", "Rejestracja")}</button>
        </div>

        <form className="gt-account-auth__form" onSubmit={(event) => void submit(event)}>
          {mode === "register" ? <label><span>{tr(lang, "Ім’я та прізвище", "Full name", "Imię i nazwisko")}</span><span className="gt-account-auth__field"><UserRound size={20} /><input autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder={tr(lang,"Ваше ім’я","Your name","Twoje imię")} /></span></label> : null}
          <label><span>{tr(lang, "Номер телефону", "Phone number", "Numer telefonu")}</span><span className="gt-account-auth__field"><Phone size={20} /><input type="tel" inputMode="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+380XXXXXXXXX" /></span></label>
          <label><span>{tr(lang, "Пароль", "Password", "Hasło")}</span><span className="gt-account-auth__field"><LockKeyhole size={20} /><input type={visible ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "register" ? tr(lang,"Не менше 8 символів","At least 8 characters","Co najmniej 8 znaków") : "••••••••"} /><button type="button" className="gt-account-auth__eye" onClick={() => setVisible(v => !v)} aria-label={visible ? tr(lang,"Приховати пароль","Hide password","Ukryj hasło") : tr(lang,"Показати пароль","Show password","Pokaż hasło")}>{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button></span></label>
          {error ? <div className="gt-account-auth__error" role="alert">{error}</div> : null}
          <button className="gt-account-auth__submit" type="submit" disabled={pending}><LogIn size={20} />{pending ? tr(lang,"Обробка…","Please wait…","Proszę czekać…") : mode === "login" ? tr(lang,"Увійти", "Sign in", "Zaloguj się") : tr(lang,"Зареєструватися","Create account","Utwórz konto")}<ArrowRight size={18} /></button>
        </form>
        <div className="gt-account-auth__or">{tr(lang,"або", "or", "lub")}</div>
        <button type="button" className="gt-account-auth__telegram" disabled={pending} onClick={() => void telegramLogin()}><span className="gt-account-auth__tg">✈</span>{tr(lang,"Увійти через Telegram", "Continue with Telegram", "Kontynuuj przez Telegram")}</button>
        <small className="gt-account-auth__disclaimer">{tr(lang,"При звичайному першому відкритті через Telegram реєстрація не потрібна.","On your first Telegram visit, no separate registration is required.","Przy pierwszej wizycie przez Telegram osobna rejestracja nie jest potrzebna.")}</small>
      </main>
    </div>
  );
}
