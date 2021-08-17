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