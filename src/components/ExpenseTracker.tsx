import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Modal } from './Modal';
import type { Expense, Roommate } from '../types';

interface Props {
  expenses: Expense[];
  roommates: Roommate[];
  onExpenseAdded: (e: Expense) => void;
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

const FIELD = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const LABEL = 'block text-sm font-medium text-gray-700 mb-1';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function AddExpenseModal({
  roommates,
  onClose,
  onSaved,
}: {
  roommates: Roommate[];
  onClose: () => void;
  onSaved: (e: Expense) => void;
}) {
  const [description, setDescription]   = useState('');
  const [amount, setAmount]             = useState('');
  const [paidBy, setPaidBy]             = useState(roommates[0]?.id ?? '');
  const [splitBetween, setSplitBetween] = useState<string[]>(roommates.map(r => r.id));
  const [date, setDate]                 = useState(today());
  const [saving, setSaving]             = useState(false);
  const [err, setErr]                   = useState<string | null>(null);

  function toggleSplit(id: string) {
    setSplitBetween(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !amount || splitBetween.length === 0) return;
    setSaving(true);
    setErr(null);
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        description: description.trim(),
        amount: parseFloat(amount),
        paid_by: paidBy,
        split_between: splitBetween,
        date,
      })
      .select()
      .single();
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSaved(data as Expense);
    onClose();
  }

  return (
    <Modal title="Add Expense" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={LABEL}>Description</label>
          <input
            className={FIELD}
            placeholder="e.g. Groceries"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className={LABEL}>Amount ($)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={FIELD}
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
        </div>

        <div>
          <label className={LABEL}>Paid by</label>
          <select
            className={FIELD}
            value={paidBy}
            onChange={e => setPaidBy(e.target.value)}
          >
            {roommates.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>Split between</label>
          <div className="space-y-2 mt-1">
            {roommates.map(r => (
              <label key={r.id} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitBetween.includes(r.id)}
                  onChange={() => toggleSplit(r.id)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm text-gray-700">{r.name}</span>
              </label>
            ))}
          </div>
          {splitBetween.length === 0 && (
            <p className="text-xs text-rose-500 mt-1">Select at least one person.</p>
          )}
        </div>

        <div>
          <label className={LABEL}>Date</label>
          <input
            type="date"
            className={FIELD}
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>

        {err && <p className="text-sm text-rose-600">{err}</p>}

        <button
          type="submit"
          disabled={saving || !description.trim() || !amount || splitBetween.length === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
        >
          {saving ? 'Saving…' : 'Add Expense'}
        </button>
      </form>
    </Modal>
  );
}

export function ExpenseTracker({ expenses, roommates, onExpenseAdded }: Props) {
  const [showModal, setShowModal] = useState(false);
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
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {expenses.length} expenses · ${total.toFixed(2)} total
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Expense
          </button>
        </div>
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

      {showModal && (
        <AddExpenseModal
          roommates={roommates}
          onClose={() => setShowModal(false)}
          onSaved={onExpenseAdded}
        />
      )}
    </div>
  );
}
