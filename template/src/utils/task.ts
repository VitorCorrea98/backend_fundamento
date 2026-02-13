// src/utils/task.ts

import type { TServiceResponse } from "../core/http/HttpType";
import { failure, success } from "../core/services/ServiceResult";

// Wrapper para qualquer operação que retorna TServiceResponse
export type Task<T> = Promise<TServiceResponse<T>>;

/**
 * CHAIN (Assíncrono)
 * Usado quando a próxima função retorna uma Promise (ex: ir ao banco).
 */
export const chain = <T, U>(
	nextFn: (data: T) => Promise<TServiceResponse<U>> | TServiceResponse<U>,
) => {
	return async (input: TServiceResponse<T>): Promise<TServiceResponse<U>> => {
		if (input.status !== "OK" && input.status !== "CREATED") {
			// TypeScript precisa saber que se falhou, o tipo muda de T para U (no fluxo de erro)
			return input as unknown as TServiceResponse<U>;
		}
		return nextFn(input.data);
	};
};

/**
 * MAP (Síncrono)
 * Usado para transformação de dados pura (ex: DTO -> Domain).
 */
export const map = <T, U>(transformFn: (data: T) => U) => {
	return (input: TServiceResponse<T>): TServiceResponse<U> => {
		if (input.status !== "OK" && input.status !== "CREATED") {
			return input as unknown as TServiceResponse<U>;
		}
		try {
			return success(input.status, transformFn(input.data));
		} catch (error) {
			// Segurança extra caso o transformFn falhe
			return failure("INTERNAL_SERVER_ERROR", "Erro de mapeamento");
		}
	};
};

/**
 * TRY TASK
 * Envolve chamadas de repositório.
 */
export const tryTask = <T>(
	fn: () => Promise<T | null>,
	errorMsg: string = "Operation failed",
) => {
	return async (): Promise<TServiceResponse<T>> => {
		try {
			const result = await fn();
			if (!result) return failure("BAD_REQUEST", errorMsg);
			return success("CREATED", result); // Assumindo CREATED para este fluxo
		} catch (error) {
			return failure(
				"INTERNAL_SERVER_ERROR",
				error instanceof Error ? error.message : errorMsg,
			);
		}
	};
};

/**
 * ENSURE (Validação de Regra de Negócio)
 * Verifica uma condição lógica. Se false, retorna erro e interrompe o pipe.
 * Se true, repassa o dado para o próximo passo.
 */
export const ensure = <T>(
	predicate: (data: T) => boolean | Promise<boolean>,
	errorMsg: string,
) => {
	return async (input: TServiceResponse<T>): Promise<TServiceResponse<T>> => {
		// Se já falhou antes, repassa o erro
		if (input.status !== "OK" && input.status !== "CREATED") {
			return input;
		}

		try {
			const isValid = await predicate(input.data);
			if (!isValid) {
				return failure("BAD_REQUEST", errorMsg); // Regra de negócio violada
			}
			return input; // Sucesso: O dado continua intacto para o próximo passo
		} catch (_error) {
			return failure(
				"INTERNAL_SERVER_ERROR",
				"Erro ao validar regra de negócio",
			);
		}
	};
};

export const tap = <T>(fn: (data: T) => void) => {
	return (input: TServiceResponse<T>) => {
		if (input.status === "OK") fn(input.data);
		return input;
	};
};
