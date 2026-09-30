import {
  getTransactionsPage,
  type TransactionScopeFilter,
} from "@/lib/transactions";
import TransactionTable from "@/components/dashboard/TransactionTable";

/**
 * Server section behind the dashboard's transaction table.
 *
 * Only the first page is fetched here; the table takes over pagination on the
 * client through `loadMoreTransactions`.
 */
export default async function DashboardTransactions({
  scope,
}: {
  scope: TransactionScopeFilter;
}) {
  const page = await getTransactionsPage(undefined, scope);

  return (
    <TransactionTable
      transactions={page.transactions}
      nextCursor={page.nextCursor}
      scope={scope}
    />
  );
}