import "dotenv/config";
import * as vscode from "vscode";
import axios from "axios";
import * as dotenv from "dotenv";
import { BlogInfo } from "./interface";

dotenv.config({ path: "D:\\MyProject\\vscode-with-tistory\\.env" });

const { CLIENT_ID, REDIRECT_URI, SECRET_KEY } = process.env;

const API_URI = {
    AUTHORIZATION: "https://www.tistory.com/oauth/authorize",
    GET_ACCESS_TOKEN: "https://www.tistory.com/oauth/access_token",
    BLOG_INFO: "https://www.tistory.com/apis/blog/info",
};
const configuration = vscode.workspace.getConfiguration("vscode-with-tistory");
const setAccessToken = (token: string): void => {
    if (configuration.has("token")) {
        configuration.update("token", token);
    } else {
        throw new Error("Not Exist Token property");
    }
};
const getAccessToken = (): string | false => {
    if (configuration.has("token")) {
        const token: string | undefined = configuration.get("token");
        if (token === undefined) {
            return false;
        } else {
            return token;
        }
    } else {
        return false;
    }
};

export const authorizateTistory = async () => {
    const accessToken: string | boolean = getAccessToken();
    if (!accessToken) {
        vscode.env.openExternal(
            vscode.Uri.parse(
                `${API_URI.AUTHORIZATION}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`
            )
        );
    } else {
        vscode.window.showInformationMessage("Exist Login");
    }
};
// TODO: 글 1개를 포스팅하는 함수 작성
export const pushOnePost = async () => {
    const blogInfo = getBlogInfo();
};

export const getBlogInfo = async (): Promise<BlogInfo | undefined> => {
    try {
        const accessToken: string | boolean = getAccessToken();
        if (accessToken) {
            const {
                data: {
                    tistory: {
                        item: { blogs },
                        status,
                        error_message,
                    },
                },
            } = await axios.get(API_URI.BLOG_INFO, {
                data: {
                    access_token: accessToken,
                    output: "json",
                },
            });
            if (status === "200" && error_message === undefined) {
                for (let item of blogs) {
                    if (item.default === "Y") {
                        vscode.window.showInformationMessage(
                            `Hello ${item.nickname}`
                        );
                        return item;
                    }
                }
            } else {
                throw new Error(error_message);
            }
        } else {
            throw new Error("Not Exist Token");
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Request Failed`);
    }
};

export const createAccessToken = async (code: string): Promise<void> => {
    const {
        data: { access_token },
    } = await axios.get(API_URI.GET_ACCESS_TOKEN, {
        data: {
            client_id: CLIENT_ID,
            client_secret: SECRET_KEY,
            redirect_uri: REDIRECT_URI,
            code,
            grant_type: "authorization_code",
        },
    });
    setAccessToken(access_token);
};
