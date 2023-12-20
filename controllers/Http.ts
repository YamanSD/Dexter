/**
 * Enum class for the response codes.
 * Provides additional context for consistency and maintenance.
 */
enum Http {
    OK = 200,
    BAD = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    TIMEOUT = 408,
    ALREADY_EXISTS = 409,
    INTERNAL = 500,
    INSUFFICIENT_RESOURCES = 507
}

export default Http;
