/**
 * Enum class for the types of service responses.
 *
 * >- SUCCESS: operation successful.
 * >- INVALID_IN: invalid input.
 * >- ALREADY_EXISTS: entity already exists.
 * >- INTERNAL: internal error.
 * >- NOT_EXIST: entity does not exist.
 */
enum Response {
    SUCCESS = "SUCCESS",
    INVALID_IN = "INVALID INPUT",
    ALREADY_EXISTS = "ALREADY EXISTS",
    INTERNAL = "INTERNAL SERVER ERROR",
    NOT_EXIST = "DOES NOT EXIST"
}

export default Response;
