import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user;

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
      </CardHeader>
      <CardContent>
        <ProfileForm
          defaultFirstName={user.firstName}
          defaultLastName={user.lastName}
          defaultEmail={user.email}
        />
      </CardContent>
    </Card>
  );
}
