import {Options} from "sequelize";
import 'dotenv/config';

/**
 * Configuration for the Sequelize connection to the database.
 *
 * - database: name of the database
 * - host: host IP for the connection
 * - port: port used by the database
 * - username: to use in the connection
 * - password: to use in the connection
 * - dialect: type of the database
 * - logging: false, disables logging of queries
 */
const config: Options = {
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    dialect: "mysql",
    logging: false
};

export default config;
