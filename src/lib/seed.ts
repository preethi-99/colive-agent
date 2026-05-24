import { supabase } from './supabase';
import type { Roommate } from '../types';

function isoWeek(): string {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export async function seedIfEmpty(): Promise<void> {
  const { data: existing } = await supabase.from('roommates').select('id').limit(1);
  if (existing && existing.length > 0) return;

  const { data: roommates, error } = await supabase
    .from('roommates')
    .insert([
      { name: 'Preethi', email: 'preethi@colive.app' },
      { name: 'Alex',    email: 'alex@colive.app' },
      { name: 'Jordan',  email: 'jordan@colive.app' },
      { name: 'Sam',     email: 'sam@colive.app' },
    ])
    .select();

  if (error || !roommates) {
    console.error('Seed: failed to insert roommates', error);
    return;
  }

  const [preethi, alex, jordan, sam] = roommates as Roommate[];
  const allIds = roommates.map((r: Roommate) => r.id);

  await supabase.from('expenses').insert([
    {
      amount: 120.00,
      paid_by: preethi.id,
      description: 'Groceries – weekly shop',
      date: daysAgo(6),
      split_between: allIds,
    },
    {
      amount: 85.00,
      paid_by: alex.id,
      description: 'Internet bill',
      date: daysAgo(5),
      split_between: allIds,
    },
    {
      amount: 45.00,
      paid_by: jordan.id,
      description: 'Cleaning supplies',
      date: daysAgo(3),
      split_between: allIds,
    },
    {
      amount: 200.00,
      paid_by: sam.id,
      description: 'Shared couch',
      date: daysAgo(10),
      split_between: allIds,
    },
    {
      amount: 60.00,
      paid_by: preethi.id,
      description: 'Netflix + Spotify',
      date: daysAgo(1),
      split_between: allIds,
    },
  ]);

  const week = isoWeek();
  await supabase.from('chores').insert([
    { task_name: 'Vacuum living room', assigned_to: preethi.id, completed: true,  week },
    { task_name: 'Clean kitchen',      assigned_to: alex.id,    completed: false, week },
    { task_name: 'Take out trash',     assigned_to: jordan.id,  completed: false, week },
    { task_name: 'Mop floors',         assigned_to: sam.id,     completed: false, week },
  ]);
}
