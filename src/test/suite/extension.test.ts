import * as assert from "assert";
import * as vscode from "vscode";
import axios, { AxiosResponse } from "axios";
import * as fs from "fs";
import { createInterface } from "readline";
import { API_URI, ERROR_MESSAGES, PROPERTIES, VISIBILITY } from "../../Enum";
import { getConfigProperty, requestTistory } from "../../commons";
import {
    BlogInfo,
    BlogInfos,
    CategoryInfo,
    CategoryList,
    PostInfo,
} from "../../interface";
import * as MarkdownIt from "markdown-it";
import * as MarkdownItEmoji from "markdown-it-emoji";
import Token = require("markdown-it/lib/token");
import { it } from "mocha";
import path = require("path");
import { ParsedOptions } from "../../Classes";

const accessToken = getConfigProperty(PROPERTIES.TOKEN);
const dateTimeFormat = "2021-09-17 03:24:00";
const timestamp = new Date(dateTimeFormat).getTime() / 1000;
let selectedBlog: BlogInfo;

const findBlog = (blogInfos: BlogInfo[], name: string): BlogInfo => {
    for (let blogInfo of blogInfos) {
        if (blogInfo.name === name) {
            return blogInfo;
        } else {
            continue;
        }
    }
    throw new Error("디폴트 블로그 미존재");
};

const getBlogInfo = async (): Promise<BlogInfo[] | any> => {
    const accessToken: string = getConfigProperty(PROPERTIES.TOKEN);
    if (accessToken) {
        const tistory: Partial<BlogInfos> = await requestTistory({
            method: "get",
            url: API_URI.BLOG_INFO,
            params: {
                access_token: accessToken,
                output: "json",
            },
        });
        return tistory.item?.blogs;
    } else {
        throw new Error(ERROR_MESSAGES.HAS_NOT_TOKEN);
    }
};
const getCategories = async (
    blogName: string
): Promise<Array<CategoryInfo>> => {
    const tistory: Partial<CategoryList> = await requestTistory({
        url: API_URI.CATEGORY_LIST,
        method: "post",
        params: {
            access_token: getConfigProperty(PROPERTIES.TOKEN),
            output: "json",
            blogName,
        },
    });
    return tistory.item!.categories;
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
const parsingTagOption = (line: string): string => {
    const regex = /(?<=^-\x20).*/u;
    const tagOption = line.match(regex);
    if (tagOption?.length === 1) {
        return tagOption[0];
    } else {
        return "";
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
            continue;
        }
        endOptionLineNumber++;
    }
    const content = document.getText(
        new vscode.Range(endOptionLineNumber, 0, document.lineCount, 0)
    );
    return [options, content, endOptionLineNumber];
};
before("Get Default Blog ", async () => {
    const blogInfos: BlogInfo[] = await getBlogInfo();
    selectedBlog = findBlog(blogInfos, "greenflamingo");
    assert.notStrictEqual(selectedBlog, undefined);
});

describe("Extension Test", () => {
    describe("VSCode test", () => {
        it("get editor", () => {
            const { window } = vscode;
            assert.ok(window.activeTextEditor?.selections);
            assert.strictEqual(
                window.activeTextEditor?.document.languageId,
                "markdown"
            );
            assert.strictEqual(
                window.activeTextEditor?.document.uri.path,
                "/d:/blog/vscode-with-tistory-test/parsingOption.md"
            );
        });
        it("Check External Image", async () => {
            const name1 =
                "https://cdn.pixabay.com/photo/2017/11/12/09/05/black-2941843_960_720.jpg";
            const name2 = "./coffee.jpg";
            const name3 = "D:\\blog\\vscode-with-tistory-test\\coffee.jpg";
            assert.strictEqual(vscode.Uri.parse(name1).scheme, "https");
            assert.strictEqual(vscode.Uri.parse(name2).scheme, "file");
            // assert.strictEqual(vscode.Uri.parse(name3).scheme, "file");
        });
    });
});

describe("Tistory Test", () => {
    describe.skip("Post Blog1. Set Timestamp", async () => {
        const {
            data: {
                tistory: { postId },
            },
        } = await axios({
            method: "post",
            url: API_URI.CREATE_POST,
            data: {
                access_token: accessToken,
                output: "json",
                blogName: selectedBlog.name,
                title: "test",
                visibility: VISIBILITY.PROTECT,
                published: timestamp,
                content: "<h1>header1</h1>",
            },
        });
        const {
            data: {
                tistory: {
                    item: { date },
                },
            },
        } = await axios.get(API_URI.READ_POST, {
            params: {
                access_token: accessToken,
                output: "json",
                blogName: selectedBlog.name,
                postId,
            },
        });
        assert.strictEqual(date, dateTimeFormat, `date is ${date}`);
    });
    describe.skip("Post Blog2: Upload markdown", async () => {
        const MarkdownIt = require("markdown-it");
        const emoji = require("markdown-it-emoji");
        const md = new MarkdownIt();
        const workspaces = vscode.workspace.workspaceFolders;
        if (workspaces !== undefined) {
            // get workspace
            const uri = workspaces[0].uri;
            const markdown = fs.readFileSync(`${uri.fsPath}\\TEST.md`, "utf-8");
            const html = md.render(markdown);
            const {
                data: {
                    tistory: { postId },
                },
            } = await axios({
                method: "post",
                url: API_URI.CREATE_POST,
                data: {
                    access_token: accessToken,
                    output: "json",
                    blogName: selectedBlog.name,
                    title: "test",
                    visibility: VISIBILITY.PRIVATE,
                    published: timestamp,
                    content: html,
                    password: "aaaa",
                },
            });
            const {
                data: {
                    tistory: {
                        item: { content },
                    },
                },
            } = await axios.get(API_URI.READ_POST, {
                params: {
                    access_token: accessToken,
                    output: "json",
                    blogName: selectedBlog.name,
                    postId,
                },
            });
            assert.strictEqual(
                context,
                fs.readFileSync(`${uri.fsPath}\\TEST.html`, "utf-8")
            );
        } else {
            throw new Error("Workspace Error");
        }
    });
    it("Get Category ID", async () => {
        const {
            data: {
                tistory: {
                    status,
                    error_message,
                    item: { categories },
                },
            },
        } = await axios.get(API_URI.CATEGORY_LIST, {
            params: {
                access_token: getConfigProperty(PROPERTIES.TOKEN),
                output: "json",
                blogName: selectedBlog.name,
            },
        });
        assert.ok(categories);
    });
    const uploadImage = async (imagePath: string): Promise<string> => {
        const {
            window: { activeTextEditor },
        } = vscode;

        const imageAbsolutePath = path.resolve(
            activeTextEditor!.document?.uri.fsPath,
            "../",
            imagePath
        );
        const buffer = fs.readFileSync(imageAbsolutePath);
        const FormData = await import("form-data");
        const formData = new FormData();
        formData.append("access_token", accessToken);
        formData.append("output", "json");
        formData.append("blogName", selectedBlog.name);
        formData.append("uploadedfile", buffer, "coffee.jpg");
        const {
            data,
            data: { tistory },
        } = await axios({
            method: "post",
            url: API_URI.UPLOAD_FILE,
            headers: formData.getHeaders(),
            data: formData,
            validateStatus: (status: number) => status >= 200 && status < 500,
        });
        assert.ok(data.tistory);
        assert.strictEqual(tistory.status, "200");
        return tistory.url;
    };
    describe.skip("Upload Absolute Path Image", async () => {
        const url = await uploadImage(
            "D:\\blog\\vscode-with-tistory-test\\coffee.jpg"
        );
        console.log("absolute image", url);
    });
    describe.skip("Upload Relative Path Image", async () => {
        const url = await uploadImage("./coffee.jpg");
        console.log("relative image", url);
    });
    describe.skip("Post Blog3: Upload Markdown && Image", async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.strictEqual(document?.languageId, "markdown");
        const blogName = selectedBlog.name;
        const [options, markdownContent, postIdLocation] = await readFile(
            document,
            blogName
        );
        //md2html
        const md = new MarkdownIt();
        md.use(require("markdown-it-emoji"));
        const tokens = md.parse(markdownContent, {});
        //uploading image use BFS
        const queue: Array<Token> = [];
        queue.push(...tokens);
        while (queue.length > 0) {
            const token = queue.shift();
            if (token?.children) {
                token.children.forEach((child) => queue.push(child));
            }
            const inputImageSrc = token!.attrGet("src");
            if (
                token?.type === "image" &&
                token.tag === "img" &&
                inputImageSrc
            ) {
                const imageAbsolutePath = path.resolve(
                    document.uri.fsPath,
                    "../",
                    inputImageSrc
                );
                const uri = vscode.Uri.parse(inputImageSrc);
                if (uri.scheme === "https" || uri.scheme === "http") {
                    break;
                } else {
                    const FormData = require("form-data");
                    const formData = new FormData();
                    const buffer = fs.readFileSync(imageAbsolutePath);
                    const splitPath = uri.path.split("/");
                    const filename = splitPath.pop();
                    formData.append("access_token", accessToken);
                    formData.append("output", "json");
                    formData.append("blogName", selectedBlog.name);
                    formData.append("uploadedfile", buffer, filename);
                    const {
                        data: { tistory },
                    } = await axios({
                        method: "post",
                        url: API_URI.UPLOAD_FILE,
                        headers: formData.getHeaders(),
                        data: formData,
                        validateStatus: (status: number) =>
                            status >= 200 && status < 500,
                    });
                    assert.ok(tistory);
                    assert.strictEqual(tistory.status, "200");
                    token.attrSet("src", tistory.url);
                }
            }
        }
        // Markdown Token to HTML
        const content = md.renderer.render(tokens, {}, {});
        // push new post
        assert.ok(accessToken);
        const {
            data: { tistory },
        } = await axios({
            method: "post",
            url: API_URI.CREATE_POST,
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
                content,
            },
            validateStatus: (status: number) => status >= 200 && status < 500,
        });
        assert.ok(tistory);
        assert.ok(tistory.postId);
        assert.strictEqual(tistory.status, "200");
        console.log(tistory.url);
        //insert postId
        const activeTextEditor = vscode.window.activeTextEditor;
        activeTextEditor?.selection;
        activeTextEditor!.edit((editorBuilder) => {
            const position = new vscode.Position(
                postIdLocation,
                "".charCodeAt(0)
            );
            editorBuilder.insert(position, `postId: ${tistory.postId}\n`);
        });
    });

    it("Post Blog4: Update Exist Post", async () => {
        const document = vscode.window.activeTextEditor?.document;
        assert.strictEqual(document?.languageId, "markdown");
        const blogName = selectedBlog.name;
        const [options, markdownContent, postIdLocation] = await readFile(
            document,
            blogName
        );

        //md2html
        const md = new MarkdownIt();
        md.use(require("markdown-it-emoji"));
        const tokens = md.parse(markdownContent, {});
        //uploading image use BFS
        const queue: Array<Token> = [];
        queue.push(...tokens);
        while (queue.length > 0) {
            const token = queue.shift();
            if (token?.children) {
                token.children.forEach((child) => queue.push(child));
            }
            const inputImageSrc = token!.attrGet("src");
            if (
                token?.type === "image" &&
                token.tag === "img" &&
                inputImageSrc
            ) {
                const imageAbsolutePath = path.resolve(
                    document.uri.fsPath,
                    "../",
                    inputImageSrc
                );
                const uri = vscode.Uri.parse(inputImageSrc);
                if (uri.scheme === "https" || uri.scheme === "http") {
                    continue;
                } else {
                    const FormData = require("form-data");
                    const formData = new FormData();
                    const buffer = fs.readFileSync(imageAbsolutePath);
                    const splitPath = uri.path.split("/");
                    const filename = splitPath.pop();
                    formData.append("access_token", accessToken);
                    formData.append("output", "json");
                    formData.append("blogName", selectedBlog.name);
                    formData.append("uploadedfile", buffer, filename);
                    const {
                        data: { tistory },
                    } = await axios({
                        method: "post",
                        url: API_URI.UPLOAD_FILE,
                        headers: formData.getHeaders(),
                        data: formData,
                        validateStatus: (status: number) =>
                            status >= 200 && status < 500,
                    });
                    assert.ok(tistory);
                    assert.strictEqual(tistory.status, "200");
                    token.attrSet("src", tistory.url);
                }
            }
        }
        // Markdown Token to HTML
        const content = md.renderer.render(tokens, {}, {});
        const axiosResponse = await axios({
            method: "get",
            url: API_URI.READ_POST,
            params: {
                access_token: accessToken,
                blogName: selectedBlog.name,
                output: "json",
                postId: options.postId,
            },
            validateStatus: (status: number) => status >= 200 && status < 500,
        });
        const postStatus = axiosResponse.data.tistory.status;
        assert.strictEqual(postStatus, "200");

        let updatePostInfo: PostInfo = {
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
            postId: options.postId,
            content,
        };
        //check date
        const currentTime = Math.floor(new Date().getTime() / 1000);
        if (parseInt(options.date) > currentTime) {
            updatePostInfo["published"] = options.date;
        }
        // push new post
        assert.ok(accessToken);
        const response = await axios({
            method: "post",
            url: API_URI.UPDATE_POST,
            data: updatePostInfo,
            validateStatus: (status: number) => status >= 200 && status <= 500,
        });
        const {
            data: { tistory },
        } = response;

        assert.ok(tistory);
        assert.ok(tistory.postId);
        assert.strictEqual(tistory.status, "200");
        console.log(tistory.url);
    });
});

describe("Markdown Test", () => {
    /// init markdown-it
    const md = new MarkdownIt();
    // permit emoji
    md.use(MarkdownItEmoji);
    // get current Workspace
    const workspaces = vscode.workspace.workspaceFolders;
    assert.ok(workspaces);
    const uri = workspaces[0].uri;
    it("Test Markdown2Html", () => {
        const convertedHtml = md.render("# header1");
        assert.strictEqual(convertedHtml, "<h1>header1</h1>\n");
    });
    it("Test emoji", () => {
        const text = "emoji ✔";
        const htmlData = md.render(text).trim();
        assert.strictEqual(htmlData, `<p>${text}</p>`);
    });
    it("Parsing Option", async () => {
        const cmpOption = {
            title: "title name",
            date: "9999-09-17 12:23:34",
            post: "private",
            tag: ["javascript", "자바스크립트"],
            comments: "true",
        };
        let markdownData: string = "";
        async function readOneLine(
            filename: string,
            parsedOption: any
        ): Promise<any> {
            const fileStream = fs.createReadStream(filename);
            const readLineInterface = createInterface({
                input: fileStream,
                crlfDelay: Infinity,
            });
            let endParsing = false;
            let lineNumber = 0;
            let parsingTag = false;
            // Regex: find option info
            const kindOfOption = [
                "title",
                "date",
                "post",
                "tag",
                "comments",
                "password",
                "category",
                "url",
                "postId",
            ];
            const regexOption = new RegExp(
                `^(?<key>${kindOfOption.join("|")}):\s*?(?<value>.+)?`,
                "u"
            );
            const tagOptionRegex = new RegExp("(?<=^-\x20).*", "u");
            for await (const line of readLineInterface) {
                if (lineNumber === 0) {
                    if (line !== "---") {
                        new Error("Fail Parsing option");
                    }
                } else if (!endParsing && lineNumber > 0 && line === "---") {
                    endParsing = true;
                } else if (!endParsing) {
                    const groups = line.match(regexOption)?.groups;
                    if (groups?.key && groups?.value) {
                        const { key, value } = groups;
                        parsedOption[key] = value.trim();
                        parsingTag = false;
                    } else if (groups?.key === "tag") {
                        parsedOption.tag = [];
                        parsingTag = true;
                    } else if (parsingTag) {
                        const tagOption = line.match(tagOptionRegex);
                        if (tagOption) {
                            parsedOption.tag.push(tagOption[0]);
                        } else {
                            throw new Error("Error");
                        }
                    } else {
                        throw new Error("Error");
                    }
                } else {
                    markdownData += line;
                }
                lineNumber++;
            }
            return parsedOption;
        }
        const parsedOption = await readOneLine(
            `${uri.fsPath}\\parsingOption.md`,
            {}
        );
        assert.deepStrictEqual(parsedOption, cmpOption);
    });
    it("Convert imagePath", async () => {
        const iterator = require("markdown-it-for-inline");
        md.use(
            iterator,
            "uploadImage",
            "image",
            (tokens: Token[], idx: number) => {
                const token = tokens[idx];
                token.attrSet("src", `img/${token.attrGet("src")}`);
            }
        );
        const result = md.render("![test](./test.jpg)");
        assert.match(result, /img\/\.\/test.jpg/);
    });
});
