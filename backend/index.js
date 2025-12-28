import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
const app = express();
// import config from './startup/config.js';
import './startup/db.js';
import routes from './startup/routes.js';


dotenv.config();

app.use(morgan(":date[clf] :method :url :status :res[content-length] - :response-time ms"));
app.use(helmet());

routes(app);

const port = process.env.PORT || 3000;
app.listen(port, () => console.info("Listening on port " + port));