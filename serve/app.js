/*
 * @Descripttion:
 * @Author: ZhangYu
 * @Date: 2023-04-03 16:49:58
 * @LastEditors: ZhangYu
 * @LastEditTime: 2023-04-04 00:04:30
 */
const WebSocket = require('ws')

const server = new WebSocket.Server({
  port: 7999
})

server.on('connection', handleConnection)

function handleConnection (ws) {
  console.log('---server is connected---')

  ws.on('close', handleClose)
  ws.on('error', handleError)
  ws.on('message', handleMessage)
}

function handleClose () {
  console.log('---server is closed')
}

function handleError (e) {
  console.log('---serve occured error---' + e)
}
/**
 * {
 *   mode: 'MESSAGE' or 'HEART_BEAT',
 *   msg: string
 * }
 */
function handleMessage (data) {
  const { mode, msg } = JSON.parse(data)
  switch (mode) {
    case 'MESSAGE':
      console.log('---user message---', msg)
      this.send(JSON.stringify(JSON.parse(data)))
      break;
    case 'HEART_BEAT':
      console.log('---heart beat message---', msg)
      this.send(JSON.stringify(JSON.parse(data)))
      break;
    default:
      break;
  }
}