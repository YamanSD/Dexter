import Dockerode, {Container, Exec, ExecCreateOptions, ExecStartOptions} from "dockerode";
import containerConfig from "./containerConfig";
import {
    ContainerCreationError,
    ContainerExecError,
    ContainerStartError,
    LangNotFoundError,
    LogError,
    StartExecError,
    StreamError,
    TimeoutError
} from "./Errors";
import * as stream from "stream";
import {Duplex, Writable} from "stream";
import {clearTimeout} from "timers";
import {DockerImageService, ServiceResponse, StatisticService} from "../services";
import Response from "./Response";
import {docker, generateImageName} from "./Builder";
import 'dotenv/config';
import {DockerImage, Language, hasLanguage} from "../model";

/**
 * Type alias for Callback functions.
 */
type Callback<T> = (result: T) => any;

/**
 * Type alias for Callback function requiring detailed access.
 */
type DetailCallback<T, G> = (result0: T, result1: G) => any;

/**
 * Responsible for running Docker containers.
 */
export default class Runner {
    /**
     * Docker instance that serves as an interface between Node.JS
     * and Docker Remote API.
     * Shared with Builder class.
     *
     * @private
     */
    private static readonly docker = docker;

    /**
     * Used by the 'cat' linux command to populate the main file
     * with user code.
     * This represents the keyword boundary.
     * End result is EOTddd, where each 'd' is a decimal digit.
     *
     * @private
     */
    private static readonly catBounds = `EOT`;

    /**
     * Number of running containers.
     * @private
     */
    private static runningContainers = 0;

    /**
     * @param filepath to write the data into.
     * @param data to be written to file.
     * @returns ExecCreateOptions for the given filepath and data.
     * @private
     */
    private generateFileExecOptions(filepath: string, data: string): ExecCreateOptions {
        /* get a random cat bound */
        const catBound = this.catBound;

        return {
            Cmd: ["sh", "-c", `cat > ${filepath} << ${catBound}\n${data}\n${catBound}`],
            AttachStdout: true,
            AttachStderr: true,
            Privileged: true
        }
    }

    /**
     * @param language to generate the run command for
     * @returns ExecCreateOptions to run the program
     * @private
     */
    private generateRunExecOptions(language: Language): ExecCreateOptions {
        return {
            Cmd: ["sh", "-c", language.startCommand],
            AttachStdout: true,
            AttachStderr: true,
            AttachStdin: true,
            Privileged: true,
            Tty: true,
        };
    }

    /**
     * @param callback function that receives the created container.
     * @param onErr function called when an error is encountered.
     * @param version version of the image to use.
     * @param uid ID of the user executing the code.
     * @throws ContainerCreationError if the container creation fails.
     * @private
     */
    private createContainer(
        callback: Callback<Dockerode.Container>,
        onErr: Callback<unknown>,
        version: number,
        uid: string
    ): void {
        /* generate in use image name */
        const finalImage = generateImageName(version);

        /* add memory limit */
        const memoryLimit = uid === process.env.SU_EMAIL ? undefined : containerConfig.HostConfig?.Memory;

        Runner.docker.createContainer({
                ...containerConfig,
                Image: finalImage,
                HostConfig: {
                    ...containerConfig.HostConfig,
                    Memory: memoryLimit
                }
            },
            (err?: Error, result?: Container) => {
                /* check if there are no errors, and that the container is present */
                if (err || result === undefined) {
                    onErr(new ContainerCreationError(err));
                    return;
                }

                callback(result);
        });
    }

    /**
     * Creates & starts a new container.
     *
     * @param callback function that receives the started container.
     * @param onErr function called when an error is encountered.
     * @param version version of the image to use.
     * @param uid ID of the user executing the code.
     * @throws ContainerStartError if the container start fails.
     * @private
     */
    private startContainer(
        callback: Callback<Dockerode.Container>,
        onErr: Callback<unknown>,
        version: number,
        uid: string
    ): void {
        this.createContainer((container) => {
            container.start((err?: Error) => {
               /* check if there are no errors */
                if (err) {
                   onErr(new ContainerStartError(err));
                   return;
                }

                Runner.runningContainers++;
                callback(container);
            });
        }, onErr, version, uid);
    }

    /**
     * Creates, starts, & executes in the container.
     *
     * @param options creation execution options
     * @param onErr function called when an error is encountered.
     * @param version version of the image to use.
     * @param uid ID of the user executing the code.
     * @param callback function that receives the created exec instance.
     * @param detailCallback function that receives the created exec instance and container.
     * @throws ContainerExecError if the container exec fails.
     * @throws Error if there is are no callbacks.
     * @private
     */
    private execContainer(options: ExecCreateOptions,
                          onErr: Callback<unknown>,
                          version: number,
                          uid: string,
                          callback?: Callback<Exec>,
                          detailCallback?: DetailCallback<Exec, Container>): void {
        this.startContainer((container) => {
           container.exec(options, (err?: Error, result?: Exec) => {
               /* check if there are no errors, and that the exec is present */
               if (err || result === undefined) {
                   onErr(new ContainerExecError(err));
                   return;
               }

               if (callback) {
                   callback(result);
               } else if (detailCallback) {
                   detailCallback(result, container);
               } else {
                   throw new Error("No callback on execContainer");
               }
           });
        }, onErr, version, uid);
    }

    /**
     * @param exec to start
     * @param onErr function called when an error is encountered.
     * @param startOptions execution options
     * @param callback function that receives the created stream instance.
     * @param preStart called before starting the execution, but after the checks.
     * @param addErrListener if true adds an error listener to the stream.
     * @throws StartExecError if starting the container exec fails.
     * @throws StreamError if execution in the stream fails
     *         (not user code errors, but shell errors).
     * @protected
     */
    protected startExistingExec(exec: Exec,
                                onErr: Callback<unknown>,
                                startOptions: ExecStartOptions,
                                callback: Callback<stream.Duplex>,
                                preStart?: () => any,
                                addErrListener?: boolean): void {
        exec.start(startOptions, (err?: Error, result?: Duplex) => {
            /* check if there are no errors, and that the stream is present */
            if (err || result === undefined) {
                onErr(new StartExecError(err));
                return;
            }

            /* check to add error listener */
            if (addErrListener === true) {
                /* handle stream execution errors */
                result.on('error', (err) => {
                    onErr(new StreamError(err));
                    return;
                });
            }

            /* check for a pre-start function */
            if (preStart) {
                preStart();
            }

            callback(result);
        });
    }

    /**
     * @param container to be used to run the exec
     * @param onErr function called when an error is encountered.
     * @param createOptions creation execution options
     * @param startOptions execution options
     * @param callback function that receives the created stream instance.
     * @param preStart called before starting the execution, but after the checks.
     * @param addErrListener if true adds an error listener to the stream.
     * @throws StartExecError if starting the container exec fails.
     * @protected
     */
    protected startChildExec(
        container: Container,
        onErr: Callback<unknown>,
        createOptions: ExecCreateOptions,
        startOptions: ExecStartOptions,
        callback: Callback<stream.Duplex>,
        preStart?: () => any,
        addErrListener?: boolean
    ) {
        container.exec(createOptions, (err?: Error, exec?: Exec) => {
            /* check if there are no errors, and that the stream is present */
            if (err || exec === undefined) {
                onErr(new StartExecError(err));
                return;
            }

            exec.start(startOptions, (err?: Error, result?: Duplex) => {
                /* check if there are no errors, and that the stream is present */
                if (err || result === undefined) {
                    onErr(new StartExecError(err));
                    return;
                }

                /* check for a pre-start function */
                if (preStart) {
                    preStart();
                }

                /* check to add error listener */
                if (addErrListener === true) {
                    /* handle stream execution errors */
                    result.on('error', (err) => {
                        onErr(new StreamError(err));
                        return;
                    });
                }

                callback(result);
            });
        });
    }

    /**
     * Links given streams to TCP sockets using modem.
     *
     * @param stream input stream
     * @param stdout output stream
     * @param stderr error output stream
     * @protected
     */
    protected linkTcpSockets(stream: NodeJS.ReadableStream,
                             stdout: NodeJS.WritableStream,
                             stderr: NodeJS.WritableStream): void {
        Runner.docker.modem.demuxStream(stream, stdout, stderr);
    }

    /**
     * @returns a new random input bound.
     * @private
     */
    private get catBound(): string {
        return `${Runner.catBounds}${Math.floor(Math.random() * 1_000)}`;
    }

    /**
     * @param filepath to store the data in
     * @param onErr function called when an error is encountered.
     * @param version version of the image to use.
     * @param uid ID of the user executing the code.
     * @param data to be written to the file
     * @param callback called after the file creation ends successfully.
     *        Takes exec stream and parent container as input.
     * @private
     */
    private createFile(filepath: string,
                       onErr: Callback<unknown>,
                       version: number,
                       uid: string,
                       data: string,
                       callback: (stream: Duplex, container: Container) => any): void {
        this.execContainer(
            this.generateFileExecOptions(filepath, data),
            onErr,
            version,
            uid,
            undefined,
            (exec, container) => {
                this.startExistingExec(exec, onErr, {
                    hijack: true,
                    stdin: true
                }, (stream) => {
                    /* when execution ends, call callback */
                    stream.on('end', () => {
                       callback(stream, container);
                    });
                });
            }
        );
    };

    /**
     * @param uid user ID to log the info to.
     * @param container to log info for.
     * @param onErr function called when an error is encountered.
     * @protected
     */
    protected async logInfo(uid: string, container: Container, onErr: Callback<unknown>): Promise<void> {
        return await new Promise<void>((resolve) => {
            container.stats({
                stream: false
            }, (err, containerInfo) => {
                if (err || !containerInfo) {
                    onErr(new LogError(err));
                    return;
                } else {
                    container.inspect(async (err, containerInspection) => {
                        if (err || !containerInspection) {
                            onErr(new LogError(err));
                            return;
                        }

                        const createAt: Date = new Date(containerInspection.State.StartedAt as string);

                        // Less accurate but necessary, unless we want to split time statistics update
                        // and memory statistics update. This is due to the fact that we have to log the info
                        // before stopping the container, resulting in an invalid State.finishedAt time string.
                        const finishedAt: Date = new Date();

                        // Log user information and save to database.
                        StatisticService.logStatistics(
                            uid,
                            finishedAt.getTime() - createAt.getTime(),
                            containerInfo.memory_stats.max_usage
                        ).then((r) => {
                            if (r.response === ServiceResponse.SUCCESS) {
                                resolve();
                            } else {
                                onErr(r.err);
                                return;
                            }
                        });
                    });
                }
            });
        });
    }

    /**
     * @param language for which to get the file
     * @returns a filepath in dir for the given programming language
     * @protected
     */
    protected getFilePath(language: Language): string {
        return `${language.mainFile}`;
    }

    /**
     * @param uid ID of the user running the program
     * @param onEnd given the final output, called on end
     * @param onErr given the error code, called on error
     * @param program to be executed
     * @param language programming language to be executed
     * @param version version of the image to use, undefined uses the
     *        current image in use.
     * @param input program input
     * @throws LangNotFoundError if the language is not found
     * @returns program output
     */
    public async run(
            uid: string,
            onEnd: (out: string) => void,
            onErr: (err: Response, e?: unknown) => void,
            program: string,
            language: Language,
            version?: number,
            input?: string
    ): Promise<void> {
        /* wrapper for the onErr use function */
        const onErrWrapped = (e: unknown) => {
            /* declare error code */
            let errorCode: Response;

            if (e instanceof ContainerCreationError) {
                errorCode = Response.CONT_CRE_ERR;
            } else if (e instanceof ContainerStartError) {
                errorCode = Response.CONT_START_ERR;
            } else if (e instanceof ContainerExecError) {
                errorCode = Response.CONT_EXEC_ERR;
            } else if (e instanceof StartExecError) {
                errorCode = Response.EXEC_START_ERR;
            } else if (e instanceof StreamError) {
                errorCode = Response.STREAM_ERR;
            } else if (e instanceof LogError) {
                errorCode = Response.LOG_ERR;
            } else if (e instanceof LangNotFoundError) {
                errorCode = Response.NO_LANG_ERR;
            } else if (e instanceof TimeoutError) {
                errorCode = Response.TIMEOUT_ERR;
            } else {
                errorCode = Response.INTERNAL_ERR;
            }

            onErr(errorCode, e);
        }

        /* ID of the timer for the program execution */
        let timer: number | undefined = undefined;

        /* stores the output of the program */
        let output: string = '';

        /* writable stream that updates the output */
        const stdout = new Writable({
            write(chunk: string, encoding: BufferEncoding, callback: () => any) {
                output += chunk.toString(); // append container output to current
                callback();
            },
        });

        /* get current version */
        if (version === undefined) {
            const currentImage = await DockerImageService.getInUse();

            if (currentImage.response !== ServiceResponse.SUCCESS) {
                onErr(Response.NO_IMAGE, "Image does not exist");
                return;
            }

            version = (currentImage.result as DockerImage).version;
        }

        /* check if the language exists */
        if (!(await hasLanguage(version, language.name))) {
            onErrWrapped(new LangNotFoundError(language.toString()));
            return;
        }

        /* create file and then run program */
        this.createFile(
            this.getFilePath(language),
            onErrWrapped,
            version,
            uid,
            program,
            (stream, container) => {
                this.startChildExec(
                    container,
                    onErrWrapped,
                    this.generateRunExecOptions(language),
                    {
                        hijack: true,
                        stdin: true
                    },
                    (runStream) => {
                        /* pass user input to the stream, before running */
                        runStream.write(`${input ?? ""}\n`);

                        /* link streams with TCP */
                        this.linkTcpSockets(runStream, stdout, stdout);

                        /* when execution finishes */
                        runStream.on('end', () => {
                            /* stop timer */
                            if (timer !== undefined) {
                                clearTimeout(timer);
                            }

                            /*
                             * Pass output to callback function, after removing input.
                             * +2 to exclude the \n we added at the end of the runStream.write().
                             */
                            onEnd(output.substring((input?.length ?? 0) + 2));
                            this.terminateContainer(uid, container, onErrWrapped);
                        });
                    },
                    () => {
                        if (uid === process.env.SU_EMAIL) {
                            return; // No timer for superuser
                        }

                        timer = setTimeout(() => {
                                this.terminateContainer(uid, container, onErrWrapped);
                                onErrWrapped(new TimeoutError());
                            },
                            language.timeLimit
                        ) as any as number;
                    },
                    true
                );
            }
        );
    }

    /**
     * @param uid user ID
     * @param container to be logged and terminated
     * @param onErr function called when an error is encountered.
     * @private
     */
    private terminateContainer(uid: string, container: Container, onErr: Callback<unknown>): void {
        /* log container information */
        this.logInfo(uid, container, onErr).then(() => {
            /* stop container */
            container.stop().then(() => {
                /* delete container */
                container.remove(() => {
                    Runner.runningContainers--;
                });
            });
        }).catch(() => {
            /* delete container */
            container.remove(() => {
                Runner.runningContainers--;
            });
        });
    }

    /**
     * @returns the number of running containers.
     */
    public get runningContainers(): number {
        return Runner.runningContainers;
    }
};
