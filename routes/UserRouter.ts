import express, {Request, Response} from 'express';
import {UserController} from '../controllers';
import {UserValidator} from '../validations';

/* router instance for the StatisticController */
const userRouter = express.Router();

/* parent path for admin API calls */
const adminPath: string = '/admin';

userRouter.post('/authenticate', UserValidator.createUserValidation, UserController.authenticate);
userRouter.post(`${adminPath}/allUsers`, UserController.getAllUsers);
userRouter.post('/userData', UserController.getUser);
userRouter.post('/register', UserValidator.createUserValidation, (req: Request, res: Response) => UserController.register(req, res, false));
userRouter.post(`${adminPath}/createUser`, UserValidator.createUserValidation, UserController.createUser);
userRouter.delete(`${adminPath}/deleteUser`, UserValidator.deleteUserValidation, UserController.deleteUser);
userRouter.post(`${adminPath}/setUserBanStatus`, UserValidator.setBannedValidation, UserController.setBanUser);
userRouter.post(`/updateUser`, UserValidator.updateUserValidation, UserController.updateUser);

export default userRouter;
