import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';
import { requireAuth, AuthRequest } from './src/middleware/auth.js';
import { db } from './src/db/index.js';
import { users, accounts, categories, transactions, loans, budgets } from './src/db/schema.js';
import { eq, desc, and, sum, sql, gte, lte } from 'drizzle-orm';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const [user] = await db.select().from(users).where(eq(users.uid, req.user.uid));
      res.json(user);
    } catch (error: any) {
      console.error(error); require("fs").appendFileSync("error.log", error.stack + "\n");
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/accounts", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const [user] = await db.select().from(users).where(eq(users.uid, req.user.uid));
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, user.id));
      res.json(userAccounts);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const [user] = await db.select().from(users).where(eq(users.uid, req.user.uid));
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const { type, name, institution, balance, currency } = req.body;
      const [newAccount] = await db.insert(accounts).values({
        userId: user.id,
        type,
        name,
        institution,
        balance: balance || "0",
        currency: currency || "INR",
      }).returning();
      
      res.json(newAccount);
    } catch (error: any) {
      console.error(error); require("fs").appendFileSync("error.log", error.stack + "\n");
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.get("/api/transactions", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const [user] = await db.select().from(users).where(eq(users.uid, req.user.uid));
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const userTransactions = await db.select().from(transactions)
        .where(eq(transactions.userId, user.id))
        .orderBy(desc(transactions.date));
      res.json(userTransactions);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const [user] = await db.select().from(users).where(eq(users.uid, req.user.uid));
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const { accountId, type, amount, categoryId, merchant, date, note } = req.body;
      
      const [newTransaction] = await db.insert(transactions).values({
        userId: user.id,
        accountId,
        type,
        amount,
        categoryId: categoryId || null,
        merchant,
        date,
        note,
      }).returning();
      
      // Update account balance
      const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
      if (account) {
        let newBalance = parseFloat(account.balance || "0");
        const txAmount = parseFloat(amount);
        if (type === 'income') newBalance += txAmount;
        if (type === 'expense') newBalance -= txAmount;
        
        await db.update(accounts)
          .set({ balance: newBalance.toString() })
          .where(eq(accounts.id, accountId));
      }
      
      res.json(newTransaction);
    } catch (error: any) {
      console.error(error); require("fs").appendFileSync("error.log", error.stack + "\n");
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.get("/api/budgets", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const [user] = await db.select().from(users).where(eq(users.uid, req.user.uid));
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const { month } = req.query;
      const conditions = [eq(budgets.userId, user.id)];
      if (month && typeof month === 'string') {
        conditions.push(eq(budgets.month, month));
      }
      
      const userBudgets = await db.select().from(budgets).where(and(...conditions));
      res.json(userBudgets);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const [user] = await db.select().from(users).where(eq(users.uid, req.user.uid));
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const { category, limit, month } = req.body;
      
      // Check if it already exists for this month/category
      const [existing] = await db.select().from(budgets).where(
        and(
          eq(budgets.userId, user.id),
          eq(budgets.category, category),
          eq(budgets.month, month)
        )
      );

      if (existing) {
        const [updatedBudget] = await db.update(budgets)
          .set({ limit: String(limit) })
          .where(eq(budgets.id, existing.id))
          .returning();
        res.json(updatedBudget);
      } else {
        const [newBudget] = await db.insert(budgets).values({
          userId: user.id,
          category,
          limit: String(limit),
          month,
        }).returning();
        res.json(newBudget);
      }
    } catch (error: any) {
      console.error(error); require("fs").appendFileSync("error.log", error.stack + "\n");
      res.status(500).json({ error: "Failed to create or update budget" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
