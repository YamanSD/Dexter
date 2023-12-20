import {check} from "express-validator";


/**
 * Used for checking the image version
 */
export const versionCheck = [
    check('version').isNumeric().withMessage('Version must be numeric'),
];


