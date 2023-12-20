import {DataTypes, Model, NonAttribute, Optional} from "sequelize";
import {database} from "../database";
import 'dotenv/config';

/**
 * Interface for the docker image model. Provides type context.
 */
interface ImageAttributes {
    image_version: number,
    dockerfile_content: string,
    in_use: boolean,
    createdAt: Date
}

/**
 * Type alias for the image creation attributes
 */
type ImageCreationAttributes = Optional<Optional<ImageAttributes, 'in_use'>, 'createdAt'>;

// noinspection JSAnnotator (disables a false error)
/**
 * Used for providing docker images information.
 * Stores historic images in the files.
 * Immutable.
 *
 * >- image_version: version of an image.
 * >- dockerfile_content: contents of the image dockerfile.
 * >- in_use: true if the image is currently in use
 */
export default class DockerImage extends Model<ImageAttributes, ImageCreationAttributes> {
    /**
     * @returns the version of the image
     */
    public get version(): NonAttribute<number> {
        return this.getDataValue('image_version');
    }

    /**
     * @returns the contents of the dockerfile of the image
     */
    public get dockerfile(): NonAttribute<string> {
        return this.getDataValue('dockerfile_content');
    }

    /**
     * @returns true if the image is in use
     */
    public get isInUse(): NonAttribute<boolean> {
        return this.getDataValue('in_use');
    }

    /**
     * @param status new status of the image
     */
    public setInUse(status: boolean) {
        this.setDataValue('in_use', status);
    }

    /**
     * @returns the latest ID
     */
    public static async latestId(): Promise<NonAttribute<number>> {
        return (
            await DockerImage.max(
            'createdAt'
            )
        ) ?? 0;
    }
}

/**
 * ORM model for the Statistic table.
 *
 * >- user_email: String representing the email of the user.
 * >- time: total execution time of the user in milliseconds.
 * >- memory: total memory used by the user in bytes.
 * >- execution_count: number of times a user ran a script.
 */
DockerImage.init({
    image_version: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    in_use: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0
    },
    dockerfile_content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize: database,
    modelName: 'Docker_Image'
});
