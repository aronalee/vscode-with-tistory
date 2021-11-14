import * as vscode from "vscode";
import { runPosting } from "./pushPost";
import {
    ERROR_MESSAGES,
    INFO_MESSAGES,
    KIND_OF_CERTIFICATE,
    PROPERTIES,
} from "./Enum";
import { getConfigProperty } from "./commons";
import { runClient, stopClient } from "./Client";
import { openAuthPage } from "./loginTistory";

export const pushPost = () => {
    const activeTextEditor = vscode.window.activeTextEditor;
    const document = activeTextEditor?.document;
    if (activeTextEditor && document?.languageId === "markdown") {
        return runPosting(activeTextEditor, document);
    } else {
        throw new Error(ERROR_MESSAGES.NOT_MARKDOWN_FILE);
    }
};

export const authTistory = () => {
    const redirectURI: string = getConfigProperty(PROPERTIES.REDIRECT_URI);
    const clientID: string = getConfigProperty(PROPERTIES.CLIENT_ID);
    const clientSecret: string = getConfigProperty(PROPERTIES.CLIENT_SECRET);
    const accessToken: string = getConfigProperty(PROPERTIES.TOKEN);
    let port = 5500;
    if (redirectURI) {
        const isPort = redirectURI?.match(/(?<=\:)\d{1,5}/);
        if (isPort) {
            port = parseInt(isPort[0]);
        }
    }
    // run local server
    runClient(port);
    // open browser page
    const result = openAuthPage(
        accessToken,
        clientID,
        redirectURI,
        clientSecret
    );

    if (result === KIND_OF_CERTIFICATE.OPEN_BROWSER) {
        vscode.window.showInformationMessage(INFO_MESSAGES.OPEN_BROWSER);
    } else if (result === KIND_OF_CERTIFICATE.HAS_TOKEN) {
        stopClient();
        throw new Error(ERROR_MESSAGES.HAS_TOKEN);
    } else if (result === KIND_OF_CERTIFICATE.HAS_NOT_PROPERTY) {
        stopClient();
        throw new Error(ERROR_MESSAGES.INVALID_OAUTH2_PROPERTY);
    } else {
        stopClient();
        throw new Error(ERROR_MESSAGES.NOT_DESIGNATE_ERROR);
    }
};
