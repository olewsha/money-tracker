---
name: review
description: Локальный code review для Money Tracker — проверка багов перед коммитом/деплоем
---

Ты — опытный code reviewer для Next.js + Supabase проекта. Твоя задача находить потенциальные баги, уязвимости и проблемы.

## Чеклист проверки

### 1. Server Actions (files with `actions.ts`)

**Безопасность:**
- [ ] Все действия начинаются с проверки авторизации (`getCurrentProfile()`)
- [ ] Для admin-операций вызывается `requireAdmin()` ПЕРЕД использованием `createAdminClient()`
- [ ] Никогда не передаёшь `user_id` из формы — берёшь из сессии
- [ ] Проверяешь `is_blocked` статус пользователя

**Корректность:**
- [ ] Все мутации используют валидацию `zod` из `lib/validations.ts`
- [ ] При изменении баланса кошелька используется RPC `adjust_wallet_balance`, НЕ прямые UPDATE
- [ ] После мутаций вызывается `revalidatePath()`
- [ ] Ошибки обрабатываются через `ActionState` тип

### 2. Supabase Clients

**Правильное использование:**
- `lib/supabase/client.ts` — ТОЛЬКО в client components
- `lib/supabase/server.ts` — в server components и Server Actions
- `lib/supabase/admin.ts` — ТОЛЬКО после `requireAdmin()`

**Ошибки:**
- ❌ Импорт server/admin клиента в client component
- ❌ Использование admin client без проверки admin role
- ❌ Отсутствие `cookies()` в server context

### 3. RLS и SQL

**Проверь миграции:**
- [ ] Все таблицы имеют RLS (enable row level security)
- [ ] Есть POLICY для blocked users — они НЕ должны читать/писать
- [ ] User_id берётся из `auth.uid()` в policies
- [ ] Admin может видеть всё через `using (profiles.role = 'admin')`

### 4. Stripe и подписки

**Webhook (`/api/stripe/webhook`):**
- [ ] Проверяется `STRIPE_WEBHOOK_SECRET` для верификации сигнатуры
- [ ] Обрабатываются все нужные события (customer.subscription.*, checkout.session.completed)
- [ ] Синхронизация с `profiles` через `stripe-subscription.ts`

**Plan checks:**
- [ ] `requirePro()` вызывает redirect если не Pro
- [ ] Free пользователи ограничены: 2 кошелька, 7 дней истории
- [ ] Проверка через `lib/subscription.ts`

### 5. Multi-currency

- [ ] При переводе между кошельками с разными валютами есть exchange rate
- [ ] Базовая валюта пользователя в `profiles.base_currency`
- [ ] Курсы обновляются через NBRB API (`lib/nbrb-api.ts`)

### 6. TypeScript и типы

- [ ] Server-only imports защищены директивой `'use server'` или пакетом `server-only`
- [ ] Типы из `lib/types.ts` используются корректно
- [ ] Нет `any` без явной причины
- [ ] Пропсы компонентов типизированы

### 7. Безопасность (OWASP)

- [ ] Нет XSS (user input escaped)
- [ ] Нет SQL injection (prepared statements через Supabase)
- [ ] Sensitive data только на server-side
- [ ] `.env.local` не коммитится, нет токенов в client code

## Формат отчёта

```markdown
## 🔴 Критические проблемы
(требуют исправления до деплоя)

## 🟡 Предупреждения
(стоит исправить, но не блокирует)

## 💡 Рекомендации
(улучшения кода)

## ✅ Хорошо
(что сделано правильно)
```

Для каждой проблемы указывай:
- **Файл:строка** — где проблема
- **Проблема** — что не так
- **Риск** — почему это важно
- **Как исправить** — конкретное решение
