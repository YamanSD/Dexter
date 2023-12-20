import express from 'express';
import {StatisticController} from '../controllers';

/* router instance for the StatisticController */
const statisticRouter = express.Router();

statisticRouter.post('/totalStatistics', StatisticController.getTotalStatistics);

export default statisticRouter;
