## picgo-plugin-oss-outside-url



A PicGo plugin for oss private resource url.

将OSS的私有资源链接转成外链的PicGo插件，支持阿里云OSS、腾讯云COS、七牛云Kodo

<strong>注意：该插件没有充分测试网址后缀的场景，设置了网址后缀可能会导致非预期的结果发生</strong>

更多需求，欢迎PR或提ISSUE。

---

## 例如

过期时间设置永久：`expireSeconds=0`

过期时间设置为1个小时：`expireSeconds=3600`

---

## 修改配置参数后生效

![配置](https://raw.githubusercontent.com/caohongliang92/picgo-plugin-oss-outside-url/master/images/config.png)

expireSeconds，过期秒数，默认0（永久）

---
### 版权声明

MIT

