import * as http from "http";
import { URL } from "url";
import { createAccessToken } from "./apis";

const client = http.createServer(
    (req: http.IncomingMessage, res: http.ServerResponse) => {
        const { url } = req;
        const params = new URL(`http://localhost${url}`).searchParams;
        const [code, error] = [
            params.get("code"),
            params.get("error")
        ];
        if (code !== null) {
            createAccessToken(code);
            res.writeHead(200);
            res.write(`close WebPage`);
        } else {
            res.writeHead(200);
            res.write(`Tistory Error: ${error}`);
        }
        res.end();
    }
);


export const runClient = () => {
    if (!client.listening) {
        client.listen(5500, () => {
            console.log("Start Client");
        });
    }
};
export const stopClient = () => {
    if (client.listening) {
        client.close(() => console.log("Stop Client"));
    }
};
