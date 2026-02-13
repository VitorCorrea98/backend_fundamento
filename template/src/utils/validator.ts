// src/utils/validator.ts

import type { TServiceResponse } from "../core/http/HttpType";
import { failure, success } from "../core/services/ServiceResult";

// Um Type Guard genérico
export type Validator<T> = (data: unknown) => data is T;

export const hasKeys = <T extends object>(
	data: unknown,
	keys: (keyof T)[],
): data is T => {
	if (!data || typeof data !== "object") return false;

	// Verifica se todas as chaves existem no objeto
	return keys.every((key) => key in data);
};

/**
 * Validador para uso dentro de um chain().
 * Se o dado for null/undefined, retorna erro NOT_FOUND.
 */
export const ensureFound =
	<T>(message: string = "Registro não encontrado") =>
	(data: T | null | undefined): Promise<TServiceResponse<T>> => {
		if (!data) {
			return Promise.resolve(failure("NOT_FOUND", message));
		}
		return Promise.resolve(success("OK", data));
	};

// Exemplo de uso mais robusto (verificando tipos primitivos)
export const isString = (value: unknown): value is string =>
	typeof value === "string";
export const isNumber = (value: unknown): value is number =>
	typeof value === "number";
