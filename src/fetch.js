async function fetchMyContent(page = 1, type = "myblog") {
    let uid = globalConfig.uid;
    return await fetchPostMeta(uid, page, type);
}

async function fetchPostMeta(uid = 0, page = 1, type = "myblog") {
    let api = `https://weibo.com/ajax/statuses/mymblog?uid=${uid}&page=${page}&feature=0&with_total=true`;

    if (type === "fav") {
        api = `https://weibo.com/ajax/favorites/all_fav?uid=${uid}&page=${page}&with_total=true`;
    }

    if (type === "like") {
        api = `https://weibo.com/ajax/statuses/likelist?uid=${uid}&page=${page}&with_total=true`;
    }

    console.log(`request ${api}`);
    const req = await fetch(api, globalConfig.httpInit());
    const data = await req.json();
    return data;
}

async function fetchAllPostMetas(type = "myblog", range) {
    console.log(`fetching ${type} post ${range}`)
    let uid = globalConfig.uid;
    let page = 1;
    let allPageData = [];
    let noMore = false;
    for (let index = range[0]; index <= range[1]; index++) {
        console.log("scan", "page", page);
        showTip(`正在备份第 ${page} 页<br>因微博速率限制，过程可能较长，先干点别的吧`);
        for (let index = 0; index < 10; index++) {
            const pageData = await fetchPostMeta(uid, page, type);
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
            showTip(
                `[重试]备份第 ${page} 页，错误内容： ${JSON.stringify(pageData)}`
            );
        }
        page++;
        if (noMore) break;
        await new Promise((resolve) => {
            setTimeout(resolve, 100);
        });
    }
    let data = allPageData.flat();
    showTip(`数据拉取完成，等待下载到本地`);
    return data;
}

async function fetchAllPosts(type = "myblog", range, outFormat = "html") {
    let metaData = await fetchAllPostMetas(type, range);
    let data;
    let filename;
    let contentType = 'text/plain';

    if (outFormat == 'html') {
        let cache = new Map();
        data = await generateHtml(metaData, cache);
        filename = "weibo-" + Date.now() + "-" + type + '.html';
    } else {
        data = JSON.stringify(rawData, null, 2);
        filename = "weibo-" + Date.now() + "-" + type + '.json';
    }
    let file = new Blob([data], { type: contentType });
    console.log(typeof FileSaver);
    saveAs(file, filename);

    console.log("all done");
    showTip(`完成，可以进行其它操作`);
}