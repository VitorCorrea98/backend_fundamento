import type { IncomingMessage, ServerResponse } from "node:http";
import { HTTP_STATUS, type THttpStatusCode } from "../core/http/HttpType";

// Tipo genérico para definir a assinatura de um Controller
export type Controller = (
	req: IncomingMessage,
	res: ServerResponse,
) => Promise<void>;

export type Middleware = (
	req: IncomingMessage,
	res: ServerResponse,
	next: () => Promise<void>,
) => Promise<void>;

export interface IRouteConfig {
	handler: Controller;
	middlewares?: Middleware[];
}

// O RouteMap agora aceita tanto um Controller direto quanto um objeto de configuração
export type RouteMap = Record<string, Controller | IRouteConfig>;

export const runMiddlewareChain = async (
	req: IncomingMessage,
	res: ServerResponse,
	route: Controller | IRouteConfig,
) => {
	// Se for apenas uma função, executa diretamente
	if (typeof route === "function") {
		return await route(req, res);
	}

	const { handler, middlewares = [] } = route;
	let index = 0;

	// Função recursiva para percorrer a lista de middlewares
	const next = async (): Promise<void> => {
		if (index < middlewares.length) {
			const middleware = middlewares[index++];
			return await middleware(req, res, next);
		}
		// Após todos os middlewares, executa o controller final
		return await handler(req, res);
	};

	await next();
};

const MAX_SIZE = 1e6; // 1MB

// 1. O Parser de Body (Lida com Streams assincronamente)
export const parseBody = <T>(req: IncomingMessage): Promise<T> => {
	return new Promise((resolve, reject) => {
		let body = "";
		let size = 0;

		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > MAX_SIZE) {
				// Importante: Destruir a stream para parar de receber dados
				req.destroy();
				reject(new Error("PAYLOAD_TOO_LARGE"));
				return;
			}
			body += chunk.toString();
		});

		req.on("end", () => {
			try {
				// Se não tiver corpo, retorna null ou objeto vazio
				if (!body) resolve({} as T);
				else resolve(JSON.parse(body));
			} catch (error) {
				reject(new Error("Invalid JSON format"));
			}
		});

		req.on("error", (err) => {
			reject(err);
		});
	});
};

export const sendJson = (
	res: ServerResponse,
	statusCode: THttpStatusCode,
	data: unknown,
): void => {
	res.writeHead(statusCode, { "Content-Type": "application/json" });
	res.end(JSON.stringify(data));
};

export const prefixRoutes = (routes: RouteMap, prefix: string): RouteMap => {
	const prefixedRoutes: RouteMap = {};

	for (const key in routes) {
		const [method, path] = key.split(":");
		// Garante que não teremos barras duplas se o path já começar com /
		const normalizedPath = path.startsWith("/") ? path : `/${path}`;

		// Nova chave formatada (Ex: GET:/api/users)
		const newKey = `${method}:${prefix}${normalizedPath}`;
		prefixedRoutes[newKey] = routes[key];
	}

	return prefixedRoutes;
};

// Helpers semânticos (Opcional, mas muito elegante no estilo funcional)
export const ok = (res: ServerResponse, data: unknown) =>
	sendJson(res, HTTP_STATUS.OK, data);

export const created = (res: ServerResponse, data: unknown) =>
	sendJson(res, HTTP_STATUS.CREATED, data);

export const accepted = (res: ServerResponse, data: unknown) =>
	sendJson(res, HTTP_STATUS.ACCEPTED, data);

export const noContent = (res: ServerResponse, data: unknown) =>
	sendJson(res, HTTP_STATUS.NO_CONTENT, data);

export const partialContent = (res: ServerResponse, data: unknown) =>
	sendJson(res, HTTP_STATUS.PARTIAL_CONTENT, data);

export const badRequest = (res: ServerResponse, message: string) =>
	sendJson(res, HTTP_STATUS.BAD_REQUEST, { error: message });

export const unauthorized = (res: ServerResponse, message: string) =>
	sendJson(res, HTTP_STATUS.UNAUTHORIZED, { error: message });

export const forbidden = (res: ServerResponse, message: string) =>
	sendJson(res, HTTP_STATUS.FORBIDDEN, { error: message });

export const notFound = (res: ServerResponse, message: string) =>
	sendJson(res, HTTP_STATUS.NOT_FOUND, { error: message });

export const methodNotAllowed = (res: ServerResponse, message: string) =>
	sendJson(res, HTTP_STATUS.METHOD_NOT_ALLOWED, { error: message });

export const internalServerError = (res: ServerResponse, message: string) =>
	sendJson(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, { error: message });

export const badGateway = (res: ServerResponse, message: string) =>
	sendJson(res, HTTP_STATUS.BAD_GATEWAY, { error: message });

export const serviceUnavailable = (res: ServerResponse, message: string) =>
	sendJson(res, HTTP_STATUS.SERVICE_UNAVAILABLE, { error: message });

export const gatwayTimeout = (res: ServerResponse, message: string) =>
	sendJson(res, HTTP_STATUS.GATEWAY_TIMEOUT, { error: message });
