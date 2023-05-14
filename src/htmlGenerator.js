const HTML_GEN_TEMP = `<html lang="zh-CN"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1"><style>

body {
    background-color: #f1f2f5
}

.bk-post-wrapper {
    border-radius: 4px;
    background: #fff;
    width: 700px;
    margin: 8px auto;
    padding: 10px 0
}

.bk-poster {
    display: flex;
    align-items: center;
    vertical-align: middle;
    height: 60px
}

.bk-poster-avatar {
    height: 60px;
    width: 60px;
    border-radius: 50%;
    margin: auto 8px
}

.bk-post-text {
    background: #fff
}

.bk-content {
    margin: 8px 24px 8px 76px;
    font-size: 15px;
    line-height: 24px
}

.bk-retweet-poster {
    margin: 8px 24px 8px 76px;
    vertical-align: middle
}

.bk-retweet {
    background: #f9f9f9;
    padding: 2px auto
}

.bk-pic {
    max-width: 600px;
    max-height: 400px;
    margin: auto 24px auto 76px
}

.bk-video {
    width: 600px
}

.bk-poster-name,
.bk-retweet-poster-name {
    color: #000;
    font-weight: 700;
    text-decoration: none;
    font-family: Arial, Helvetica, sans-serif
}

.bk-poster-name:hover,
.bk-retweet-poster-name:hover {
    color: #eb7350
}

.bk-retweet-poster-name {
    margin: 8px 24px 8px 76px
}

.bk-icon-link {
    height: 12px;
    filter: sepia(100%) saturate(3800%) contrast(75%)
}

.bk-link,
.bk-user {
    color: #eb7350;
    text-decoration: none
}

.bk-link:hover,
.bk-user:hover {
    text-decoration: underline
}

.bk-emoji {
    height: 20px;
}

</style><title>微博备份</title></head><body><div class="bk-post-wrapper"><div class="bk-poster"><img class="bk-poster-avatar" alt="weibo poster"> <a class="bk-poster-name"></a></div><div class="bk-post"><div class="bk-post-text bk-content"></div><div class="bk-post-media bk-content"></div></div><div class="bk-retweet"><a class="bk-retweet-poster-name"></a><div class="bk-retweet-text bk-content"></div><div class="bk-retweet-media bk-content"></div></div></div></body></html>`;
const POST_GEN_TEMP = `<div class="bk-post-wrapper"><div class="bk-poster"><img class="bk-poster-avatar" alt="weibo poster"> <a class="bk-poster-name"></a></div><div class="bk-post"><div class="bk-post-text bk-content"></div></div></div>`;
const RETWEET_TEMP = `<div class="bk-retweet"><a class="bk-retweet-poster-name"></a><div class="bk-retweet-text bk-content"></div></div>`;

async function generateHtml(posts, name) {
    await fetchEmoticon();
    globalConfig.taskName = name;
    let storage = {
        cache: new Map(),
        taskName: name,
    }
    let inner = (await Promise.all(posts.map((post) => generateOnePost(post, storage)))).join('');
    let doc = (new DOMParser).parseFromString(HTML_GEN_TEMP, 'text/html');
    doc.body.innerHTML = inner;
    const zip = new JSZip();
    zip.file(name + '.html', doc.documentElement.outerHTML);
    const resources = zip.folder(name + '_files');
    await Promise.all(Array.from(storage.cache).map((kv) => {
        return fetchPic(kv[0]).then((blob) => {
            resources.file(kv[1], blob, { binary: true });
        });
    }));
    resources.file("test.txt", "helloworld");
    return zip;
}

async function fetchPic(url) {
    let res = await fetch(url, globalConfig.httpInit);
    return (await res.blob());
}

async function generateOnePost(post, storage) {
    // try {
    let tempContainerDiv = document.createElement('div');
    tempContainerDiv.innerHTML = POST_GEN_TEMP;
    let post_wrapper = tempContainerDiv.querySelector('.bk-post-wrapper');
    let poster_avatar = tempContainerDiv.querySelector('.bk-poster-avatar');
    let poster_name = tempContainerDiv.querySelector('.bk-poster-name');
    let post_text = tempContainerDiv.querySelector('.bk-post-text');
    poster_avatar.src = post.user.profile_image_url;
    let a = await parsePost(post, storage);
    // console.log(a);
    poster_name.innerHTML = a.poster_name;
    poster_name.href = a.poster_url;
    post_text.innerHTML = a.text;
    if (a.post_media) {
        let post_div = tempContainerDiv.querySelector('.bk-post');
        let post_media = document.createElement('div');
        post_media.className = "bk-post-media bk-content";
        post_media.innerHTML = a.post_media;
        post_div.appendChild(post_media);
    }
    if (post.retweeted_status) {
        let retweet_div = document.createElement('div');
        retweet_div.innerHTML = RETWEET_TEMP;
        let retweeter_name = retweet_div.querySelector('.bk-retweet-poster-name');
        let retweet_text = retweet_div.querySelector('.bk-retweet-text');
        let a = await parsePost(post.retweeted_status, storage);
        // console.log(a);
        retweeter_name.innerHTML = a.poster_name;
        retweeter_name.href = a.poster_url;
        retweet_text.innerHTML = a.text;
        if (a.post_media) {
            let post_media = document.createElement('div');
            post_media.className = "bk-post-media bk-content";
            post_media.innerHTML = a.post_media;
            post_div.appendChild(retweet_div);
        }
        post_wrapper.appendChild(retweet_div);
    }
    // console.log('return ', tempContainerDiv.innerHTML);
    return tempContainerDiv.innerHTML;
    // } catch (err) {
    //     console.log(err);
    // }
}

async function parsePost(post, storage) {
    // try {
    let text = await transText(post.isLongText ? await fetchLongText(post.mblogid) : post.text_raw,
        post.topic_struct, post.url_struct, storage);
    // console.log(text);
    let pics = [];
    let video = {};
    return {
        poster_name: post.user.screen_name,
        poster_url: 'https://weibo.com' + post.user.profile_url,
        poster_avatar: post.user.avatar_hd,
        text: text,
        post_url: `https://weibo.com/${post.user.idstr}/${post.mblogid}`,
        mblogid: post.mblogid,
        created_at: post.created_at,
        pics: pics,
        video: video,
    }
    // } catch (err) {
    //     console.log(`cannot parse: ${err}`, post);
    //     console.error(err);
    // }
}

async function fetchLongText(mblogid, storage) {
    let api = `https://weibo.com/ajax/statuses/longtext?id=${mblogid}`;
    let res = await fetch(api, globalConfig.httpInit);
    let longText = (await res.json()).data.longTextContent;
    // console.log('fetch long text', longText);
    return longText;
}

async function transText(text, topic_struct, url_struct, storage) {
    // console.log(`conv ${text} to`);
    var text = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : ""
        , topic_struct = arguments.length > 1 ? arguments[1] : void 0
        , url_struct = arguments.length > 2 ? arguments[2] : void 0
        , o = {
            url: "(http|https)://[a-zA-Z0-9$%&~_#/.\\-;:=,?]{5,280}",
            stock: "\\$([^\\$]+)\\$",
            br: "\\n",
            singleQuote: "(&|&amp;)#39;"
        }
        , atExpr = /@[\u4e00-\u9fa5|\uE7C7-\uE7F3|\w_\-·]+/g //at id
        , emojiExpr = /(\[.*?\])(?!#)/g //emoji
        , r = new RegExp(Object.values(o).join("|"), "g")
        , emailExpr = /[A-Za-z0-9]+([_\.][A-Za-z0-9]+)*@([A-Za-z0-9\-]+\.)+[A-Za-z]{2,6}/g // mail addr
        , topicExpr = /#([^#]+)#/g //topic
        , u = [];
    let ret = text && (text = text.replace(emailExpr, (function (t) { // mail addr
        if (t.match(atExpr)) {
            var e = t.match(atExpr);
            u.push(e && e[0])
        }
        return t
    }
    )),
        text = text.replace(/&#39;/g, "'"),
        text = text.replace(r, (function (e) {
            if (e) {
                var o = e.slice(0, 1);
                return "\n" === e ? transBr() : "h" === o || url_struct ? transUrl(e, url_struct, topic_struct) : e
            }
        }
        )),
        text = text.replace(atExpr, (function (e) {
            return -1 !== u.indexOf(e) ? e : transUser(e)
        }
        )),
        text = text.replace(topicExpr, (function (e) {
            var a = e.slice(0, 1);
            return "#" === a && "#&#" && isSuperTopic(e, url_struct) !== e ? transTopic(e, topic_struct) : e
        }
        )),
        console.assert(globalConfig.emoticon),
        text = text.replace(emojiExpr, (function (e) {
            return transEmoji(e, storage);
        }
        )),
        text);
    // console.log(ret);
    return ret;
}

function isSuperTopic(input, url_struct) {
    var input = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : ""
        , url_struct = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : [];
    return !(!input || !url_struct.length) && url_struct.find((function (e) {
        return e.short_url === input
    }
    ))
}

function resetUrl(t) {
    var e = /sinaweibo:\/\/([\w.]+\/?)\S*/
        , i = e.test(t);
    return i ? "https://m.weibo.cn/api/scheme?scheme=".concat(encodeURIComponent(t)) : t
}

function transUrl(input, url_struct, topic_struct, a) {
    var urlObj = url_struct && url_struct.find((function (e) {
        return e.short_url === input
    }
    ))
        , urlExpr = /(http|https):\/\/([\w.]+\/?)\S*/
        , c = '<a class="bk-link" target="_blank"';
    if (urlObj && urlObj.short_url && urlObj.short_url === input) {
        if (urlObj && urlObj.url_type_pic) {
            if (urlObj.pic_infos && urlObj.pic_ids && urlObj.pic_infos["".concat(urlObj.pic_ids[0])]) {
                var l = urlObj.pic_infos["".concat(urlObj.pic_ids[0])].large.url;
                l = l.replace("http://", "https://"),
                    c += " data-pid=".concat(Object.keys(urlObj.pic_infos)[0], '  href="').concat(l, '"')
            } else
                urlObj.page_id && urlObj.page_id.indexOf("100808") > -1 ? c += ' href="https://weibo.com/p/'.concat(urlObj.page_id, '"') : c += ' href="'.concat(resetUrl(url_struct), '"');
            c += '><img class="icon-link" src="'.concat(urlObj.url_type_pic.slice(0, -4) + "_default.png", '"/>').concat(urlObj.url_title, "</a>")
        } else
            c += ' href="'.concat(resetUrl(url_struct), '">').concat(urlObj.url_title, "</a>")
    } else {
        if (input && "#" === input.slice(0, 1))
            return transTopic(input, topic_struct);
        if (!urlExpr.test(input))
            return input;
        var u = /^http:\/\/t\.cn/;
        u.test(input) && (input = input.replace(/http:/, "https:")),
            c += ' href="'.concat(input, '"><img class="bk-icon-link" src="https://h5.sinaimg.cn/upload/2015/09/25/3/timeline_card_small_web_default.png"/>网页链接</a>')
    }
    return c
}

function transTopic(t, topic_struct) {
    var i = t && t.slice(1, -1)
        , a = topic_struct && topic_struct.find((function (t) {
            return t.topic_title === i && 1 === t.is_invalid
        }));
    if (a)
        return t;
    var o = "", n = "";
    return (o = "https://s.weibo.com/weibo?q=".concat(encodeURIComponent(t)),
        n = "_blank"),
        '<a class ="bk-link" href="'.concat(o, '" target="').concat(n, '">').concat(t, "</a>")
}

function transUser(t) {
    var e = t.slice(1);
    return e ? "<a class='bk-user' href=https://weibo.com/n/".concat(e, ">").concat(t, "</a>") : t
}

function transBr() {
    return "<br />"
}

function transEmoji(t, storage) {
    let url = getEmoji(t, storage);
    let o = t.slice(1, -1);
    return url ? '<img class="bk-emoji" alt="['.concat(o, ']" title="[').concat(o, ']" src="').concat(url, '" />') : t
}

async function fetchEmoticon() {
    let api = 'https://weibo.com/ajax/statuses/config';
    let res = await fetch(api, globalConfig.httpInit);
    let rawEmoticon = (await res.json()).data.emoticon;
    console.assert(void 0 !== rawEmoticon);

    let emoticon = new Map();
    for (const lang in rawEmoticon) {
        // v: {哆啦A梦:{}, 其它:{}...}
        let emojiSets = rawEmoticon[lang];
        for (const setName in emojiSets) {
            for (const obj of emojiSets[setName]) {
                emoticon.set(obj.phrase, obj.url);
            }
        }
    }
    globalConfig.emoticon = emoticon;
    // console.log(emoticon);
}

function getEmoji(e, storage) {
    let emoticon = globalConfig.emoticon;
    if (void 0 === emoticon) {
        return '';
    }
    let url = emoticon.get(e);
    if (url) {
        let fileName = getFilename(url);
        let filePath = `./${storage.taskName}_files/` + getFilename(url);
        storage.cache.set(url, fileName);
        return filePath;
    } else {
        return '';
    }
}

function getFilename(url) {
    return url.split('/').slice(-1)[0];
}