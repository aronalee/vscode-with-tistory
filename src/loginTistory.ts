import * as vscode from "vscode";
import axios from "axios";
import { stopClient } from "./Client";
import {
    API_URI,
    KIND_OF_CERTIFICATE,
    PROPERTIES,
    ERROR_MESSAGES,
} from "./Enum";
import { getConfigProperty } from "./commons";

const setAccessToken = (token: string): void => {
    const configuration = vscode.workspace.getConfiguration(PROPERTIES.Title);
    if (configuration.has(PROPERTIES.TOKEN)) {
        configuration.update(PROPERTIES.TOKEN, token);
    } else {
        throw new Error(ERROR_MESSAGES.HAS_TOKEN);
    }
};

export const openAuthPage = (
    accessToken: string,
    clientID: string,
    redirectURI: string,
    clientSecret: string
): KIND_OF_CERTIFICATE => {
    if (!(clientID && redirectURI && clientSecret)) {
        return KIND_OF_CERTIFICATE.HAS_NOT_PROPERTY;
    } else if (!accessToken) {
        vscode.env.openExternal(
            vscode.Uri.parse(
                `${API_URI.AUTHORIZATION}?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code`
            )
        );
        return KIND_OF_CERTIFICATE.OPEN_BROWSER;
    } else {
        return KIND_OF_CERTIFICATE.HAS_TOKEN;
    }
};

export const createAccessToken = async (code: string): Promise<void> => {
    const client_id: string = getConfigProperty(PROPERTIES.CLIENT_ID);
    const client_secret: string = getConfigProperty(PROPERTIES.CLIENT_SECRET);
    const redirect_uri: string = getConfigProperty(PROPERTIES.REDIRECT_URI);
    if (client_id && client_secret && client_secret) {
        const {
            data: { access_token },
        } = await axios.get(API_URI.GET_ACCESS_TOKEN, {
            params: {
                client_id,
                client_secret,
                redirect_uri,
                code,
                grant_type: "authorization_code",
            },
            validateStatus: (status: number) => status >= 200 && status < 500,
        });
        setAccessToken(access_token);
        stopClient();
    } else {
        throw new Error(ERROR_MESSAGES.INVALID_OAUTH2_PROPERTY);
    }
};
