import * as http from "http";
import { URL } from "url";
import axios from "axios";
import { getAccessToken } from "./apis";
import { resolve } from "path";

export const client = http.createServer(
    (req: http.IncomingMessage, res: http.ServerResponse) => {
        const { headers, method, url } = req;
        const params = new URL(`http://localhost:5500${url}`).searchParams;
        const [code, error, error_reason, state] = [
            params.get("code"),
            params.get("error"),
            params.get("error_reason"),
            params.get("state"),
        ];
        if(code!==null){
            getAccessToken(code);
            res.writeHead(200);
            res.write('done');
        }else{
            res.writeHead(200);
            res.write(error_reason);
        }
        res.end();
    }
);