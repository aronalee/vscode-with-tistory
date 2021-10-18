import { AxiosError } from "axios";
import * as vscode from "vscode";
import { certifyTistory, postBlog, getConfigProperty } from "./apis";
import { runClient, stopClient } from "./Client";
import {
    ERROR_MESSAGES,
    INFO_MESSAGES,
    KIND_OF_CERTIFICATE,
    PROPERTIES,
} from "./Enum";

export function activate(context: vscode.ExtensionContext) {
    const loginTistory = vscode.commands.registerCommand(
        "vscode-with-tistory.login",
        () => {
            try {
                const redirectURI: string = getConfigProperty(
                    PROPERTIES.RedirectURI
                );
                const clientID: string = getConfigProperty(PROPERTIES.ClientID);
                const accessToken: string = getConfigProperty(PROPERTIES.Token);
                let port = 5500;
                if (redirectURI) {
                    const isPort = redirectURI?.match(/(?<=\:)\d{1,5}/);
                    if (isPort) {
                        port = parseInt(isPort[0]);
                    }
                }
                runClient(port);
                const result = certifyTistory(
                    accessToken,
                    clientID,
                    redirectURI
                );
                if (result === KIND_OF_CERTIFICATE.OpenBrowser) {
                    vscode.window.showInformationMessage(
                        INFO_MESSAGES.OpenBrowser
                    );
                } else if (result === KIND_OF_CERTIFICATE.HasToken) {
                    throw new Error(ERROR_MESSAGES.HasToken);
                } else if (result === KIND_OF_CERTIFICATE.HasNotProperty) {
                    throw new Error(ERROR_MESSAGES.OAuth2Property);
                }
            } catch (e: any) {
                vscode.window.showErrorMessage(e.message);
            }
        }
    );
    const pushOne = vscode.commands.registerCommand(
        "vscode-with-tistory.pushOrUpdatePost",
        () => {
            vscode.window.showInformationMessage(INFO_MESSAGES.RunPosting);
            postBlog()
                .then((url: string) => {
                    vscode.window
                        .showInformationMessage(
                            `${INFO_MESSAGES.PushPost}:${url}`,
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
                            ERROR_MESSAGES.NotDesignateError
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
