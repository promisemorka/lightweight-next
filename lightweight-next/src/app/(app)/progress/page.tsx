import Link from "next/link";
import { Trophy } from "lucide-react";

import { getPersonalRecords } from "@/actions/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function ProgressPage() {
  const records = await getPersonalRecords();

  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl text-primary">Personal records</h1>

      {records.length === 0 ? (
        <p className="text-muted-foreground">
          Log a few sets and your personal records will show up here.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercise</TableHead>
              <TableHead>Best lift</TableHead>
              <TableHead>Set on</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.exerciseId}>
                <TableCell>
                  <Link
                    href={`/exercises/${record.exerciseId}`}
                    className="capitalize hover:underline"
                  >
                    {record.exerciseName}
                  </Link>
                </TableCell>
                <TableCell className="flex items-center gap-1.5 font-medium">
                  <Trophy className="size-4 text-primary" />
                  {record.weight} {record.unit}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {dateFormatter.format(record.performedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
