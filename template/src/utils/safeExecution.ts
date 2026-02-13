// src/utils/safeExecution.ts

import type { TServiceResponse } from "../core/http/HttpType";
import { failure } from "../core/services/ServiceResult";

// Tipo genérico para qualquer função assíncrona
type AsyncFunction<T> = (...args: any[]) => Promise<TServiceResponse<T>>;

export const safe = <T>(fn: AsyncFunction<T>): AsyncFunction<T> => {
	return async (...args: any[]) => {
		try {
			return await fn(...args);
		} catch (error) {
			console.error("Auto-caught error:", error);
			// Aqui você pode verificar se o erro é uma instância conhecida
			if (error instanceof Error) {
				return failure("INTERNAL_SERVER_ERROR", error.message);
			}
			return failure("INTERNAL_SERVER_ERROR", "Unexpected error");
		}
	};
};
