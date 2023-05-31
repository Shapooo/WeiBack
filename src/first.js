// ==UserScript==
// @name         微博备份
// @namespace    https://github.com/Shapooo/
// @version      0.5
// @description  微博数据下载备份
// @author       Shapooo
// @homepageURL  https://github.com/Shapooo/WeiBack
// @match        *://*.weibo.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=weibo.com
// @require      https://cdn.bootcdn.net/ajax/libs/jszip/3.10.1/jszip.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @grant        none
// @license      GPL
// @note         2023-05-12 0.1 完成最基本的功能，能够拉取原始json数据文件进行备份
// @note         2023-05-15 0.2 完成html格式保存功能
// @note         2023-05-20 0.3 完成分段下载功能
// @note         2023-05-20 0.3 优化链接显示标题
// @note         2023-05-20 0.3 增加对图片、视频混合型微博支持
// @note         2023-05-20 0.3 增加对 www.weibo.com 的支持
// @note         2023-05-22 0.4 本地图片缓存添加 lru 算法
// @note         2023-05-23 0.4 将图片获取变为串行，减小下载连接被 reset 的可能性
// @note         2023-05-23 0.4 为图片下载增加了重试机制
// @note         2023-05-23 0.4 增加了备份失败时的提示，方便用户反馈问题
// @note         2023-05-23 0.4 修复若干问题
// @note         2023-05-28 0.5 修复若干问题
// @note         2023-05-28 0.5 增加分段下载设置功能
// @note         2023-05-28 0.5 增加图片大小设置功能
// ==/UserScript==
"use strict";
