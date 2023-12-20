import express from 'express';
import {DockerImageController, LanguageController} from '../controllers';
import {DockerImageValidator} from '../validations';

/* router instance for the DockerImageController */
const imageRouter = express.Router();

/* parent path for super API calls */
const superPath: string = '/super';

imageRouter.post(`/latestImage`, DockerImageController.getLatestImage);
imageRouter.post(`/imageHistory`, DockerImageController.getHistory);
imageRouter.post(`/currentImage`, DockerImageController.getInUseImage);
imageRouter.post(
    `${superPath}/setCurrentImage`,
    DockerImageValidator.versionCheck,
    DockerImageController.setInUseImage
);
imageRouter.post(
    `${superPath}/createImage`,
    DockerImageValidator.versionCheck,
    DockerImageController.createImage
);
imageRouter.delete(
    `${superPath}/deleteImage`,
    DockerImageValidator.versionCheck,
    DockerImageController.deleteImage
);
imageRouter.post(
    `${superPath}/linkLanguages`,
    DockerImageController.linkLanguages
);
imageRouter.post(
    `${superPath}/unlinkLanguages`,
    DockerImageController.unlinkLanguages
);
imageRouter.post(
    `${superPath}/createLanguage`,
    LanguageController.createLanguage
);
imageRouter.post(
    `${superPath}/getLanguage`,
    LanguageController.getLanguage
);
imageRouter.delete(
    `${superPath}/deleteLanguage`,
    LanguageController.deleteLanguage
);
imageRouter.post(
    `${superPath}/updateLanguage`,
    LanguageController.updateLanguage
);

export default imageRouter;
