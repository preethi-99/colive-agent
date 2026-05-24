import Anthropic from '@anthropic-ai/sdk';
import type { Roommate, Expense, Chore, Message } from '../types';

// dangerouslyAllowBrowser is required for browser-side SDK usage.
// In production, proxy this through a Supabase Edge Function.
const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY as string,
  dangerouslyAllowBrowser: true,
});

function buildSystemPrompt(
  roommates: Roommate[],
  expenses: Expense[],
  chores: Chore[],
): string {
  const nameOf = (id: string) => roommates.find(r => r.id === id)?.name ?? id;

  const balances: Record<string, number> = Object.fromEntries(
    roommates.map(r => [r.id, 0]),
  );
  for (const e of expenses) {
    const share = Number(e.amount) / e.split_between.length;
    for (const id of e.split_between) {
      if (id !== e.paid_by) {
        balances[id] -= share;
        balances[e.paid_by] += share;
      }
    }
  }

  const expenseLines = expenses
    .map(e =>
      `  • ${e.description}: $${Number(e.amount).toFixed(2)} paid by ${nameOf(e.paid_by)} on ${e.date}` +
      `, split between ${e.split_between.map(nameOf).join(', ')}`,
    )
    .join('\n');

  const balanceLines = roommates
    .map(r => {
      const b = balances[r.id];
      const sign = b >= 0 ? '+' : '';
      const label = b > 0 ? 'is owed' : b < 0 ? 'owes' : 'settled up';
      return `  • ${r.name}: ${sign}$${b.toFixed(2)} (${label})`;
    })
    .join('\n');

  const choreLines = chores
    .map(c => `  • ${c.task_name} → ${nameOf(c.assigned_to)} [${c.completed ? 'DONE' : 'PENDING'}] (${c.week})`)
    .join('\n');

  return `You are the CoLive house manager AI. The house has 4 roommates: ${roommates.map(r => r.name).join(', ')}.

EXPENSES (${expenses.length} total, $${expenses.reduce((s, e) => s + Number(e.amount), 0).toFixed(2)} combined):
${expenseLines}

NET BALANCES (positive = is owed money, negative = owes money):
${balanceLines}

CHORES THIS WEEK:
${choreLines}

Answer questions about the house concisely and helpfully. When discussing money, always show exact amounts.`;
}

export async function chat(
  messages: Message[],
  roommates: Roommate[],
  expenses: Expense[],
  chores: Chore[],
  onChunk: (text: string) => void,
): Promise<void> {
  const stream = client.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: buildSystemPrompt(roommates, expenses, chores),
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });

  stream.on('text', onChunk);
  await stream.finalMessage();
}
