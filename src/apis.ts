import "dotenv/config";
import * as vscode from "vscode";
import axios from "axios";
import { BlogInfo, ConfigType } from "./interface";
import { stopClient } from "./Client";
import {API_URI,PROPERTIES} from './Enum';


const setAccessToken = (token: string): void => {
    const configuration = vscode.workspace.getConfiguration(
        PROPERTIES.TITLE
    );
    if (configuration.has("token")) {
        configuration.update("token", token);
    } else {
        throw new Error("Not Exist Token property");
    }
};

export const getConfigProperty = (property: string): ConfigType => {
    const configuration = vscode.workspace.getConfiguration(
        PROPERTIES.TITLE
    );
    const value: string | undefined = configuration.get(property);
    if (value !== undefined || value === "") {
        return value;
    } else {
        return false;
    }
};

export const authorizateTistory = async () => {
    const accessToken: ConfigType = getConfigProperty(PROPERTIES.TOKEN);
    const client_id: ConfigType = getConfigProperty(PROPERTIES.CLIENT_ID);
    const redirect_uri: ConfigType = getConfigProperty(PROPERTIES.REDIRECT_URI);
    if (!(client_id && redirect_uri)) {
        vscode.window.showErrorMessage("Client.OAuth2속성을 확인해주세요");
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
    const blogInfo: BlogInfo| undefined = await getBlogInfo();
};

export const getBlogInfo = async (): Promise<BlogInfo | undefined> => {
    try {
        const access_token: ConfigType = getConfigProperty(PROPERTIES.TOKEN);
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
    const client_id: ConfigType = getConfigProperty(PROPERTIES.CLIENT_ID);
    const client_secret: ConfigType = getConfigProperty(PROPERTIES.CLIENT_SECRET);
    const redirect_uri: ConfigType = getConfigProperty(PROPERTIES.REDIRECT_URI);
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
        vscode.window.showErrorMessage("Client.OAuth2속성을 확인해주세요");
    }
};
