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
            "accept": "application/json, text/plain, */*",
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
    let rawData = allPageData.flat();
    download(
        JSON.stringify(rawData, null, 2),
        "weibo-" + Date.now() + "-" + type + ".json",
        "text/plain"
    );
    console.log("all done");
}