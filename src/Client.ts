import * as http from "http";
import { URL } from "url";
import { createAccessToken } from "./apis";

export const client = http.createServer(
    (req: http.IncomingMessage, res: http.ServerResponse) => {
        const { headers, method, url } = req;
        const params = new URL(`http://localhost:5500${url}`).searchParams;
        const [code, error, state] = [
            params.get("code"),
            params.get("error"),
            params.get("state"),
        ];
        if(code!==null){
            createAccessToken(code);
            res.writeHead(200);
            res.write(`close WebPage`);
        }else{
            res.writeHead(200);
            res.write(`Tistory Error: ${error}`);
        }
        res.end();
    }
);