import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, numeric } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID
  name: text('name'),
  email: text('email').notNull(),
  role: text('role').default('user'), // 'user' | 'admin'
  createdAt: timestamp('created_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(), // 'bank', 'cash', 'wallet', 'credit'
  name: text('name').notNull(),
  institution: text('institution'),
  maskedIdentifier: text('masked_identifier'),
  currency: text('currency').default('INR'),
  balance: numeric('balance', { precision: 12, scale: 2 }).default('0'),
  status: text('status').default('active'), // 'active', 'archived'
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id), // null for system defaults
  name: text('name').notNull(),
  type: text('type').notNull(), // 'income' | 'expense'
  systemDefault: boolean('system_default').default(false),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  accountId: integer('account_id').references(() => accounts.id).notNull(),
  type: text('type').notNull(), // 'income', 'expense', 'transfer'
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  merchant: text('merchant'),
  date: text('date').notNull(), // YYYY-MM-DD
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const loans = pgTable('loans', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  lender: text('lender').notNull(),
  principal: numeric('principal', { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric('interest_rate', { precision: 5, scale: 2 }),
  tenure: integer('tenure').notNull(), // months
  emiAmount: numeric('emi_amount', { precision: 12, scale: 2 }).notNull(),
  dueDay: integer('due_day').notNull(),
  startDate: text('start_date').notNull(),
  status: text('status').default('active'),
});

export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  category: text('category').notNull(), // e.g. "Food", "Transport"
  limit: numeric('limit', { precision: 12, scale: 2 }).notNull(),
  month: text('month').notNull(), // YYYY-MM
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  transactions: many(transactions),
  loans: many(loans),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));
