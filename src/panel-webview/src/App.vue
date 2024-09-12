<script setup lang="ts">
import { ref } from 'vue';
import ImagePreview from './ImagePreview.vue';

const backgroundColor = ref('#272822');
const textColor = ref('#fff');
const images = ref<{
  imageName: string;
  dep: string[];
  webviewImageUri: any;
  size: string;
  originalSize: string | number;
}[]>([]);

const x = ref(0);
const y = ref(0);
const url = ref();
const show = ref(false);

const vscode = window?.acquireVsCodeApi?.();

vscode.postMessage({
  command: 'init',
});

const init = () => {
  let data: any;

  try {
    data = JSON.parse(localStorage.getItem('scan2findimgs') || '');
  } catch(err) {
    console.log('scan2findimgs webview err', err);
  }

  if (data) {
    backgroundColor.value = data?.backgroundColor || '#272822';
    textColor.value = data?.textColor || '#fff';
    images.value = data?.images.sort((a: any, b: any) => b.originalSize - a.originalSize) || [];
  }
};

window.addEventListener('message', event => {
  const message = event.data;
  switch (message.command) {
    case 'init':
      const currentWorkspace = localStorage.getItem('scan2findimgs_firstWorkspaceFolderPath');
      if (currentWorkspace === message?.data?.firstWorkspaceFolderPath) {
        init();
        break;
      }
      localStorage.setItem('scan2findimgs', JSON.stringify(message?.data));
      localStorage.setItem('scan2findimgs_firstWorkspaceFolderPath', message?.data?.firstWorkspaceFolderPath);
      backgroundColor.value = message?.data?.backgroundColor || '#272822';
      textColor.value = message?.data?.textColor || '#fff';
      images.value = message?.data?.images.sort((a: any, b: any) => b.originalSize - a.originalSize) || [];
      break;
  }
});

const openFile = (img: any) => {
  vscode.postMessage({
    command: 'openFile',
    data: JSON.stringify(img),
  });
};

const imageMouseover = (path: string, event: any) => {
  console.log(event, 'event看看');
  x.value = event.clientX;
  y.value = event.clientY;
  url.value = path;
  show.value = true;
};
const imageMouseout = (path: string, event: any) => {
  x.value = 0;
  y.value = 0;
  url.value = '';
  show.value = false;
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
      <colgroup class="column1"></colgroup>
      <colgroup class="column2"></colgroup>
      <colgroup class="column3"></colgroup>
      <colgroup class="column4"></colgroup>
      <colgroup class="column5"></colgroup>
      <thead>
        <tr>
          <th>No.</th>
          <th>size</th>
          <th>image</th>
          <th>image file</th>
          <th>dependencies</th>
        </tr>
      </thead>
      <tbody v-if="images.length > 0">
        <tr v-for="(item, index) in images" :key="index">
          <td>{{ index + 1 }}</td>
          <td>{{ item.size }}</td>
          <td>
            <img :src="item?.webviewImageUri || ''" alt="" @mouseover="imageMouseover(item?.webviewImageUri, $event)"
            @mouseout="imageMouseout(item?.webviewImageUri, $event)">
          </td>
          <td class="cursor image-name" @click="openFile(item.imageName)">{{ item?.imageName || '' }}</td>
          <td class="cursor">
            <template v-if="item?.dep">
              <div class="dep" v-for="dep in item?.dep" @click="openFile(dep)">
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
  <ImagePreview :url="url" :showPreview="show" :x="x + 10" :y="y + 10" />
</template>

<style lang="scss">

.panel {
  height: 100%;
  .total {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  .column2 {
    min-width: 150px;
  }
  .column4, .column5 {
    max-width: 500px;
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
  .dep:hover {
    color: rgb(116, 94, 224);
  }
  .image-name:hover {
    color: rgb(116, 94, 224);
  }
}
</style>
