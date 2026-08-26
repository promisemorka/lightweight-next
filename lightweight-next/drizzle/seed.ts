import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { exercises } from "./schema";

const referenceExercises: Array<{
  name: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  target: string;
}> = [
  { name: "Dumbbell bench press", bodyPart: "chest", equipment: "dumbbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0289.gif", target: "pectorals" },
  { name: "Incline dumbbell bench press", bodyPart: "chest", equipment: "dumbbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0314.gif", target: "pectorals" },
  { name: "Chest dip", bodyPart: "chest", equipment: "body weight", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1430.gif", target: "pectorals" },
  { name: "Barbell lying triceps extension skull crusher", bodyPart: "upper arms", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0060.gif", target: "triceps" },
  { name: "One arm dumbbell extension", bodyPart: "upper arms", equipment: "dumbbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0346.gif", target: "triceps" },
  { name: "Tricep extension", bodyPart: "upper arms", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1720.gif", target: "triceps" },
  { name: "Barbell front raise", bodyPart: "shoulders", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0041.gif", target: "delts" },
  { name: "Dumbbell lateral raise", bodyPart: "shoulders", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0334.gif", target: "delts" },
  { name: "Wide grip pull up", bodyPart: "back", equipment: "body weight", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1429.gif", target: "lats" },
  { name: "Lat pull down", bodyPart: "back", equipment: "cable", gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif", target: "lats" },
  { name: "Straight arm lat pull down", bodyPart: "back", equipment: "cable", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0199.gif", target: "lats" },
  { name: "Machine reverse fly", bodyPart: "back", equipment: "Leverage machine", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0602.gif", target: "delts" },
  { name: "Barbell upright row", bodyPart: "shoulders", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0120.gif", target: "delts" },
  { name: "Standing barbell curl", bodyPart: "upper arms", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0106.gif", target: "biceps" },
  { name: "Preacher curl", bodyPart: "upper arms", equipment: "dumbbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1414.gif", target: "biceps" },
  { name: "Incline dumbbell curl", bodyPart: "upper arms", equipment: "dumbbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0315.gif", target: "biceps" },
  { name: "Barbell full squat", bodyPart: "upper legs", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1462.gif", target: "glutes" },
  { name: "Dumbbell lunge", bodyPart: "upper legs", equipment: "dumbbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0336.gif", target: "glutes" },
  { name: "45 degree leg press", bodyPart: "upper legs", equipment: "sled machine", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0739.gif", target: "glutes" },
  { name: "Lever seated leg curl", bodyPart: "upper legs", equipment: "leverage machine", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0599.gif", target: "glutes" },
  { name: "Lever leg extension", bodyPart: "upper legs", equipment: "leverage machine", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0585.gif", target: "quads" },
  { name: "Barbell standing calf raise", bodyPart: "lower legs", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1372.gif", target: "calves" },
  { name: "Dumbbell seated calf raise", bodyPart: "lower legs", equipment: "dumbbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1379.gif", target: "calves" },
  { name: "Barbell bench press", bodyPart: "chest", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1379.gif", target: "pectorals" },
  { name: "Dumbbell fly", bodyPart: "chest", equipment: "dumbbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0308.gif", target: "pectorals" },
  { name: "Cable fly", bodyPart: "chest", equipment: "cable", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1269.gif", target: "pectorals" },
  { name: "Barbell close-grip bench press", bodyPart: "upper arms", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0030.gif", target: "triceps" },
  { name: "Dumbbell lying single extension", bodyPart: "upper arms", equipment: "dumbbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1735.gif", target: "triceps" },
  { name: "Dumbbell standing alternating tricep kickback", bodyPart: "upper arms", equipment: "dumbbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1739.gif", target: "triceps" },
  { name: "Dumbbell bench seated press", bodyPart: "shoulders", equipment: "dumbbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1739.gif", target: "delts" },
  { name: "Cable one arm lateral raise", bodyPart: "shoulders", equipment: "cable", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0192.gif", target: "delts" },
  { name: "Barbell standing wide military press", bodyPart: "shoulders", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1457.gif", target: "delts" },
  { name: "Cable rope seated row", bodyPart: "back", equipment: "cable", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1323.gif", target: "upper back" },
  { name: "Barbell bent over row", bodyPart: "back", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0027.gif", target: "upper back" },
  { name: "Smith bent over row", bodyPart: "back", equipment: "smith machine", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1359.gif", target: "upper back" },
  { name: "Barbell deadlift", bodyPart: "upper legs", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0032.gif", target: "glutes" },
  { name: "Cable close grip curl", bodyPart: "upper arms", equipment: "cable", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/1630.gif", target: "biceps" },
  { name: "Dumbbell concentration curl", bodyPart: "upper arms", equipment: "dumbbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0297.gif", target: "biceps" },
  { name: "Barbell reverse curl", bodyPart: "upper arms", equipment: "barbell", gifUrl: "http://d205bpvrqc9yn1.cloudfront.net/0080.gif", target: "biceps" },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  await db
    .insert(exercises)
    .values(referenceExercises)
    .onConflictDoUpdate({
      target: exercises.name,
      set: {
        bodyPart: sql`excluded.body_part`,
        equipment: sql`excluded.equipment`,
        gifUrl: sql`excluded.gif_url`,
        target: sql`excluded.target`,
      },
    });

  console.log(`Seeded ${referenceExercises.length} exercises.`);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
