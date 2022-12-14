

<template>
  <div class="container-main">
        <router-view v-slot="{ Component, route }">
                <component
                    :is="Component"
                    :key="route.path"
                />
            
        </router-view>
    </div>
</template>

<style scoped>

</style>
