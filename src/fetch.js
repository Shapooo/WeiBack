async function fetchPostMeta(uid = 0, page = 1, type = 'myblog') {
    let api = `${STATUSES_MY_MICRO_BLOG_API}?uid=${uid}&page=${page}&feature=0`

    if (type === 'fav') {
        api = `${FAVORITES_ALL_FAV_API}?uid=${uid}&page=${page}`
    }

    if (type === 'like') {
        api = `${STATUSES_LIKE_LIST_API}?uid=${uid}&page=${page}`
    }

    console.log(`request ${api}`)
    const req = await fetch(api, globalConfig.httpInit())
    const data = await req.json()
    return data
}

async function fetchAllPosts(type = 'myblog', range) {
    console.log(`fetching ${type} post ${range}`)

    const storage = {
        resourceMap: new Map(),
        taskName: `WeiBack-${type}-${Date.now()}`,
        resources: new Set(),
        index: 1
    }
    await fetchEmoticon()

    const uid = globalConfig.uid
    const downloadPerid = 10
    let allPageData = []
    let noMore = false
    let index = 0
    const zip = new JSZip()
    const name = storage.taskName
    const rootFolder = zip.folder(name)
    for (let page = range[0]; page <= range[1]; page++) {
        console.log('scan', 'page', page)
        showTip(`正在备份第 ${page} 页<br>因微博速率限制，过程可能较长，先干点别的吧`)
        let data
        for (let i = 0; i < 10; i++) {
            const pageData = await fetchPostMeta(uid, page, type)
            if (pageData.ok) {
                data = type === 'fav' ? pageData.data : pageData.data.list
                if (data.length === 0) noMore = true
                break
            }
            await new Promise((resolve) => {
                setTimeout(resolve, 8 * 1000)
            })
            console.log('retry', i)
            showTip(
                `[重试]备份第 ${index} 页，错误内容： ${JSON.stringify(pageData)}`
            )
        }

        allPageData.push(await generateHTMLPage(data, storage))
        await Promise.all(Array.from(storage.resources).map((url) => {
            let item = storage.resourceMap.get(url)
            if (item.blob === undefined) {
                return fetchPic(url).then((blob) => {
                    storage.resourceMap.set(url, { fileName: item.fileName, blob })
                })
            } else {
                return Promise.resolve()
            }
        }))

        index++
        if (index % downloadPerid == 0 || page == range[1] || noMore) {
            const taskName = `${name}-${storage.index}`
            storage.index++
            const doc = (new DOMParser()).parseFromString(HTML_GEN_TEMP, 'text/html')
            doc.body.innerHTML = allPageData.join('')
            allPageData = []
            rootFolder.file(taskName + '.html', doc.documentElement.outerHTML)
            const resources = rootFolder.folder(taskName + '_files')
            storage.resources.forEach((url) => {
                let item = storage.resourceMap.get(url)
                resources.file(item.fileName, item.blob, { base64: true })
            })
            storage.resources.clear()
        }

        if (noMore || page === range[1]) break
        await new Promise((resolve) => {
            setTimeout(resolve, 8 * 1000)
        })
    }

    showTip('数据拉取完成，等待下载到本地')

    zip.generateAsync({ type: 'blob' }).then(function (content) {
        saveAs(content, name + '.zip')
    }).catch((err) => {
        console.error(err)
    })

    console.log('all done')
    showTip('完成，可以进行其它操作')
}

async function fetchPic(url) {
    const res = await fetch(url, globalConfig.httpInit)
    return (await res.blob())
}
