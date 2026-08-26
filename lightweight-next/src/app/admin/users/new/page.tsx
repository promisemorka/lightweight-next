import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCreateUserForm } from "@/components/users/admin-create-user-form";

export default function NewUserPage() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Create user</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminCreateUserForm />
      </CardContent>
    </Card>
  );
}
