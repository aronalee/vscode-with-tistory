import * as http from "http";
import { URL } from "url";
import { getAccessToken } from "./apis";

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
            res.write('<script scr> </script>')
            res.write('done');
        }else{
            res.writeHead(200);
            res.write(error_reason);
        }
        res.end();
    }
);