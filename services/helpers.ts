import Response from "./Response";
import {
    ExclusionConstraintError,
    ForeignKeyConstraintError,
    UniqueConstraintError,
    UnknownConstraintError,
    ValidationError
} from "sequelize";

/**
 * Type alias for the return type of CRUD functions.
 *
 * >- Response: response code for the operation.
 * >- output: Generic output of the function.
 */
export type Result<T = undefined> = Promise<{
    response: Response,
    err?: Error | unknown,
    result?: T
}>;

/**
 * @param e generated error.
 * @returns a proper response for the error.
 */
export function handleError(e: any) {
    if (e instanceof ValidationError) {
        return {
            err: e,
            response: Response.INVALID_IN
        };
    } else if (e instanceof ExclusionConstraintError) {
        return {
            err: e,
            response: Response.NOT_EXIST
        };
    } else if (e instanceof ForeignKeyConstraintError) {
        return {
            err: e,
            response: Response.INVALID_IN
        };
    } else if (e instanceof UnknownConstraintError) {
        return {
            err: e,
            response: Response.INVALID_IN
        };
    } else if (e instanceof UniqueConstraintError) {
        return {
            err: e,
            response: Response.ALREADY_EXISTS
        };
    } else {
        return {
            err: e,
            response: Response.INTERNAL
        };
    }
}
