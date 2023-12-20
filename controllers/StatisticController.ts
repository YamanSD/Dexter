import {Request, Response} from 'express';
import {ServiceResponse, StatisticService} from '../services';
import Http from "./Http";
import {handleBadRes, verifyToken} from "./helpers";
import {Statistic} from "../model";

/**
 * Type alias for req parameter of the get all stats function
 */
type GetAllRequest = Request<
    {token: string}, // Header parameters
    {memory: number, time: number, execCount: number}, // Response body
    {}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing admin token in header
 * @param res HTTP response containing memory, time, & execution count
 * @returns res with appropriate response code and data
 */
export async function getTotalStatistics(req: GetAllRequest, res: Response): Promise<Response> {
    return verifyToken(req, res, async () => {
        const temp = await StatisticService.getTotalStatistics();

        /* check if retrieving stats was successful */
        if (temp.response === ServiceResponse.SUCCESS) {
            const statistics = temp.result as Statistic;

            return res.status(Http.OK).json({
                memory: statistics.totalMemory,
                time: statistics.totalTime,
                execCount: statistics.executionCount,
            });
        }

        return handleBadRes(res, temp.response, temp.err);
    }, true);
}
