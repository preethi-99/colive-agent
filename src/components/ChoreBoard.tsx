import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Modal } from './Modal';
import type { Chore, Roommate } from '../types';

interface Props {
  chores: Chore[];
  roommates: Roommate[];
  onChoreUpdated: (updated: Chore) => void;
  onChoreAdded: (c: Chore) => void;
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
];
function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function currentIsoWeek(): string {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

const FIELD = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const LABEL = 'block text-sm font-medium text-gray-700 mb-1';

function AddChoreModal({
  roommates,
  onClose,
  onSaved,
}: {
  roommates: Roommate[];
  onClose: () => void;
  onSaved: (c: Chore) => void;
}) {
  const [taskName, setTaskName]     = useState('');
  const [assignedTo, setAssignedTo] = useState(roommates[0]?.id ?? '');
  const [week, setWeek]             = useState(currentIsoWeek());
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskName.trim() || !week.trim()) return;
    setSaving(true);
    setErr(null);
    const { data, error } = await supabase
      .from('chores')
      .insert({ task_name: taskName.trim(), assigned_to: assignedTo, week: week.trim(), completed: false })
      .select()
      .single();
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSaved(data as Chore);
    onClose();
  }

  return (
    <Modal title="Add Chore" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={LABEL}>Task name</label>
          <input
            className={FIELD}
            placeholder="e.g. Vacuum living room"
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className={LABEL}>Assign to</label>
          <select
            className={FIELD}
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
          >
            {roommates.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>Week</label>
          <input
            className={FIELD}
            placeholder="e.g. 2025-W21"
            value={week}
            onChange={e => setWeek(e.target.value)}
            pattern="\d{4}-W\d{2}"
            title="Format: YYYY-Www (e.g. 2025-W21)"
            required
          />
          <p className="text-xs text-gray-400 mt-1">Format: YYYY-Www (e.g. {currentIsoWeek()})</p>
        </div>

        {err && <p className="text-sm text-rose-600">{err}</p>}

        <button
          type="submit"
          disabled={saving || !taskName.trim() || !week.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
        >
          {saving ? 'Saving…' : 'Add Chore'}
        </button>
      </form>
    </Modal>
  );
}

function ChoreCard({
  chore,
  roommate,
  onToggle,
  busy,
}: {
  chore: Chore;
  roommate: Roommate | undefined;
  onToggle: () => void;
  busy: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm transition-all ${
        chore.completed ? 'border-emerald-200 opacity-70' : 'border-gray-100'
      }`}
    >
      <button
        onClick={onToggle}
        disabled={busy}
        aria-label={chore.completed ? 'Mark incomplete' : 'Mark complete'}
        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          chore.completed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-gray-300 hover:border-indigo-400'
        } ${busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {chore.completed && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`font-medium truncate ${
            chore.completed ? 'line-through text-gray-400' : 'text-gray-900'
          }`}
        >
          {chore.task_name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{chore.week}</p>
      </div>

      {roommate && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className={`w-7 h-7 rounded-full ${avatarColor(roommate.name)} flex items-center justify-center text-white text-xs font-bold`}
          >
            {roommate.name[0]}
          </div>
          <span className="text-sm text-gray-600 hidden sm:block">{roommate.name}</span>
        </div>
      )}
    </div>
  );
}

export function ChoreBoard({ chores, roommates, onChoreUpdated, onChoreAdded }: Props) {
  const [busy, setBusy]         = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const roommateMap = Object.fromEntries(roommates.map(r => [r.id, r]));

  async function toggle(chore: Chore) {
    setBusy(chore.id);
    const { data } = await supabase
      .from('chores')
      .update({ completed: !chore.completed })
      .eq('id', chore.id)
      .select()
      .single();
    if (data) onChoreUpdated(data as Chore);
    setBusy(null);
  }

  const pending = chores.filter(c => !c.completed);
  const done    = chores.filter(c => c.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Chore Board</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Chore
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Pending ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">All done!</p>
            )}
            {pending.map(c => (
              <ChoreCard
                key={c.id}
                chore={c}
                roommate={roommateMap[c.assigned_to]}
                onToggle={() => toggle(c)}
                busy={busy === c.id}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Completed ({done.length})
          </h3>
          <div className="space-y-2">
            {done.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Nothing done yet</p>
            )}
            {done.map(c => (
              <ChoreCard
                key={c.id}
                chore={c}
                roommate={roommateMap[c.assigned_to]}
                onToggle={() => toggle(c)}
                busy={busy === c.id}
              />
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <AddChoreModal
          roommates={roommates}
          onClose={() => setShowModal(false)}
          onSaved={onChoreAdded}
        />
      )}
    </div>
  );
}
