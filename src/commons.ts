import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as vscode from "vscode";
import { API_URI, ERROR_MESSAGES, PROPERTIES } from "./Enum";
import { Tistory } from "./interface";

export const getConfigProperty = (property: string): string => {
    const configuration = vscode.workspace.getConfiguration(PROPERTIES.Title);
    const value: string | undefined = configuration.get(property);
    if (value !== undefined || value === "") {
        return value.trim();
    } else {
        return "";
    }
};

export const requestTistory = async (
    axiosRequestConfig: AxiosRequestConfig
) => {
    axiosRequestConfig.validateStatus = (status: number) =>
        status >= 200 && status < 500;
    const axiosResponse: AxiosResponse<Tistory> = await axios(
        axiosRequestConfig
    );
    if (axiosResponse.status !== 200) {
        const {
            data: {
                tistory: { status, error_message },
            },
        } = axiosResponse;
        throw new Error(
            `${ERROR_MESSAGES.TISTORY_ERROR}\n status: ${status} | ${error_message}`
        );
    } else {
        return axiosResponse.data.tistory;
    }
};
