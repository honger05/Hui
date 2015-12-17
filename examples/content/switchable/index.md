# 基本用法

- order: 1
- pubdate: 2015-12-15

---

<script src="../dist/lib/jquery/jquery.js"></script>
<script src="../dist/lib/handlebars/handlebars.js"></script>
<script src="../dist/core-debug.js"></script>
<script src="../dist/hui-debug.js"></script>

[Tabs](./tabs.html)
[Slide](./slide.html)
[Carousel](./carousel.html)
[Accordion](./accordion.html)

## 指定 Triggers/Panels

<style>
.tab-demo, .slide-demo {
    margin: 20px 0;
    padding: 0;
}
.hidden {
    display: none;
}
</style>

**注意: 所有示例中, 每个示例的 CSS, HTML, JS 都是独立的, 按照示例的代码复制并修改即可, 不需要引入当前页面的其他样式!!**

````css
#tab-demo-1 {
    font: 14px/1.5 'Xin Gothic', 'PT Sans', 'Hiragino Sans GB', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    position: relative;
    width: 750px;
    padding-top: 29px;
}

#tab-demo-1 .ui-switchable-nav {
    position: absolute;
    top: 0;
    left: 20px;
    margin: 0;
    padding: 0;
    z-index: 99;
    list-style: none;
}

#tab-demo-1 .ui-switchable-nav li {
    float: left;
    width: 130px;
    height: 27px;
    line-height: 21px;
    text-align: center;
    background: url(assets/tabs-sprite.gif) no-repeat 0 6px;
    margin-right: 3px;
    padding-top: 8px;
    cursor: pointer;
    list-style: none;
}

#tab-demo-1 .ui-switchable-nav .ui-switchable-active {
    background-position: 0 -40px;
    cursor: default;
}

#tab-demo-1 .ui-switchable-content {
    position: relative;
    height: 150px;
    padding: 20px;
    border: 1px solid #AEC7E5;
}
````

````html
<div id="tab-demo-1" class="tab-demo">
    <ul class="ui-switchable-nav">
        <li>标题 A</li>
        <li>标题 B</li>
        <li>标题 C</li>
        <li>标题 D</li>
    </ul>
    <div class="ui-switchable-content">
        <div class="hidden">
            内容 A
            <pre>
              - 在当前 trigger 中 mouseover/mouseout, click, focus, 不触发
              - 鼠标快速滑过非当前 trigger, 不触发
              - mouseover 到非当前 trigger, 停留时间到达延迟时，触发
              - click 或 Tab 切换到 trigger, 立即触发
              - switch / switched 事件的触发
            </pre>
        </div>
        <div class="hidden">内容 B</div>
        <div class="hidden">内容 C</div>
        <div class="hidden">内容 D</div>
    </div>
</div>
````

````js
var Tabs = Hui.Switchable.Tabs;
new Tabs({
    element: '#tab-demo-1',
    triggers: '.ui-switchable-nav li',
    panels: '.ui-switchable-content div',
    activeIndex: 2,
    effect: 'fade'
});
````
