# Dialog - ajax 载入内容

- order: 5
- pubdate: 2015-12-15

---

<link href="../dist/asset/alice/dialog.css" rel="stylesheet">
<script src="../dist/lib/jquery/jquery.js"></script>
<script src="../dist/lib/handlebars/handlebars.js"></script>
<script src="../dist/core-debug.js"></script>
<script src="../dist/hui-debug.js"></script>


<style>
.fn-hide {display:none;}
</style>

<button id="example1">打开对话框（ajax）</button>

````js
var Dialog = Hui.Dialog;
var example = new Dialog({
    trigger: '#example1',
    content: './ajax-page.html?ajax'
});
````

<button id="example2">打开对话框（iframe）</button>

````js
var example = new Dialog({
    trigger: '#example2',
    content: './ajax-page.html'
});
````

ajax-page 的内容如下：

```html
<!DOCTYPE HTML>
<html>
<head>
  <style>
  body {color:red; height: 200px;}
  </style>
<head>
<body>
  <div>我是一个页面的内容</div>
  <div>我是一个页面的内容</div>
</body>
</html>
```
