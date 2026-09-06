import { db } from './src/db/index.js';
import { budgets, users } from './src/db/schema.js';
import { eq, and } from 'drizzle-orm';

async function test() {
  try {
    const [user] = await db.select().from(users).limit(1);
    const category = 'Test API';
    const limit = '2000';
    const month = '2026-09';
    
    // Simulate what the server does
    const [existing] = await db.select().from(budgets).where(
      and(
        eq(budgets.userId, user.id),
        eq(budgets.category, category),
        eq(budgets.month, month)
      )
    );
    
    let result;
    if (existing) {
      const [updated] = await db.update(budgets).set({ limit }).where(eq(budgets.id, existing.id)).returning();
      result = updated;
    } else {
      const [inserted] = await db.insert(budgets).values({ userId: user.id, category, limit, month }).returning();
      result = inserted;
    }
    console.log("Success:", result);
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
