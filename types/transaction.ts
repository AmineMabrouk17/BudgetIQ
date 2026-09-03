export type TransactionType = "income" | "expense" | "asset";

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType;
  title: string;
  amount: number;
  category: string;
  created_at: string;
};

export type CreateTransactionInput = {
  type: TransactionType;
  title: string;
  amount: number;
  category?: string;
};
