import {Sequelize} from "sequelize";
import 'dotenv/config';
import config from "./config";

/**
 * Checks the database if it exists.
 */
export async function syncDatabase(): Promise<void> {
    /*
     * Remove database name from config, to prevent it from being
     * used by the sequelize instance and causing errors.
     * The job of this connection is to create the database if it does
     * not exist.
     * */
    const {database, ...noDbConfig} = {...config};

    /* sequelize instance to communicate create the database */
    const sequelize = new Sequelize(noDbConfig);

    /* Open connection with server */
    await sequelize.authenticate();

    /* create table encase it does not exist */
    await sequelize.query(
        `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`
    );

    /* Close connection */
    await sequelize.close();
}

export default new Sequelize(config);
