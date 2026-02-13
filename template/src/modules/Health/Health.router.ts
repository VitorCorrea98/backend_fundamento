import { IncomingMessage } from "node:http";
import { sendJson, type RouteMap } from "../../utils/http";
import { ServerResponse } from "node:http";

export const healthRoutes: RouteMap = {
	"GET:/health": async (_req: IncomingMessage, res: ServerResponse) => {
			return sendJson(res, 200, {health: true})
		},
};
