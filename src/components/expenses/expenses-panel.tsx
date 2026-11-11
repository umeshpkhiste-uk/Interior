import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpensesManager } from "./expenses-manager";
import { PaymentsManager } from "./payments-manager";
import type { ExpenseRow, PaymentRow } from "@/lib/data/expenses";

export function ExpensesPanel({
  projectId,
  expenses,
  payments,
}: {
  projectId: string;
  expenses: ExpenseRow[];
  payments: PaymentRow[];
}) {
  return (
    <Tabs defaultValue="expenses">
      <TabsList>
        <TabsTrigger value="expenses">Expenses</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
      </TabsList>
      <TabsContent value="expenses" className="pt-4">
        <ExpensesManager projectId={projectId} expenses={expenses} />
      </TabsContent>
      <TabsContent value="payments" className="pt-4">
        <PaymentsManager projectId={projectId} payments={payments} />
      </TabsContent>
    </Tabs>
  );
}
