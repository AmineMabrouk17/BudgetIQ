export type TransactionType = "income" | "expense" | "asset";
export type TransactionScope = "business" | "personal";

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType;
  title: string;
  amount: number;
  category: string;
  created_at: string;
  scope: TransactionScope;
};

export type CreateTransactionInput = {
  type: TransactionType;
  title: string;
  amount: number;
  category?: string;
  scope?: TransactionScope;
};
