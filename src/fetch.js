import {generateHTMLPage, getFilename} from './htmlGenerator.js';
import {LRUCache} from './lru-cache.js';
import {showTip} from './main.js';
export {fetchAllPosts};

const domain = window.location.host;
const HTML_GEN_TEMP = '<html lang="zh-CN"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background-color:#f1f2f5}.bk-post-wrapper{border-radius:4px;background:#fff;width:700px;margin:8px auto;padding:10px 0}.bk-poster{display:flex;align-items:center;vertical-align:middle;height:60px}.bk-poster-avatar,.bk-retweeter-avatar{height:60px;width:60px;border-radius:50%;margin:auto 8px}.bk-retweeter-avatar{height:40px;width:40px}.bk-post-text{background:#fff}.bk-content{margin:8px 24px 8px 76px;font-size:15px;line-height:24px}.bk-retweeter{display:flex;align-items:center;vertical-align:middle;height:40px;margin:8px 24px 8px 76px}.bk-retweet{background:#f9f9f9;padding:2px 0}.bk-pic{max-width:600px;max-height:400px;margin:auto}.bk-poster-name,.bk-retweeter-name{color:#000;font-weight:700;text-decoration:none;font-family:Arial,Helvetica,sans-serif}.bk-poster-name:hover,.bk-retweeter-name:hover{color:#eb7350}.bk-icon-link{height:20px;filter:sepia(100%) saturate(3800%) contrast(75%);vertical-align:middle;margin-bottom:4px}.bk-link,.bk-user{color:#eb7350;text-decoration:none}.bk-link:hover,.bk-user:hover{text-decoration:underline}.bk-emoji{height:20px;vertical-align:middle;margin-bottom:4px}.bk-create-detail{font-size:10px;color:#939393}</style><title>微博备份</title></head><body></body></html>';
const STATUSES_MY_MICRO_BLOG_API = `https://${domain}/ajax/statuses/mymblog`;
const STATUSES_CONFIG_API = `https://${domain}/ajax/statuses/config`;
const STATUSES_LIKE_LIST_API = `https://${domain}/ajax/statuses/likelist`;
const FAVORITES_ALL_FAV_API = `https://${domain}/ajax/favorites/all_fav`;

async function fetchPostMeta(uid = 0, page = 1, type = 'myblog') {
  let api = `${STATUSES_MY_MICRO_BLOG_API}?uid=${uid}&page=${page}&feature=0`;

  if (type === 'fav') {
    api = `${FAVORITES_ALL_FAV_API}?uid=${uid}&page=${page}`;
  }

  if (type === 'like') {
    api = `${STATUSES_LIKE_LIST_API}?uid=${uid}&page=${page}`;
  }

  console.log(`request ${api}`);
  const req = await fetch(api);
  const data = await req.json();
  return data;
}

async function fetchAllPosts(type = 'myblog', range, uid) {
  console.log(`fetching ${type} post ${range}`);

  const storage = {
    cache: new LRUCache(200),
    taskName: `WeiBack-${type}-${Date.now()}`,
    picUrls: new Set(),
    index: 1,
  };
  await fetchEmoticon();

  uid = uid ? uid : globalConfig.uid;
  const downloadPeriod = globalThis.downloadPeriod || 10;
  let allPageData = [];
  let noMore = false;
  let index = 0;
  const zip = new JSZip();
  const name = storage.taskName;
  const rootFolder = zip.folder(name);
  const resources = new Map();
  for (let page = range[0]; page <= range[1]; page++) {
    console.log('scan', 'page', page);
    showTip(`正在备份第 ${page} 页<br>因微博速率限制，过程可能较长，先干点别的吧`);
    let data;
    for (let i = 0; i < 10; i++) {
      const pageData = await fetchPostMeta(uid, page, type);
      if (pageData.ok) {
        data = type === 'fav' ? pageData.data : pageData.data.list;
        if (data.length === 0) noMore = true;
        break;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 8 * 1000);
      });
      console.log('retry', i);
      showTip(
          `[重试]备份第 ${index} 页，错误内容： ${JSON.stringify(pageData)}`,
      );
    }

    allPageData.push(await generateHTMLPage(data, storage));
    for (const url of storage.picUrls) {
      if (resources.get(url)) {
        continue;
      }
      const blob = storage.cache.get(url);
      if (blob) {
        resources.set(url, blob);
      } else {
        const blob = await fetchPic(url);
        storage.cache.set(url, blob);
        resources.set(url, blob);
      }
    }
    storage.picUrls.clear();

    index++;
    if (index % downloadPeriod === 0 || page === range[1] || noMore) {
      const taskName = `${name}-${storage.index}`;
      storage.index++;
      const doc = (new DOMParser()).parseFromString(HTML_GEN_TEMP, 'text/html');
      doc.body.innerHTML = allPageData.join('');
      allPageData = [];
      rootFolder.file(taskName + '.html', doc.documentElement.outerHTML);
      const resourcesFolder = rootFolder.folder(taskName + '_files');
      resources.forEach((blob, url) => {
        resourcesFolder.file(getFilename(url), blob, {base64: true});
      });
      resources.clear();
    }

    if (noMore || page === range[1]) break;
    await new Promise((resolve) => {
      setTimeout(resolve, 10 * 1000);
    });
  }

  showTip('数据拉取完成，等待下载到本地');

  zip.generateAsync({type: 'blob'}).then(function(content) {
    saveAs(content, name + '.zip');
  }).catch((err) => {
    console.error(err);
  });

  console.log('all done');
  showTip('完成，可以进行其它操作');
}

async function fetchPic(url) {
  for (let i = 0; i < 5; ++i) {
    try {
      const res = await fetch(url);
      return (await res.blob());
    } catch (err) {
      console.log('fic fetch occurs: ', err);
      await new Promise((resolve) => {
        setTimeout(resolve, i * 300);
      });
    }
  }
  console.log(`pic ${url} download failed`);
}

async function fetchEmoticon() {
  const api = STATUSES_CONFIG_API;
  const res = await fetch(api);
  const rawEmoticon = (await res.json()).data.emoticon;
  console.assert(rawEmoticon !== undefined);

  const emoticon = new Map();
  for (const lang in rawEmoticon) {
    // v: {哆啦A梦:{}, 其它:{}...}
    const emojiSets = rawEmoticon[lang];
    for (const setName in emojiSets) {
      for (const obj of emojiSets[setName]) {
        emoticon.set(obj.phrase, obj.url);
      }
    }
  }
  globalThis.globalConfig.emoticon = emoticon;
}
