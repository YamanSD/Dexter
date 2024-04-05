import {ContainerCreateOptions} from "dockerode";

/**
 * For further information check the official documentation:
 * >>- https://docs.docker.com/engine/api/v1.37/#tag/Image/operation/ImageBuild
 * >>- https://github.com/apocas/dockerode
 *
 * >- Image: Name of the base Docker image that contains all the necessary
 *          dependencies to run code of different programming languages.
 *
 * >- AttachStdin: true to attach stdin to the container.
 *
 * >- AttachStdout: true to attach stdout to the container.
 *
 * >- AttachStderr: true to attach stderr to the container.
 *
 * >- OpenStdin: true to open the stdin for input.
 *
 * >- NetworkDisabled: true to disable networking for the container.
 *
 * >- Tty: true attach standard streams to a TTY (Teletype writer).
 *
 * >- HostConfig: container configuration that depends on the host we are running on.
 * >>- Memory: (100 MiB) limits the size of the memory for each container (in bytes).
 * >>- NetworkMode: (none) Sets the networking mode for the run commands during build
 */
const containerConfig: ContainerCreateOptions = {
    Image: "online_compiler",
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    OpenStdin: true,
    NetworkDisabled: true,
    Tty: true,
    HostConfig: {
        Memory: 100 * 1024 * 1024, // This value is default in case not specified
        NetworkMode: "none",
    }
};

/* default time limit for program execution in milliseconds */
export const defaultTimeLimit: number = 20_000;

export default containerConfig;
