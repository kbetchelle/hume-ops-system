import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Expense } from "@/hooks/useExpenses";
import { format } from "date-fns";

interface ExpenseTableProps {
  expenses: Expense[];
  onDelete: (expense: Expense) => void;
}

export function ExpenseTable({ expenses, onDelete }: ExpenseTableProps) {
  return (
    <div className="border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[10px] uppercase tracking-widest">Date</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest">Category</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest">Location</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest">Description</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-right">Amount</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No expenses recorded
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="text-xs">
                  {format(new Date(expense.expense_date), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-xs">{expense.category}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{expense.location}</TableCell>
                <TableCell className="text-xs max-w-[300px] truncate">{expense.description}</TableCell>
                <TableCell className="text-right font-medium">
                  ${Number(expense.amount).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(expense)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
