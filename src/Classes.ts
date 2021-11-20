import { ERROR_MESSAGES, VISIBILITY } from "./Enum";
import { CategoryInfo } from "./interface";

export class ParsedOptions {
    private _title?: string;
    private _postId?: string;
    private _url?: string;
    private _date?: Date;
    private _tag?: string[];
    private _comments?: boolean;
    public password?: string;
    private _post?: "public" | "protect" | "private";
    private _category?: CategoryInfo;
    private _categoryList: Array<CategoryInfo>;

    constructor(categoryList: Array<CategoryInfo>) {
        this._tag = new Array<string>();
        this._categoryList = categoryList;
        this._comments = true;
    }

    public set title(v: string) {
        this._title = v;
    }

    public get title(): string {
        return this._title ? this._title : "";
    }

    public set postId(v: string) {
        this._postId = v;
    }

    public get postId(): string {
        return this._postId ? this._postId : "0";
    }

    public set tag(tagOption: string) {
        this._tag!.push(tagOption);
    }
    public get tag(): string {
        return this._tag!.join(",");
    }
    public set comments(isComment: string) {
        if (isComment === "false") {
            this._comments = false;
        } else {
            this._comments = true;
        }
    }
    public get comments(): string {
        if (this._comments) {
            return "1";
        } else {
            return "0";
        }
    }
    public set date(dateString: string) {
        const today = new Date();
        if (dateString.match(/^(\d{4}\-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/)) {
            this._date = new Date(dateString);
        } else if (dateString.match(/^\d{4}\-\d{2}-\d{2}$/)) {
            const [hours, minutes, seconds] = [
                today.getHours(),
                today.getMinutes(),
                today.getSeconds(),
            ];
            this._date = new Date(dateString);
            this._date.setHours(hours);
            this._date.setMinutes(minutes);
            this._date.setSeconds(seconds);
        } else {
            throw new TypeError(ERROR_MESSAGES.INVALID_DATA_FORMAT);
        }
    }
    public get date(): string {
        if (this._date) {
            return Math.floor(this._date.getTime() / 1000).toString();
        } else {
            return "";
        }
    }
    public set post(postCategory: string) {
        if (/^public$|^true$/i.test(postCategory)) {
            this._post = "public";
        } else if (/^protect$/i.test(postCategory)) {
            this._post = "protect";
        } else if (/^private$|^false$/i.test(postCategory)) {
            this._post = "private";
        } else {
            throw new TypeError(ERROR_MESSAGES.INVALID_POST_FORMAT);
        }
    }
    public get post(): VISIBILITY {
        if (this._post) {
            if (this._post === "public") {
                return VISIBILITY.PUBLIC;
            } else if (this._post === "protect") {
                return VISIBILITY.PROTECT;
            } else if (this._post === "private") {
                return VISIBILITY.PRIVATE;
            } else {
                throw new TypeError(ERROR_MESSAGES.FAIL_PARSING);
            }
        } else {
            throw new TypeError(ERROR_MESSAGES.FAIL_PARSING);
        }
    }
    public set category(categoryName: string) {
        for (let category of this._categoryList) {
            if (category.name === categoryName) {
                this._category = category;
                return;
            }
        }
        throw new TypeError(ERROR_MESSAGES.FAIL_PARSING);
    }
    public get category(): string {
        return this._category ? this._category.id : "0";
    }
    public set url(slogan: string) {
        this._url = slogan;
    }
    public get url(): string {
        return this._url ? this._url : "";
    }
    public setOption(parsedArray: Array<any>, isTagParsing: boolean): boolean {
        if (parsedArray.length === 2) {
            const [key, value] = parsedArray;
            switch (key) {
                case "title":
                    this.title = value.trim();
                    break;
                case "date":
                    this.date = value.trim();
                    break;
                case "post":
                    this.post = value.trim();
                    break;
                case "comments":
                    this.comments = value.trim();
                    break;
                case "password":
                    this.password = value.trim();
                    break;
                case "category":
                    this.category = value.trim();
                    break;
                case "url":
                    this.url = value.trim();
                    break;
                case "postId":
                    this.postId = value.trim();
                    break;
                default:
                    break;
            }
            return true;
        } else if (
            parsedArray.length === 1 &&
            (parsedArray[0].trim() === "tag" || isTagParsing)
        ) {
            return false;
        } else {
            throw new Error(ERROR_MESSAGES.FAIL_PARSING);
        }
    }
}
