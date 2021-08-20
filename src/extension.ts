import * as vscode from "vscode";
import {
    certifyTistory,
    getBlogInfo,
    pushOnePost,
    getConfigProperty,
} from "./apis";
import { runClient, stopClient } from "./Client";
import { KIND_OF_CERTIFICATE, PROPERTIES } from "./Enum";

export function activate(context: vscode.ExtensionContext) {
    const loginTistory = vscode.commands.registerCommand(
        "vscode-with-tistory.login",
        () => {
            const redirectURI = getConfigProperty(PROPERTIES.RedirectURI);
            const clientID = getConfigProperty(PROPERTIES.ClientID);
            const accessToken = getConfigProperty(PROPERTIES.Token);
            runClient();
            const result=certifyTistory(accessToken, clientID, redirectURI);
            if(result===KIND_OF_CERTIFICATE.OpenBrowser){
                vscode.window.showInformationMessage("브라우저를 확인해주세요");
            }else if(result===KIND_OF_CERTIFICATE.HasToken){
                vscode.window.showErrorMessage("토큰이 존재합니다.");
            }else if(result===KIND_OF_CERTIFICATE.HasNotProperty){
                vscode.window.showErrorMessage("Client.OAuth2 속성을 확인해주세요")
            }
        }
    );
    const getBlog = vscode.commands.registerCommand(
        "vscode-with-tistory.get-blog",
        () => {
            getBlogInfo();
        }
    );
    const pushOne = vscode.commands.registerCommand(
        "vscode-with-tistory.push-one",
        () => {
            pushOnePost();
        }
    );
    const pushAll = vscode.commands.registerCommand(
        "vscode-with-tistory.push-all",
        () => {
            runClient();
        }
    );

    context.subscriptions.push(loginTistory, getBlog);
}

export function deactivate() {
    stopClient();
}
