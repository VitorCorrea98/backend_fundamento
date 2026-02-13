// src/infra/Context/AsyncContext.ts
import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
	requestId: string;
	userId?: string; // ID do usuário logado
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
