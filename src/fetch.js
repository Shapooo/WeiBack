async function fetchMyContent(page = 1, type = "myblog") {
    let uid = globalConfig.uid;
    return await fetchContent(uid, page, type);
}

async function fetchContent(uid = 0, page = 1, type = "myblog") {
    let api = `https://weibo.com/ajax/statuses/mymblog?uid=${uid}&page=${page}&feature=0&with_total=true`;

    if (type === "fav") {
        api = `https://weibo.com/ajax/favorites/all_fav?uid=${uid}&page=${page}&with_total=true`;
    }

    if (type === "like") {
        api = `https://weibo.com/ajax/statuses/likelist?uid=${uid}&page=${page}&with_total=true`;
    }

    console.log(`request ${api}`);
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

async function fetchAll(type = "myblog", range) {
    console.log(`fetching ${type} post ${range}`)
    let uid = globalConfig.uid;
    let page = 1;
    let allPageData = [];
    let noMore = false;
    for (let index = range[0]; index <= range[1]; index++) {
        console.log("scan", "page", page);
        // printLog(`正在备份第 ${page} 页`);
        for (let index = 0; index < 10; index++) {
            const pageData = await fetchContent(uid, page, type);
            if (pageData.ok) {
                const dataList = type === "fav" ? pageData.data.status : pageData.data.list;
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
    console.log("data fetched, start to process")
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
    // console.log("data", allPageData, parsed);
    console.log("data processed, saving to disk")
    download(
        JSON.stringify(parsed, null, 2),
        "weibo-" + Date.now() + "-" + type + ".json",
        "text/plain"
    );
    console.log("all done");
}