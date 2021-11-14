export interface Tistory {
    tistory: {
        status: string;
        error_message?: string;
    };
}

export interface BlogInfo {
    name: string;
    url: string;
    secondaryUrl: string;
    nickname: string;
    title: string;
    description: string;
    default: "Y" | "N";
    blogIconUrl: string;
    faviconUrl: string;
    profileThumbnailImageUrl: string;
    profileImageUrl: string;
    role: string;
    blogId: string;
    statistics: {
        post: string;
        comment: string;
        trackback: string;
        guestbook: string;
        invitation: string;
    };
}
export interface PostInfo {
    access_token: string;
    output: "json" | "xml";
    blogName: string;
    title: string;
    content?: string;
    visibility?: string;
    category?: string;
    published?: string;
    slogan?: string;
    tag?: string;
    acceptComment?: string;
    password?: string;
    postId?: string;
}
export interface CategoryInfo {
    id: string;
    name: string;
    parent: string;
    label: string;
    entries: string;
}
export interface BlogInfos {
    status: string;
    item: {
        id: string;
        userId: string;
        blogs: BlogInfo[];
    };
}

export interface CategoryList {
    status: string;
    item: {
        categories: Array<CategoryInfo>;
    };
}

export interface ResponseFileUpload {
    status: string;
    url: string;
    replacer: string;
}

export interface ResponsePost extends Tistory {
    status: string;
    url: string;
    postId: string;
}
