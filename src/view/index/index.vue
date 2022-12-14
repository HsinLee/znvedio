<template>
	<div>
		home
	</div>
</template>

<script setup lang="ts" name='index'>
import api from "../../network/module/index.js"
import {onMounted} from 'vue'

onMounted(() => {
   console.log(api.getList)
   api.getList().then((res)=>{console.log(res,222)})
});
</script>
