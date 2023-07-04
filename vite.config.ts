import { defineConfig } from 'vite';
import createReScriptPlugin from '@jihchi/vite-plugin-rescript';
import monkey from 'vite-plugin-monkey'

export default defineConfig({
    plugins: [createReScriptPlugin(),
    monkey({
        entry: 'src/main.js',
        userscript: {
            name: 'weiback',
            namespace: 'https://github.com/Shapooo/',
            author: 'Shapooo',
            description: '微博数据下载备份',
            homepageURL: 'https://github.com/Shapooo/WeiBack',
            match: [
                '*://*.weibo.com/*',
            ],
            require: ['https://cdn.bootcdn.net/ajax/libs/jszip/3.10.1/jszip.min.js',
                'https://cdn.bootcdn.net/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'],
            icon: 'https://www.google.com/s2/favicons?sz=64&domain=weibo.com',
            grant: 'none',
            license: 'GPL',
        },
        build: {
            fileName: 'WeiBack.user.js',
            metaFileName: true,
        },
    }),],
});
