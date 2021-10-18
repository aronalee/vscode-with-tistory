export enum API_URI {
    AUTHORIZATION = "https://www.tistory.com/oauth/authorize",
    GET_ACCESS_TOKEN = "https://www.tistory.com/oauth/access_token",
    BLOG_INFO = "https://www.tistory.com/apis/blog/info",
    PUSH_POST = "https://www.tistory.com/apis/post/write",
    UPDATE_POST = "https://www.tistory.com/apis/post/modify",
    READ_POST = "https://www.tistory.com/apis/post/read",
    CATEGORY_LIST = "https://www.tistory.com/apis/category/list",
    UPLOAD_FILE = "https://www.tistory.com/apis/post/attach",
}
export enum PROPERTIES {
    Title = "vscode-with-tistory",
    ClientID = "Client.OAuth2.ClientID",
    ClientSecret = "Client.OAuth2.ClientSecret",
    RedirectURI = "Client.OAuth2.RedirectURI",
    Token = "Token",
    Blog = "Blog",
}

export enum KIND_OF_CERTIFICATE {
    OpenBrowser,
    HasNotProperty,
    HasToken,
}

export enum VISIBILITY {
    Private = "0",
    Protect = "1",
    Public = "3",
}

export enum INFO_MESSAGES {
    // Login
    OpenBrowser = "브라우저를 확인해주세요",
    // Post
    RunPosting = "포스팅 수행중...",
    PushPost = "새로운 게시글로 블로그 업로드 완료",
    UpdatePost = "게시글 수정 완료",
}

export enum ERROR_MESSAGES {
    // Login Error
    HasToken = "Login Error: Exist Token property",
    OAuth2Property = "Login Error: Check Client.OAuth2 property",
    // Post Error
    FailParsing = "Blog Post Error: Parsing Tag Error",
    NotExistBlog = "Blog Post Error: Not Exist Blog",
    NotMathDateFormat = "Blog Post Error: Not match date format",
    NotMatchPostFormat = "Blog Post Error: Not match post format",
    IsNotMarkdownFile = "Blog Post Error: This file is not .md file",
    // Common Error
    TistoryAPIError = "Tistory API Error",
    HasNotToken = "Not Exist Token property",
    NotDesignateError = "Not designate error",
    FileSystemError = "FileSystemError",
}
