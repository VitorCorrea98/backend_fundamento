import { healthRoutes } from "../../modules/Health";
import { prefixRoutes, type RouteMap } from "../../utils/http";

// Combina todos os objetos de rota em um só (Spread Operator)
const internalRoutes: RouteMap = {
	...healthRoutes,
};

export const routes: RouteMap = prefixRoutes(internalRoutes, "/api");
