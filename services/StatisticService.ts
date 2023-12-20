import {Statistic} from "../model";
import Response from "./Response";
import {handleError, Result} from "./helpers";
import 'dotenv/config';
import {getUser, superUser} from "./UserService";

/**
 * @param uid of the statistic, to initialize the stats for.
 * @returns created statistics if successful.
 *          Otherwise, reason of error & error.
 */
export async function createStatistic(uid: number): Result<Statistic> {
    try {
        return {
            result: await Statistic.create({
                uid: uid
            }),
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param statistic modified statistic, saved to database.
 */
export async function updateStatistic(statistic: Statistic): Result {
    try {
        await statistic.save();

        return {
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param email of the user
 * @returns the statistic belonging to the email
 */
export async function getStatistic(email: string): Result<Statistic> {
    try {
        const user = await getUser(email);

        if (user.response !== Response.SUCCESS || !user.result) {
            return {
                response: user.response,
                err: user.err
            };
        }

        const statistic = await Statistic.findByPk(user.result.uid);

        if (!statistic) {
            return {
                response: Response.NOT_EXIST
            };
        }

        return {
            response: Response.SUCCESS,
            result: statistic as Statistic
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param email of the user to delete statistic
 */
export async function deleteStatistic(email: string): Result {
    try {
        const statistic: Statistic | undefined = (await getStatistic(email)).result;

        if (!statistic) {
            return {
                response: Response.NOT_EXIST
            };
        }

        await statistic.destroy();

        return {
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @returns the total statistics
 */
export async function getTotalStatistics(): Result<Statistic> {
    const suResponse = await superUser();

    /* if successful return */
    if (suResponse.response === Response.SUCCESS && suResponse.result) {
        return {
            response: Response.SUCCESS,
            result: await (suResponse.result).getStatistics()
        };
    }

    return {
        response: suResponse.response,
        err: suResponse.err
    };
}

/**
 * Updates user statistics.
 *
 * @param email of the user
 * @param time spent by user
 * @param memory spent by user
 * @param execCount number of executions by user, default 1
 */
export async function logStatistics(email: string,
                                    time: number,
                                    memory: number,
                                    execCount?: number): Result {
    try {
        /* get the total statistics of the application */
        let temp = await getTotalStatistics();

        /* failed to fetch total statistics */
        if (temp.response !== Response.SUCCESS) {
            return {
                response: Response.INTERNAL
            };
        }

        /* check email, in order not to double count superuser usage */
        if (email !== process.env.SU_EMAIL) {
            const statistic: Statistic | undefined = (await getStatistic(email)).result;

            if (!statistic) {
                return {
                    response: Response.NOT_EXIST
                };
            }

            statistic.incrementMemory(memory);
            statistic.incrementTime(time);
            statistic.incrementExec(execCount);

            await updateStatistic(statistic);
        }

        /* total statistics */
        const totalStatistics = temp.result as Statistic;

        totalStatistics.incrementMemory(memory);
        totalStatistics.incrementTime(time);
        totalStatistics.incrementExec(execCount);

        return await updateStatistic(totalStatistics);
    } catch (e) {
        return handleError(e);
    }
}
