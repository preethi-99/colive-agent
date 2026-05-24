import type { Expense, Roommate } from '../types';

interface Props {
  expenses: Expense[];
  roommates: Roommate[];
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

export function ExpenseTracker({ expenses, roommates }: Props) {
  const nameMap = Object.fromEntries(roommates.map(r => [r.id, r.name]));
  const balances = calculateBalances(roommates, expenses);
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
        <span className="text-sm text-gray-400">
          {expenses.length} expenses · ${total.toFixed(2)} total
        </span>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {roommates.map(r => {
          const b = balances[r.id] ?? 0;
          return (
            <div
              key={r.id}
              className={`rounded-xl border p-4 ${
                b > 0.005
                  ? 'bg-emerald-50 border-emerald-200'
                  : b < -0.005
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <p className="text-sm font-medium text-gray-700">{r.name}</p>
              <p
                className={`text-xl font-bold mt-1 ${
                  b > 0.005
                    ? 'text-emerald-700'
                    : b < -0.005
                    ? 'text-rose-700'
                    : 'text-gray-400'
                }`}
              >
                {b >= 0 ? '+' : ''}${b.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {b > 0.005 ? 'is owed' : b < -0.005 ? 'owes' : 'settled'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Expense table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
              <th className="text-left px-5 py-3">Description</th>
              <th className="text-left px-5 py-3">Paid by</th>
              <th className="text-left px-5 py-3 hidden sm:table-cell">Split</th>
              <th className="text-right px-5 py-3">Amount</th>
              <th className="text-right px-5 py-3 hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map(e => (
              <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3.5 text-gray-900 font-medium">{e.description}</td>
                <td className="px-5 py-3.5 text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                      {nameMap[e.paid_by]?.[0]}
                    </span>
                    {nameMap[e.paid_by]}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-400 hidden sm:table-cell">
                  {e.split_between.length === roommates.length
                    ? 'Everyone'
                    : e.split_between.map(id => nameMap[id]).join(', ')}
                </td>
                <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                  ${Number(e.amount).toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right text-gray-400 hidden sm:table-cell">
                  {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
