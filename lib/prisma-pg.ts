import { PrismaPg } from "@prisma/adapter-pg";

/** Keep each checked-out transaction connection sequential, including relation
 * queries generated internally by Prisma. Different connections remain parallel.
 */
export class SequentialPrismaPg extends PrismaPg {
  override async connect() {
    const adapter = await super.connect();
    const startTransaction = adapter.startTransaction.bind(adapter);
    adapter.startTransaction = async (isolationLevel) => {
      const transaction = await startTransaction(isolationLevel);
      let pending: Promise<void> = Promise.resolve();
      const enqueue = <T>(operation: () => Promise<T>): Promise<T> => {
        const result = pending.then(operation);
        // Preserve the original rejection for the caller while allowing rollback
        // and connection cleanup to run after a failed query.
        pending = result.then(
          () => undefined,
          () => undefined,
        );
        return result;
      };
      const queryRaw = transaction.queryRaw.bind(transaction);
      const executeRaw = transaction.executeRaw.bind(transaction);
      const commit = transaction.commit.bind(transaction);
      const rollback = transaction.rollback.bind(transaction);
      transaction.queryRaw = (query) => enqueue(() => queryRaw(query));
      transaction.executeRaw = (query) => enqueue(() => executeRaw(query));
      transaction.commit = () => enqueue(commit);
      transaction.rollback = () => enqueue(rollback);
      return transaction;
    };
    return adapter;
  }
}
