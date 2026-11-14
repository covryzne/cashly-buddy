// Query the installed stdio MCP server when the host's tool list needs a restart.
// No arguments: discover schemas. Tool name argument: JSON arguments from stdin.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const toolName = process.argv[2];
const args = toolName ? JSON.parse(readFileSync(0, "utf8") || "{}") : {};
const server = spawn(
  process.execPath,
  [resolve("node_modules/shadcn/dist/index.js"), "mcp"],
  {
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
  },
);
let sequence = 0;
let buffer = "";
let diagnostics = "";
const pending = new Map();
server.stderr.on("data", (data) => {
  diagnostics = (diagnostics + data).slice(-3000);
});
server.stdout.on("data", (data) => {
  buffer += data;
  let end;
  while ((end = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, end);
    buffer = buffer.slice(end + 1);
    try {
      const message = JSON.parse(line);
      const task = pending.get(message.id);
      if (!task) continue;
      clearTimeout(task.timeout);
      pending.delete(message.id);
      if (message.error) task.reject(new Error(JSON.stringify(message.error)));
      else task.resolve(message.result);
    } catch {
      /* Ignore non-protocol startup logs. */
    }
  }
});
server.on("error", (error) => {
  for (const task of pending.values()) task.reject(error);
});
server.on("exit", () => {
  for (const task of pending.values())
    task.reject(new Error(diagnostics || "MCP server exited"));
});
function request(method, params) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`MCP timeout: ${method}`));
    }, 45000);
    pending.set(id, { resolve, reject, timeout });
    server.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n",
    );
  });
}
try {
  const info = await request("initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "cashly-mcp-check", version: "1.0.0" },
  });
  server.stdin.write(
    JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) +
      "\n",
  );
  const result = toolName
    ? await request("tools/call", { name: toolName, arguments: args })
    : { server: info.serverInfo, ...(await request("tools/list", {})) };
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
} finally {
  for (const task of pending.values()) clearTimeout(task.timeout);
  server.kill();
}
