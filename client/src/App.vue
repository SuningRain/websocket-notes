/**
 * @Descripttion:
 * @Author: ZhangYu
 * @Date: 2023-04-03 17:36:54
 * @LastEditors: ZhangYu
 * @LastEditTime: 2023-04-03 17:38:00
 */
<template>
  <button @click="sendMsg">Send</button>
</template>

<script setup>
import { createWebSocket } from './reconnectingWebSocket'

let ws = createWebSocket('ws://localhost:7999')
ws.onOpen = () => {
  console.log('---我是外面的open---')
}
const sendMsg = () => {
  if (ws) {
    ws.sendMessage({
      mode: 'MESSAGE',
      msg: 'Hello'
    })
  }
}

</script>

<style>
</style>
