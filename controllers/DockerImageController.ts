import {Request, Response} from 'express';
import {ServiceResponse, DockerImageService, LanguageService} from '../services';
import Http from "./Http";
import {handleBadRes, verifyToken} from "./helpers";
import {DockerImage, ImageLanguage} from "../model";
import {validationResult} from "express-validator";

/**
 * Type alias for req parameter of the get the latest docker image function
 */
type GetLatestRequest = Request<
    {token: string}, // Header parameters
    {image: DockerImage}, // Response body
    {}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing admin token in header
 * @param res HTTP response containing the latest version & dockerfile contents
 * @returns res with appropriate response code and data
 */
export async function getLatestImage(req: GetLatestRequest, res: Response): Promise<Response> {
    return verifyToken(req, res, async () => {
        const temp = await DockerImageService.getLatestImage();

        /* check if retrieving stats was successful */
        if (temp.response === ServiceResponse.SUCCESS && temp.result) {
            const result = temp.result as DockerImage;

            return res.status(Http.OK).json({
                image: result
            });
        }

        return handleBadRes(res, temp.response, temp.err);
    }, true);
}

/**
 * Type alias for req parameter of the get the history function
 */
type GetAllRequest = Request<
    {token: string}, // Header parameters
    {history: DockerImage[]}, // Response body
    {}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing admin token in header
 * @param res HTTP response containing the list of all docker images
 * @returns res with appropriate response code and data
 */
export async function getHistory(req: GetAllRequest,
                                 res: Response): Promise<Response> {
    return verifyToken(req, res, async () => {
        const temp = await DockerImageService.getHistory();

        /* check if retrieving stats was successful */
        if (temp.response === ServiceResponse.SUCCESS) {
            const result = temp.result as DockerImage[];

            return res.status(Http.OK).json({
                history: result
            });
        }

        return handleBadRes(res, temp.response, temp.err);
    }, true);
}

/**
 * Type alias for req parameter of the get the in use docker image function
 */
type GetInUseRequest = Request<
    {token: string}, // Header parameters
    {image: DockerImage}, // Response body
    {}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing admin token in header
 * @param res HTTP response containing the in use version & dockerfile contents
 * @returns res with appropriate response code and data
 */
export async function getInUseImage(req: GetInUseRequest, res: Response): Promise<Response> {
    return verifyToken(req, res, async () => {
        const temp = await DockerImageService.getInUse();

        /* check if retrieving stats was successful */
        if (temp.response === ServiceResponse.SUCCESS && temp.result) {
            const result = temp.result as DockerImage;

            return res.status(Http.OK).json({
                image: result
            });
        }

        return handleBadRes(res, temp.response, temp.err);
    }, true);
}

/**
 * Type alias for req parameter of the set the in use docker image function
 */
type SetInUseRequest = Request<
    {token: string}, // Header parameters
    {}, // Response body
    {version: number}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing admin token in header and version in body
 * @param res HTTP response
 * @returns res with appropriate response code and data
 */
export async function setInUseImage(req: SetInUseRequest, res: Response): Promise<Response> {
    /* check if version test failed */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(Http.BAD).json({err: "Invalid version"});
    }

    return verifyToken(req, res, async () => {
        const {version} = req.body;

        if (!version) {
            return res.status(Http.BAD).json({err: "missing version"});
        }

        const temp = await DockerImageService.setInUse(version);

        /* check if retrieving stats was successful */
        if (temp.response === ServiceResponse.SUCCESS) {
            return res.status(Http.OK).json();
        }

        return handleBadRes(res, temp.response, temp.err);
    }, true, true);
}

/**
 * Type alias for req parameter of the create a docker image function
 */
type CreateImageRequest = Request<
    {token: string}, // Header parameters
    {image: DockerImage}, // Response body
    {version: number, dockerfile: string}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing admin token in header
 * @param res HTTP response containing the dockerfile contents
 * @returns res with appropriate response code and data
 */
export async function createImage(req: CreateImageRequest, res: Response): Promise<Response> {
    /* check if version test failed */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(Http.BAD).json({err: "Invalid version"});
    }

    return verifyToken(req, res, async () => {
        const {version, dockerfile} = req.body;

        /* check for missing data */
        if (!version || !dockerfile) {
            return res.status(Http.BAD).json({err: "Missing version and/or dockerfile"});
        }

        /* create imate */
        const temp = await DockerImageService.createDockerImage(version, dockerfile);

        /* check if retrieving stats was successful */
        if (temp.response === ServiceResponse.SUCCESS && temp.result) {
            const result = temp.result as DockerImage;

            return res.status(Http.OK).json({
                image: result
            });
        }

        return handleBadRes(res, temp.response, temp.err);
    }, true, true);
}

/**
 * Type alias for req parameter of the delete image function
 */
type DeleteImageRequest = Request<
    {token: string}, // Header parameters
    {result: DockerImage}, // Response body
    {version: number}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing version to be deleted
 * @param res HTTP response with status code
 * @returns res with the appropriate code and the data
 */
export async function deleteImage(req: DeleteImageRequest,
                                  res: Response): Promise<Response> {
    /* check if version test failed */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(Http.BAD).json({err: "Invalid version"});
    }

    return verifyToken(req, res, async () => {
        const {version} = req.body;
        const deleteRes = await DockerImageService.deleteDockerImage(version);

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
 * Type alias for req parameter of the delete use function
 */
type LinkLangRequest = Request<
    {token: string}, // Header parameters
    {}, // Response body
    {version: number, langs: string[]}, // Request body
    {} // Request query
>;

/**
 * @param req HTTP request containing version of the container and
 *        a list of languages to be linked.
 * @param res HTTP response with status code
 * @returns res with the appropriate code and the data
 */
export async function linkLanguages(req: LinkLangRequest,
                                    res: Response): Promise<Response> {
    return verifyToken(req, res, async () => {
        const {version, langs} = req.body;
        const imageRes = await DockerImageService.getDockerImage(version);

        /* check if image exists */
        if (imageRes.response !== ServiceResponse.SUCCESS || !imageRes.result) {
            return handleBadRes(res, imageRes.response, imageRes.err);
        }

        const langsRes = await LanguageService.getLanguages(langs);

        /* check if languages request are valid */
        if (langsRes.response !== ServiceResponse.SUCCESS) {
            return handleBadRes(res, imageRes.response, imageRes.err);
        } else if (!langsRes.result || langsRes.result.length !== langs.length) {
            return res.status(Http.NOT_FOUND).json({
                err: "not all languages exist"
            });
        }

        // @ts-ignore
        await ImageLanguage.destroy({
            where: {
                DockerImageImageVersion: version
            }
        });

        const image = imageRes.result;
        const languageEntities = langsRes.result;

        for (const l of languageEntities) {
            // @ts-ignore
            await image.addLanguage(l);
        }

        return res.status(Http.OK).json();
    }, true, true);
}

/**
 * @param req HTTP request containing version of the container and
 *        a list of languages to be linked.
 * @param res HTTP response with status code
 * @returns res with the appropriate code and the data
 */
export async function unlinkLanguages(req: LinkLangRequest,
                                    res: Response): Promise<Response> {
    return verifyToken(req, res, async () => {
        const {version, langs} = req.body;
        const imageRes = await DockerImageService.getDockerImage(version);

        /* check if image exists */
        if (imageRes.response !== ServiceResponse.SUCCESS || !imageRes.result) {
            return handleBadRes(res, imageRes.response, imageRes.err);
        }

        const langsRes = await LanguageService.getLanguages(langs);

        /* check if languages request are valid */
        if (langsRes.response !== ServiceResponse.SUCCESS) {
            return handleBadRes(res, imageRes.response, imageRes.err);
        } else if (!langsRes.result || langsRes.result.length !== langs.length) {
            return res.status(Http.NOT_FOUND).json({
                err: "not all languages exist"
            });
        }

        const image = imageRes.result;

        for (const l of langsRes.result) {
            // @ts-ignore
            await image.removeLanguage(l);
        }

        return res.status(Http.OK).json();
    }, true, true);
}
