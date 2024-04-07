import {DockerImage, Language} from "../model";
import Response from "./Response";
import {handleError, Result} from "./helpers";
import {Builder} from '../exec';
import 'dotenv/config';

/**
 * @param version version of the docker image
 * @param dockerfile contents of a dockerfile
 * @returns created dockerImage if successful.
 *          Otherwise, reason of error & error.
 */
export async function createDockerImage(
    version: number,
    dockerfile: string
): Result<DockerImage> {
    try {
        const response = await Builder.build(version, dockerfile);

        if (response !== Response.SUCCESS) {
            return {
                err: "Invalid docker image or state machine",
                response: response
            };
        }

        return {
            result: await DockerImage.create({
                image_version: version,
                dockerfile_content: dockerfile
            }),
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param version version of the docker image
 * @returns the data of the image prior to deletion
 */
export async function deleteDockerImage(version: number): Result<DockerImage> {
    try {
        const image: DockerImage | undefined = (await getDockerImage(version)).result;

        /* image does not exist */
        if (!image) {
            return {
                response: Response.NOT_EXIST
            };
        } else if (image.isInUse) {
            return {
                response: Response.INVALID_IN,
                err: "Cannot delete active image"
            };
        }

        await Builder.destroy(version);
        await image.destroy();

        return {
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param version version of the docker image
 * @returns the DockerImage belonging to the version
 */
export async function getDockerImage(version: number): Result<DockerImage> {
    try {
        const dockerImage = await DockerImage.findByPk(version);

        if (!dockerImage) {
            return {
                response: Response.NOT_EXIST
            };
        }

        return {
            response: Response.SUCCESS,
            result: dockerImage as DockerImage
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @returns the latest image info.
 */
export async function getLatestImage(): Result<DockerImage> {
    return getDockerImage(await DockerImage.latestId());
}

/**
 * @returns list of previous dockerImages
 */
export async function getHistory(): Result<DockerImage[]> {
    try {
        return {
            response: Response.SUCCESS,
            result: await DockerImage.findAll({
                include: Language
            })
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @returns the image currently in use, if there is an image in use.
 *          Otherwise, undefined.
 */
export async function getInUse(): Result<DockerImage | undefined> {
    try {
        return {
            response: Response.SUCCESS,
            result: (
                await DockerImage.findAll({
                   where: {
                       in_use: true
                   },
                   include: Language
                })
            )[0]
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param version new version to be set in use
 */
export async function setInUse(version: number): Result {
    try {
        const inUse = await getInUse();
        const newImageResponse = await getDockerImage(version);

        /* check if in use failed */
        if (inUse.response !== Response.SUCCESS) {
            return {
                response: inUse.response,
                err: inUse.err
            };
        } else if (newImageResponse.response !== Response.SUCCESS || !newImageResponse.result) { // new image does not exist
            return {
                response: newImageResponse.response,
                err: newImageResponse.err
            };
        }

        /* get the version in use currently */
        const currentImage = inUse.result;

        /* if same image, do nothing else */
        if (currentImage?.version === version) {
            return {
                response: Response.SUCCESS
            };
        }

        /* extract new image */
        const newImage = newImageResponse.result as DockerImage;

        /* set new in use image */
        newImage.setInUse(true);
        await newImage.save();

        /* check previous image */
        if (currentImage !== undefined) {
            currentImage.setInUse(false);
            await currentImage.save();
        }

        return {
            response: Response.SUCCESS,
        };
    } catch (e) {
        return handleError(e);
    }
}
