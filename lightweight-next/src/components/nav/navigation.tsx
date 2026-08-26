import Link from "next/link";
import { Dumbbell } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/nav/user-menu";

export async function Navigation() {
  const session = await auth();

  return (
    <header className="border-b bg-background">
      <nav className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-heading flex items-center gap-2 text-xl text-primary"
        >
          <Dumbbell className="size-5" />
          Light Weight
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-4">
            <Link
              href="/workouts"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Workouts
            </Link>
            <Link
              href="/exercises"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Exercises
            </Link>
            <Link
              href="/progress"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Progress
            </Link>
            {session.user.isAdmin && (
              <Link
                href="/admin/users"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            )}
            <UserMenu
              displayName={session.user.firstName || session.user.username}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}
