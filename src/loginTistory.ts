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
    if (configuration.has(PROPERTIES.Token)) {
        configuration.update(PROPERTIES.Token, token);
    } else {
        throw new Error(ERROR_MESSAGES.HasToken);
    }
};

export const certifyTistory = (
    accessToken: string,
    clientID: string,
    redirectURI: string
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

export const createAccessToken = async (code: string): Promise<void> => {
    const client_id: string = getConfigProperty(PROPERTIES.ClientID);
    const client_secret: string = getConfigProperty(PROPERTIES.ClientSecret);
    const redirect_uri: string = getConfigProperty(PROPERTIES.RedirectURI);
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
        });
        setAccessToken(access_token);
        stopClient();
    } else {
        throw new Error(ERROR_MESSAGES.OAuth2Property);
    }
};
