import {database, syncDatabase} from "../database";

/* check all model tables */
(async () => {
    await syncDatabase();
    await database.sync();
})();

export {default as User} from './User';
export {default as Statistic} from './Statistic';
export {default as DockerImage} from './DockerImage';
export {default as Language} from './Language';
export {ImageLanguage} from './Language';
export {hasLanguage} from './Language';
