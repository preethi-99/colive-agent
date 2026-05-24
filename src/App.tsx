import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { seedIfEmpty } from './lib/seed';
import { RoommateList } from './components/RoommateList';
import { ExpenseTracker } from './components/ExpenseTracker';
import { ChoreBoard } from './components/ChoreBoard';
import { ChatInterface } from './components/ChatInterface';
import type { Roommate, Expense, Chore } from './types';

type Tab = 'roommates' | 'expenses' | 'chores' | 'chat';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'roommates', label: 'Roommates', emoji: '👥' },
  { id: 'expenses',  label: 'Expenses',  emoji: '💸' },
  { id: 'chores',    label: 'Chores',    emoji: '🧹' },
  { id: 'chat',      label: 'Ask Claude', emoji: '🤖' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('roommates');
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [chores, setChores]       = useState<Chore[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await seedIfEmpty();
        const [{ data: rm, error: e1 }, { data: ex, error: e2 }, { data: ch, error: e3 }] =
          await Promise.all([
            supabase.from('roommates').select('*').order('created_at'),
            supabase.from('expenses').select('*').order('date', { ascending: false }),
            supabase.from('chores').select('*').order('task_name'),
          ]);
        if (e1 ?? e2 ?? e3) throw e1 ?? e2 ?? e3;
        setRoommates((rm as Roommate[]) ?? []);
        setExpenses((ex as Expense[]) ?? []);
        setChores((ch as Chore[]) ?? []);
      } catch (err) {
        console.error(err);
        setError('Could not load house data. Check your Supabase configuration and run schema.sql.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none">🏠</span>
            <span className="font-bold text-gray-900 text-lg tracking-tight">CoLive</span>
            <span className="text-gray-300 hidden sm:block mx-1">·</span>
            <span className="text-gray-400 text-sm hidden sm:block">House Manager</span>
          </div>

          <nav className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span>{t.emoji}</span>
                <span className="hidden sm:block">{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm">Loading house data…</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-5 text-sm">
            <p className="font-semibold mb-1">Setup required</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {tab === 'roommates' && (
              <RoommateList roommates={roommates} expenses={expenses} />
            )}
            {tab === 'expenses' && (
              <ExpenseTracker expenses={expenses} roommates={roommates} />
            )}
            {tab === 'chores' && (
              <ChoreBoard
                chores={chores}
                roommates={roommates}
                onChoreUpdated={updated =>
                  setChores(prev => prev.map(c => (c.id === updated.id ? updated : c)))
                }
              />
            )}
            {tab === 'chat' && (
              <ChatInterface
                roommates={roommates}
                expenses={expenses}
                chores={chores}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
