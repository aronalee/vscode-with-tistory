import * as vscode from "vscode";
import { authorizateTistory,getBlogInfo,pushOnePost } from "./apis";
import { runClient, stopClient } from "./Client";


export function activate(context: vscode.ExtensionContext) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const loginTistory = vscode.commands.registerCommand(
        "vscode-with-tistory.login",
        () => {
            runClient();
            authorizateTistory();
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