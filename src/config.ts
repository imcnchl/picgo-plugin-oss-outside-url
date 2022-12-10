import { PicGo } from 'picgo'
import { IAliyunConfig, IQiniuConfig, ITcyunConfig } from 'picgo/dist/utils/interfaces'

import { IImgInfo } from 'picgo/dist/types'

import qiniu from 'qiniu'
import OSS from 'ali-oss'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const COS = require('cos-nodejs-sdk-v5')

export interface Config {
  ossType: number
  expireSeconds: number
}

export interface ListItem {
  type: string
  name: string
  visible: boolean
}

export interface Processor {
  key: string
  name: string
  process: (ctx: PicGo, img: IImgInfo, expireSeconds: number) => string
}

export class AliyunProcessor implements Processor {
  key = 'aliyun'
  name = '阿里云'

  process (ctx: PicGo, img: IImgInfo, expireSeconds: number): string {
    const config = ctx.getConfig<IAliyunConfig>('picBed.aliyun')

    const store = new OSS({
      region: config.area,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket
    })

    const key = (config.path ? config.path : '') + img.fileName
    // 去掉问号
    let process = config.options?.startsWith('?') ? config.options.substring(1) : config.options
    // 去掉x-oss-process=
    process = process.replace('x-oss-process=', '')
    let url = store.signatureUrl(key, {
      process,
      expires: expireSeconds
    })
    // 取消URI转义，避免多次转义，导致复制到粘贴板的地址不正确
    url = decodeURIComponent(url)
    if (config.customUrl) {
      const prefix = config.customUrl.endsWith('/') ? config.customUrl : config.customUrl + '/'
      url = `${prefix}${url.substring(url.indexOf(key))}`
    }
    return url
  }
}

export class TencentProcessor implements Processor {
  key = 'tcyun'
  name = '腾讯云COS'

  process (ctx: PicGo, img: IImgInfo, expireSeconds: number): string {
    const config = ctx.getConfig<ITcyunConfig>('picBed.tcyun')

    const cos = new COS({
      SecretId: config.secretId,
      SecretKey: config.secretKey
    })

    const key = (config.path ? config.path : '') + img.fileName

    // 去掉问号
    const queryStr = config.path?.startsWith('?') ? config.path.substring(1) : config.path
    const query = new Map(queryStr.split('&').map(value => {
      const arr = value.split('=')
      return [arr[0], arr]
    }))

    let url = cos.getObjectUrl({
      Bucket: config.bucket,
      Region: config.area,
      Key: key,
      Sign: true,
      Query: query,
      Expires: expireSeconds
    }, (err, data) => {
      if (err) {
        ctx.log.warn(err.message)
      }
      url = data.Url
    })

    if (config.customUrl) {
      const prefix = config.customUrl.endsWith('/') ? config.customUrl : config.customUrl + '/'
      url = `${prefix}${url.substring(url.indexOf(key))}`
    }
    return url
  }
}

export class QiniuProcessor implements Processor {
  key = 'qiniu'
  name = '七牛云Kodo'

  process (ctx: PicGo, img: IImgInfo, expireSeconds: number): string {
    const config = ctx.getConfig<IQiniuConfig>('picBed.qiniu')
    const key = (config.path ? config.path : '') + img.fileName
    const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey)
    const bucketManager = new qiniu.rs.BucketManager(mac, new qiniu.conf.Config())
    const deadline = parseInt(String(Date.now() / 1000)) + expireSeconds
    return bucketManager.privateDownloadUrl(config.url, key, deadline)
  }
}

export class Processors {
  values: Processor[] = [
    new AliyunProcessor(),
    new TencentProcessor(),
    new QiniuProcessor()
  ]

  select (key: string): Processor {
    return this.values.find(value => value.key === key)
  }
}
