import net from "net";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";
const server = net.createServer((socket) => {
    console.log("Client connected");
    // Spawn the MCP server process
    const mcpProcess = spawn("node", [join(__dirname, "index.js")], {
        stdio: ["pipe", "pipe", "inherit"],
        env: process.env,
    });
    // Pipe socket to MCP process stdin/stdout
    socket.pipe(mcpProcess.stdin);
    mcpProcess.stdout.pipe(socket);
    // Handle disconnection
    socket.on("end", () => {
        console.log("Client disconnected");
        mcpProcess.kill();
    });
    socket.on("error", (err) => {
        console.error("Socket error:", err);
        mcpProcess.kill();
    });
    mcpProcess.on("exit", (code) => {
        console.log(`MCP process exited with code ${code}`);
        socket.end();
    });
});
server.listen(PORT, HOST, () => {
    console.log(`TCP wrapper listening on ${HOST}:${PORT}`);
    console.log("Ready to accept MCP connections");
});
// Keep the process running
process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    server.close(() => {
        process.exit(0);
    });
});
