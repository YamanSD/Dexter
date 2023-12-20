import containerConfig from "./containerConfig";
import fs from 'fs';
import Docker from "dockerode";
import {ServiceResponse} from "../services";

/* docker connection, shared with Runner class */
export const docker = new Docker();


/**
 * @param version to generate image name for
 * @returns image name with version
 */
export function generateImageName(version: number): string {
    return `${containerConfig.Image}:${version}`;
}

/**
 * @param version new version number to build
 * @param dockerfile of the build
 */
export async function build(version: number, dockerfile: string): Promise<ServiceResponse> {
    return new Promise<ServiceResponse>((resolve, reject) => {
        fs.writeFile(`${__dirname}/Dockerfile`, dockerfile, (err) => {
            if (err) {
                throw err;
            }

            docker.buildImage({
                context: __dirname,
                src: ['Dockerfile']
            }, {
                t: generateImageName(version)
            }, (err, stream) => {
                if (err || !stream) {
                    reject(err);
                    return;
                }

                docker.modem.followProgress(stream, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    /* remove dangling containers and images */
                    docker.pruneContainers((err, contInfo) => {
                        if (err) {
                            resolve(ServiceResponse.INTERNAL);
                            return;
                        }

                        docker.pruneImages((err, imgInfo) => {
                            if (err) {
                                resolve(ServiceResponse.INTERNAL);
                                return;
                            }

                            const noErrContainers = !contInfo?.ContainersDeleted || contInfo.ContainersDeleted.length === 0;
                            const noErrImages = !imgInfo?.ImagesDeleted || imgInfo.ImagesDeleted.length === 0;

                            /* some containers where removed */
                            if (!noErrContainers || !noErrImages) {
                                resolve(ServiceResponse.INVALID_IN);
                                return;
                            }

                            resolve(ServiceResponse.SUCCESS);
                        });
                    });
                });
            })
        });
    });
}

/**
 * @param version to be destroyed
 */
export async function destroy(version: number) {
    await docker.getImage(generateImageName(version)).remove();
}
