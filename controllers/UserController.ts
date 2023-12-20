import {Request, Response} from 'express';
import {ServiceResponse, UserService} from '../services';
import Http from "./Http";
import {Statistic, User} from "../model";
import {handleBadRes, verifyToken} from "./helpers";
import {generateToken} from "../services/UserService";
import {validationResult} from "express-validator";

/**
 * Type alias for req parameter of the authenticate function
 */
type AuthRequest = Request<
    {}, // Header parameters
    {token?: string, err?: string}, // Response body
    {email: string, password: string}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing email & password in body
 * @param res HTTP response.
 * @return Either token in body, err reason, or undefined token if credentials are invalid.
 */
export async function authenticate(req: AuthRequest, res: Response): Promise<Response> {
    /* check for invalid data */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(Http.BAD).json({errs: errors});
    }

    const {email, password} = req.body;

    /* check for missing data */
    if (!email || !password) {
        return res.status(Http.BAD).json({err: "Missing data"});
    }

    /* try to generate token */
    const result = await UserService.generateToken(email, password);

    /* check for invalid credentials */
    if (result === null) {
        return res.status(Http.UNAUTHORIZED).json({token: undefined});
    }

    /* everything is good, return token */
    return res.status(Http.OK).json({token: result});
}

/**
 * Type alias for req parameter of the get all users function
 */
type GetAllRequest = Request<
    {token: string}, // Header parameters
    {users: User[]}, // Response body
    {}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request, has token in header
 * @param res HTTP response containing a list of Users in the body
 * @returns res with the appropriate code and the data
 */
export async function getAllUsers(req: GetAllRequest,
                                  res: Response): Promise<Response> {
    return verifyToken(req, res, async () => {
        /* get all users */
        const users = await UserService.getAllUsers();

        /* failed for some reason */
        if (users.response !== ServiceResponse.SUCCESS) {
            return handleBadRes(res, users.response, users.err);
        }

        return res.status(Http.OK).json({users: users.result as any[] });
    }, true);
}

/**
 * Type alias for req parameter of the get user function
 */
type GetUserRequest = Request<
    {token: string}, // Header parameters
    {user: User}, // Response body
    {}, // Request body
    {} // Request query
>;

/**
 * Used to retrieve user information.
 *
 * @param req HTTP request containing user token in the header.
 * @param res HTTP response containing user in the body.
 * @returns res with the appropriate code and the data
 */
export async function getUser(req: GetUserRequest,
                              res: Response): Promise<Response> {
    return verifyToken(req, res, async (user) => {
        return res.status(Http.OK).json({
            user: user.export
        });
    });
}

/**
 * Type alias for req parameter of the register function
 */
type RegisterRequest = Request<
    {}, // Header parameters
    {token: string}, // Response body
    {email: string, password: string}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing user information
 * @param res HTTP response containing token, if user information is valid
 * @param isAdmin if true, user becomes an admin
 * @returns res with the appropriate code and the data
 */
export async function register(req: RegisterRequest,
                               res: Response,
                               isAdmin?: boolean): Promise<Response> {
    /* check for invalid data */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(Http.BAD).json({errs: errors});
    }

    const {email, password} = req.body;

    /* check for missing data */
    if (!email || !password) {
        return res.status(Http.BAD).json({err: "Missing data"});
    }

    /* try to generate token */
    const result = await UserService.createUser(email, password, isAdmin);

    /* check for invalid credentials */
    if (result.response !== ServiceResponse.SUCCESS) {
        return handleBadRes(res, result.response, result.err);
    }

    /* everything is good, return token */
    return res.status(Http.OK).json({
            token: (await generateToken(email, password)) as string
    });
}

/**
 * Type alias for req parameter of the create user function
 */
type CreateUserRequest = Request<
    {token: string}, // Header parameters
    {}, // Response body
    {email: string, password: string, isAdmin: boolean}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing user information, and admin token in header
 * @param res HTTP response with user token in body if successful
 * @returns res with the appropriate code and the data
 */
export async function createUser(req: CreateUserRequest,
                                 res: Response): Promise<Response> {
    /* check for invalid data */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(Http.BAD).json({errs: errors});
    }

    /* extract isAdmin from body, since register does not read it */
    const {isAdmin} = req.body;

    return verifyToken(req, res, async () => {
        return await register(req, res, isAdmin);
    }, true);
}

/**
 * Type alias for req parameter of the delete user function
 */
type DeleteUserRequest = Request<
    {token: string}, // Header parameters
    {}, // Response body
    {email: string}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing user information, and admin token in header
 * @param res HTTP response with status code
 * @returns res with the appropriate code and the data
 */
export async function deleteUser(req: DeleteUserRequest,
                                 res: Response): Promise<Response> {
    /* check for invalid data */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(Http.BAD).json({errs: errors});
    }

    return verifyToken(req, res, async () => {
        const {email} = req.body;
        const deleteRes = await UserService.deleteUser(email);

        /* if deletion has succeeded */
        if (deleteRes.response === ServiceResponse.SUCCESS) {
            return res.status(Http.OK).json();
        }

        return handleBadRes(res, deleteRes.response, deleteRes.err);
    }, true);
}

/**
 * Type alias for req parameter of the set ban user function
 */
type SetBanRequest = Request<
    {token: string}, // Header parameters
    {}, // Response body
    {email: string, isBanned: boolean}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing user information, and admin token in header
 * @param res HTTP response with status code
 * @returns res with the appropriate code and the data
 */
export async function setBanUser(req: SetBanRequest,
                                 res: Response): Promise<Response> {
    /* check for invalid data */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(Http.BAD).json({errs: errors});
    }

    return verifyToken(req, res, async () => {
        const {email, isBanned} = req.body;

        if (email === process.env.SU_EMAIL) {
            return res.status(Http.BAD).json({
                err: "Cannot ban superuser"
            });
        }

        const result = await UserService.setBanUser(email, isBanned);

        /* if change has succeeded */
        if (result.response === ServiceResponse.SUCCESS) {
            return res.status(Http.OK).json();
        }

        return handleBadRes(res, result.response, result.err);
    }, true);
}

/**
 * Type alias for req parameter of the set ban user function
 */
type UpdateRequest = Request<
    {token: string}, // Header parameters
    {}, // Response body
    {newPassword: string, newEmail: string}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing user information, and user token in header
 * @param res HTTP response with status code
 * @returns res with the appropriate code and the data
 */
export async function updateUser(req: UpdateRequest,
                                 res: Response): Promise<Response> {
    /* check for invalid data */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(Http.BAD).json({errs: errors});
    }

    return verifyToken(req, res, async (user) => {
        if (user.isSuper) {
            return res.status(Http.BAD).json({
                err: "cannot modify superuser email"
            });
        }

        const {newPassword, newEmail} = req.body;

        /* set new user password */
        if (newPassword) {
            user.setPassword(newPassword);
        }

        /* set new user email */
        if (newEmail) {
            user.setEmail(newEmail);
        }

        const updateResult = await UserService.updateUser(user);

        /* check if update succeeded */
        if (updateResult.response === ServiceResponse.SUCCESS) {
            return res.status(Http.OK).json();
        }

        return handleBadRes(res, updateResult.response, updateResult.err);
    });
}
