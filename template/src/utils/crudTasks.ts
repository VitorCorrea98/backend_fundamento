import type { IRepository } from "../core/ORM/ORMTypes";
import { tryTask } from "./task";

/**
 * Task genérica para buscar por ID com tratamento de erro.
 */
export const taskFindById = <T>(
	repo: IRepository<T>,
	id: string,
	errorMsg: string = "Registro não encontrado",
) => {
	return tryTask(() => repo.findById(id), errorMsg);
};

/**
 * Task genérica para atualizar registro.
 * Aceita Partial<T> para atualizações parciais.
 */
export const taskUpdate = <T>(
	repo: IRepository<T>,
	id: string,
	data: Partial<T>,
	errorMsg: string = "Erro ao atualizar registro",
) => {
	return tryTask(() => repo.update(id, data), errorMsg);
};

/**
 * Task genérica para deletar.
 */
export const taskDelete = <T>(
	repo: IRepository<T>,
	id: string,
	errorMsg: string = "Erro ao deletar registro",
) => {
	return tryTask(() => repo.delete(id), errorMsg);
};
