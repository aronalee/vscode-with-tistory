import * as vscode from "vscode";
import axios from "axios";
import { BlogInfo, CategoryInfo, PostInfo, TistoryFormat } from "./interface";
import { API_URI, PROPERTIES, ERROR_MESSAGES } from "./Enum";
import * as MarkdownIt from "markdown-it";
import * as MarkdownItEmoji from "markdown-it-emoji";
import { ParsedOptions } from "./Classes";
import { getConfigProperty } from "./commons";

const parsingTagOption = (line: string): string => {
    const regex = /(?<=^-\x20).*/u;
    const tagOption = line.match(regex);
    if (tagOption?.length === 1) {
        return tagOption[0];
    } else {
        return "";
    }
};

const getCategories = async (
    blogName: string
): Promise<Array<CategoryInfo>> => {
    const {
        data: { tistory },
    } = await axios.get(API_URI.CATEGORY_LIST, {
        params: {
            access_token: getConfigProperty(PROPERTIES.Token),
            output: "json",
            blogName,
        },
        validateStatus: (status: number) => status >= 200 && status < 500,
    });

    if (tistory.status === "200") {
        return tistory.item.categories;
    } else {
        throw new Error(
            `${ERROR_MESSAGES.TistoryAPIError}: ${tistory.error_message}`
        );
    }
};
const parsingOption = (line: string): Array<string | boolean> => {
    const regex = new RegExp(
        `^(?<key>title|date|post|tag|comments|password|category|url|postId):\s*?(?<value>.+)?`,
        "u"
    );
    const groups = line.match(regex)?.groups;
    if (groups?.key === "tag") {
        return [groups.key];
    } else if (groups?.key && groups?.value) {
        return [groups.key, groups.value];
    } else {
        return [""];
    }
};
export const readFile = async (
    uri: vscode.Uri,
    blogName: string
): Promise<[ParsedOptions, string, number]> => {
    const { createReadStream } = await import("fs");
    const { createInterface } = await import("readline");

    const categoryList = await getCategories(blogName);
    const options = new ParsedOptions(categoryList);
    let lineNumber = 0;
    let endParsing = false;
    let parsingTag = false;
    let buffer = [""];
    let postIdLocationLine = 0;
    const rl = createInterface({
        input: createReadStream(uri.fsPath),
        crlfDelay: Infinity,
    });
    for await (const line of rl) {
        if (!endParsing) {
            // parsingOptions
            if (lineNumber === 0 && line !== "---") {
                throw new Error(ERROR_MESSAGES.FailParsing);
            } else if (lineNumber === 0 && line === "---") {
                lineNumber++;
                continue;
            } else if (lineNumber > 0 && line !== "---") {
                const parsedArray = parsingOption(line);
                if (parsedArray.length > 0) {
                    const isParsingSuccess = options.setOption(
                        parsedArray,
                        parsingTag
                    );
                    if (parsingTag) {
                        options.tag = parsingTagOption(line);
                    }
                    if (isParsingSuccess) {
                        parsingTag = false;
                    } else if (!isParsingSuccess) {
                        parsingTag = true;
                    }
                }
            } else {
                postIdLocationLine = lineNumber;
                endParsing = true;
            }
        } else {
            // get context
            buffer.push(line + "\n");
        }
        lineNumber++;
    }
    return [options, buffer.join(""), postIdLocationLine];
};

const MD2HTML = (content: string): string => {
    const md = new MarkdownIt();
    md.use(MarkdownItEmoji);
    return md.render(content);
};

const findDefaultBlog = (blogInfos: BlogInfo[]): BlogInfo => {
    for (let blogInfo of blogInfos) {
        if (blogInfo.default === "Y") {
            return blogInfo;
        } else {
            continue;
        }
    }
    throw new Error(ERROR_MESSAGES.NotExistBlog);
};

const findBlog = (blogInfos: BlogInfo[], blogName: string): BlogInfo => {
    for (let blogInfo of blogInfos) {
        if (blogInfo.url === blogName) {
            return blogInfo;
        } else {
            continue;
        }
    }
    throw new Error(ERROR_MESSAGES.NotExistBlog);
};
const uploadNewBlog = async (postedData: PostInfo): Promise<TistoryFormat> => {
    const {
        data: { tistory },
    } = await axios({
        method: "post",
        url: API_URI.PUSH_POST,
        data: postedData,
        validateStatus: (status: number) => status >= 200 && status < 500,
    });
    return tistory as TistoryFormat;
};

const getPostInfo = async (
    postId: string,
    accessToken: string,
    blog: BlogInfo
) => {
    const {
        data: { tistory },
    } = await axios({
        method: "get",
        url: API_URI.READ_POST,
        params: {
            access_token: accessToken,
            output: "json",
            blogName: blog.name,
            postId: postId,
        },
    });
    return tistory;
};

export const postBlog = async (): Promise<string> => {
    const document = vscode.window.activeTextEditor?.document;
    if (document?.languageId === "markdown") {
        const blogInfos: BlogInfo[] = await getBlogInfo();
        let blogName = getConfigProperty(PROPERTIES.Blog);
        let selectedBlog: BlogInfo;
        if (!blogName) {
            selectedBlog = findDefaultBlog(blogInfos);
        } else {
            selectedBlog = findBlog(blogInfos, blogName);
        }
        const [options, markdownContent] = await readFile(
            document.uri,
            selectedBlog.name
        );
        const content = MD2HTML(markdownContent);
        const accessToken = getConfigProperty(PROPERTIES.Token);
        let responseTistory: TistoryFormat;

        let postedData: PostInfo = {
            access_token: accessToken,
            output: "json",
            blogName: selectedBlog.name,
            title: options.title,
            visibility: options.post,
            published: options.date,
            password: options.password,
            tag: options.tag,
            category: options.category,
            slogan: options.url,
            acceptComment: options.comments,
            content,
        };
        if (accessToken) {
            if (!options.postId) {
                responseTistory = await uploadNewBlog(postedData);
            } else {
                const responseBlogInfo = await getPostInfo(
                    options.postId,
                    accessToken,
                    selectedBlog
                );
                let currentBlogDateTime: number;
                const {
                    data: { tistory },
                } = await axios({
                    method: "post",
                    url: API_URI.UPDATE_POST,
                    data: {
                        access_token: accessToken,
                        output: "json",
                        blogName: selectedBlog.name,
                        title: options.title,
                        visibility: options.post,
                        published: options.date,
                        password: options.password,
                        tag: options.tag,
                        category: options.category,
                        slogan: options.url,
                        acceptComment: options.comments,
                        postId: options.postId,
                        content,
                    },
                    validateStatus: (status: number) =>
                        status >= 200 && status < 500,
                });
                responseTistory = tistory;
            }
            if (responseTistory.status !== "200" || !responseTistory.url) {
                throw new Error(
                    `${ERROR_MESSAGES.TistoryAPIError}: ${responseTistory.error_message}`
                );
            } else {
                return responseTistory.url;
            }
        } else {
            throw new Error(ERROR_MESSAGES.HasNotToken);
        }
    } else {
        throw new Error(ERROR_MESSAGES.IsNotMarkdownFile);
    }
};

export const getBlogInfo = async (): Promise<BlogInfo[] | any> => {
    const accessToken: string = getConfigProperty(PROPERTIES.Token);
    if (accessToken) {
        const {
            data: { tistory },
        } = await axios.get(API_URI.BLOG_INFO, {
            params: {
                access_token: accessToken,
                output: "json",
            },
            validateStatus: (status: number) => status >= 200 && status < 500,
        });
        if (tistory.status === "200") {
            return tistory.item.blogs;
        } else {
            throw new Error(
                `${ERROR_MESSAGES.TistoryAPIError}: ${tistory.error_message}`
            );
        }
    } else {
        throw new Error(ERROR_MESSAGES.HasNotToken);
    }
};
