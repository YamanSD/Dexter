/**
 * Enum-class that represents error status codes for docker containers.
 */
enum Response {
    CONT_CRE_ERR,
    CONT_START_ERR,
    CONT_EXEC_ERR,
    EXEC_START_ERR,
    STREAM_ERR,
    LOG_ERR,
    NO_LANG_ERR,
    TIMEOUT_ERR,
    INTERNAL_ERR,
    NO_IMAGE
}

export default Response;
