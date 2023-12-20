import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import {ExecRouter, StatisticRouter, UserRouter, DockerImageRouter, ViewRouter} from "./routes";
import {ParserCatcher} from "./validations";


/* main parent URI for the API calls */
const apiParent = '/api';

/* express API instance */
const app = express();

/*
 * sets up middleware to parse URL-encoded data in HTTP requests.
 * The bodyParser middleware is used to parse the request body
 * when data is sent in the form of x-www-form-urlencoded.
 * The {extended: true} option indicates that the query string values can be of any data type
 */
app.use(bodyParser.urlencoded({extended: true}));

/*
 * sets up middleware to parse JSON data in HTTP requests.
 * The bodyParser middleware is used to parse the request
 * body when data is sent in JSON format.
 * It will convert the JSON data into a JavaScript object
 */
app.use(bodyParser.json());

/*
 * View engine for rendering the user views.
 */
app.set('view engine', 'ejs');


/* error catcher */
app.use(ParserCatcher);

/*
 * sets up middleware for handling Cross-Origin Resource Sharing (CORS).
 *  CORS is a security feature that controls which origins
 * (i.e., websites or domains) are allowed to access resources on
 * your server.
 * In this line, you're configuring CORS to allow requests from any origin
 */
app.use(cors({origin: '*'}));

/* link public static files */
app.use(express.static(`${__dirname}/../public`));
app.use(express.static(`${__dirname}/public`));

/* map routes */
app.use(`${apiParent}/statistics`, StatisticRouter);
app.use(`${apiParent}/users`, UserRouter);
app.use(`${apiParent}/exec`, ExecRouter);
app.use(`${apiParent}/docker`, DockerImageRouter);
app.use('/', ViewRouter);
app.use((req, res) => {
   res.redirect("/");
});

/* application port */
const port = Number(process.env.APP_PORT);

/*
 * start listening on the port.
 */
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`);
});
