<template>
  <div>
    <p>用户信息</p>
    <button @click="onClickBtn">返回</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
const onClickBtn = () => {
  router.push({
    path: "/",
  });
};
</script>

<style scoped>

</style>