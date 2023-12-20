import {DataTypes, Model, NonAttribute} from "sequelize";
import {database} from "../database";
import 'dotenv/config';
import User from "./User";

/**
 * Interface for the statistic model. Provides type context.
 */
interface StatisticAttributes {
    uid: number,
    total_time: number,
    total_memory: number,
    execution_count: number
}

/**
 * Type alias for statistic creation attribute type.
 */
type StatisticCreationAttributes = {
    uid: number
};

// noinspection JSAnnotator (disables a false error)
/**
 * Statistic class declaration.
 * Useful for handling instances of type Statistic and defining
 * helper functions.
 */
export default class Statistic extends Model<StatisticAttributes, StatisticCreationAttributes> {
    /**
     * @returns the total machine time spent by the user (millis)
     */
    public get totalTime(): NonAttribute<number> {
        return this.getDataValue('total_time');
    }

    /**
     * @returns the total memory spent by the user (bytes)
     */
    public get totalMemory(): NonAttribute<number> {
        return this.getDataValue('total_memory');
    }

    /**
     * @returns the total number of executions by the user
     */
    public get executionCount(): NonAttribute<number> {
        return this.getDataValue('execution_count');
    }

    /**
     * @param time in millis to be incremented to the user stats
     */
    public incrementTime(time: number): void {
        this.setDataValue('total_time', this.totalTime + time);
    }

    /**
     * @param memory in bytes to be incremented to the user stats
     */
    public incrementMemory(memory: number): void {
        this.setDataValue('total_memory', this.totalMemory + memory);
    }

    /**
     * Increments the execution counter by value.
     *
     * @param value to increment by, default 1.
     */
    public incrementExec(value?: number): void {
        this.setDataValue('execution_count', this.executionCount + (value ?? 1));
    }
}

/**
 * ORM model for the Statistic table.
 *
 * >- uid: ID of the user.
 * >- time: total execution time of the user in milliseconds.
 * >- memory: total memory used by the user in bytes.
 * >- execution_count: number of times a user ran a script.
 */
Statistic.init({
    uid: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    total_time: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    total_memory: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    execution_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    sequelize: database,
    modelName: 'Statistic'
});

/*
 * one-to-one relation with the User table.
 */
Statistic.belongsTo(User, {
    foreignKey: 'uid',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
