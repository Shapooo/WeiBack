const HTML_GEN_TEMP = `<html lang="zh-CN"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background-color:#f1f2f5}.bk-post-wrapper{border-radius:10px;background:#fff;width:700px;margin:8px auto;padding:10px 0}.bk-poster{display:flex;align-items:center;vertical-align:middle;height:60px}.bk-poster-avatar{height:60px;width:60px;border-radius:50%;margin:auto 8px}.bk-post-text{background:#fff}.bk-content,.bk-retweet-poster{margin:8px 24px 8px 76px}.bk-retweet-poster{vertical-align:middle}.bk-retweet{background:#f9f9f9}.bk-pic{max-width:600px;max-height:400px;margin:auto 24px auto 76px}.bk-video{width:600px}.bk-poster-name,.bk-retweet-poster-name{color:#000;font-weight:700;text-decoration:none;font-family:Arial,Helvetica,sans-serif}.bk-retweet-poster-name{margin:8px 24px 8px 76px}</style><title>微博备份</title></head><body></body></html>`;
const POST_GEN_TEMP = `<div class="bk-post-wrapper"><div class="bk-poster"><img class="bk-poster-avatar" alt="weibo poster"> <a class="bk-poster-name"></a></div><div class="bk-post"><div class="bk-post-text bk-content"></div></div></div>`;
const RETWEET_TEMP = `<div class="bk-retweet"><a class="bk-retweet-poster-name"></a><div class="bk-retweet-text bk-content"></div></div>`;

async function generateHtml(posts) {
    let inner = (await Promise.all(posts.map(generateOnePost))).join('');
    console.log(`inner`, inner);
    let doc = (new DOMParser).parseFromString(HTML_GEN_TEMP, 'text/html');
    doc.body.innerHTML = inner;
    return doc.documentElement.outerHTML;
}

async function generateOnePost(post) {
    try {
        let post_wrapper = document.createElement('div');
        post_wrapper.innerHTML = POST_GEN_TEMP;
        let poster_avatar = post_wrapper.querySelector('.bk-poster-avatar');
        let poster_name = post_wrapper.querySelector('.bk-poster-name');
        let post_text = post_wrapper.querySelector('.bk-post-text');
        poster_avatar.src = post.user.profile_image_url;
        let a = await parsePost(post);
        poster_name.innerHTML = a.poster_name;
        poster_name.href = a.poster_url;
        post_text.innerHTML = a.post_text;
        if (a.post_media) {
            let post_div = post_wrapper.querySelector('.bk-post');
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
            let a = await parsePost(post.retweeted_status);
            retweeter_name.innerHTML = a.poster_name;
            retweeter_name.href = a.poster_url;
            retweet_text.innerHTML = a.post_text;
            if (a.post_media) {
                let post_media = document.createElement('div');
                post_media.className = "bk-post-media bk-content";
                post_media.innerHTML = a.post_media;
                post_div.appendChild(retweet_div);
            }
            post_wrapper.appendChild(retweet_div);
        }
        return post_wrapper.innerHTML;
    } catch (err) {
        console.log('cannot parse post', post);
        // console.error(err);
        return '';
    }
}

async function parsePost(post) {
    return {
        poster_name: post.user.screen_name,
        poster_url: 'https://weibo.com' + post.user.profile_url,
        post_text: post.text,
    }
}

async function fetchLongText() {

}

async function transText(text) {

}

async function transEmoji(e) {
    let emoticon = void 0 !== globalConfig.emoticon ? globalConfig.emoticon : (getEmoticon(), globalConfig.emoticon);
}

async function getEmoticon() {

}

async function formatEmoji(e) {

}