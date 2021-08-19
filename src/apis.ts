import "dotenv/config";
import * as vscode from "vscode";
import axios from "axios";
import { BlogInfo } from "./interface";
import { stopClient } from "./Client";

const API_URI = {
    AUTHORIZATION: "https://www.tistory.com/oauth/authorize",
    GET_ACCESS_TOKEN: "https://www.tistory.com/oauth/access_token",
    BLOG_INFO: "https://www.tistory.com/apis/blog/info",
};

type ConfigType = string | false;

const getConfigProperty = (property: string): ConfigType => {
    const configuration = vscode.workspace.getConfiguration(
        "vscode-with-tistory"
    );
    const value: string | undefined = configuration.get(property);
    if (value !== undefined || value === "") {
        return value;
    } else {
        return false;
    }
};

const setAccessToken = (token: string): void => {
    const configuration = vscode.workspace.getConfiguration(
        "vscode-with-tistory"
    );
    if (configuration.has("token")) {
        configuration.update("token", token);
    } else {
        throw new Error("Not Exist Token property");
    }
};

export const authorizateTistory = async () => {
    const accessToken: ConfigType = getConfigProperty("token");
    const client_id: ConfigType = getConfigProperty("OAuth2.ClientID");
    const redirect_uri: ConfigType = getConfigProperty("OAuth2.RedirectURI");
    if (!(client_id && redirect_uri)) {
        vscode.window.showErrorMessage("OAuth2속성을 확인해주세요");
    } else if (!accessToken) {
        vscode.env.openExternal(
            vscode.Uri.parse(
                `${API_URI.AUTHORIZATION}?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code`
            )
        );
    } else {
        vscode.window.showErrorMessage("토큰이 존재합니다.");
    }
};

// TODO: 글 1개를 포스팅하는 함수 작성
export const pushOnePost = async () => {
    const blogInfo = getBlogInfo();
};

export const getBlogInfo = async (): Promise<BlogInfo | undefined> => {
    try {
        const access_token: ConfigType = getConfigProperty("token");
        if (access_token) {
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
                    access_token,
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
    const client_id: ConfigType = getConfigProperty("OAuth2.ClientID");
    const client_secret: ConfigType = getConfigProperty("OAuth2.ClientSecret");
    const redirect_uri: ConfigType = getConfigProperty("OAuth2.RedirectURI");
    if (client_id && client_secret && client_secret) {
        const {
            data: { access_token },
        } = await axios.get(API_URI.GET_ACCESS_TOKEN, {
            data: {
                client_id,
                client_secret,
                redirect_uri,
                code,
                grant_type: "authorization_code",
            },
        });
        stopClient();
        setAccessToken(access_token);
    } else {
        vscode.window.showErrorMessage("OAuth2속성을 확인해주세요");
    }
};
