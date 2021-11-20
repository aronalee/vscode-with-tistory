import * as vscode from "vscode";
import { pushPost } from "./apis";
import { authTistory } from "./apis";
import { stopClient } from "./Client";
import { ERROR_MESSAGES, INFO_MESSAGES } from "./Enum";

export function activate(context: vscode.ExtensionContext) {
    const loginTistory = vscode.commands.registerCommand(
        "vscode-with-tistory.login",
        () => {
            try {
                authTistory();
            } catch (e: any) {
                vscode.window.showErrorMessage(e.message);
            }
        }
    );
    const pushOne = vscode.commands.registerCommand(
        "vscode-with-tistory.push_post",
        () => {
            vscode.window.showInformationMessage(INFO_MESSAGES.POSTING);
            pushPost()
                .then((url: string) => {
                    vscode.window
                        .showInformationMessage(
                            `${INFO_MESSAGES.PUSH_POST_DONE}:${url}`,
                            "이동하기"
                        )
                        .then((selection) => {
                            if (selection === "이동하기") {
                                vscode.env.openExternal(vscode.Uri.parse(url));
                            }
                        });
                })
                .catch((error) => {
                    if (error?.stack && error!.message) {
                        vscode.window.showErrorMessage(error.message);
                    } else {
                        vscode.window.showErrorMessage(
                            ERROR_MESSAGES.NOT_DESIGNATE_ERROR
                        );
                    }
                });
        }
    );
    context.subscriptions.push(loginTistory, pushOne);
}

export function deactivate() {
    stopClient();
}
