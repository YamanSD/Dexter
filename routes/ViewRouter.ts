import express from 'express';
import {LanguageService, UserService, DockerImageService} from '../services';
import {verifyToken} from "../controllers/helpers";

/* router instance for the ViewController */
const viewRouter = express.Router();

viewRouter.get('/profile', async (req, res) => {
    const token = req.query.access_token as string;

    return verifyToken(req, res, async (user) => {
        /* get user statistics */
        const stats = await user.getStatistics();

        res.render('profile', {
            user: user.export,
            bytes: stats.totalMemory,
            millis: stats.totalTime,
            execCount: stats.executionCount,
            token: token
        });

        return res;
    }, false, false, token, true);
});

viewRouter.get('/auth', (req, res) => {
    res.render('auth');
});

viewRouter.get('/', async (req, res) => {
    // @ts-ignore, provided by sequelize, but not visible.
    const langs = (await DockerImageService.getInUse()).result?.Languages.map(l => l.language_name);
    const images = (await DockerImageService.getHistory()).result?.map(i => {
        return {
            version: i.version,
            inUse: i.isInUse,
            // @ts-ignore, provided by sequelize, but not visible.
            langs: i.Languages.map(l => l.language_name) ?? []
        };
    }) ?? [];

    res.render('index', {
        token: req.query.access_token,
        langs: langs ?? [],
        images: images
    });
});

viewRouter.get('/admin/usersPanel', async (req, res) => {
    const token = req.query.access_token as string;

    return verifyToken(req, res, async (user) => {
        const users = (await UserService.getAllUsers()).result;

        res.render('usersPanel', {
            users: users,
            sender: user.export
        });

        return res;
    }, true, false, token, true);
});

viewRouter.get('/super/langsPanel', async (req, res) => {
    const token = req.query.access_token as string;

    return verifyToken(req, res, async (user) => {
        const langNames = (await LanguageService.allLanguages()).result as string[];
        const langs = (await LanguageService.getLanguages(langNames)).result;

        res.render('langsPanel', {
            langs: langs,
            sender: user.export
        });

        return res;
    }, true, true, token, true);
});

viewRouter.get('/super/imagesPanel', async (req, res) => {
    const token = req.query.access_token as string;

    return verifyToken(req, res, async (user) => {
        const images = (await DockerImageService.getHistory()).result;

        res.render('imagesPanel', {
            images: images,
            langs: (await LanguageService.allLanguages()).result,
            sender: user.export
        });

        return res;
    }, true, true, token, true);
});

export default viewRouter;
