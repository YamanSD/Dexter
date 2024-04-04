import {DataTypes, Model, NonAttribute, Optional} from "sequelize";
import {database} from "../database";
import 'dotenv/config';
import DockerImage from "./DockerImage";
import {defaultTimeLimit} from "../exec";

/**
 * Interface for the language model. Provides type context.
 */
interface LanguageAttributes {
    language_name: string,
    start_command: string,
    main_file: string,
    time_limit: number
}

/**
 * Type alias for language creation attribute type.
 */
type LanguageCreationAttributes = Optional<LanguageAttributes, 'time_limit'>;

// noinspection JSAnnotator (disables a false error)
/**
 * Language class declaration.
 * Useful for handling instances of type Language and defining
 * helper functions.
 */
export default class Language extends Model<LanguageAttributes, LanguageCreationAttributes> {
    /**
     * @returns the name of the language
     */
    public get name(): NonAttribute<string> {
        return this.getDataValue('language_name');
    }

    /**
     * @returns the start command of the language
     */
    public get startCommand(): NonAttribute<string> {
        return this.getDataValue('start_command');
    }

    /**
     * @returns the time limit of the language
     */
    public get timeLimit(): NonAttribute<number> {
        return this.getDataValue('time_limit');
    }

    /**
     * @returns the name of the main file used by the language
     */
    public get mainFile(): NonAttribute<string> {
        return this.getDataValue('main_file');
    }

    /**
     * @param command new start command
     */
    public setStartCommand(command: string): void {
        this.setDataValue('start_command', command);
    }

    /**
     * @param limit new time limit
     */
    public setTimeLimit(limit: number): void {
        this.setDataValue('time_limit', Math.max(defaultTimeLimit, limit));
    }

    /**
     * @param mainFile new main file name
     */
    public setMainFile(mainFile: string): void {
        this.setDataValue('main_file', mainFile);
    }
}

/**
 * ORM model for the Language table.
 *
 * >- language_name: name of the programming language.
 * >- start_command: command run in the CLI to start the execution of the language.
 * >- time_limit: time limit on the language execution time in milliseconds.
 * >- main_file: name of the main file used to store the program code
 */
Language.init({
    language_name: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    start_command: {
        type: DataTypes.STRING,
        allowNull: false
    },
    time_limit: {
        type: DataTypes.INTEGER,
        defaultValue: defaultTimeLimit
    },
    main_file: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize: database,
    modelName: 'Language'
});

/* junction table for the DockerImage-Language M-N association */
export const ImageLanguage = database.define('Image_Language', {});

/**
 * @param version version of the docker image
 * @param language to check if it exists
 * @returns true if this image has the given language
 */
export async function hasLanguage(version: number, language: string): Promise<boolean> {
    const instance = await ImageLanguage.findOne({
        where: {
            dockerImageImageVersion: version, // Name generated in table
            languageLanguageName: language // Name generated in table
        }
    });

    return instance !== null;
}

/* Many-to-many mapping between languages and images */
Language.belongsToMany(DockerImage, { through: ImageLanguage });
DockerImage.belongsToMany(Language, { through: ImageLanguage });
