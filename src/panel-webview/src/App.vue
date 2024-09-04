<script setup lang="ts">
import { ref } from 'vue';

const backgroundColor = ref('#272822');
const textColor = ref('#fff');
const images = ref<{ imageName: string, dep: string[], webviewImageUri: any }[]>([]);
const vscode = window?.acquireVsCodeApi?.();
let data: any;

try {
  data = JSON.parse(localStorage.getItem('scan2findimgs') || '');
} catch(err) {
  console.log('scan2findimgs webview err', err);
}

if (data) {
  backgroundColor.value = data?.backgroundColor || '#272822';
  textColor.value = data?.textColor || '#fff';
  images.value = data?.images || [];
} else {
  vscode.postMessage({
    command: 'init',
  });
}

window.addEventListener('message', event => {
  const message = event.data;
  switch (message.command) {
    case 'init':
      localStorage.setItem('scan2findimgs', JSON.stringify(message?.data));
      backgroundColor.value = message?.data?.backgroundColor || '#272822';
      textColor.value = message?.data?.textColor || '#fff';
      images.value = message?.data?.images || [];
      break;
  }
});

const openFile = (img: any) => {
  vscode.postMessage({
    command: 'openFile',
    data: JSON.stringify(img),
  });
};
</script>

<template>
  <div class="panel" :style="{
    backgroundColor: backgroundColor,
    color: textColor,
  }">
    <h2>scan2findimgs</h2>
    <div class="total">
      total: {{ images.length }}
    </div>
    <table>
      <thead>
        <tr>
          <th>No.</th>
          <th>image</th>
          <th>image file</th>
          <th>dependencies</th>
        </tr>
      </thead>
      <tbody v-if="images.length > 0">
        <tr v-for="(item, index) in images" :key="index">
          <td>{{ index + 1 }}</td>
          <td>
            <img :src="item?.webviewImageUri || ''" alt="">
          </td>
          <td class="cursor" @click="openFile(item.imageName)">{{ item?.imageName || '' }}</td>
          <td class="cursor">
            <template v-if="item?.dep">
              <div v-for="dep in item?.dep" @click="openFile(dep)">
                {{ dep }}
              </div>
            </template>
            <div v-else>
              none
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss">

.panel {
  height: 100%;
  .total {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  table, tr, td, th {
    border: 1px solid #fff;
    border-collapse: collapse;
  }
  td, th {
    padding: 10px;
  }
  .cursor {
    cursor: pointer;
  }
}
</style>
