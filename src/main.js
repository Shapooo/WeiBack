let bkBoxStyle = `.bkBox{position:fixed;border-radius:3px;background:#fff;top:80px;right:20px;z-index:100000;padding:10px 15px;text-align:center;border:2px solid #000}.bkBox-title{font-size:15px;color:#000;margin:0}.bkBox-button{border-radius:.166667rem;display:block;font-weight:700;color:#444;padding:5px 14px;font-size:13px;text-align:center;border:1px solid #cfcfcf;cursor:pointer;margin:3px auto 7px}.box,.nav{width:300px;margin:auto;display:flex}.nav{height:20px;background-color:gray}.box{overflow:hidden}.content{width:300px;height:200px;flex-shrink:0}`;

const SETTINGS_TEMP = `<div><label title="每页二十个条目">页面总数</label></div><div><label title="hhhhh"><div><input type="number" value="1" min="1" max="22" style="width:30%"> 至<input type="number" value="22" min="1" max="22" style="width:30%"></div></label></div><div><button class="bkBox-button">开始下载</button></div>`;

const BKBOX_TEMP = `<h2 style="font-size: 15px;
    color: black;
    margin: 0 0;">微博备份</h2><nav><div class="nav"></div></nav><section><div class="box"></div></section>`;

let globalConfig = {
    uid: $CONFIG.uid,
}


const TT = (type, name) => {
    return (async () => {
        let a = await getPageAmount(type);
        console.log(`get amount of ${type} post: ${a}`);
        return { type: type, name: name, pageAmount: a }
    })();
}

let bkTypes = [TT('fav', '收藏'), TT('like', '点赞'), TT('myblog', '我的博文')];
Promise.all(bkTypes).then((values) => {
    let bkBox = document.createElement("div");
    bkBox.className = "bkBox";
    bkBox.innerHTML = BKBOX_TEMP;

    let bkBoxStyleSheet = document.createElement("style");
    bkBoxStyleSheet.innerText = bkBoxStyle;
    bkBox.appendChild(bkBoxStyleSheet);

    values.map((t) => {
        return {
            type: t.type, name: t.name, settingsPage: (() => {
                let type = t.type;
                let name = t.name;
                let pageAmount = t.pageAmount;
                let page = document.createElement('div');
                page.innerHTML = SETTINGS_TEMP;
                let pageEndInput = page.querySelectorAll('input')[1];
                pageEndInput.max = pageAmount;
                pageEndInput.value = pageAmount;
                let nameNode = document.createElement('div');
                nameNode.innerText = name;
                page.appendChild(nameNode);
                let btn = page.getElementsByClassName("bkBox-button")[0];
                btn.addEventListener("click", async () => {
                    let dlRange_ = page.querySelectorAll("input");
                    let dlRange = [dlRange_[0].value, dlRange_[1].value];
                    await fetchAll(type, dlRange);
                })
                return page;
            })()
        };
    }).forEach((c) => {
        settleDownBkTypes(c.type, c.name, c.settingsPage);
        console.log(`settled post type ${c.type} to bkBox`);
    })
    document.body.appendChild(bkBox);


    // =========================================================

    function settleDownBkTypes(type, name, settingsPage) {
        let nav = bkBox.getElementsByClassName("nav")[0];
        let settingBox = bkBox.getElementsByClassName("box")[0];
        let naviButton = document.createElement("a");
        naviButton.innerText = name;
        naviButton.className = "nav"
        naviButton.href = "#" + type;
        nav.appendChild(naviButton);
        let page = document.createElement("div");
        page.id = type;
        page.className = "content"
        page.appendChild(settingsPage);
        settingBox.appendChild(page);
        nav.append
    }

})

async function getPageAmount(type) {
    let data = (await fetchMyContent(1, type)).data;
    let amount = 0;
    if (type == 'fav') {
        amount = data.total_number;
    } else if (type == 'myblog') {
        amount = data.total;
    } else {
        amount = Infinity;
    }
    return Math.ceil(amount / 20);
}