// src/utils/pipe.ts

/**
 * Função utilitária para encadear operações.
 */
export const pipe = <T>(val: T, ...fns: ((x: any) => any)[]) =>
	fns.reduce((prev, fn) => fn(prev), val);

/**
 * Definições de Sobrecarga (Overloads) CORRIGIDAS.
 * O retorno agora é Promise<Awaited<TipoFinal>>, o que previne o erro de "Promise<Promise<...>>".
 */
export function asyncPipe<A, B>(
	val: A,
	fn1: (x: Awaited<A>) => B,
): Promise<Awaited<B>>;
export function asyncPipe<A, B, C>(
	val: A,
	fn1: (x: Awaited<A>) => B,
	fn2: (x: Awaited<B>) => C,
): Promise<Awaited<C>>;
export function asyncPipe<A, B, C, D>(
	val: A,
	fn1: (x: Awaited<A>) => B,
	fn2: (x: Awaited<B>) => C,
	fn3: (x: Awaited<C>) => D,
): Promise<Awaited<D>>;
export function asyncPipe<A, B, C, D, E>(
	val: A,
	fn1: (x: Awaited<A>) => B,
	fn2: (x: Awaited<B>) => C,
	fn3: (x: Awaited<C>) => D,
	fn4: (x: Awaited<D>) => E,
): Promise<Awaited<E>>;
export function asyncPipe<A, B, C, D, E, F>(
	val: A,
	fn1: (x: Awaited<A>) => B,
	fn2: (x: Awaited<B>) => C,
	fn3: (x: Awaited<C>) => D,
	fn4: (x: Awaited<D>) => E,
	fn5: (x: Awaited<E>) => F,
): Promise<Awaited<F>>;
export function asyncPipe<A, B, C, D, E, F, G>(
	val: A,
	fn1: (x: Awaited<A>) => B,
	fn2: (x: Awaited<B>) => C,
	fn3: (x: Awaited<C>) => D,
	fn4: (x: Awaited<D>) => E,
	fn5: (x: Awaited<E>) => F,
	fn6: (x: Awaited<F>) => G,
): Promise<Awaited<G>>;
export function asyncPipe<A, B, C, D, E, F, G, H>(
	val: A,
	fn1: (x: Awaited<A>) => B,
	fn2: (x: Awaited<B>) => C,
	fn3: (x: Awaited<C>) => D,
	fn4: (x: Awaited<D>) => E,
	fn5: (x: Awaited<E>) => F,
	fn6: (x: Awaited<F>) => G,
	fn7: (x: Awaited<G>) => H,
): Promise<Awaited<H>>;
export function asyncPipe<A, B, C, D, E, F, G, H, I>(
	val: A,
	fn1: (x: Awaited<A>) => B,
	fn2: (x: Awaited<B>) => C,
	fn3: (x: Awaited<C>) => D,
	fn4: (x: Awaited<D>) => E,
	fn5: (x: Awaited<E>) => F,
	fn6: (x: Awaited<F>) => G,
	fn7: (x: Awaited<G>) => H,
	fn8: (x: Awaited<H>) => I,
): Promise<Awaited<I>>;
export function asyncPipe<A, B, C, D, E, F, G, H, I, J>(
	val: A,
	fn1: (x: Awaited<A>) => B,
	fn2: (x: Awaited<B>) => C,
	fn3: (x: Awaited<C>) => D,
	fn4: (x: Awaited<D>) => E,
	fn5: (x: Awaited<E>) => F,
	fn6: (x: Awaited<F>) => G,
	fn7: (x: Awaited<G>) => H,
	fn8: (x: Awaited<H>) => I,
	fn9: (x: Awaited<I>) => J,
): Promise<Awaited<J>>;

/**
 * Implementação Real
 */
export async function asyncPipe(val: any, ...fns: ((x: any) => any)[]) {
	return fns.reduce(async (prev, fn) => fn(await prev), val);
}
