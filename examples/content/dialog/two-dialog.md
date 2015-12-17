# 两个对话框共享遮罩层

- order: 3
- pubdate: 2015-12-15

---

<link href="../dist/asset/alice/dialog.css" rel="stylesheet">
<script src="../dist/lib/jquery/jquery.js"></script>
<script src="../dist/lib/handlebars/handlebars.js"></script>
<script src="../dist/core-debug.js"></script>
<script src="../dist/hui-debug.js"></script>

> 这里要注意 mask 的表现。

<button id="example1">打开第一个对话框</button>
<button id="example2" style="display: none">打开第二个对话框</button>

````javascript
var Dialog = Hui.Dialog;
var Confirmbox = Dialog.ConfirmBox;

var d1 = new Dialog({
    trigger: '#example1',
    height: 400,
    content: '#example2'
});
d1.after('show', function() {
    $('#example2').show();
});

$('#example2').click(function() {
    Confirmbox.alert('xxx');
});
````
