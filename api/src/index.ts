import express from "express";
import cors from "cors";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";

const app = express();

app.use(cors({credentials: true}))
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());     

app.get("/", (req, res) => {
    res.send("Hello World of Warcraft");
});



const server = http.createServer(app);

server.listen(8080, () => {
    console.log("Server is running on port 8080");
})