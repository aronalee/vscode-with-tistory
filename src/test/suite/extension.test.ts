import * as assert from "assert";
import * as vscode from "vscode";
import axios from "axios";
import { API_URI, PROPERTIES, VISIBILITY } from "../../Enum";
import { findDefaultBlog, getBlogInfo, getConfigProperty } from "../../apis";
import { BlogInfo } from "../../interface";

const accessToken = getConfigProperty(PROPERTIES.Token);
const dateTimeFormat="2021-09-17 03:24:00";
const timestamp = new Date(dateTimeFormat).getTime()/1000;
describe("Tistory Test", () => {
    it("Post Blog1. Set Timestamp", async () => {
            const blogInfos: BlogInfo[] = await getBlogInfo();
            const defaultBlog: BlogInfo = findDefaultBlog(blogInfos);
            const {
                data: {
                    tistory: { postId },
                },
            } = await axios.post(API_URI.PUSH_POST, {
                access_token: accessToken,
                output: "json",
                blogName: defaultBlog.name,
                title: "test",
				visibility:VISIBILITY.Protect,
                published: timestamp,
                content: "<h1>header1</h1>",
            });
            const {
                data: {
                    tistory: {
                        item: { date },
                    },
                },
            } = await axios.get(API_URI.READ_POST, {
                data: {
                    access_token: accessToken,
                    output: "json",
                    blogName: defaultBlog.name,
                    postId,
                },
            });
			console.log(date);
            assert.strictEqual(date, dateTimeFormat, `date is ${date}`);
    });
});
