import {check} from "express-validator";


/**
 * Used for user registration, creation, & authentication.
 */
export const createUserValidation = [
    check('email').isEmail().withMessage('Invalid user email'),
    check('password').notEmpty().withMessage('Password is required'),
];

/**
 * Used for user deletion
 */
export const deleteUserValidation = [
    check('email').isEmail().withMessage("Invalid user email"),
];

/**
 * Used for banning user validation
 */
export const setBannedValidation = [
    check('email').isEmail().withMessage("Invalid user email"),
    check('isBanned').isBoolean().withMessage("Invalid ban status"),
];

/**
 * Used for user update
 */
export const updateUserValidation = [
    check('email').optional().isEmail().withMessage("Invalid user email"),
];
