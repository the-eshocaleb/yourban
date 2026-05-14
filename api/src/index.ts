import express from "express";
import cors from "cors";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import movieRouter from "./controllers/movie";

// import boxOffice200 from "./box-office-200.json";

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

app.use("/", movieRouter);

const server = http.createServer(app);

server.listen(8080, () => {
  console.log("Server is running on port 8080");
});
