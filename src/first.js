// ==UserScript==
// @name         微博备份
// @namespace    https://github.com/Shapooo/
// @version      0.3
// @description  微博数据下载备份
// @author       Shapooo
// @homepageURL  https://github.com/Shapooo/WeiBack
// @match        *://*.weibo.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=weibo.com
// @grant        none
// @license      GPL
// @note         2023-05-12 0.1 完成最基本的功能，能够拉取原始json数据文件进行备份
// @note         2023-05-15 0.2 完成html格式保存功能
// @note         2023-05-20 0.3 完成分段下载功能
// @note         2023-05-20 0.3 优化链接显示标题
// @note         2023-05-20 0.3 增加对图片、视频混合型微博支持
// @note         2023-05-20 0.3 增加对 www.weibo.com 的支持
// ==/UserScript==
"use strict";
