import {Request, Response} from 'express';
import {ServiceResponse, LanguageService} from '../services';
import Http from "./Http";
import {handleBadRes, verifyToken} from "./helpers";
import {Language} from "../model";


/**
 * Type alias for req parameter of the create a language function
 */
type CreateLanguage = Request<
    {token: string}, // Header parameters
    {lang: Language}, // Response body
    {name: string, startCommand: string, mainFile: string, timeLimit?: number}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing admin token in header
 * @param res HTTP response containing the created language in the body
 * @returns res with appropriate response code and data
 */
export async function createLanguage(req: CreateLanguage, res: Response): Promise<Response> {
    return verifyToken(req, res, async () => {
        const {name, startCommand, mainFile, timeLimit} = req.body;

        /* check for missing data */
        if (!name || !startCommand || !mainFile) {
            return res.status(Http.BAD).json({err: "Missing info"});
        }

        /* create language */
        const temp = await LanguageService.createLanguage(name, startCommand, mainFile, timeLimit);

        /* check if retrieving stats was successful */
        if (temp.response === ServiceResponse.SUCCESS && temp.result) {
            const result = temp.result as Language;

            return res.status(Http.OK).json({
                lang: result
            });
        }

        return handleBadRes(res, temp.response, temp.err);
    }, true, true);
}

/**
 * Type alias for req parameter of the delete user function
 */
type DeleteLangRequest = Request<
    {token: string}, // Header parameters
    {}, // Response body
    {name: string}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing version to be deleted
 * @param res HTTP response with status code
 * @returns res with the appropriate code and the data
 */
export async function deleteLanguage(req: DeleteLangRequest,
                                  res: Response): Promise<Response> {
    return verifyToken(req, res, async () => {
        const {name} = req.body;
        const deleteRes = await LanguageService.deleteLanguage(name);

        /* if deletion has succeeded */
        if (deleteRes.response === ServiceResponse.SUCCESS) {
            return res.status(Http.OK).json({
                result: deleteRes
            });
        }

        return handleBadRes(res, deleteRes.response, deleteRes.err);
    }, true, true);
}

/**
 * Type alias for req parameter of the update language function
 */
type UpdateRequest = Request<
    {token: string}, // Header parameters
    {}, // Response body
    {name: string, startCommand?: string, mainFile?: string, timeLimit?: number}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing new language information
 * @param res HTTP response with status code
 * @returns res with the appropriate code and the data
 */
export async function updateLanguage(req: UpdateRequest,
                                     res: Response): Promise<Response> {
    return verifyToken(req, res, async () => {
        const {name, startCommand, mainFile, timeLimit} = req.body;

        /* to be updated */
        const lang = await LanguageService.getLanguage(name);

        /* check if language is valid */
        if (lang.response !== ServiceResponse.SUCCESS || !lang.result) {
            return handleBadRes(res, lang.response, lang.err);
        }

        /* to be updated */
        const language = lang.result;

        /* update start command */
        if (startCommand) {
            language.setStartCommand(startCommand);
        }

        /* update main file */
        if (mainFile) {
            language.setMainFile(mainFile);
        }

        /* update time limit */
        if (timeLimit) {
            language.setTimeLimit(timeLimit);
        }

        const updateResult = await LanguageService.updateLanguage(language);

        /* check if update succeeded */
        if (updateResult.response === ServiceResponse.SUCCESS) {
            return res.status(Http.OK).json();
        }

        return handleBadRes(res, updateResult.response, updateResult.err);
    }, true, true);
}

/**
 * Type alias for req parameter of the get language function
 */
type ReadLangRequest = Request<
    {token: string}, // Header parameters
    {result: Language}, // Response body
    {name: string}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing new language information
 * @param res HTTP response with status code
 * @returns res with the appropriate code and the data
 */
export async function getLanguage(req: ReadLangRequest,
                                  res: Response): Promise<Response> {
    return verifyToken(req, res, async () => {
        const {name} = req.body;

        /* to be updated */
        const lang = await LanguageService.getLanguage(name);

        /* check if language is valid */
        if (lang.response !== ServiceResponse.SUCCESS || !lang.result) {
            return handleBadRes(res, lang.response, lang.err);
        }

        return res.status(Http.OK).json({
            result: lang.result
        });
    }, true, true);
}
