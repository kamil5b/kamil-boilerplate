# Quick Reference Guide - New Features

## Navigation Paths

### Inventory Management
- **List All History**: `/inventory-histories`
- **View Summary**: `/inventory-histories/summary`
- **Manipulate Inventory**: `/inventory-histories/manipulate`
- **Product Detail**: `/inventory-histories/product/{productId}`

### Transaction Management
- **List Transactions**: `/transactions`
- **View Dashboard**: `/transactions/dashboard`
- **Create Transaction**: `/transactions/new`
- **View Detail**: `/transactions/{transactionId}`

### Payment Management
- **List Payments**: `/payments`
- **Create Payment**: `/payments/new`
- **View Detail**: `/payments/{paymentId}`

## User Workflows

### 1. Inventory Manipulation Workflow
1. Navigate to `/inventory-histories`
2. Click "Manipulate Inventory" button
3. Add items (product + unit + quantity)
   - Use negative quantity to subtract
   - Use positive quantity to add
4. Add remarks (optional)
5. Submit to create inventory history entries

### 2. View Inventory Summary Workflow
1. Navigate to `/inventory-histories`
2. Click "View Summary" button
3. View products grouped with quantities per unit
4. Click "View History" on any product to see timeline

### 3. Create Transaction Workflow
1. Navigate to `/transactions`
2. Click "Create Transaction" button
3. Select transaction type (SELL or BUY)
4. Select customer (optional)
5. Add items:
   - Select product
   - Select unit
   - Enter quantity
   - Enter price per unit
   - Subtotal calculates automatically
6. Add discounts (optional):
   - Total Fixed: Amount off entire transaction
   - Total Percentage: Percentage off entire transaction
   - Item Fixed: Amount off specific item
   - Item Percentage: Percentage off specific item
7. Select taxes (optional)
8. View calculation summary (subtotal, discount, tax, grand total)
9. Add remark (optional)
10. Submit to create transaction

### 4. View Transaction Dashboard Workflow
1. Navigate to `/transactions`
2. Click "View Dashboard" button
3. View summary cards:
   - Total Revenue
   - Total Expenses
   - Net Income
4. View timeline chart showing revenue/expenses over time
5. View product summary table
6. Click product to view details (if implemented)

### 5. Create Payment Workflow
1. Navigate to `/payments`
2. Click "Create Payment" button
3. Select payment type (CASH/CARD/TRANSFER/QRIS/PAPER)
4. Select customer (optional)
5. Select transaction (optional)
6. Add payment details:
   - Enter identifier (e.g., "Card Number", "Transfer ID")
   - Enter value
   - Click "Add Detail" to add more
7. Add remark (optional)
8. Submit to create payment

### 6. Link Payment to Transaction Workflow
1. Navigate to `/transactions/{id}` (transaction detail)
2. Click "Create Payment" button
3. System automatically pre-fills transaction ID
4. Complete payment form
5. Submit
6. Payment will be linked to transaction

## Component Features

### PaginatedSelect Component
Used throughout for searchable dropdowns:
- Real-time search with debouncing
- Infinite scroll
- Clear button
- Works with any paginated endpoint
- Type-safe with generics

### FormField Component
Consistent form field layout:
- Label with optional required indicator
- Error message display
- Consistent spacing

### Calculation Display
Transaction form shows real-time calculations:
- Items subtotal
- Discount amount (red)
- After discount amount
- Tax amount
- Grand total (bold)

## API Endpoints Used

### Inventory
- `GET /api/inventory-histories` - List with pagination
- `GET /api/inventory-histories/summary` - Summary by product
- `GET /api/inventory-histories/time-series?productId={id}` - Product timeline
- `POST /api/inventory-histories/manipulate` - Manipulate inventory

### Transactions
- `GET /api/transactions` - List with pagination
- `GET /api/transactions/{id}` - Get single transaction
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/summary` - Get summary stats
- `GET /api/transactions/time-series` - Get timeline data
- `GET /api/transactions/product-summary` - Get product summary

### Payments
- `GET /api/payments` - List with pagination
- `GET /api/payments/{id}` - Get single payment
- `POST /api/payments` - Create payment

### Other Resources
- `GET /api/products` - List products
- `GET /api/unit-quantities` - List units
- `GET /api/customers` - List customers
- `GET /api/taxes` - List taxes

## Validation Rules

### Inventory Manipulate
- At least one item required
- Product required for each item
- Unit required for each item
- Quantity cannot be zero

### Transaction Form
- At least one item required
- Product required for each item
- Unit required for each item
- Quantity must be greater than 0
- Price cannot be negative
- Discount value cannot be negative
- Percentage discount cannot exceed 100%

### Payment Form
- Payment type required
- At least one payment detail required
- Amount must be greater than 0

## Color Coding

### Inventory
- **Green**: Positive quantities (stock added)
- **Red**: Negative quantities (stock removed)

### Transactions
- **Green Badge**: SELL type
- **Red Badge**: BUY type
- **Green Badge**: PAID status
- **Yellow Badge**: PARTIALLY_PAID status
- **Red Badge**: UNPAID status

### Payments
- **Green**: CASH
- **Blue**: CARD
- **Purple**: TRANSFER
- **Pink**: QRIS
- **Yellow**: PAPER

### Dashboard
- **Green**: Revenue amounts
- **Red**: Expense amounts
- **Green/Red**: Net income (based on positive/negative)

## Tips for Testing

1. **Start with Master Data**: Create products, units, customers, taxes first
2. **Test Inventory**: Manipulate inventory to create stock
3. **Test SELL Transaction**: Will deduct from inventory
4. **Test BUY Transaction**: Will add to inventory
5. **Test Payments**: Link to transactions to mark them as paid
6. **Check Dashboard**: View analytics after creating transactions
7. **Verify Calculations**: Manually verify discount and tax calculations
8. **Test Edge Cases**: Empty forms, zero values, negative values, etc.

## Troubleshooting

### If transaction form shows errors:
- Ensure all required fields are filled
- Check that quantities are positive
- Verify discount percentages are ≤ 100%
- Check that at least one item is added

### If inventory manipulation fails:
- Verify products and units exist
- Check quantity values (cannot be zero)
- Ensure at least one item is added

### If dashboard shows no data:
- Create some transactions first
- Check that transactions have status PAID or PARTIALLY_PAID
- Verify date ranges if filtering is added

### If payments don't link to transactions:
- Verify transaction ID is valid
- Check that transaction exists
- Ensure transaction is not already fully paid
