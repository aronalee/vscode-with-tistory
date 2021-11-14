import * as vscode from "vscode";
import {
    BlogInfo,
    CategoryInfo,
    CategoryList,
    PostInfo,
    ResponseFileUpload,
    BlogInfos,
    ResponsePost,
} from "./interface";
import { API_URI, PROPERTIES, ERROR_MESSAGES } from "./Enum";
import { ParsedOptions } from "./Classes";
import { getConfigProperty, requestTistory } from "./commons";
import Token = require("markdown-it/lib/token");

const parsingTagOption = (line: string): string => {
    const regex = /(?<=^-\x20).*/u;
    const tagOption = line.match(regex);
    if (tagOption?.length === 1) {
        return tagOption[0];
    } else {
        return "";
    }
};
const findDefaultBlog = (blogInfos: BlogInfo[]): BlogInfo => {
    for (let blogInfo of blogInfos) {
        if (blogInfo.default === "Y") {
            return blogInfo;
        } else {
            continue;
        }
    }
    throw new Error(ERROR_MESSAGES.NOT_EXIST_BLOG);
};

const findBlog = (blogInfos: BlogInfo[], blogName: string): BlogInfo => {
    for (let blogInfo of blogInfos) {
        if (blogInfo.name === blogName) {
            return blogInfo;
        } else {
            continue;
        }
    }
    throw new Error(ERROR_MESSAGES.NOT_EXIST_BLOG);
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

const readFile = async (
    document: vscode.TextDocument,
    blogName: string
): Promise<[ParsedOptions, string, number]> => {
    const categoryList = await getCategories(blogName);
    const options = new ParsedOptions(categoryList);
    let endOptionLineNumber = 0;
    let endParsing = false;
    let parsingTag = false;

    while (!endParsing) {
        const line = document.lineAt(endOptionLineNumber).text;
        // parsingOptions
        if (endOptionLineNumber === 0 && line !== "---") {
            throw new Error(ERROR_MESSAGES.FAIL_PARSING);
        } else if (endOptionLineNumber === 0 && line === "---") {
            endOptionLineNumber++;
            continue;
        } else if (endOptionLineNumber > 0 && line !== "---") {
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
            endParsing = true;
            endOptionLineNumber++;
            continue;
        }
        endOptionLineNumber++;
    }
    const content = document.getText(
        new vscode.Range(endOptionLineNumber, 0, document.lineCount, 0)
    );
    return [options, content, endOptionLineNumber];
};

const uploadImage = async (uri: vscode.Uri, blogName: string) => {
    const FormData = require("form-data");
    const formData = new FormData();
    const buffer = await vscode.workspace.fs.readFile(uri);
    const splitPath = uri.path.split("/");
    const filename = splitPath.pop();
    formData.append("access_token", getConfigProperty(PROPERTIES.TOKEN));
    formData.append("output", "json");
    formData.append("blogName", blogName);
    formData.append("uploadedfile", buffer, filename);
    const tistory = (await requestTistory({
        method: "post",
        url: API_URI.UPLOAD_FILE,
        headers: formData.getHeaders(),
        data: formData,
    })) as ResponseFileUpload;
    return tistory.url!;
};

const convertImageURL = async (
    blogName: string,
    tokens: Array<Token>,
    document: vscode.TextDocument
): Promise<Token[]> => {
    const path = await import("path");
    const queue: Array<Token> = [];
    //Search img tag(BFS)
    while (queue.length > 0) {
        const token = queue.shift(); // TODO: 빠른걸로 교체
        if (token?.children) {
            token.children.forEach((child) => queue.push(child));
        }
        const inputImageSrc = token!.attrGet("src");
        if (token?.type === "image" && token.tag === "img" && inputImageSrc) {
            const imageAbsolutePath = path.resolve(
                document.uri.fsPath,
                "../",
                inputImageSrc
            );
            const uri = vscode.Uri.parse(inputImageSrc);
            const url = await uploadImage(uri, blogName);
            if (uri.scheme === "https" || uri.scheme === "http") {
                break;
            } else {
                token.attrSet("src", url);
            }
        }
    }
    return tokens;
};

const convertMD2HTML = async (
    blogName: string,
    content: string,
    document: vscode.TextDocument
): Promise<string> => {
    const MarkdownIt = await import("markdown-it");
    // MD2Token
    const md = new MarkdownIt();
    md.use(await import("markdown-it-emoji"));
    const tokens = await convertImageURL(
        blogName,
        md.parse(content, {}),
        document
    );
    // Token2HTML
    return md.renderer.render(tokens, {}, {});
};
// Network Modules
const getCategories = async (
    blogName: string
): Promise<Array<CategoryInfo>> => {
    const tistory = (await requestTistory({
        url: API_URI.CATEGORY_LIST,
        method: "get",
        params: {
            access_token: getConfigProperty(PROPERTIES.TOKEN),
            output: "json",
            blogName,
        },
    })) as CategoryList;
    return tistory.item!.categories;
};

const getBlogInfo = async (): Promise<BlogInfo[] | any> => {
    const accessToken: string = getConfigProperty(PROPERTIES.TOKEN);
    if (accessToken) {
        const tistory = (await requestTistory({
            method: "get",
            url: API_URI.BLOG_INFO,
            params: {
                access_token: accessToken,
                output: "json",
            },
        })) as BlogInfos;
        return tistory.item?.blogs;
    } else {
        throw new Error(ERROR_MESSAGES.HAS_NOT_TOKEN);
    }
};
const uploadNewBlog = async (postedData: PostInfo): Promise<ResponsePost> => {
    const tistory: ResponsePost = (await requestTistory({
        method: "post",
        url: API_URI.CREATE_POST,
        data: postedData,
    })) as ResponsePost;
    return tistory;
};
const updatePost = async (
    postDate: PostInfo,
    options: ParsedOptions
): Promise<ResponsePost> => {
    //add postId
    postDate.postId = options.postId;
    // accept option time?
    const currentTime = Math.floor(new Date().getTime() / 1000);
    if (parseInt(options.date) > currentTime) {
        postDate.published = options.date;
    }
    return (await requestTistory({
        method: "post",
        url: API_URI.UPDATE_POST,
        data: postDate,
    })) as ResponsePost;
};

const writePostID = async (
    textEditor: vscode.TextEditor,
    postId: string,
    endOfOption: number
) => {
    const isSuccess = await textEditor.edit((editorBuilder) => {
        editorBuilder.insert(
            new vscode.Position(endOfOption, "".charCodeAt(0)),
            `postId: ${postId}\n`
        );
    });
    if (!isSuccess) {
        throw new Error(
            `${ERROR_MESSAGES.FAIL_WRITE_POST_ID}=> postId: ${postId}`
        );
    }
};

export const runPosting = async (
    activeTextEditor: vscode.TextEditor,
    document: vscode.TextDocument
): Promise<string> => {
    const blogInfos: BlogInfo[] = await getBlogInfo();
    let blogName = getConfigProperty(PROPERTIES.BLOG);
    let selectedBlog: BlogInfo;

    // Select Blog
    if (!blogName) {
        selectedBlog = findDefaultBlog(blogInfos);
    } else {
        selectedBlog = findBlog(blogInfos, blogName);
    }
    // ReadFile
    const [options, markdownContent, endOfOption] = await readFile(
        document,
        selectedBlog.name
    );
    // MD2HTML
    const content = await convertMD2HTML(
        selectedBlog.name,
        markdownContent,
        document
    );
    //get AccessToken
    const accessToken = getConfigProperty(PROPERTIES.TOKEN);
    // post data
    let postInfo: PostInfo = {
        access_token: accessToken,
        output: "json",
        blogName: selectedBlog.name,
        title: options.title,
        visibility: options.post,
        password: options.password,
        tag: options.tag,
        category: options.category,
        slogan: options.url,
        acceptComment: options.comments,
        content,
    };
    if (accessToken) {
        if (options.postId === "0") {
            postInfo.published = options.date;
            const { url, postId } = await uploadNewBlog(postInfo);
            await writePostID(activeTextEditor, postId, endOfOption);
            return url;
        } else {
            const { url } = await updatePost(postInfo, options);
            return url;
        }
    } else {
        throw new Error(ERROR_MESSAGES.HAS_NOT_TOKEN);
    }
};
