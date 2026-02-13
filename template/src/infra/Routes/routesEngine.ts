// src/infra/Routes/routesEngine.ts
import type { IncomingMessage, ServerResponse } from "node:http";
import { notFound, runMiddlewareChain } from "../../utils/http";
import { routes } from "./routesBarrel";

// Cache para separar estáticas de dinâmicas na inicialização (Singleton pattern)
const staticRoutes = new Map();
const dynamicRoutes: { regex: RegExp; handler: any }[] = [];

// Inicializa separação (roda apenas uma vez quando o server sobe)
Object.entries(routes).forEach(([key, handler]) => {
	const [method, path] = key.split(":");
	if (path.includes("(") || path.includes(":")) {
		// É dinâmica (tem regex ou param)
		const regex = new RegExp(`^${method}:${path}$`);
		dynamicRoutes.push({ regex, handler });
	} else {
		// É estática (busca direta)
		staticRoutes.set(`${method}:${path}`, handler);
	}
});

export const router = async (req: IncomingMessage, res: ServerResponse) => {
	const { url, method } = req;
	const path = url?.split("?")[0] ?? "/";
	const exactKey = `${method}:${path}`;

	// 1. Tenta Match Estático (Instantâneo)
	if (staticRoutes.has(exactKey)) {
		await runMiddlewareChain(req, res, staticRoutes.get(exactKey));
		return;
	}

	// 2. Tenta Match Dinâmico (Apenas se falhar o estático)
	for (const route of dynamicRoutes) {
		if (route.regex.test(exactKey)) {
			await runMiddlewareChain(req, res, route.handler);
			return;
		}
	}

	notFound(res, `Route ${method} ${path} not found`);
};
