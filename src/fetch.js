async function fetchPostMeta(uid = 0, page = 1, type = 'myblog') {
    let api = `${STATUSES_MY_MICRO_BLOG_API}?uid=${uid}&page=${page}&feature=0`

    if (type === 'fav') {
        api = `${FAVORITES_ALL_FAV_API}?uid=${uid}&page=${page}`
    }

    if (type === 'like') {
        api = `${STATUSES_LIKE_LIST_API}?uid=${uid}&page=${page}`
    }

    console.log(`request ${api}`)
    const req = await fetch(api)
    const data = await req.json()
    return data
}

async function fetchAllPosts(type = 'myblog', range) {
    console.log(`fetching ${type} post ${range}`)

    const storage = {
        cache: new LRUCache(200),
        taskName: `WeiBack-${type}-${Date.now()}`,
        picUrls: new Set(),
        index: 1
    }
    await fetchEmoticon()

    const uid = globalConfig.uid
    downloadPerid = downloadPerid || 10
    let allPageData = []
    let noMore = false
    let index = 0
    const zip = new JSZip()
    const name = storage.taskName
    const rootFolder = zip.folder(name)
    const resources = new Map()
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
        for (const url of storage.picUrls) {
            if (resources.get(url)) {
                continue
            }
            const blob = storage.cache.get(url)
            if (blob) {
                resources.set(url, blob)
            } else {
                const blob = await fetchPic(url)
                storage.cache.set(url, blob)
                resources.set(url, blob)
            }
        }
        storage.picUrls.clear()

        index++
        if (index % downloadPerid === 0 || page === range[1] || noMore) {
            const taskName = `${name}-${storage.index}`
            storage.index++
            const doc = (new DOMParser()).parseFromString(HTML_GEN_TEMP, 'text/html')
            doc.body.innerHTML = allPageData.join('')
            allPageData = []
            rootFolder.file(taskName + '.html', doc.documentElement.outerHTML)
            const resourcesFolder = rootFolder.folder(taskName + '_files')
            resources.forEach((blob, url) => {
                resourcesFolder.file(getFilename(url), blob, { base64: true })
            })
            resources.clear()
        }

        if (noMore || page === range[1]) break
        await new Promise((resolve) => {
            setTimeout(resolve, 10 * 1000)
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
    for (let i = 0; i < 5; ++i) {
        try {
            const res = await fetch(url)
            return (await res.blob())
        } catch (err) {
            console.log('fic fetch occurs: ', err)
            await new Promise((resolve) => {
                setTimeout(resolve, i * 300)
            })
        }
    }
    console.log(`pic ${url} download failed`)
}
