import * as vscode from "vscode";
import { PROPERTIES } from "./Enum";

export const getConfigProperty = (property: string): string => {
    const configuration = vscode.workspace.getConfiguration(PROPERTIES.Title);
    const value: string | undefined = configuration.get(property);
    if (value !== undefined || value === "") {
        return value;
    } else {
        return "";
    }
};
