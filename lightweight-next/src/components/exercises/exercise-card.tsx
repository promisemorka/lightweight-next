import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ExerciseCard({
  exercise,
  href,
}: {
  exercise: {
    id: number;
    name: string;
    gifUrl: string;
    bodyPart: string;
    target: string;
  };
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full overflow-hidden transition-colors hover:bg-muted/50">
        <div className="relative aspect-square bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            className="size-full object-cover"
          />
        </div>
        <CardContent className="grid gap-1 pt-4">
          <p className="font-medium capitalize">{exercise.name}</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">{exercise.bodyPart}</Badge>
            <Badge variant="secondary">{exercise.target}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
