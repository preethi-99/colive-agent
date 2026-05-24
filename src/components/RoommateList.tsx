import type { Roommate, Expense } from '../types';

interface Props {
  roommates: Roommate[];
  expenses: Expense[];
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-violet-500', 'bg-cyan-500',   'bg-orange-500', 'bg-pink-500',
];

function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function calculateBalances(
  roommates: Roommate[],
  expenses: Expense[],
): Record<string, number> {
  const b: Record<string, number> = Object.fromEntries(roommates.map(r => [r.id, 0]));
  for (const e of expenses) {
    const share = Number(e.amount) / e.split_between.length;
    for (const id of e.split_between) {
      if (id !== e.paid_by) {
        b[id] -= share;
        b[e.paid_by] += share;
      }
    }
  }
  return b;
}

export function RoommateList({ roommates, expenses }: Props) {
  const balances = calculateBalances(roommates, expenses);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Roommates</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roommates.map(r => {
          const balance = balances[r.id] ?? 0;
          return (
            <div
              key={r.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-3"
            >
              <div
                className={`w-16 h-16 rounded-full ${avatarColor(r.name)} flex items-center justify-center text-white text-xl font-bold select-none`}
              >
                {r.name[0]}
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">{r.name}</p>
                <p className="text-sm text-gray-400 mt-0.5">{r.email}</p>
              </div>
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${
                  balance > 0.005
                    ? 'bg-emerald-50 text-emerald-700'
                    : balance < -0.005
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-gray-50 text-gray-500'
                }`}
              >
                {balance > 0.005
                  ? `+$${balance.toFixed(2)} owed to you`
                  : balance < -0.005
                  ? `-$${Math.abs(balance).toFixed(2)} you owe`
                  : 'Settled up'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
