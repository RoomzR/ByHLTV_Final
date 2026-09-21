import { execSync } from "node:child_process";

const steps = [
  "npm run db:generate",
  "npm run push --workspace=@byhltv/database",
  "npm run db:seed",
];

for (const step of steps) {
  console.log(`> ${step}`);
  execSync(step, { stdio: "inherit", cwd: process.cwd() });
}
