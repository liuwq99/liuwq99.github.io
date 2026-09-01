<template>
  <div>
    <van-button type="primary">主要按钮</van-button>
    <p class="text">这是一个段落</p>
  </div>
</template>

<script setup lang="ts">
import { Button } from "vant";

defineOptions({
  components: {
    [Button.name]: Button,
  },
});
</script>

<style scoped lang="scss">
.text {
  font-size: 16px;
}
</style>
