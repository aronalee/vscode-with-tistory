import "dotenv/config";
import * as vscode from "vscode";
import axios from "axios";
import { BlogInfo, ConfigType } from "./interface";
import { stopClient } from "./Client";
import { API_URI, KIND_OF_CERTIFICATE, PROPERTIES, VISIBILITY } from "./Enum";

const setAccessToken = (token: string): void => {
    const configuration = vscode.workspace.getConfiguration(PROPERTIES.Title);
    if (configuration.has(PROPERTIES.Token)) {
        configuration.update(PROPERTIES.Token, token);
    } else {
        throw new Error("Not Exist Token property");
    }
};

const getBlogInfo = async () => {
    try {
        const access_token: ConfigType = getConfigProperty(PROPERTIES.Token);
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
                return blogs;
            } else {
                throw new Error(error_message);
            }
        } else {
            throw new Error("Not Exist Token");
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Request Failed: ${error}`);
    }
};

const findDefaultBlog=(blogInfos: BlogInfo[]): BlogInfo=>{
    for(let blogInfo of blogInfos) {
        if(blogInfo.default==="Y"){
            return blogInfo;
        }else{
            continue;
        }
    }
    throw new Error('Not Exist Default Blog');
}

export const getConfigProperty = (property: string): ConfigType => {
    const configuration = vscode.workspace.getConfiguration(PROPERTIES.Title);
    const value: string | undefined = configuration.get(property);
    if (value !== undefined || value === "") {
        return value;
    } else {
        return false;
    }
};

export const certifyTistory = (
    accessToken: ConfigType,
    clientID: ConfigType,
    redirectURI: ConfigType
): KIND_OF_CERTIFICATE => {
    if (!(clientID && redirectURI)) {
        return KIND_OF_CERTIFICATE.HasNotProperty;
    } else if (!accessToken) {
        vscode.env.openExternal(
            vscode.Uri.parse(
                `${API_URI.AUTHORIZATION}?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code`
            )
        );
        return KIND_OF_CERTIFICATE.OpenBrowser;
    } else {
        return KIND_OF_CERTIFICATE.HasToken;
    }
};

// TODO: 글 1개를 포스팅하는 함수 작성
export const pushOnePost = async () => {
    try {
        const blogInfos: BlogInfo[] = await getBlogInfo();
        let defaultBlog=findDefaultBlog(blogInfos);
        for (let blog of blogInfos) {
            if (blog.default === "Y") {
                defaultBlog = blog;
            }
        }
    } catch (error) {
        console.log(error);
    }
};


export const createAccessToken = async (code: string): Promise<void> => {
    const client_id: ConfigType = getConfigProperty(PROPERTIES.ClientID);
    const client_secret: ConfigType = getConfigProperty(
        PROPERTIES.ClientSecret
    );
    const redirect_uri: ConfigType = getConfigProperty(PROPERTIES.RedirectURI);
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
        setAccessToken(access_token);
        stopClient();
    } else {
        vscode.window.showErrorMessage("Client.OAuth2속성을 확인해주세요");
    }
};
