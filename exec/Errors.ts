/**
 * Used by the createContainer function.
 */
export class ContainerCreationError extends Error {
    public constructor(err?: Error) {
        super("CRE_CONT_ERR" + '\n' + err?.name + '\n' + err?.message);
    }
}

/**
 * Used by the startContainer function.
 */
export class ContainerStartError extends Error {
    public constructor(err?: Error) {
        super("START_CONT_ERR" + '\n' + err?.name + '\n' + err?.message);
    }
}

/**
 * Used by the execContainer function.
 */
export class ContainerExecError extends Error {
    public constructor(err?: Error) {
        super("EXEC_CONT_ERR" + '\n' + err?.name + '\n' + err?.message);
    }
}

/**
 * Used by the startExec function.
 */
export class StartExecError extends Error {
    public constructor(err?: Error) {
        super("START_EXEC_ERR" + '\n' + err?.name + '\n' + err?.message);
    }
}

/**
 * Used by the stream.on('error', ...) function.
 */
export class StreamError extends Error {
    public constructor(err?: Error) {
        super("STREAM_ERR" + '\n' + err?.name + '\n' + err?.message);
    }
}

/**
 * Used by the logInfo function.
 */
export class LogError extends Error {
    public constructor(err?: Error) {
        super("LOG_ERR" + '\n' + err?.name + '\n' + err?.message);
    }
}

/**
 * Used by the run function
 */
export class LangNotFoundError extends Error {
    public constructor(language: string) {
        super(`No such programming language: ${language}`);
    }
}

/**
 * Used by the run function
 */
export class TimeoutError extends Error {
    public constructor() {
        super(`Timeout`);
    }
}
