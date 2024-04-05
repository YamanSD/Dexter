import {Request, Response} from 'express';
import Http from "./Http";
import {LanguageService, ServiceResponse} from "../services";
import {handleBadExec, handleBadRes, verifyToken} from "./helpers";
import {Runner, ExecErrResponse, containerConfig} from "../exec";
import {Language} from "../model";
import Convert from "ansi-to-html";

/**
 * Type alias for req parameter of the execute function
 */
type ExecRequest = Request<
    {token: string}, // Header parameters
    {}, // Response body
    {lang: string, program: string, input?: string, version?: number}, // Request body
    {} // Request query
>;

/* runner instance to execute code */
const runner: Runner = new Runner();

/**
 * @param req HTTP request containing admin token in header & execution
 *        parameters in the body.
 * @param res HTTP response containing program output.
 * @returns res with appropriate response code and data
 */
export async function execute(req: ExecRequest, res: Response): Promise<Response> {
    return verifyToken(req, res, async (user) => {
        /* extract parameters from the body */
        const {lang, program, input, version} = req.body;

        /* check for missing data */
        if (!lang || !program) {
            return res.status(Http.BAD).json({err: "missing lang and/or program"});
        } else if (version !== undefined && !user.isAdmin) {
            return res.status(Http.UNAUTHORIZED).json({err: "cannot specify version"});
        }

        /* get the language */
        const languageRes = await LanguageService.getLanguage(lang);

        /* check if we got the language */
        if (languageRes.response !== ServiceResponse.SUCCESS) {
            return handleBadRes(res, languageRes.response, languageRes.err);
        }

        /* runs concurrently, returns a string if the code executed */
        let output = await (
            new Promise<string | {errCode: ExecErrResponse, e: unknown}>((resolve) => {
                runner.run(
                    user.email,
                    (output: string) => {
                        resolve(output);
                    },
                    (errCode, e) => {
                        resolve({errCode, e});
                    },
                    program,
                    languageRes.result as Language,
                    version,
                    input,
                    containerConfig.HostConfig?.Memory
                );
            })
        );

        /* we encountered an error */
        if (typeof output !== "string") {
            return handleBadExec(res, output.errCode, output.e);
        }

        /* converts ANSI to HTML */
        const convert = new Convert();

        return res.status(Http.OK).json({ output: convert.toHtml(output) });
    });
}

/**
 * @param req HTTP request.
 * @param res HTTP response.
 * @returns res with appropriate response code and map of languages
 */
export async function listLanguages(req: Request, res: Response): Promise<Response> {
    return res.status(Http.OK).json({
        langs: (await LanguageService.allLanguages()).result
    });
}

/**
 * @param req HTTP request.
 * @param res HTTP response.
 * @returns res with appropriate response code and number of running containers currently
 */
export async function currentRunningContainers(req: Request, res: Response): Promise<Response> {
    return verifyToken(req, res, () => {
        return res.status(Http.OK).json({
            current_running: runner.runningContainers
        });
    }, true);
}
