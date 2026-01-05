# Implementation Notes

## Assumptions & Simplifications

### Discount Rules

- **"Highest discount"** means from customer's perspective (maximum savings amount)
- Volume discount applies to total order units, not per-product
- Black Friday: Friday between Nov 23-29 (not always last Friday, but covers common range)
- Holiday discount applies only to Electronics & Books categories
- Location multipliers affect base prices before discount calculations

### Customer/Location Model

- Customers pre-seeded in database with fixed locations (US, Europe, Asia)
- Location doesn't change - simplified model for pricing demonstration
- No dynamic customer creation endpoint (not required)

### Stock Management

- Stock updates are synchronous - no race condition handling
- Orders permanently decrease stock (no cancellation/refund flow)
- No stock reservation system

### Omitted Features

- Authentication/authorization (not in requirements)
- Order status transitions (always "completed")
- Customer CRUD operations (seeded data only)
- Audit logging
- Database migrations
- Rate limiting
- Containerization (Docker, docker-compose)
- Caching layer (Redis for hot data)
- Message queue for async operations
- Health check endpoints
- Metrics and monitoring (Prometheus, Grafana)
- Proper logging infrastructure (Winston, ELK stack)

## Technical Decisions

### Database: LowDB

**Why:** Lightweight JSON file storage, perfect for prototype/interview task. Zero setup required.

**Tradeoffs:** Not suitable for production (no transactions, poor concurrency, file-based).

**Production alternative:** PostgreSQL with:

- Proper ACID transactions
- Row-level locking for stock management
- Connection pooling (pg-pool)
- Migrations (Knex/TypeORM)
- Replication for read scaling
- Redis for caching frequently accessed products

### CQRS Implementation

**Approach:** Folder-based separation without event sourcing.

- `commands/` - Write operations with business logic
- `queries/` - Read operations (simple data retrieval)
- Commands update stock and calculate discounts
- Queries just fetch and return data

**Why this level:** Full CQRS with separate databases/event sourcing would be overengineering for this scope. Current approach demonstrates pattern understanding while keeping complexity reasonable.

### Project Structure

```
commands/queries → Business operations
routes → HTTP layer (validation, status codes)
helpers/utils.ts → Pure functions for discounts
helpers/types.ts → Shared types and constants
```

**Why:** Clear separation of concerns. Business logic testable without HTTP layer. Routes stay thin.

## Business Logic

### Discount Priority System

Located in `helpers/utils.ts → calculateBestDiscount()`:

1. Calculate all three discount types:

   - Volume: based on total units
   - Black Friday: 25% if date matches
   - Holiday: 15% on eligible categories only

2. Use `Math.max()` to select highest savings

3. Return single discount value

**Edge case:** Discount can't exceed subtotal (clamped to 0 with `Math.max(subTotal - discount, 0)`)

### Stock Consistency

Located in `commands/orders.ts → buildOrderProducts()`:

- Check stock availability **before** any modifications
- Throw error if insufficient - transaction rolls back (no db.write())
- Only update stock after all validations pass
- Update happens in-memory first, persisted after order creation

**Limitation:** No locking mechanism. Concurrent requests could oversell (LowDB limitation).

### Edge Cases Handled

- Zero/negative quantities rejected by Joi schemas
- Missing products/customers → 404 errors
- Insufficient stock → 409 conflict
- Unknown locations default to 1.0x multiplier
- Discount clamped to prevent negative totals

## Testing

### What's Covered

1. **Unit tests (commands/):**

   - All discount calculation functions
   - Location multipliers
   - Date validation (holidays, Black Friday)
   - Stock management operations
   - Error cases (not found, insufficient stock)

2. **Integration tests (api.test.ts):**

   - Full order flow with real HTTP requests
   - Product CRUD operations
   - Location pricing verification
   - Volume discount application

3. **Validation tests:**
   - All Joi schemas
   - Edge cases (zero, negative, decimals)

**Coverage:** Core business logic and critical paths fully tested.

### Not Covered (Production Requirements)

- Concurrent request handling
- Database connection failures and retry logic
- File system errors (LowDB writes)
- Large dataset performance
- Memory leaks in long-running process
- Malformed JSON handling in database file
- **Infrastructure:**
  - Docker containerization
  - Redis for caching and session management
  - PostgreSQL with connection pooling
  - Message queue (RabbitMQ/Kafka) for order processing
  - API Gateway and load balancing
  - CI/CD pipeline
  - Environment-specific configs (dev/staging/prod)
  - Database backups and disaster recovery
- **Observability:**
  - Structured logging (Winston + ELK)
  - Distributed tracing (OpenTelemetry)
  - APM (Application Performance Monitoring)
  - Error tracking (Sentry)
- **Security:**
  - JWT authentication
  - Rate limiting per user/IP
  - Input sanitization beyond Joi
  - HTTPS/TLS
  - Secrets management (Vault)
  - SQL injection prevention (irrelevant for LowDB, critical for real DB)

## Trade-offs & Alternatives

### Decision: Single `utils.ts` file for all discount logic

**Chosen approach:**
All discount functions (`calculateVolumeDiscount`, `calculateBlackFridayDiscount`, etc.) in one file.

**Alternative considered:**
Separate discount strategy classes with common interface:

```typescript
interface DiscountStrategy {
  calculate(order: Order): number;
}
class VolumeDiscountStrategy implements DiscountStrategy { ... }
```

**Why rejected:**

- Strategy pattern adds 4-5 new files for simple calculations
- Current functions are pure and independently testable
- No runtime strategy selection needed (all evaluated every time)
- Overkill for 3 discount types with different input parameters

**Downsides of chosen solution:**

- Adding new discount types requires modifying `calculateBestDiscount`
- File grows with more discount rules
- Less obvious extension point

**When I'd change it:**
If discount count reaches 5+, or if discounts need dynamic loading/configuration at runtime, strategy pattern becomes worth the complexity.

### Decision: Location multiplier applied to unit prices, not final total

**Chosen approach:**
In `commands/orders.ts → buildOrderProducts()`:

```typescript
const adjustedUnitPrice = product.price * locationMultiplier;
```

Multiplier applied before discount calculation.

**Alternative considered:**
Apply location multiplier to final amount after discounts:

```typescript
const finalAmount = (subTotal - bestDiscount) * locationMultiplier;
```

**Why rejected:**

- Task requirement states "Prices increased by 15%" (plural) suggesting per-product
- Customer sees location-adjusted prices in their cart before discounts
- More transparent (each product shows actual price for location)

**Downsides of chosen solution:**

- Holiday discount calculation more complex (uses adjusted prices)
- Can't easily show "base price" vs "your price" in UI
- Location change would require order recalculation

**Real-world note:**
Production systems typically store prices in multiple currencies with exchange rates. This simplified model works for demonstration but wouldn't scale to real e-commerce.
