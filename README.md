## Setup

```bash
npm install
```

## Running

```bash
npm run dev    # Development
npm run build  # Production build
npm start      # Production
```

## Testing

```bash
npm test              # All tests
npm run test:coverage # With coverage
```

## API Endpoints

### Products

- `GET /products` - List all products
- `POST /products` - Create product
- `POST /products/:id/restock` - Increase stock
- `POST /products/:id/sell` - Decrease stock

### Orders

- `POST /orders` - Create order with automatic discount calculation

## Request Examples

**Create Product:**

```json
POST /products
{
  "name": "Laptop",
  "description": "Gaming Laptop",
  "category": "Electronics",
  "price": 1000,
  "stock": 50
}
```

**Create Order:**

```json
POST /orders
{
  "customerId": "c1",
  "products": [
    { "productId": "p1", "quantity": 5 }
  ]
}
```

## Discount System

The system automatically applies the **highest** applicable discount:

1. **Volume Discounts:**

   - 5+ units: 10%
   - 10+ units: 20%
   - 50+ units: 30%

2. **Black Friday:** 25% (last Friday of November, 23-29)

3. **Holiday Sales:** 15% on Electronics & Books (Polish public holidays)

4. **Location Pricing:**
   - US: Standard (1.0x)
   - Europe: +15% (VAT)
   - Asia: -5% (logistics)

**Discounts never stack** - only the best one applies.

## Tech Stack

- Node.js + Express + TypeScript
- LowDB (JSON file database)
- Joi (validation)
- Vitest (testing)
- CQRS pattern (commands/queries separation)

## Project Structure

```
src/
├── commands/       # Write operations (create, update)
├── queries/        # Read operations (get, list)
├── routes/         # API endpoints
├── schemas/        # Joi validation
├── helpers/        # Business logic & types
├── db/             # Database setup
├── middleware/     # Error handling
└── tests/          # Unit & integration tests
```
