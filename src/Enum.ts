export enum API_URI {
    AUTHORIZATION = "https://www.tistory.com/oauth/authorize",
    GET_ACCESS_TOKEN = "https://www.tistory.com/oauth/access_token",
    BLOG_INFO = "https://www.tistory.com/apis/blog/info",
    CREATE_POST = "https://www.tistory.com/apis/post/write",
    UPDATE_POST = "https://www.tistory.com/apis/post/modify",
    READ_POST = "https://www.tistory.com/apis/post/read",
    CATEGORY_LIST = "https://www.tistory.com/apis/category/list",
    UPLOAD_FILE = "https://www.tistory.com/apis/post/attach",
}

export enum PROPERTIES {
    Title = "vscode-with-tistory",
    CLIENT_ID = "Client.OAuth2.ClientID",
    CLIENT_SECRET = "Client.OAuth2.ClientSecret",
    REDIRECT_URI = "Client.OAuth2.RedirectURI",
    TOKEN = "Token",
    BLOG = "Blog",
}

export enum KIND_OF_CERTIFICATE {
    OPEN_BROWSER,
    HAS_NOT_PROPERTY,
    HAS_TOKEN,
}

export enum VISIBILITY {
    PRIVATE = "0",
    PROTECT = "1",
    PUBLIC = "3",
}

export enum INFO_MESSAGES {
    // Login
    OPEN_BROWSER = "브라우저를 확인해주세요",
    // Post
    POSTING = "포스팅 수행중...",
    PUSH_POST_DONE = "게시글 작성 완료",
}

export enum ERROR_MESSAGES {
    // Login Error
    HAS_TOKEN = "이미 티스토리와 연동되어있습니다.",
    INVALID_OAUTH2_PROPERTY = "Client.OAuth2 속성이 알맞지 않습니다.",
    // Post Error
    FAIL_PARSING = "옵션 정보 파싱 실패",
    NOT_EXIST_BLOG = "존재하지 않는 블로그",
    INVALID_DATA_FORMAT = "알맞지 않은 date포멧(yyyy-mm-dd)",
    INVALID_POST_FORMAT = "알맞지 않은 post포멧(true/public/protect/false/private)",
    NOT_MARKDOWN_FILE = "선택된 파일은 .md파일이 아닙니다.",
    FAIL_WRITE_POST_ID = "postId작성 실패, 직접 작성해주십시오",
    // Common Error
    TISTORY_ERROR = "Tistory Error",
    HAS_NOT_TOKEN = "티스토리 미연동 상태",
    NOT_DESIGNATE_ERROR = "예기치 않은 오류",
}
