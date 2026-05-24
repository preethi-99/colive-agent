import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Modal } from './Modal';
import type { Roommate, Expense } from '../types';

interface Props {
  roommates: Roommate[];
  expenses: Expense[];
  onRoommateAdded: (r: Roommate) => void;
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

const FIELD = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const LABEL = 'block text-sm font-medium text-gray-700 mb-1';

function AddRoommateModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (r: Roommate) => void;
}) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    setErr(null);
    const { data, error } = await supabase
      .from('roommates')
      .insert({ name: name.trim(), email: email.trim() })
      .select()
      .single();
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSaved(data as Roommate);
    onClose();
  }

  return (
    <Modal title="Add Roommate" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={LABEL}>Name</label>
          <input
            className={FIELD}
            placeholder="e.g. Jordan"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label className={LABEL}>Email</label>
          <input
            type="email"
            className={FIELD}
            placeholder="jordan@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button
          type="submit"
          disabled={saving || !name.trim() || !email.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
        >
          {saving ? 'Saving…' : 'Add Roommate'}
        </button>
      </form>
    </Modal>
  );
}

export function RoommateList({ roommates, expenses, onRoommateAdded }: Props) {
  const [showModal, setShowModal] = useState(false);
  const balances = calculateBalances(roommates, expenses);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Roommates</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Roommate
        </button>
      </div>

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

      {showModal && (
        <AddRoommateModal
          onClose={() => setShowModal(false)}
          onSaved={onRoommateAdded}
        />
      )}
    </div>
  );
}
