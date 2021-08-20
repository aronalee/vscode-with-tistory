import * as http from "http";
import { URL } from "url";
import { createAccessToken } from "./apis";

const client = http.createServer(
    (req: http.IncomingMessage, res: http.ServerResponse) => {
        const { url } = req;
        const params = new URL(`http://localhost${url}`).searchParams;
        const [code, error,error_description] = [
            params.get("code"), params.get("error"),params.get("error_description")];
        if (code !== null) {
            createAccessToken(code);
            res.writeHead(200);
            res.write(`close WebPage`);
        } else {
            res.writeHead(200);
            res.write(`Tistory Error: ${error} => ${error_description}`);
        }
        res.end();
    }
);

export const runClient = (port: number): void => {
    if (!client.listening) {
        client.listen(port, () => {
            console.log("Start Client");
        });
    }
};
export const stopClient = (): void => {
    if (client.listening) {
        client.close(() => console.log("Stop Client"));
    }
};
