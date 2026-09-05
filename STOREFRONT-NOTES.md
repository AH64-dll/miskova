# Storefront verification and deployment

## Checks

- `npm run typecheck`
- `npm run test:safety` — isolated temporary storage; normalization, bounded request bodies, reference uniqueness, concurrent writes, corrupt-store protection.
- `npm run build && npm run test:e2e` — production collection navigation and cash-on-delivery checkout, isolated order store. Chrome path can be set with `PUPPETEER_EXECUTABLE_PATH`.
- `BASE_URL=http://127.0.0.1:3111 npm run test:catalog` — requires a running site and access to the upstream catalog.

## Deployment limits

- Orders currently use a JSON file, not a database. Set `ORDERS_STORE_PATH` to a durable writable local volume and back it up. Do not deploy this storage unchanged to ephemeral serverless instances or multiple hosts. A transactional database is needed there.
- Writes use an exclusive filesystem lock and atomic rename. Locks are never evicted solely for being old: doing so can corrupt orders during a slow write. After a crashed process, stop all writers before removing the orphan `<ORDERS_STORE_PATH>.lock`, then restart. Normal lock contention returns a temporary storage error.
- Order references include random bytes. Admin sessions use HMAC; sessions created before this change must sign in again.
- Checkout totals are catalog subtotals. Below the free-delivery threshold, delivery fees are explicitly marked as confirmed before dispatch. No delivery rate is invented.
- The client blocks simultaneous submits, but retry-after-network-failure idempotency is not implemented. A durable idempotency key belongs in the future order database.
- Admin login has a shared per-process burst limit of 10 attempts per minute, with `Retry-After`. It intentionally does not trust spoofable forwarding headers. Before public deployment, configure trusted-edge rate limiting for order creation and admin login across replicas, HTTPS, a strong `ADMIN_PASSWORD`, monitoring, and backups. This focused storefront pass is not a full security audit.
