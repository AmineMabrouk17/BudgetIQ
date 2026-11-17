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
  // A new id set means the server sent a fresh page (for example after a save).
  // Remounting resets the table's local pagination/selection against that page
  // without an effect that would fight the user's in-progress interactions.
  const pageKey = `page-${page.transactions.map((t) => t.id).join("|")}`;

  return (
    <TransactionTable
      key={pageKey}
      transactions={page.transactions}
      nextCursor={page.nextCursor}
      scope={scope}
    />
  );
}