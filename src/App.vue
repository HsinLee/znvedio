

<template>
  <div class="container-main">
    <Header />
    <div>
        <router-view v-slot="{ Component, route }">
                <component
                    :is="Component"
                    :key="route.path"
                />
        </router-view>
      </div>
    </div>
</template>

<script>
  import { defineComponent } from "vue";
  import Header from "./components/header.vue";
console.log(Header,111)
  export default defineComponent({
    name: "app",
    components:{
      Header,
    }
  })
</script>

<style scoped>

</style>
