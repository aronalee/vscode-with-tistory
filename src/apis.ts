import "dotenv/config";
import * as vscode from "vscode";
import axios from "axios";
import * as dotenv from "dotenv";
import { BlogInfo } from "./interface";

dotenv.config({ path: "D:\\MyProject\\vscode-with-tistory\\.env" });

const { CLIENT_ID, REDIRECT_URI, SECRET_KEY } = process.env;

const API_URI = {
    AUTHORIZATION: "https://www.tistory.com/oauth/authorize",
    GET_access_token: "https://www.tistory.com/oauth/access_token",
    BlogInfo: "https://www.tistory.com/apis/blog/info",
};

let access_token: String = "";
function setAccessToken(token: string) {
    access_token = token;
}

const checkAccessToken = (): boolean =>access_token !== "" ;

// TODO: 현재 workspace의 path를 조회 => 절대경로로 파일을 저장
const saveToken = (token: string): void => {
    console.log(token);
};

export const authorizateTistory = async () => {
    if (!checkAccessToken()) {
        vscode.env.openExternal(
            vscode.Uri.parse(
                `${API_URI.AUTHORIZATION}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`
            )
        );
    } else {
        vscode.window.showInformationMessage("Exist Login");
    }
};

export const pushOnePost = async () => {
    const blogInfo = getBlogInfo();
};

export const getBlogInfo = async (): Promise<BlogInfo | undefined> => {
    try {
        if(checkAccessToken()){
            const {
                data: {
                    tistory: {
                        item: { blogs },
                        status,
                        error_message,
                    },
                },
            } = await axios.get(API_URI.BlogInfo, {
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
        }else{
            throw new Error('Not Exist Token');
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Request Failed`);
    }
};

export const getAccessToken = async (code: string): Promise<void> => {
    const {
        data: { access_token },
    } = await axios.get(API_URI.GET_access_token, {
        data: {
            client_id: CLIENT_ID,
            client_secret: SECRET_KEY,
            redirect_uri: REDIRECT_URI,
            code,
            grant_type: "authorization_code",
        },
    });
    setAccessToken(access_token);
    saveToken(access_token);
};
