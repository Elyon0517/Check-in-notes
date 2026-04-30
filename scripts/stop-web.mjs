import { execFileSync } from "node:child_process";

const port = Number(process.env.PORT || 5002);

function getListeningPids() {
  try {
    const output = execFileSync("lsof", [
      "-ti",
      `TCP:${port}`,
      "-sTCP:LISTEN",
    ], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return [...new Set(output.trim().split("\n").filter(Boolean))];
  } catch {
    return [];
  }
}

const pids = getListeningPids();

if (pids.length === 0) {
  console.log(`No local web server is listening on port ${port}.`);
  process.exit(0);
}

for (const pid of pids) {
  process.kill(Number(pid), "SIGTERM");
}

console.log(`Stopped ${pids.length} process${pids.length === 1 ? "" : "es"} on port ${port}.`);
