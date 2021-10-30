import * as assert from "assert";
import * as vscode from "vscode";
import axios from "axios";
import * as fs from "fs";
import { createInterface } from "readline";
import { API_URI, PROPERTIES, VISIBILITY } from "../../Enum";
import { getBlogInfo } from "../../apis";
import { getConfigProperty } from "../../commons";
import { BlogInfo } from "../../interface";
import * as MarkdownIt from "markdown-it";
import * as MarkdownItEmoji from "markdown-it-emoji";
import Token = require("markdown-it/lib/token");

const accessToken = getConfigProperty(PROPERTIES.Token);
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
            url: API_URI.PUSH_POST,
            data: {
                access_token: accessToken,
                output: "json",
                blogName: selectedBlog.name,
                title: "test",
                visibility: VISIBILITY.Protect,
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
                url: API_URI.PUSH_POST,
                data: {
                    access_token: accessToken,
                    output: "json",
                    blogName: selectedBlog.name,
                    title: "test",
                    visibility: VISIBILITY.Private,
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
                access_token: getConfigProperty(PROPERTIES.Token),
                output: "json",
                blogName: selectedBlog.name,
            },
        });
        assert.ok(categories);
    });
    it("Upload Image", async () => {
        const buffer = fs.readFileSync(
            "D:\\blog\\vscode-with-tistory-test\\[5-1]1920x1080.jpg"
        );
        const FormData = await import("form-data");
        const formData = new FormData();
        formData.append("access_token", accessToken);
        formData.append("output", "json");
        formData.append("blogName", selectedBlog.name);
        formData.append("uploadedfile", buffer, "[5-1]1920x1080.jpg");
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
    });
    let postId = 16;
    before("Get Post Info", async () => {
        const {
            data: { tistory },
        } = await axios({
            method: "get",
            url: API_URI.READ_POST,
            params: {
                access_token: accessToken,
                output: "json",
                blogName: selectedBlog.name,
                postId: postId,
            },
        });
        assert.strictEqual(tistory.error_message, undefined);
        assert.strictEqual(tistory.status, "200");
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
        console.log(result);
    });
});
