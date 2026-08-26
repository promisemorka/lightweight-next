import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { adminDeleteUser, listUsers } from "@/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-primary">Manage users</h1>
        <Button asChild>
          <Link href="/admin/users/new">
            <Plus />
            New user
          </Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.isAdmin && <Badge>Admin</Badge>}
              </TableCell>
              <TableCell>
                <form action={adminDeleteUser.bind(null, user.id)}>
                  <Button variant="ghost" size="icon-sm" type="submit">
                    <Trash2 />
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
