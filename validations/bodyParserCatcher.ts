import {Request, Response} from "express";
import {Http} from "../controllers";

const catcher = (err: unknown, req: Request, res: Response, next: (...arg: any[]) => any) => {
    if (err) {
        res.status(Http.BAD).send('Bad JSON data')
    } else {
        next();
    }
};

export default catcher;
