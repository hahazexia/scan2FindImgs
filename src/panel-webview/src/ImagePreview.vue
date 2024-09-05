<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps({
  showPreview: {
    type: Boolean,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
});
</script>
<template>
  <div class="image-preview-box" :style="{
    left: `${props?.x || 0}px`,
    top: `${props?.y || 0}px`,
    display: props?.showPreview ? 'block' : 'none',
  }">
    <img :src="props?.url" alt="">
  </div>
</template>
<style lang="scss">
.image-preview-box {
  display: none;
  position: fixed;
  img {
    max-width: 500px;
    max-height: 500px;
  }
}
</style>