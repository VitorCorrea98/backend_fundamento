import { randomUUID } from "node:crypto";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { asyncLocalStorage } from "./infra/Context/AsyncContext";
import { router } from "./infra/Routes/routesEngine";
import { internalServerError } from "./utils/http";

const PORT = process.env.PORT || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

const applySecurityHeaders = (res: ServerResponse) => {
	// Previne Clickjacking (seu site não pode ser aberto num iframe de outro site)
	res.setHeader("X-Frame-Options", "DENY");

	// Previne MIME-sniffing (navegador tentar adivinhar tipo de arquivo)
	res.setHeader("X-Content-Type-Options", "nosniff");

	// Segurança estrita de transporte (HSTS) - Force HTTPS
	res.setHeader(
		"Strict-Transport-Security",
		"max-age=63072000; includeSubDomains; preload",
	);

	// Remove header que diz que você usa Node.js (Security by obscurity, mas válido)
	res.removeHeader("X-Powered-By");
};

/**
 * Middleware funcional para aplicar CORS.
 * Modifica o objeto 'res' diretamente (mutação necessária do stream http).
 */
const applyCorsHeaders = (res: ServerResponse) => {
	res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL); // Em prod, troque '*' pelo domínio do seu front
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

const server = http.createServer(
	async (req: IncomingMessage, res: ServerResponse) => {
		// 1. Logger Básico (Data | Método | URL)
		console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

		// 2. Aplicar Headers de CORS
		applySecurityHeaders(res);
		applyCorsHeaders(res);

		// 3. Tratamento de Pre-flight (OPTIONS)
		// O navegador manda um OPTIONS antes de POST/PUT. Precisamos responder rápido.
		if (req.method === "OPTIONS") {
			res.writeHead(204); // No Content
			res.end();
			return;
		}

		// 4. Execução da Rota Protegida
		try {
			const context = { requestId: randomUUID() }; // Adicione userId aqui após autenticação

			asyncLocalStorage.run(context, async () => {
				// Todo o código executado aqui dentro (router, controller, service)
				// tem acesso a esse contexto, mesmo sendo async.
				await router(req, res);
			});
		} catch (error) {
			// Red de segurança final (Catch-all)
			console.error("Critical Uncaught Error:", error);

			// Só tentamos responder se o cabeçalho ainda não foi enviado
			if (!res.headersSent) {
				internalServerError(res, "Internal Server Error - Unexpected Failure");
			}
		}
	},
);

// Inicialização do Servidor
server.listen(PORT, () => {
	console.log(`
  🚀 Server is running!
  ---------------------
  url: http://localhost:${PORT}
  env: ${process.env.NODE_ENV || "development"}
  ---------------------
  `);
});

/**
 * GRACEFUL SHUTDOWN
 * Boas práticas: Ouvir sinais de encerramento do sistema (CTRL+C ou Docker stop)
 * para fechar conexões de banco ou processos pendentes antes de sair.
 */
const shutdown = () => {
	console.log("\n🛑 Shutting down server...");
	server.close(() => {
		console.log("Server closed. Exiting process.");
		process.exit(0);
	});
};

process.on("SIGINT", shutdown); // CTRL+C
process.on("SIGTERM", shutdown); // Kill command
