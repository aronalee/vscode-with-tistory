import * as vscode from "vscode";
import {
    certifyTistory,
    getBlogInfo,
    pushOnePost,
    getConfigProperty,
} from "./apis";
import { runClient, stopClient } from "./Client";


export function activate(context: vscode.ExtensionContext) {
    const loginTistory = vscode.commands.registerCommand(
        "vscode-with-tistory.login",
        () => {
            getConfigProperty("Client.OAuth2.RedirectURI");
            runClient();
            certifyTistory();
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

    context.subscriptions.push(loginTistory,getBlog);
}

export function deactivate() {
    stopClient();
}