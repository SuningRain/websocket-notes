/*
 * @Descripttion: websocket心跳机制
 * @Author: ZhangYu
 * @Date: 2023-04-03 17:43:01
 * @LastEditors: ZhangYu
 * @LastEditTime: 2023-04-04 01:04:13
 */
class RCNWS {
  static CONNECTING = WebSocket.CONNECTING // 0
  static OPEN = WebSocket.OPEN // 1
  static CLOSING = WebSocket.CLOSING // 2
  static CLOSED = WebSocket.CLOSED // 3

  constructor (url) {
    this._init({ url })
  }
  // 初始化
  _init (data) {
    this._initData(data)
    this._connect()
  }
  // 初始化属性
  _initData (data) {
    const { url } = data
    this._url = url // 用于连接和重连
    this._ws = null // 需要用到websocket实例相关方法
    this._heartBeatTimer = null
    this._reConnectTimer = null
    this._forceClose = false
    this._readyState = RCNWS.CONNECTING // 初始为准备连接态
    this.onOpen = function () {}
    this.onMessage = function () {}
    this.onClose = function () {}
    this.onError = function () {}
  }
  // 连接
  _connect () {
    console.log('---to connect server---', this._url, this._ws)
    this._ws = new WebSocket(this._url)
    this._initEventListener()
  }
  // 重连
  _reConnect () {
    // 重连一般需要进行延时处理
    this._reConnectTimer = setTimeout(() => {
      this._connect()
      clearTimeout(this._reConnectTimer)
      this._reConnectTimer = null
    }, 5000)
  }
  // 初始化事件监听
  _initEventListener () {
    const ws = this._ws
    ws.addEventListener('open', this._handleConnected.bind(this))
    ws.addEventListener('message', this._handleReceiveMessage.bind(this))
    ws.addEventListener('close', this._handleClosed.bind(this))
    ws.addEventListener('error', this._handleError.bind(this))
  }
  // 连接成功
  _handleConnected () {
    console.log('---client is connected---')
    this._setReadyState(RCNWS.OPEN)
    this.onOpen()
    this._createHeartBeat()
  }
  // 收到服务器消息
  _handleReceiveMessage ({ data }) {
    const { mode, msg } = JSON.parse(data)
    switch (mode) {
      case 'MESSAGE':
        this._handleNormalMessage(msg)
        break;
      case 'HEART_BEAT':
        console.log('---heart beat message---')
        break;
      default:
        break;
    }
  }
  // 连接关闭
  _handleClosed () {
    this.onClose()
    console.log('---client is closed---')
    this._reset()
    if (this._forceClose) { // 外部调用close方法主动关闭，不重连
      this._setReadyState(RCNWS.CLOSED)
    } else {
      this._reConnect()
    }
  }
  // 主动关闭
  close () {
    if (this._isConnected()) {
      this.forceClose = true
      this.ws.close()
    } else {
      console.log('---connect has closed---')
    }
  }
  // 连接错误
  _handleError () {
    this.onError()
    this._reset()
    console.log('---client connect error---')
  }
  // 发送消息
  sendMessage (data) {
    if (this._isConnected()) {
      this._ws.send(JSON.stringify(data))
    } else {
      console.log('---connect has closed---')
    }
  }
  // 接受消息
  _handleNormalMessage (msg) {
    this.onMessage()
    console.log('---normal message---', msg)
  }
  // 是否是连接状态
  _isConnected () {
    return this._readyState === RCNWS.OPEN
  }
  // 创建心跳包任务
  _createHeartBeat () {
    const heartBeatData = {
      mode: 'HEART_BEAT',
      msg: 'HEART_BEAT'
    }
    this._heartBeatTimer = setInterval(() => {
      this.sendMessage(heartBeatData)
      this._testClose() // 测试方法，用于测试连接断开
    }, 5000)
  }

  //****属性改变相关****//

  _setReadyState (readyState) {
    this._readyState = readyState
  }

  _reset () {
    const _clearHeartBeatTimer = () => {
      if (this._heartBeatTimer) {
        clearInterval(this._heartBeatTimer)
        this._heartBeatTimer = null
      }
    }
    const _clearReconnectTimer = () => {
      if (this._reConnectTimer) {
        clearTimeout(this._reConnectTimer)
        this._reConnectTimer = null
      }
    }
    this._ws = null // 需要用到websocket实例相关方法
    this._forceClose = false
    this._readyState = RCNWS.CONNECTING // 初始为准备连接态
    _clearHeartBeatTimer()
    _clearReconnectTimer()
  }

  //****模拟相关功能****//
  _testClose () {
    setTimeout(() => {
      try {
        this._ws.close(1000, '主动关闭')
      } catch (e) {
      }
    }, 1000)
  }
}

export function createWebSocket (url) {
  const target = new RCNWS(url)
  const ReconnectingWebSocket = new Proxy(target, {
    get: function(target, key){
      console.log('---key---', key)
      if (key.startsWith('_')) { // 对私有变量属性隔离
        return undefined
      }
      return target[key]
    },
    set: function(target, key, value) {
      if (key.startsWith('_')) {
        return undefined
      }
      target[key] = value
      return target[key]
    }
  })
  return ReconnectingWebSocket
}