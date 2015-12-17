# Dialog - 直接显示

- order: 3
- pubdate: 2015-12-15

---

<link href="../dist/asset/alice/dialog.css" rel="stylesheet">
<script src="../dist/lib/jquery/jquery.js"></script>
<script src="../dist/lib/handlebars/handlebars.js"></script>
<script src="../dist/core-debug.js"></script>
<script src="../dist/hui-debug.js"></script>


无需 trigger，直接显示在页面上。

<style>
.fn-hide {display:none;}
</style>

---

````javascript
var Dialog = Hui.Dialog;

new Dialog({
    content: '<div style="padding:50px">没有 trigger，直接显示出来</div>'
}).show();
````
