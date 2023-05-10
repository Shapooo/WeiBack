// ==UserScript==
// @name         炸号微博备份
// @namespace    https://dun.mianbaoduo.com/@fun
// @version      0.7
// @description  炸号微博一键备份
// @author       fun
// @match        *://weibo.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=weibo.com
// @grant        none
// @license      GPL
// ==/UserScript==
"use strict";

var bkBoxStyle = `\
.bkBox {
    position: fixed;
    border-radius: 3px;
    background: white;
    top: 80px;
    right: 20px;
    z-index: 100000;
    padding: 10px 15px;
    text-align: center;
    border: 2px solid black
}

.bkBox-title {
    font-size: 15px;
    color: black;
    margin: 0 0;
}

.bkBox-button {
    border-radius: 0.166667rem;
    display: block;
    font-weight: bold;
    color: #444;
    margin: 0 auto;
    padding: 5px 14px;
    font-size: 13px;
    text-align: center;
    border: 1px solid #cfcfcf;
    margin-top: 3px;
    cursor: pointer;
    margin-bottom: 7px;
}

.nav {
    display: flex;
    width: 300px;
    height: 20px;
    background-color: aqua;
    margin: auto;
}

.box {
    width: 300px;
    /* 超出部分隐藏 */
    overflow: hidden;
    margin: auto;
    display: flex;
}

.content {
    width: 300px;
    height: 200px;
    flex-shrink: 0;
}

#content1 {
    background-color: paleturquoise;
}

#content2 {
    background-color: yellowgreen;
}

#content3 {
    background-color: peru;
}
`;

let bkBoxStyleSheet = document.createElement("style");
bkBoxStyleSheet.innerText = bkBoxStyle;
let bkBox = document.createElement("div");
bkBox.className = "bkBox";
bkBox.innerHTML = `\
    <h2 style="font-size: 15px;
    color: black;
    margin: 0 0;">微博备份</h2>
    <nav>
        <div class="nav">
        </div>
    </nav>
    <section>
        <div class="box">
        </div>
    </section>
`;

var bkTypes = [];
let fav = {
    id: "fav",
    name: "收藏",
    page_range: (1, Infinity),
    settingsPage: (() => {
        var pages = 0;
        var settingsPage = document.createElement('div');
        settingsPage.innerHTML = `\
                <label title="每页二十个条目">页面总数  `+ pages + `</label>
                <label title = "hhhhh">
                    页面范围：
                    <input type="text" class="bkBox-pageRange" placeholder="eg. -10,12,14-20,27,30-40/2,50-60/3,70-">
                </label>
                <div><button class="bkBox-button">开始下载</button></div>`;
        var range = settingsPage.querySelector("input").value.split('-').map(parseInt).slice(0, 2);
        this.page_range = (range[0], range[1]);
        var btn = settingsPage.getElementsByClassName("bkBox-button")[0];
        btn.setAttribute("onclick", async () => {
            await fetchAll(id, page_range);
        });
        return settingsPage
    })()
};
bkTypes.push(fav)

let like = {
    id: "like",
    name: "点赞",
    page_range: (1, Infinity),
    settingsPage: (() => {
        var pages = 0;
        var settingsPage = document.createElement('div');
        settingsPage.innerHTML = `\
                <label title="每页二十个条目">页面总数  `+ pages + `</label>
                <label title = "hhhhh">
                    页面范围：
                    <input type="text" class="bkBox-pageRange" placeholder="eg. -10,12,14-20,27,30-40/2,50-60/3,70-">
                </label>
                <div><button class="bkBox-button">开始下载</button></div>`;
        var range = settingsPage.querySelector("input").value.split('-').map(parseInt).slice(0, 2);
        this.page_range = (range[0], range[1]);
        var btn = settingsPage.getElementsByClassName("bkBox-button")[0];
        btn.setAttribute("onclick", async () => {
            await fetchAll(id, page_range);
        });
        return settingsPage
    })()
}
bkTypes.push(like);
let post = {
    id: "my",
    name: "用户微博",
    page_range: (1, Infinity),
    settingsPage: (() => {
        var pages = 0;
        var settingsPage = document.createElement('div');
        settingsPage.innerHTML = `\
                <label title="每页二十个条目">页面总数  `+ pages + `</label>
                <label title = "hhhhh">
                    页面范围：
                    <input type="text" class="bkBox-pageRange" placeholder="eg. -10,12,14-20,27,30-40/2,50-60/3,70-">
                </label>
                <div><button class="bkBox-button">开始下载</button></div>`;
        var range = settingsPage.querySelector("input").value.split('-').map(parseInt).slice(0, 2);
        this.page_range = (range[0], range[1]);
        var btn = settingsPage.getElementsByClassName("bkBox-button")[0];
        btn.setAttribute("onclick", async () => {
            await fetchAll(id, page_range);
        });
        return settingsPage
    })()
};
bkTypes.push(post);


bkBox.appendChild(bkBoxStyleSheet);

bkTypes.forEach((c) => {
    createBkType(c.id, c.name, c.settingsPage);
})

function createBkType(id, name, settingsPage) {
    var nav = bkBox.getElementsByClassName("nav")[0];
    var settingBox = bkBox.getElementsByClassName("box")[0];
    let naviButton = document.createElement("a");
    naviButton.innerText = name;
    naviButton.className = "nav"
    // naviButton.id = id;
    naviButton.href = "#" + id;
    nav.appendChild(naviButton);
    let page = document.createElement("div");
    page.id = id;
    page.className = "content"
    // page.innerHTML = settingsPage;
    page.appendChild(settingsPage);
    settingBox.appendChild(page);
    nav.append
}


document.body.appendChild(bkBox);

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}
//   download(jsonData, "json.txt", "text/plain");
async function fetchContent(uid = 0, page = 1, type = "my") {
    let api = `https://weibo.com/ajax/statuses/mymblog?uid=${uid}&page=${page}&feature=0`;

    if (type === "fav") {
        api = `https://weibo.com/ajax/favorites/all_fav?uid=${uid}&page=${page}`;
    }

    if (type === "like") {
        api = `https://weibo.com/ajax/statuses/likelist?uid=${uid}&page=${page}`;
    }

    const req = await fetch(api, {
        headers: {
            accept: "application/json, text/plain, */*",
            "accept-language": "zh-CN,zh;q=0.9,en-IN;q=0.8,en;q=0.7,ar;q=0.6",
            "sec-ch-ua":
                '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"macOS"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
        },
        referrer: `https://weibo.com/u/${uid}`,
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include",
    });
    const data = await req.json();
    return data;
}

async function fetchAll(type = "my", range) {
    var uid = $CONFIG.uid;
    let page = 1;
    let allPageData = [];
    let noMore = false;
    for (let index = range[0]; index < range[1]; index++) {
        console.log("scan", "page", page);
        // printLog(`正在备份第 ${page} 页`);
        for (let index = 0; index < 10; index++) {
            const pageData = await fetchContent(uid, page, type);
            if (pageData.ok) {
                const dataList = type === "fav" ? pageData.data : pageData.data.list;
                allPageData.push(dataList);
                if (dataList.length === 0) noMore = true;
                break;
            }
            await new Promise((resolve) => {
                setTimeout(resolve, 8 * 1000);
            });
            console.log("retry", index);
            // printLog(
            //     `[重试]备份第 ${page} 页，错误内容： ${JSON.stringify(pageData)}`
            // );
        }
        page++;
        if (noMore) break;
        await new Promise((resolve) => {
            setTimeout(resolve, 5 * 1000);
        });
    }
    console.log("all done");
    // printLog(`备份完毕! 打开【下载内容】查看数据文件`);
    const parsed = allPageData.reduce((all, dataList) => {
        dataList.forEach((c) => {
            const formatted = {
                images:
                    c.pic_ids &&
                    c.pic_ids.map((d) => {
                        return c.pic_infos[d].large.url;
                    }),
                text: c.text,
                created_at: c.created_at,
                raw: c,
            };
            if (c.retweeted_status) {
                formatted.retweeted_status = {
                    text: c.retweeted_status.text,
                    images:
                        c.retweeted_status.pic_ids &&
                        c.retweeted_status.pic_ids.map((d) => {
                            return c.retweeted_status.pic_infos[d].large.url;
                        }),
                };
            }
            all.push(formatted);
        });
        return all;
    }, []);
    console.log("data", allPageData, parsed);
    download(
        JSON.stringify(parsed, null, 2),
        "weibo-" + Date.now() + "-" + type + ".json",
        "text/plain"
    );
}