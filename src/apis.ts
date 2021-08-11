import "dotenv/config";
import * as vscode from "vscode";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config({path: 'D:\\MyProject\\vscode-with-tistory\\.env'});


const {CLIENT_ID,REDIRECT_URI,SECRET_KEY}=process.env;
let ACCESS_TOKEN: String='';
const API_LIST={
    AUTHORIZATION:"https://www.tistory.com/oauth/authorize",
    GET_ACCESS_TOKEN:"https://www.tistory.com/oauth/access_token"
}


export const authorizateTistory = async (context: vscode.ExtensionContext) => {
    vscode.env.openExternal(
        vscode.Uri.parse(
            `${API_LIST.AUTHORIZATION}=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`
            )
        );
};


export const getAccessToken=async (code: string)=>{
    const {data:{
        access_token
    }} =await axios.get(API_LIST.GET_ACCESS_TOKEN,{
        data:{
            client_id:CLIENT_ID,
            client_secret:SECRET_KEY,
            redirect_uri:REDIRECT_URI,
            code,
            grant_type:'authorization_code'
        }
    });
    ACCESS_TOKEN=access_token;
}