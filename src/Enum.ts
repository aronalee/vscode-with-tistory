export enum API_URI {
    AUTHORIZATION="https://www.tistory.com/oauth/authorize",
    GET_ACCESS_TOKEN="https://www.tistory.com/oauth/access_token",
    BLOG_INFO="https://www.tistory.com/apis/blog/info"
};
export enum PROPERTIES {
    Title="vscode-with-tistory",
    ClientID="Client.OAuth2.ClientID",
    ClientSecret= "Client.OAuth2.ClientSecret",
    RedirectURI= "Client.OAuth2.RedirectURI",
    Token= "Token"
};

export enum KIND_OF_CERTIFICATE{
    OpenBrowser,
    HasNotProperty,
    HasToken,
}