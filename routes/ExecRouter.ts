import express from 'express';
import {ExecController} from '../controllers';

/* router instance for the ExecController */
const execRouter = express.Router();

/* parent path for admin API calls */
const adminPath: string = '/admin';

execRouter.post('/execute', ExecController.execute);
execRouter.get('/list', ExecController.listLanguages);
execRouter.post(`${adminPath}/currentRunning`, ExecController.currentRunningContainers);

export default execRouter;
