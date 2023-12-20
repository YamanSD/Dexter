import {Language} from "../model";
import Response from "./Response";
import {handleError, Result} from "./helpers";
import 'dotenv/config';

/**
 * @param name name of the language
 * @param startCommand starting command of the language
 * @param mainFile main file that contains user code on execution
 * @param timeLimit time limit placed on the language
 * @returns created language if successful.
 *          Otherwise, reason of error & error.
 */
export async function createLanguage(name: string,
                                     startCommand: string,
                                     mainFile: string,
                                     timeLimit?: number): Result<Language> {
    try {
        return {
            result: await Language.create({
                language_name: name,
                main_file: mainFile,
                time_limit: timeLimit,
                start_command: startCommand
            }),
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param name of the language
 * @returns the data of the language prior to deletion
 */
export async function deleteLanguage(name: string): Result<Language> {
    try {
        const lang: Language | undefined = (await getLanguage(name)).result;

        /* image does not exist */
        if (!lang) {
            return {
                response: Response.NOT_EXIST
            };
        }

        await lang.destroy();

        return {
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param name of the programming language
 * @returns the Language belonging to the name
 */
export async function getLanguage(name: string): Result<Language> {
    try {
        const lang = await Language.findByPk(name);

        if (!lang) {
            return {
                response: Response.NOT_EXIST
            };
        }

        return {
            response: Response.SUCCESS,
            result: lang as Language
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param names list of programming language names to get
 * @returns the Languages belonging to the name
 */
export async function getLanguages(names: string[]): Result<Language[]> {
    try {
        const langs = await Language.findAll({
            where: {
                language_name: names
            }
        });

        if (!langs) {
            return {
                response: Response.NOT_EXIST
            };
        }

        return {
            response: Response.SUCCESS,
            result: langs as Language[]
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param lang modified language, saved to database.
 */
export async function updateLanguage(lang: Language): Result {
    try {
        await lang.save();

        return {
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @returns a list of all language IDs
 */
export async function allLanguages(): Result<string[]> {
    try {
        return {
            response: Response.SUCCESS,
            result: (await Language.findAll({
                attributes: ['language_name']
            })).map(l => l.name)
        };
    } catch (e) {
        return handleError(e);
    }
}