import * as path from 'path'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import express from 'express'
import type { RequestProps } from './types'
import type { ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel } from './chatgpt'
import { auth } from './middleware/auth'
import { limiter } from './middleware/limiter'
import { isNotEmptyString } from './utils/is'

const app = express()
const router = express.Router()

let port = 3002
if (process.env.NODE_ENV === 'production') {
  port = 13034
  app.use('/', express.static(path.join(__dirname, '/../../dist')))
}
app.use(express.static('public'))
app.use(express.json())

app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

router.post('/chat-process', [auth, limiter], async (req, res) => {
  res.setHeader('Content-type', 'application/octet-stream')

  try {
    const { prompt, options = {}, systemMessage, temperature, top_p } = req.body as RequestProps
    let firstChunk = true
    await chatReplyProcess({
      message: prompt,
      lastContext: options,
      process: (chat: ChatMessage) => {
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
        firstChunk = false
      },
      systemMessage,
      temperature,
      top_p,
    })
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    res.end()
  }
})

router.post('/config', auth, async (req, res) => {
  try {
    const response = await chatConfig()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/session', async (req, res) => {
  try {
    const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
    const hasAuth = isNotEmptyString(AUTH_SECRET_KEY)
    res.send({ status: 'Success', message: '', data: { auth: hasAuth, model: currentModel() } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body as { token: string }
    if (!token)
      throw new Error('Secret key is empty')

    if (process.env.AUTH_SECRET_KEY !== token)
      throw new Error('密钥无效 | Secret key is invalid')

    res.send({ status: 'Success', message: 'Verify successfully', data: null })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

const StorageConfig = {
  DEFAULT_CACHE_TIME: 60 * 60 * 24 * 7,
  dirPath: path.join(__dirname, '/../../.storage/'),
}
router.post('/setStorage', async (req, res) => {
  try {
    const { key, data, expire } = req.body as { key: string; data: any; expire?: number | null }
    const storageData = {
      data,
      expire: expire !== null ? new Date().getTime() + (expire === undefined ? StorageConfig.DEFAULT_CACHE_TIME : expire) * 1000 : null,
    }
    const filePath = path.join(StorageConfig.dirPath, `${key}.json`)
    mkdirSync(StorageConfig.dirPath, { recursive: true })
    writeFileSync(filePath, JSON.stringify(storageData), { encoding: 'utf8' })
    res.send({ status: 'Success', message: '' })
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    res.end()
  }
})
router.post('/getStorage', async (req, res) => {
  try {
    let retData = {}
    const { key } = req.body as { key: string }
    const filePath = path.join(StorageConfig.dirPath, `${key}.json`)
    const stats = statSync(filePath) // when file is not exist, it will throw error
    if (stats) {
      const storageData = readFileSync(filePath, { encoding: 'utf8' })
      const { data, expire } = JSON.parse(storageData) as { data: any; expire: number | null }
      if (expire === null || expire >= Date.now())
        retData = data
    }
    res.send({ status: 'Success', message: '', data: retData })
  }
  catch (error) {
    // console.log(error)
    res.send({ status: 'Fail', message: JSON.stringify(error) })
  }
  finally {
    res.end()
  }
})

app.use('', router)
app.use('/api', router)
app.set('trust proxy', 1)

// globalThis.console.log(process.env)
app.listen(port, () => globalThis.console.log(`Server is running on port ${port}`))
