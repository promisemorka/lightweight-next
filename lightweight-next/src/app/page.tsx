import Link from "next/link";

import { auth } from "@/auth";
import { Navigation } from "@/components/nav/navigation";
import { Button } from "@/components/ui/button";

export default async function Homepage() {
  const session = await auth();

  return (
    <>
      <Navigation />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="font-heading text-6xl text-primary sm:text-7xl">
          Light Weight
        </h1>
        <p className="max-w-md text-muted-foreground">
          Plan your workouts by day, log the weights you lift, and stop
          scrolling through screenshots to remember what you did last week.
        </p>
        {session?.user ? (
          <div className="flex items-center gap-3">
            <p className="text-lg">Welcome back, {session.user.firstName}.</p>
            <Button asChild>
              <Link href="/workouts">Go to your workouts</Link>
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
