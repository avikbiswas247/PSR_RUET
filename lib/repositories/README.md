
# PSRU PostgreSQL repositories + service examples

This package is designed for your project layout:

```text
my-app/
  lib/
    db.ts                  # your existing PostgreSQL helper
    repositories/          # copied from this package
    services/              # starter business-logic examples
```

## Before using

1. Copy `lib/repositories` and `lib/services` into your Next.js project's `lib/` directory.
2. The code expects `lib/db.ts` to export:
   - `query<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>>`
   - `transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>`
3. The imports use the common Next.js alias `@/lib/db`. If your `tsconfig.json` does not map `@/*` to the project root, change that import to the correct relative path.
4. Use the Node.js runtime for routes that access `pg`; do not run these repositories in the Edge runtime.
5. Run `npx tsc --noEmit` after copying. Fix any mismatch between your actual `db.ts` function signatures and the assumptions above.

## Repository vs service: the mental model

Think of a restaurant:
- Repository = waiter who knows how to fetch/save the order in the database.
- Service = manager who checks the rules: is the user allowed, is the booking valid, what happens next?
- Route handler = front desk that receives the HTTP request and sends the response.

A repository should not decide who is allowed to book, send emails, or hash passwords. It should execute database operations.
A service should enforce business rules and coordinate multiple repositories.
A route handler should validate incoming data, authenticate the caller, call a service, and return an HTTP response.

## Important safety rules

- Never accept `user_id`, `role`, `admin_id`, `photographer_id`, or payment status from the browser as trusted facts. Derive the actor from the authenticated server-side session and authorize it.
- Hash passwords with Argon2id or bcrypt in a service before calling `createAccount`. Never store plaintext passwords.
- Store only hashes of reset tokens and refresh tokens. Generate random tokens with a cryptographically secure generator.
- Do not expose `password_hash`, `token_hash`, or `refresh_token_hash` in API responses.
- SQL values use `$1`, `$2`, etc. Do not build SQL values by string concatenation.
- The shared update helper only accepts columns in each repository's constant allowlist.
- Add pagination limits and validate `limit`/`offset` in the service or route. Do not let users request unlimited rows.
- Use a database transaction when one business action must write multiple related rows.
- A transaction alone does not prevent two simultaneous booking requests for the same time. You need a conflict-safe availability design (ideally a PostgreSQL exclusion constraint on a timestamp range) before treating booking slots as guaranteed.
- Email should be sent after the database write succeeds. For reliable production delivery, use an email outbox table/worker and retry failed messages.

## Notes about this schema

- `auth.repository.ts` combines `users` and `user_roles` for login/account creation. Sessions and password-reset tokens stay in their own repositories.
- `role.repository.ts` works with both `roles` and the junction table `user_roles`.
- `photo_category_map`, `portfolio_items`, `event_registrations`, and `exhibition_items` are relationship tables. Their repositories expose relationship-oriented methods.
- Your SQL has no `email_outbox` table, no unique normalized-email index, and no booking-overlap constraint. Consider adding these before production.
- Your SQL uses `VARCHAR` status columns with `CHECK` constraints. Keep TypeScript status unions synchronized with the SQL checks.

## A beginner's way to learn each repository

For every function, identify:
1. What table does it touch?
2. What does `$1` represent? (The first parameter passed separately to SQL.)
3. What does `RETURNING *` do? (PostgreSQL returns the inserted/updated row.)
4. What happens if no row exists? (`null`, `[]`, or `false`, depending on the function.)
5. Which service is responsible for checking permissions and business rules?
