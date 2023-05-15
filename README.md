# WeiBack

WeiBack 是一个帮助微博用户备份自己数据的 [油猴 (Tampermonkey)](https://www.tampermonkey.net/) 脚本。

*本项目仅为技术学习和交流，本人拒绝为任何商业或非法目的提供任何技术支持，请在遵守当地相关法律法规的前提下使用本项目*

## 亮点

- 拥有简洁和直观的使用界面，操作方便，用户友好
- 良好的备份进度和状态提示
- 导出格式为 HTML，通过主流浏览器可打开
- 导出的 HTML 页面外观与 Weibo 原生界面接近，阅读体验良好
- 导出的 HTML 页面代码结构简单，可使用 Chrome/Firefox 等主流浏览器无痛转换成 PDF 格式

## 安装

- 通过 **Greasyfork**：进入 [微博备份](https://greasyfork.org/zh-CN/scripts/466100-%E5%BE%AE%E5%8D%9A%E5%A4%87%E4%BB%BD)，直接安装本脚本
- Clone 本项目到本地，执行 make 生成脚本文件后手动安装到 Tampermonkey

## 使用

### 基础

1. 安装脚本完毕后，打开 weibo.com（确保不是 www.weibo.com ） 页面。右侧自然出现操作窗口。

   ![image-20230515224745538](resources/image-20230515224745538.png)

2. 目前本脚本包含下载自己的微博发布、收藏和点赞的功能，点击对应的按钮进入对应数据的下载页。

3. 备份以 **页** 为单位，每页有二十条博文。在输入框中输入自已需要的页面范围，默认下载全部数据。点击 **开始下载** 即可开始备份。
4. 备份完成后，数据将被自动保存到本地。
5. 目前下载格式为包含 HTML 文件和其图片资源的 zip 压缩包，解压后使可用主流浏览器（Chrome/Firefox/Edge）打开。

### 进阶

#### 导出为PDF：

使用浏览器打开已经下载解压完毕的 HTML 文件，在浏览器菜单中选择打印（快捷键 Ctrl-p），选择输出为 PDF。

### 注意

- 过快的接口请求频率会增加微博官方的负载，甚至可能增加被 ban 风险。因此本脚本对每个请求设置了一个合理的等待时间以匹配人类的划动速度，因此备份数据量较大时可能耗时较长，请耐心等待，先去泡杯咖啡。本脚本仅为解放人手于繁重的操作，合理、适度地使用脚本乃为长久之计。
- 备份期间建议不要进行点赞、增删、收藏等操作，以免 weibo 服务器返回的数据错位，导致备份数据的重复或遗漏。
- 一次导出大量博文可能导致生成的 HTML 页面过长，不便于日后阅读，并会拖慢浏览器加载。建议一次保存十页左右，并将数据分段备份。后续版本将更新分段备份功能。

## 计划

- 对带封面的链接生成封面，优化导出页面的阅读体验
- 对视频生成封面，优化阅读体验
- 将页面中出现的短链转化为原始长链
- 增加对 www.weibo.com 的支持（目前仅 weibo.com）
- 增加自动分段下载的功能
- 增加图片默认保存质量设置功能，当前默认保存最高质量的图片
- 优化代码的结构和报错、日志
- 增加备份指定用户博文的功能（待定，目前已经有相关项目了）
- 不打算开发保存视频到本地的功能，因为视频文件太大，而且存在电影等巨型文件。对于特别喜爱的个别视频建议点击相应链接后用其它视频抓取工具进行下载，不值得一次性下载所有视频。、

## 日志

2023-05-12 0.1 完成最基本的功能，能够拉取原始json数据文件进行备份

2023-05-15 0.2 完成html格式保存功能

## Bugs/Requests

通过 [github issue tracker](https://github.com/Shapooo/WeiBack/issues) 提交问题和需求，或通过  [Greasyfork](https://greasyfork.org/zh-CN/scripts/466100-%E5%BE%AE%E5%8D%9A%E5%A4%87%E4%BB%BD/feedback) 进行反馈，优先选择github。

## 其它

感谢 [炸号微博备份](https://greasyfork.org/zh-CN/scripts/445022-%E7%82%B8%E5%8F%B7%E5%BE%AE%E5%8D%9A%E5%A4%87%E4%BB%BD) ，本项目受其影响并在初始版本使用其部分代码。因该脚本有时间未更新且存在bug便有了本项目的诞生。

本项目使用了 [JSZip](https://stuk.github.io/jszip/) 和 [FileSaver.js](https://github.com/eligrey/FileSaver.js/) 项目代码。

## 协议

Copyright Shapooo, 2023.

Distributed under the terms of the [GPL](https://github.com/Shapooo/WeiBack/blob/master/LICENSE)
