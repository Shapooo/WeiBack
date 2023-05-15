async function fetchMyContent(page = 1, type = "myblog") {
    let uid = globalConfig.uid;
    return await fetchPostMeta(uid, page, type);
}

async function fetchPostMeta(uid = 0, page = 1, type = "myblog") {
    let api = `${STATUSES_MY_MICRO_BLOG_API}?uid=${uid}&page=${page}&feature=0&with_total=true`;

    if (type === "fav") {
        api = `${STATUSES_FAVORITES_API}?uid=${uid}&page=${page}&with_total=true`;
    }

    if (type === "like") {
        api = `${STATUSES_LIKE_LIST_API}?uid=${uid}&page=${page}&with_total=true`;
    }

    console.log(`request ${api}`);
    const req = await fetch(api, globalConfig.httpInit());
    const data = await req.json();
    return data;
}

async function fetchAllPosts(type = "myblog", range, outFormat = 'html') {
    console.log(`fetching ${type} post ${range}`)

    let storage;
    if (outFormat = 'html') {
        storage = {
            resourceMap: new Map(),
            taskName: 'WeiBack' + Date.now(),
            resources: [],
        }
        await fetchEmoticon();
    }

    let uid = globalConfig.uid;
    let page = 1;
    let allPageData = [];
    let noMore = false;
    for (let index = range[0]; index <= range[1]; index++) {
        console.log("scan", "page", page);
        showTip(`正在备份第 ${page} 页<br>因微博速率限制，过程可能较长，先干点别的吧`);
        let data;
        for (let index = 0; index < 10; index++) {
            const pageData = await fetchPostMeta(uid, page, type);
            if (pageData.ok) {
                data = type === "fav" ? pageData.data.status : pageData.data.list;
                if (data.length === 0) noMore = true;
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

        if (outFormat == 'html') {
            allPageData.push(await generateHTMLPage(data, storage));
            let PicToFetch = [];
            storage.resourceMap.forEach((v, url) => {
                if (!v.saved) {
                    PicToFetch.push([url, v.fileName])
                }
            });
            storage.resources = storage.resources.concat(await Promise.all(PicToFetch.map((picItem) => {
                return fetchPic(picItem[0]).then((blob) => {
                    storage.resourceMap.set(picItem[0], { fileName: picItem[1], saved: true })
                    return [picItem[1], blob];
                });
            })));
        } else {
            allPageData.push(pageData);
        }
        page++;
        if (noMore) break;
        await new Promise((resolve) => {
            if (outFormat == 'html') {
                setTimeout(resolve, 100);
            } else {
                setTimeout(resolve, 5 * 1000);
            }

        });
    }

    showTip(`数据拉取完成，等待下载到本地`);
    if (outFormat == 'html') {
        let name = storage.taskName;
        let doc = (new DOMParser).parseFromString(HTML_GEN_TEMP, 'text/html');
        doc.body.innerHTML = allPageData.join('');
        const zip = new JSZip();
        zip.file(name + '.html', doc.documentElement.outerHTML);
        const resources = zip.folder(name + '_files');

        storage.resources.forEach((item) => {
            resources.file(item[0], item[1], { base64: true });
        })

        zip.generateAsync({ type: "blob" }).then(function (content) {
            saveAs(content, name + '.zip');
        }).catch((err) => {
            console.error(err);
        });
    } else {
        let jsonStr = JSON.stringify(allPageData.flat(), null, 2);
        let file = new Blob([jsonStr], { type: 'application/json' });
        saveAs(file, "weibo-" + Date.now() + "-" + type + '.json')
    }

    console.log("all done");
    showTip(`完成，可以进行其它操作`);
}

async function fetchPic(url) {
    let res = await fetch(url, globalConfig.httpInit);
    return (await res.blob());
}