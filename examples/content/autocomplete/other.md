# 其他示例

- order:5
- pubdate: 2015-12-15

---

<link rel="stylesheet" href="../dist/asset/alice/one.css">
<script src="../dist/lib/jquery/jquery.js"></script>
<script src="../dist/lib/handlebars/handlebars.js"></script>
<script src="../dist/core-debug.js"></script>
<script src="../dist/hui-debug.js"></script>

## Email 自动补全

这个功能很常用，在输入账号的时候希望补全常用的邮箱后缀

通过 dataSource 实现，每次输入 dataSource 都根据输入自动生成，并设置 filter 为空

<input id="example" type="text" value="" />

````javascript
var AutoComplete = Hui.AutoComplete;

var data = [
    '163.com',
    '126.com',
    'gmail.com'
];
new AutoComplete({
    trigger: '#example',
    dataSource: function(query) {
        query = query.replace(/^(.*)@.*$/,'$1');
        return $.map(data, function(v) {
            return query + '@' + v;
        });
    }
}).render();
````

## 选中后新开窗口


<form action="">
  <input id="acTrigger" type="text" value="" />
</form>


````html
<script id="acTrigger4-template" type="text/x-handlebars-template">
  <div class="{{classPrefix}}">
    <div class="{{classPrefix}}-content">
      {{> header}}
      <ul data-role="items">
      {{#if items}}
        {{#each items}}
          <li data-role="item" class="{{../classPrefix}}-item">
            <a href="http://www.baidu.com" target="_blank">
            {{#include parent=.. }}{{> html}}{{/include}}
            </a>
          </li>
        {{/each}}
      {{else}}
          <li class="{{../classPrefix}}-item">无匹配的产品和服务</li>
      {{/if}}
      </ul>
      {{> footer}}
      <p><a href="" target="_blank">“信用卡”相关的帮助</a></p>
    </div>
  </div>
</script>
````

````javascript
var ac = new AutoComplete({
  trigger: '#acTrigger',
  template: $('#acTrigger4-template').html(),
  width: '200',
  dataSource: [
    '信用卡',
    '信息 '
  ]
}).render();
````
