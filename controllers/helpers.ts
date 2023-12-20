import {ServiceResponse, UserService} from "../services";
import {Response, Request} from 'express';
import Http from "./Http";
import {User} from "../model";
import {ExecErrResponse} from "../exec";

/**
 * @param res HTTP response.
 * @returns the response.
 *
 * Takes proper action on a bad HTTP render.
 */
export function handleBadRender(res: Response): Response {
    res.redirect(Http.UNAUTHORIZED, '/auth');
    return res;
}

/**
 * @param res HTTP response instance to return
 * @param response response code from service function
 * @param err error from service function
 * @returns appropriate HTTP response code with the error message in the body, if needed.
 */
export function handleBadRes(res: Response, response: ServiceResponse, err?: unknown): Response {
    switch (response) {
        case ServiceResponse.INVALID_IN:
            return res.status(Http.BAD).json({err: err});
        case ServiceResponse.ALREADY_EXISTS:
            return res.status(Http.ALREADY_EXISTS).json({err: err});
        case ServiceResponse.INTERNAL:
            return res.status(Http.INTERNAL).json({err: err});
        case ServiceResponse.NOT_EXIST:
            return res.status(Http.NOT_FOUND).json({err: err});
        default:
            return res.status(Http.INTERNAL).json({err: err});
    }
}

/**
 * Maps a bad exec response to an HTTP status.
 *
 * @param res HTTP response
 * @param code error code
 * @param e encountered error
 * @returns the response with the appropriate code.
 */
export function handleBadExec(res: Response,
                              code: ExecErrResponse,
                              e?: unknown): Response {
    switch (code) {
        case ExecErrResponse.CONT_CRE_ERR:
        case ExecErrResponse.CONT_START_ERR:
        case ExecErrResponse.CONT_EXEC_ERR:
        case ExecErrResponse.EXEC_START_ERR:
            return res.status(Http.INSUFFICIENT_RESOURCES).json(
                {
                    err: e,
                    hint: "maybe using an invalid version"
                }
            );
        case ExecErrResponse.NO_LANG_ERR:
            return res.status(Http.NOT_FOUND).json();
        case ExecErrResponse.TIMEOUT_ERR:
            return res.status(Http.TIMEOUT).json();
        case ExecErrResponse.NO_IMAGE:
            return res.status(Http.NOT_FOUND).json({err: "no image found"});
        case ExecErrResponse.STREAM_ERR:
        case ExecErrResponse.LOG_ERR:
        case ExecErrResponse.INTERNAL_ERR:
        default:
            return res.status(Http.INTERNAL).json({err: e});
    }
}

/**
 * Type alias for the callback function used in VerifyToken
 */
type Callback = (user: User) => Promise<Response> | Response;

/**
 * @param req HTTP request
 * @param res HTTP response
 * @param callback called if the token is valid
 * @param isAdmin if true indicates that the calling controller requires
 *        admin privileges.
 * @param isSuper if true indicates that the calling controller requires
 *        superuser privileges.
 * @param foreignToken token provided through some other form other than the header.
 *        Used by views, thus when true the user is redirected.
 * @param isView true for view rendering.
 * @returns response of the callback or a bad response if the token
 *          is invalid.
 */
export async function verifyToken(req: Request,
                                  res: Response,
                                  callback: Callback,
                                  isAdmin?: boolean,
                                  isSuper?: boolean,
                                  foreignToken?: string,
                                  isView?: boolean): Promise<Response> {
    /* JWT token */
    let token: string | undefined = foreignToken ?? req.headers.authorization;

    /* check for missing data */
    if (!token) {
        if (isView) {
            return handleBadRender(res);
        }

        return res.status(Http.UNAUTHORIZED).json({err: "Missing token"});
    }

    // /* extract actual token (if using Bearer) */
    // token = token.split(' ')[1];

    /* container for the token user */
    const tokenUser: {uid: string | null} = { uid: null };

    /* verify token */
    await UserService.verifyToken(token, tokenUser);

    /* check if token is invalid */
    if (!tokenUser.uid) {
        if (isView) {
            return handleBadRender(res);
        }

        return res.status(Http.UNAUTHORIZED).json({err: "Invalid token"});
    }

    /* get user */
    const temp = await UserService.getUser(tokenUser.uid);

    /* check for failure */
    if (temp.response !== ServiceResponse.SUCCESS) {
        if (isView) {
            return handleBadRender(res);
        }

        return handleBadRes(res, temp.response, temp.err);
    }

    /* extract user */
    const user = temp.result as User;

    /* check for super privileges */
    if (isSuper && user.email !== process.env.SU_EMAIL as string) {
        if (isView) {
            return handleBadRender(res);
        }

        return res.status(Http.UNAUTHORIZED).json({err: "Not superuser"});
    }

    /* check if user is an admin and not banned */
    if (user.isBanned || (isAdmin && !user.isAdmin)) {
        if (isView) {
            return handleBadRender(res);
        }

        return res.status(Http.UNAUTHORIZED).json({err: "Not an admin"});
    }

    return callback(temp.result as User);
}
