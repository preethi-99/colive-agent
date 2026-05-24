export interface Roommate {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  amount: number;
  paid_by: string;
  description: string;
  date: string;
  split_between: string[];
}

export interface Chore {
  id: string;
  task_name: string;
  assigned_to: string;
  completed: boolean;
  week: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
