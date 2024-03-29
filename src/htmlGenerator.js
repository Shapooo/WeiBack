export { generateHTMLPage, getFilename };

const domain = window.location.host;
const STATUSES_LONGTEXT_API = `https://${domain}/ajax/statuses/longtext`;

async function generateHTMLPage(posts, storage) {
  return Promise.all(posts.map((post) => generateHTMLPost(post, storage))).then((posts) => posts.join(''));
}

function composePost(postMeta, isRetweet = false) {
  let prefix = 'bk-post';
  if (isRetweet) {
    prefix = 'bk-retweet';
  }
  const postDiv = document.createElement('div');
  postDiv.className = prefix;
  if (postMeta.posterName) {
    const posterDiv = document.createElement('div');
    posterDiv.className = prefix + 'er';
    const avatar = document.createElement('img');
    avatar.className = prefix + 'er-avatar';
    avatar.alt = '头像';
    avatar.src = postMeta.posterAvatar;
    posterDiv.appendChild(avatar);
    const name = document.createElement('a');
    name.className = prefix + 'er-name';
    name.href = postMeta.posterUrl;
    name.innerText = postMeta.posterName;
    posterDiv.appendChild(name);
    const createDetail = document.createElement('p');
    createDetail.className = 'bk-create-detail';
    createDetail.innerHTML = `&nbsp&nbsp&nbsp${postMeta.createdAt} ${postMeta.regionName}`;
    posterDiv.appendChild(createDetail);
    postDiv.appendChild(posterDiv);
  }
  const textDiv = document.createElement('div');
  textDiv.className = prefix + '-text bk-content';
  textDiv.innerHTML = postMeta.text;
  postDiv.appendChild(textDiv);
  if (postMeta.medium) {
    const mediaDiv = document.createElement('div');
    mediaDiv.className = prefix + '-media bk-content';
    mediaDiv.innerHTML = postMeta.medium.join('');
    postDiv.appendChild(mediaDiv);
  }
  if (postMeta.postUrl) {
    const postUrl = document.createElement('a');
    postUrl.innerHTML = '[原贴链接]';
    postUrl.href = postMeta.postUrl;
    postUrl.className = 'bk-link bk-content';
    postDiv.appendChild(postUrl);
  }
  return postDiv;
}

async function generateHTMLPost(post, storage) {
  const wrapper = document.createElement('div');
  wrapper.className = 'bk-post-wrapper';
  wrapper.appendChild(composePost(await parsePost(post, storage)));
  if (post.retweeted_status) {
    wrapper.appendChild(composePost(await parsePost(post.retweeted_status, storage), true));
  }
  return wrapper.outerHTML;
}

function getMedium(post, storage) {
  const imageDefinition = globalThis.imageDefinition
  if (post.mix_media_info) {
    return post.mix_media_info.items.map((item) => {
      const data = item.data;
      if (item.type === 'pic') {
        const pic = document.createElement('img');
        pic.className = 'bk-pic';
        pic.alt = '[图片]';
        let picObj;
        if (imageDefinition === 3) {
          picObj = item.data.mw2000 || item.data.largest || item.data.original || item.data.large || item.data.bmiddle;
        } else if (imageDefinition === 2) {
          picObj = item.data.large || item.data.bmiddle;
        } else {
          picObj = item.data.bmiddle || item.data.thumbnail;
        }
        pic.src = picObj.url;
        return pic.outerHTML;
      } else if (item.type === 'video') {
        const video = document.createElement('a');
        video.className = 'bk-link';
        video.innerHTML = data.page_title;
        video.href = data.media_info && data.media_info.h5_url;
        const pic = document.createElement('img');
        pic.className = 'bk-pic';
        pic.alt = '[视频]';
        pic.src = url2path(data.page_pic, storage);
        video.appendChild(pic);
        return video.outerHTML;
      } else {
        return '';
      }
    });
  } else if (post.pic_ids && post.pic_infos) {
    return post.pic_ids.map((id) => {
      const tmpObj = post.pic_infos[id];
      let picObj;
      if (imageDefinition === 3) {
        picObj = tmpObj.mw2000 || tmpObj.largest || tmpObj.original || tmpObj.large || tmpObj.bmiddle;
      } else if (imageDefinition === 2) {
        picObj = tmpObj.large || tmpObj.bmiddle;
      } else {
        picObj = tmpObj.bmiddle || tmpObj.thumbnail;
      }
      return url2path(picObj.url, storage);
    }).map((loc) => {
      const pic = document.createElement('img');
      pic.className = 'bk-pic';
      pic.alt = '[图片]';
      pic.src = loc;
      return pic.outerHTML;
    });
  } else {
    return [];
  }
}

async function parsePost(post, storage) {
  let text = (post.isLongText && await fetchLongText(post.mblogid)) || post.text_raw;
  text = await transText(text || post.text_raw, post.topic_struct, post.url_struct, storage);
  let posterAvatar;
  if (post.user && post.user.id) {
    let avatarUrl;
    switch (imageDefinition) {
      case 1:
        avatarUrl = post.user.profile_image_url || post.user.avatar_large || post.user.avatar_hd;
        break;
      case 2:
        avatarUrl = post.user.avatar_large || post.user.avatar_hd || post.user.profile_image_url;
        break;
      default:
        avatarUrl = post.user.avatar_hd || post.user.avatar_large || post.user.profile_image_url;
    }
    posterAvatar = avatarUrl && url2path(avatarUrl, storage);
  }
  return {
    posterName: post.user && post.user.screen_name,
    posterUrl: post.user && 'https://weibo.com' + post.user.profile_url,
    posterAvatar,
    text,
    postUrl: post.user && post.user.id && `https://weibo.com/${post.user.idstr}/${post.mblogid}`,
    mblogid: post.mblogid,
    createdAt: new Date(post.created_at).toLocaleString('zh-CN'),
    regionName: post.region_name ? post.region_name : '',
    medium: getMedium(post, storage),
  };
}

async function fetchLongText(mblogid) {
  const api = `${STATUSES_LONGTEXT_API}?id=${mblogid}`;
  const res = await fetch(api);
  if (res.ok) {
    const jsn = await res.json();
    return jsn.data && jsn.data.longTextContent || '';
  } else {
    return '';
  }
}

async function transText(text, topicStruct, urlStruct, storage) {
  const o = {
    url: '(http|https)://[a-zA-Z0-9$%&~_#/.\\-:=,?]{5,280}',
    stock: '\\$([^\\$]+)\\$',
    br: '\\n',
  };
  const atExpr = /@[\u4e00-\u9fa5|\uE7C7-\uE7F3|\w_\-·]+/g; // at id
  const emojiExpr = /(\[.*?\])(?!#)/g; // emoji
  const r = new RegExp(Object.values(o).join('|'), 'g');
  const emailExpr = /[A-Za-z0-9]+([_.][A-Za-z0-9]+)*@([A-Za-z0-9-]+\.)+[A-Za-z]{2,6}/g; // mail addr
  const topicExpr = /#([^#]+)#/g; // topic
  const u = [];
  const ret = text && (text = text.replace(emailExpr, function (t) { // mail addr
    if (t.match(atExpr)) {
      const e = t.match(atExpr);
      u.push(e && e[0]);
    }
    return t;
  }),
    text = text.replace(r, function (e) {
      if (e) {
        const o = e.slice(0, 1);
        return e === '\n' ? transBr() : o === 'h' || urlStruct ? transUrl(e, urlStruct) : e;
      }
    }),
    text = text.replace(atExpr, function (e) {
      return u.indexOf(e) !== -1 ? e : transUser(e);
    }),
    text = text.replace(topicExpr, function (e) {
      const a = e.slice(0, 1);
      return a === '#' && '#&#' && isSuperTopic(e, urlStruct) !== e ? transTopic(e, topicStruct) : e;
    }),
    console.assert(globalThis.globalConfig.emoticon),
    text = text.replace(emojiExpr, function (e) {
      return transEmoji(e, storage);
    }),
    text);
  return ret;
}

function isSuperTopic(input, urlStruct) {
  input = input !== undefined ? input : '';
  urlStruct = urlStruct !== undefined ? urlStruct : [];
  return (input && urlStruct.length) && urlStruct.find(function (e) {
    return e.short_url === input;
  });
}

function transUrl(input, urlStruct) {
  const urlObj = urlStruct && urlStruct.find(function (e) {
    return e.short_url === input;
  });
  const urlExpr = /(http|https):\/\/([\w.]+\/?)\S*/;
  if (!urlExpr.test(input)) {
    return input;
  }
  const u = /^http:\/\/t\.cn/;
  u.test(input) && (input = input.replace(/http:/, 'https:'));
  let urlTitle = '网页链接';
  let url = input;
  if (urlObj && urlObj.url_title) {
    urlTitle = urlObj.url_title;
  }
  if (urlObj && urlObj.long_url) {
    url = urlObj.long_url;
  }
  return `<a class="bk-link" target="_blank" href="${url}"><img class="bk-icon-link" src="https://h5.sinaimg.cn/upload/2015/09/25/3/timeline_card_small_web_default.png"/>${urlTitle}</a>`;
}

function transTopic(t, topicStruct) {
  const i = t && t.slice(1, -1);
  const a = topicStruct && topicStruct.find(function (t) {
    return t.topic_title === i && t.is_invalid === 1;
  });
  if (a) {
    return t;
  }
  const o = 'https://s.weibo.com/weibo?q='.concat(encodeURIComponent(t));
  const n = '_blank';
  return '<a class ="bk-link" href="'.concat(o, '" target="').concat(n, '">').concat(t, '</a>');
}

function transUser(t) {
  const e = t.slice(1);
  return e ? '<a class="bk-user" href=https://weibo.com/n/'.concat(e, '>').concat(t, '</a>') : t;
}

function transBr() {
  return '<br />';
}

function transEmoji(t, storage) {
  const location = getEmoji(t, storage);
  const o = t.slice(1, -1);
  return location ? '<img class="bk-emoji" alt="['.concat(o, ']" title="[').concat(o, ']" src="').concat(location, '" />') : t;
}

function getEmoji(e, storage) {
  const emoticon = globalThis.globalConfig.emoticon;
  if (emoticon === undefined) {
    return '';
  }
  const url = emoticon.get(e);
  if (url) {
    return url2path(url, storage);
  } else {
    return '';
  }
}

function getFilename(url) {
  return url.split('/').slice(-1)[0].split('?')[0];
}

function url2path(url, storage) {
  const fileName = getFilename(url);
  const filePath = `./${storage.taskName}-${storage.index}_files/` + fileName;
  storage.picUrls.add(url);
  return filePath;
}
