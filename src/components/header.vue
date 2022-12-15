<template>
  <div class="header-container">
    <span class="logo"></span>
  </div>
</template>

<script>


</script>


<style lang="less">
.header-container{
  position:fixed;
  top:0;
  left:0;
  height: 50px;
  width:100%;
  display:flex;
  padding: 0 15px;
  align-items: center;
  .logo{
    background-image: url("../assets/logo.png");
    display:block;
    width:140px;
    height:30px;
    background-size: contain;
  }
}
</style>
