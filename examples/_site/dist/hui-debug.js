
// Position
// --------
// 定位工具组件，将一个 DOM 节点相对对另一个 DOM 节点进行定位操作。
// 代码易改，人生难得
var Hui = Hui || {};

(function($) {
	'use strict'

	var Position = Hui.Position = {},
	    VIEWPORT = { _id: 'VIEWPORT', nodeType: 1 },
	    isPinFixed = false,
	    ua = (window.navigator.userAgent || "").toLowerCase(),
	    isIE6 = ua.indexOf("msie 6") !== -1;


	// 将目标元素相对于基准元素进行定位
	// 这是 Position 的基础方法，接收两个参数，分别描述了目标元素和基准元素的定位点
	Position.pin = function(pinObject, baseObject) {

	    // 将两个参数转换成标准定位对象 { element: a, x: 0, y: 0 }
	    pinObject = normalize(pinObject);
	    baseObject = normalize(baseObject);

	    // if pinObject.element is not present
	    // https://github.com/aralejs/position/pull/11
	    if (pinObject.element === VIEWPORT ||
	        pinObject.element._id === 'VIEWPORT') {
	        return;
	    }

	    // 设定目标元素的 position 为绝对定位
	    // 若元素的初始 position 不为 absolute，会影响元素的 display、宽高等属性
	    var pinElement = $(pinObject.element);

	    if (pinElement.css('position') !== 'fixed' || isIE6) {
	        pinElement.css('position', 'absolute');
	        isPinFixed = false;
	    }
	    else {
	        // 定位 fixed 元素的标志位，下面有特殊处理
	        isPinFixed = true;
	    }

	    // 将位置属性归一化为数值
	    // 注：必须放在上面这句 `css('position', 'absolute')` 之后，
	    //    否则获取的宽高有可能不对
	    posConverter(pinObject);
	    posConverter(baseObject);

	    var parentOffset = getParentOffset(pinElement);
	    var baseOffset = baseObject.offset();

	    // 计算目标元素的位置
	    var top = baseOffset.top + baseObject.y -
	            pinObject.y - parentOffset.top;

	    var left = baseOffset.left + baseObject.x -
	            pinObject.x - parentOffset.left;

	    // 定位目标元素
	    pinElement.css({ left: left, top: top });
	};


	// 将目标元素相对于基准元素进行居中定位
	// 接受两个参数，分别为目标元素和定位的基准元素，都是 DOM 节点类型
	Position.center = function(pinElement, baseElement) {
	    Position.pin({
	        element: pinElement,
	        x: '50%',
	        y: '50%'
	    }, {
	        element: baseElement,
	        x: '50%',
	        y: '50%'
	    });
	};


	// 这是当前可视区域的伪 DOM 节点
	// 需要相对于当前可视区域定位时，可传入此对象作为 element 参数
	Position.VIEWPORT = VIEWPORT;


	// Helpers
	// -------

	// 将参数包装成标准的定位对象，形似 { element: a, x: 0, y: 0 }
	function normalize(posObject) {
	    posObject = toElement(posObject) || {};

	    if (posObject.nodeType) {
	        posObject = { element: posObject };
	    }

	    var element = toElement(posObject.element) || VIEWPORT;
	    if (element.nodeType !== 1) {
	        throw new Error('posObject.element is invalid.');
	    }

	    var result = {
	        element: element,
	        x: posObject.x || 0,
	        y: posObject.y || 0
	    };

	    // config 的深度克隆会替换掉 Position.VIEWPORT, 导致直接比较为 false
	    var isVIEWPORT = (element === VIEWPORT || element._id === 'VIEWPORT');

	    // 归一化 offset
	    result.offset = function() {
	        // 若定位 fixed 元素，则父元素的 offset 没有意义
	        if (isPinFixed) {
	            return {
	                left: 0,
	                top: 0
	            };
	        }
	        else if (isVIEWPORT) {
	            return {
	                left: $(document).scrollLeft(),
	                top: $(document).scrollTop()
	            };
	        }
	        else {
	            return getOffset($(element)[0]);
	        }
	    };

	    // 归一化 size, 含 padding 和 border
	    result.size = function() {
	        var el = isVIEWPORT ? $(window) : $(element);
	        return {
	            width: el.outerWidth(),
	            height: el.outerHeight()
	        };
	    };

	    return result;
	}

	// 对 x, y 两个参数为 left|center|right|%|px 时的处理，全部处理为纯数字
	function posConverter(pinObject) {
	    pinObject.x = xyConverter(pinObject.x, pinObject, 'width');
	    pinObject.y = xyConverter(pinObject.y, pinObject, 'height');
	}

	// 处理 x, y 值，都转化为数字
	function xyConverter(x, pinObject, type) {
	    // 先转成字符串再说！好处理
	    x = x + '';

	    // 处理 px
	    x = x.replace(/px/gi, '');

	    // 处理 alias
	    if (/\D/.test(x)) {
	        x = x.replace(/(?:top|left)/gi, '0%')
	             .replace(/center/gi, '50%')
	             .replace(/(?:bottom|right)/gi, '100%');
	    }

	    // 将百分比转为像素值
	    if (x.indexOf('%') !== -1) {
	        //支持小数
	        x = x.replace(/(\d+(?:\.\d+)?)%/gi, function(m, d) {
	            return pinObject.size()[type] * (d / 100.0);
	        });
	    }

	    // 处理类似 100%+20px 的情况
	    if (/[+\-*\/]/.test(x)) {
	        try {
	            // eval 会影响压缩
	            // new Function 方法效率高于 for 循环拆字符串的方法
	            // 参照：http://jsperf.com/eval-newfunction-for
	            x = (new Function('return ' + x))();
	        } catch (e) {
	            throw new Error('Invalid position value: ' + x);
	        }
	    }

	    // 转回为数字
	    return numberize(x);
	}

	// 获取 offsetParent 的位置
	function getParentOffset(element) {
	    var parent = element.offsetParent();

	    // IE7 下，body 子节点的 offsetParent 为 html 元素，其 offset 为
	    // { top: 2, left: 2 }，会导致定位差 2 像素，所以这里将 parent
	    // 转为 document.body
	    if (parent[0] === document.documentElement) {
	        parent = $(document.body);
	    }

	    // 修正 ie6 下 absolute 定位不准的 bug
	    if (isIE6) {
	        parent.css('zoom', 1);
	    }

	    // 获取 offsetParent 的 offset
	    var offset;

	    // 当 offsetParent 为 body，
	    // 而且 body 的 position 是 static 时
	    // 元素并不按照 body 来定位，而是按 document 定位
	    // http://jsfiddle.net/afc163/hN9Tc/2/
	    // 因此这里的偏移值直接设为 0 0
	    if (parent[0] === document.body &&
	        parent.css('position') === 'static') {
	            offset = { top:0, left: 0 };
	    } else {
	        offset = getOffset(parent[0]);
	    }

	    // 根据基准元素 offsetParent 的 border 宽度，来修正 offsetParent 的基准位置
	    offset.top += numberize(parent.css('border-top-width'));
	    offset.left += numberize(parent.css('border-left-width'));

	    return offset;
	}

	function numberize(s) {
	    return parseFloat(s, 10) || 0;
	}

	function toElement(element) {
	    return $(element)[0];
	}

	// fix jQuery 1.7.2 offset
	// document.body 的 position 是 absolute 或 relative 时
	// jQuery.offset 方法无法正确获取 body 的偏移值
	//   -> http://jsfiddle.net/afc163/gMAcp/
	// jQuery 1.9.1 已经修正了这个问题
	//   -> http://jsfiddle.net/afc163/gMAcp/1/
	// 这里先实现一份
	// 参照 kissy 和 jquery 1.9.1
	//   -> https://github.com/kissyteam/kissy/blob/master/src/dom/sub-modules/base/src/base/offset.js#L366
	//   -> https://github.com/jquery/jquery/blob/1.9.1/src/offset.js#L28
	function getOffset(element) {
	    var box = element.getBoundingClientRect(),
	        docElem = document.documentElement;

	    // < ie8 不支持 win.pageXOffset, 则使用 docElem.scrollLeft
	    return {
	        left: box.left + (window.pageXOffset || docElem.scrollLeft) -
	              (docElem.clientLeft || document.body.clientLeft  || 0),
	        top: box.top  + (window.pageYOffset || docElem.scrollTop) -
	             (docElem.clientTop || document.body.clientTop  || 0)
	    };
	}

})(jQuery)

var Hui = Hui || {};

(function($) {
    'use strict'

    var Position = Hui.Position;

    var isIE6 = (window.navigator.userAgent || '').toLowerCase().indexOf('msie 6') !== -1;

    // target 是需要添加垫片的目标元素，可以传 `DOM Element` 或 `Selector`
    function Shim(target) {
        // 如果选择器选了多个 DOM，则只取第一个
        this.target = $(target).eq(0);
    }

    // 根据目标元素计算 iframe 的显隐、宽高、定位
    Shim.prototype.sync = function() {
        var target = this.target;
        var iframe = this.iframe;

        // 如果未传 target 则不处理
        if (!target.length) return this;

        var height = target.outerHeight();
        var width = target.outerWidth();

        // 如果目标元素隐藏，则 iframe 也隐藏
        // jquery 判断宽高同时为 0 才算隐藏，这里判断宽高其中一个为 0 就隐藏
        // http://api.jquery.com/hidden-selector/
        if (!height || !width || target.is(':hidden')) {
            iframe && iframe.hide();
        } else {
            // 第一次显示时才创建：as lazy as possible
            iframe || (iframe = this.iframe = createIframe(target));

            iframe.css({
                'height': height,
                'width': width
            });

            Position.pin(iframe[0], target[0]);
            iframe.show();
        }

        return this;
    };

    // 销毁 iframe 等
    Shim.prototype.destroy = function() {
        if (this.iframe) {
            this.iframe.remove();
            delete this.iframe;
        }
        delete this.target;
    };

    if (isIE6) {
        Hui.Shim = Shim;
    } else {
        // 除了 IE6 都返回空函数
        function Noop() {}

        Noop.prototype.sync = function() {return this};
        Noop.prototype.destroy = Noop;

        Hui.Shim = Noop;
    }

    // Helpers

    // 在 target 之前创建 iframe，这样就没有 z-index 问题
    // iframe 永远在 target 下方
    function createIframe(target) {
        var css = {
            display: 'none',
            border: 'none',
            opacity: 0,
            position: 'absolute'
        };

        // 如果 target 存在 zIndex 则设置
        var zIndex = target.css('zIndex');
        if (zIndex && zIndex > 0) {
            css.zIndex = zIndex - 1;
        }

        return $('<iframe>', {
            src: 'javascript:\'\'', // 不加的话，https 下会弹警告
            frameborder: 0,
            css: css
        }).insertBefore(target);
    }

})(jQuery)
/**
 *     __  ___
 *    /  |/  /___   _____ _____ ___   ____   ____ _ ___   _____
 *   / /|_/ // _ \ / ___// ___// _ \ / __ \ / __ `// _ \ / ___/
 *  / /  / //  __/(__  )(__  )/  __// / / // /_/ //  __// /
 * /_/  /_/ \___//____//____/ \___//_/ /_/ \__, / \___//_/
 *                                        /____/
 *
 * @description MessengerJS, a common cross-document communicate solution.
 * @author biqing kwok
 * @version 2.0
 * @license release under MIT license
 */
var Hui = Hui || {};

Hui.Messenger = (function(){
    'use strict'

    // 消息前缀, 建议使用自己的项目名, 避免多项目之间的冲突
    var prefix = "arale-messenger",
        supportPostMessage = 'postMessage' in window;

    // Target 类, 消息对象
    function Target(target, name){
        var errMsg = '';
        if(arguments.length < 2){
            errMsg = 'target error - target and name are both required';
        } else if (typeof target != 'object'){
            errMsg = 'target error - target itself must be window object';
        } else if (typeof name != 'string'){
            errMsg = 'target error - target name must be string type';
        }
        if(errMsg){
            throw new Error(errMsg);
        }
        this.target = target;
        this.name = name;
    }

    // 往 target 发送消息, 出于安全考虑, 发送消息会带上前缀
    if ( supportPostMessage ){
        // IE8+ 以及现代浏览器支持
        Target.prototype.send = function(msg){
            this.target.postMessage(prefix + msg, '*');
        };
    } else {
        // 兼容IE 6/7
        Target.prototype.send = function(msg){
            var targetFunc = window.navigator[prefix + this.name];
            if ( typeof targetFunc == 'function' ) {
                targetFunc(prefix + msg, window);
            } else {
                throw new Error("target callback function is not defined");
            }
        };
    }

    // 信使类
    // 创建Messenger实例时指定, 必须指定Messenger的名字, (可选)指定项目名, 以避免Mashup类应用中的冲突
    // !注意: 父子页面中projectName必须保持一致, 否则无法匹配
    function Messenger(messengerName, projectName){
        this.targets = {};
        this.name = messengerName;
        this.listenFunc = [];
        prefix = projectName || prefix;
        this.initListen();
    }

    // 添加一个消息对象
    Messenger.prototype.addTarget = function(target, name){
        var targetObj = new Target(target, name);
        this.targets[name] = targetObj;
    };

    // 初始化消息监听
    Messenger.prototype.initListen = function(){
        var self = this;
        var generalCallback = function(msg){
            if(typeof msg == 'object' && msg.data){
                msg = msg.data;
            }
            // 剥离消息前缀
            msg = msg.slice(prefix.length);
            for(var i = 0; i < self.listenFunc.length; i++){
                self.listenFunc[i](msg);
            }
        };

        if ( supportPostMessage ){
            if ( 'addEventListener' in document ) {
                window.addEventListener('message', generalCallback, false);
            } else if ( 'attachEvent' in document ) {
                window.attachEvent('onmessage', generalCallback);
            }
        } else {
            // 兼容IE 6/7
            window.navigator[prefix + this.name] = generalCallback;
        }
    };

    // 监听消息
    Messenger.prototype.listen = function(callback){
        this.listenFunc.push(callback);
    };
    // 注销监听
    Messenger.prototype.clear = function(){
        this.listenFunc = [];
    };
    // 广播消息
    Messenger.prototype.send = function(msg){
        var targets = this.targets,
            target;
        for(target in targets){
            if(targets.hasOwnProperty(target)){
                targets[target].send(msg);
            }
        }
    };

    return Messenger;

})();


var Hui = Hui || {};

(function($, Handlebars) {
  'use strict'

  var compiledTemplates = {};

  // 提供 Template 模板支持，默认引擎是 Handlebars
  Hui.Templatable = {

    // Handlebars 的 helpers
    templateHelpers: null,

    // Handlebars 的 partials
    templatePartials: null,

    // template 对应的 DOM-like object
    templateObject: null,

    // 根据配置的模板和传入的数据，构建 this.element 和 templateElement
    parseElementFromTemplate: function () {
      // template 支持 id 选择器
      var t, template = this.get('template');
      if (/^#/.test(template) && (t = document.getElementById(template.substring(1)))) {
        template = t.innerHTML;
        this.set('template', template);
      }
      this.templateObject = convertTemplateToObject(template);
      this.element = $(this.compile());
    },

    // 编译模板，混入数据，返回 html 结果
    compile: function (template, model) {
      template || (template = this.get('template'));

      model || (model = this.get('model')) || (model = {});
      if (model.toJSON) {
        model = model.toJSON();
      }

      // handlebars runtime，注意 partials 也需要预编译
      if (isFunction(template)) {
        return template(model, {
          helpers: this.templateHelpers,
          partials: precompile(this.templatePartials)
        });
      } else {
        var helpers = this.templateHelpers;
        var partials = this.templatePartials;
        var helper, partial;

        // 注册 helpers
        if (helpers) {
          for (helper in helpers) {
            if (helpers.hasOwnProperty(helper)) {
              Handlebars.registerHelper(helper, helpers[helper]);
            }
          }
        }
        // 注册 partials
        if (partials) {
          for (partial in partials) {
            if (partials.hasOwnProperty(partial)) {
              Handlebars.registerPartial(partial, partials[partial]);
            }
          }
        }

        var compiledTemplate = compiledTemplates[template];
        if (!compiledTemplate) {
          compiledTemplate = compiledTemplates[template] = Handlebars.compile(template);
        }

        // 生成 html
        var html = compiledTemplate(model);

        // 卸载 helpers
        if (helpers) {
          for (helper in helpers) {
            if (helpers.hasOwnProperty(helper)) {
              delete Handlebars.helpers[helper];
            }
          }
        }
        // 卸载 partials
        if (partials) {
          for (partial in partials) {
            if (partials.hasOwnProperty(partial)) {
              delete Handlebars.partials[partial];
            }
          }
        }
        return html;
      }
    },

    // 刷新 selector 指定的局部区域
    renderPartial: function (selector) {
      if (this.templateObject) {
        var template = convertObjectToTemplate(this.templateObject, selector);

        if (template) {
          if (selector) {
            this.$(selector).html(this.compile(template));
          } else {
            this.element.html(this.compile(template));
          }
        } else {
          this.element.html(this.compile());
        }
      }

      // 如果 template 已经编译过了，templateObject 不存在
      else {
        var all = $(this.compile());
        var selected = all.find(selector);
        if (selected.length) {
          this.$(selector).html(selected.html());
        } else {
          this.element.html(all.html());
        }
      }

      return this;
    }
  };


  // Helpers
  // -------
  var _compile = Handlebars.compile;

  Handlebars.compile = function (template) {
    return isFunction(template) ? template : _compile.call(Handlebars, template);
  };

  // 将 template 字符串转换成对应的 DOM-like object


  function convertTemplateToObject(template) {
    return isFunction(template) ? null : $(encode(template));
  }

  // 根据 selector 得到 DOM-like template object，并转换为 template 字符串


  function convertObjectToTemplate(templateObject, selector) {
    if (!templateObject) return;

    var element;
    if (selector) {
      element = templateObject.find(selector);
      if (element.length === 0) {
        throw new Error('Invalid template selector: ' + selector);
      }
    } else {
      element = templateObject;
    }
    return decode(element.html());
  }

  function encode(template) {
    return template
    // 替换 {{xxx}} 为 <!-- {{xxx}} -->
    .replace(/({[^}]+}})/g, '<!--$1-->')
    // 替换 src="{{xxx}}" 为 data-TEMPLATABLE-src="{{xxx}}"
    .replace(/\s(src|href)\s*=\s*(['"])(.*?\{.+?)\2/g, ' data-templatable-$1=$2$3$2');
  }

  function decode(template) {
    return template.replace(/(?:<|&lt;)!--({{[^}]+}})--(?:>|&gt;)/g, '$1').replace(/data-templatable-/ig, '');
  }

  function isFunction(obj) {
    return typeof obj === "function";
  }

  function precompile(partials) {
    if (!partials) return {};

    var result = {};
    for (var name in partials) {
      var partial = partials[name];
      result[name] = isFunction(partial) ? partial : Handlebars.compile(partial);
    }
    return result;
  };


  // 调用 renderPartial 时，Templatable 对模板有一个约束：
  // ** template 自身必须是有效的 html 代码片段**，比如
  //   1. 代码闭合
  //   2. 嵌套符合规范
  //
  // 总之，要保证在 template 里，将 `{{...}}` 转换成注释后，直接 innerHTML 插入到
  // DOM 中，浏览器不会自动增加一些东西。比如：
  //
  // tbody 里没有 tr：
  //  `<table><tbody>{{#each items}}<td>{{this}}</td>{{/each}}</tbody></table>`
  //
  // 标签不闭合：
  //  `<div><span>{{name}}</div>`


})(jQuery, Handlebars)

/**
 * Overlay 继承了 Widget 的生命周期
 * 实现了 可定位（Positionable）和 可层叠（Stackable）
 */

var Hui = Hui || {};

(function($) {


	var Position = Hui.Position,
	    Shim = Hui.Shim,
	    Widget = Hui.Widget;


	// Overlay
	// -------
	// Overlay 组件的核心特点是可定位（Positionable）和可层叠（Stackable）
	// 是一切悬浮类 UI 组件的基类
	var Overlay = Widget.extend({

	  attrs: {
	    // 基本属性
	    width: null,
	    height: null,
	    zIndex: 99,
	    visible: false,

	    // 定位配置
	    align: {
	      // element 的定位点，默认为左上角
	      selfXY: [0, 0],
	      // 基准定位元素，默认为当前可视区域
	      baseElement: Position.VIEWPORT,
	      // 基准定位元素的定位点，默认为左上角
	      baseXY: [0, 0]
	    },

	    // 父元素
	    parentNode: document.body
	  },

	  show: function () {
	    // 若从未渲染，则调用 render
	    if (!this.rendered) {
	      this.render();
	    }
	    this.set('visible', true);
	    return this;
	  },

	  hide: function () {
	    this.set('visible', false);
	    return this;
	  },

	  setup: function () {
	    var that = this;
	    // 加载 iframe 遮罩层并与 overlay 保持同步
	    this._setupShim();
	    // 窗口resize时，重新定位浮层
	    this._setupResize();

	    this.after('render', function () {
	      var _pos = this.element.css('position');
	      if (_pos === 'static' || _pos === 'relative') {
	        this.element.css({
	          position: 'absolute',
	          left: '-9999px',
	          top: '-9999px'
	        });
	      }
	    });
	    // 统一在显示之后重新设定位置
	    this.after('show', function () {
	      that._setPosition();
	    });
	  },

	  destroy: function () {
	    // 销毁两个静态数组中的实例
	    erase(this, Overlay.allOverlays);
	    erase(this, Overlay.blurOverlays);
	    return Overlay.superclass.destroy.call(this);
	  },

	  // 进行定位
	  _setPosition: function (align) {
	    // 不在文档流中，定位无效
	    if (!isInDocument(this.element[0])) return;

	    align || (align = this.get('align'));

	    // 如果align为空，表示不需要使用js对齐
	    if (!align) return;

	    var isHidden = this.element.css('display') === 'none';

	    // 在定位时，为避免元素高度不定，先显示出来
	    if (isHidden) {
	      this.element.css({
	        visibility: 'hidden',
	        display: 'block'
	      });
	    }

	    Position.pin({
	      element: this.element,
	      x: align.selfXY[0],
	      y: align.selfXY[1]
	    }, {
	      element: align.baseElement,
	      x: align.baseXY[0],
	      y: align.baseXY[1]
	    });

	    // 定位完成后，还原
	    if (isHidden) {
	      this.element.css({
	        visibility: '',
	        display: 'none'
	      });
	    }

	    return this;
	  },

	  // 加载 iframe 遮罩层并与 overlay 保持同步
	  _setupShim: function () {
	    var shim = new Shim(this.element);

	    // 在隐藏和设置位置后，要重新定位
	    // 显示后会设置位置，所以不用绑定 shim.sync
	    this.after('hide _setPosition', shim.sync, shim);

	    // 除了 parentNode 之外的其他属性发生变化时，都触发 shim 同步
	    var attrs = ['width', 'height'];
	    for (var attr in attrs) {
	      if (attrs.hasOwnProperty(attr)) {
	        this.on('change:' + attr, shim.sync, shim);
	      }
	    }

	    // 在销魂自身前要销毁 shim
	    this.before('destroy', shim.destroy, shim);
	  },

	  // resize窗口时重新定位浮层，用这个方法收集所有浮层实例
	  _setupResize: function () {
	    Overlay.allOverlays.push(this);
	  },

	  // 除了 element 和 relativeElements，点击 body 后都会隐藏 element
	  _blurHide: function (arr) {
	    arr = $.makeArray(arr);
	    arr.push(this.element);
	    this._relativeElements = arr;
	    Overlay.blurOverlays.push(this);
	  },

	  // 用于 set 属性后的界面更新
	  _onRenderWidth: function (val) {
	    this.element.css('width', val);
	  },

	  _onRenderHeight: function (val) {
	    this.element.css('height', val);
	  },

	  _onRenderZIndex: function (val) {
	    this.element.css('zIndex', val);
	  },

	  _onRenderAlign: function (val) {
	    this._setPosition(val);
	  },

	  _onRenderVisible: function (val) {
	    this.element[val ? 'show' : 'hide']();
	  }

	});

	// 绑定 blur 隐藏事件
	Overlay.blurOverlays = [];
	$(document).on('click', function (e) {
	  hideBlurOverlays(e);
	});

	// 绑定 resize 重新定位事件
	var timeout;
	var winWidth = $(window).width();
	var winHeight = $(window).height();
	Overlay.allOverlays = [];

	$(window).resize(function () {
	  timeout && clearTimeout(timeout);
	  timeout = setTimeout(function () {
	    var winNewWidth = $(window).width();
	    var winNewHeight = $(window).height();

	    // IE678 莫名其妙触发 resize
	    // http://stackoverflow.com/questions/1852751/window-resize-event-firing-in-internet-explorer
	    if (winWidth !== winNewWidth || winHeight !== winNewHeight) {
	      $(Overlay.allOverlays).each(function (i, item) {
	        // 当实例为空或隐藏时，不处理
	        if (!item || !item.get('visible')) {
	          return;
	        }
	        item._setPosition();
	      });
	    }

	    winWidth = winNewWidth;
	    winHeight = winNewHeight;
	  }, 80);
	});

	Hui.Overlay = Overlay;


	// Helpers
	// -------

	function isInDocument(element) {
	  return $.contains(document.documentElement, element);
	}

	function hideBlurOverlays(e) {
	  $(Overlay.blurOverlays).each(function (index, item) {
	    // 当实例为空或隐藏时，不处理
	    if (!item || !item.get('visible')) {
	      return;
	    }

	    // 遍历 _relativeElements ，当点击的元素落在这些元素上时，不处理
	    for (var i = 0; i < item._relativeElements.length; i++) {
	      var el = $(item._relativeElements[i])[0];
	      if (el === e.target || $.contains(el, e.target)) {
	        return;
	      }
	    }

	    // 到这里，判断触发了元素的 blur 事件，隐藏元素
	    item.hide();
	  });
	}

	// 从数组中删除对应元素
	function erase(target, array) {
	  for (var i = 0; i < array.length; i++) {
	    if (target === array[i]) {
	      array.splice(i, 1);
	      return array;
	    }
	  }
	}

})(jQuery)


/**
 * Mask 是 Overlay 的一个具体实现，提供一个单例的全屏遮罩组件
 */

var Hui = Hui || {};

(function($) {
  'use strict'

  var Overlay = Hui.Overlay,
      
      ua = (window.navigator.userAgent || "").toLowerCase(),
      isIE6 = ua.indexOf("msie 6") !== -1,
      
      body = $(document.body),
      doc = $(document);

  // Mask
  // ----------
  // 全屏遮罩层组件
  var Mask = Overlay.extend({

    attrs: {
      width: isIE6 ? doc.outerWidth(true) : '100%',
      height: isIE6 ? doc.outerHeight(true) : '100%',

      className: 'ui-mask',
      opacity: 0.2,
      backgroundColor: '#000',
      style: {
        position: isIE6 ? 'absolute' : 'fixed',
        top: 0,
        left: 0
      },

      align: {
        // undefined 表示相对于当前可视范围定位
        baseElement: isIE6 ? body : undefined
      }
    },

    show: function () {
      if (isIE6) {
        this.set('width', doc.outerWidth(true));
        this.set('height', doc.outerHeight(true));
      }
      return Mask.superclass.show.call(this);
    },

    _onRenderBackgroundColor: function (val) {
      this.element.css('backgroundColor', val);
    },

    _onRenderOpacity: function (val) {
      this.element.css('opacity', val);
    }
  });

  // 单例
  Hui.Overlay.Mask = new Mask();

})(jQuery)

/**
 * Popup 继承了 Overlay 可定位，可层叠
 * 实现了 可触发  声明式的视图逻辑
 */

var Hui = Hui || {};

(function($) {
  'use strict'


  var Overlay = Hui.Overlay;

  // Popup 是可触发 Overlay 型 UI 组件
  var Popup = Overlay.extend({

    attrs: {
      // 触发元素
      trigger: {
        value: null,
        // required
        getter: function (val) {
          return $(val);
        }
      },

      // 触发类型
      triggerType: 'hover',
      // or click or focus
      // 触发事件委托的对象
      delegateNode: {
        value: null,
        getter: function (val) {
          return $(val);
        }
      },

      // 默认的定位参数
      align: {
        value: {
          baseXY: [0, '100%'],
          selfXY: [0, 0]
        },
        setter: function (val) {
          if (!val) {
            return;
          }
          if (val.baseElement) {
            this._specifiedBaseElement = true;
          } else if (this.activeTrigger) {
            // 若给的定位元素未指定基准元素
            // 就给一个...
            val.baseElement = this.activeTrigger;
          }
          return val;
        },
        getter: function (val) {
          // 若未指定基准元素，则按照当前的触发元素进行定位
          return $.extend({}, val, this._specifiedBaseElement ? {} : {
            baseElement: this.activeTrigger
          });
        }
      },

      // 延迟触发和隐藏时间
      delay: 70,

      // 是否能够触发
      // 可以通过set('disabled', true)关闭
      disabled: false,

      // 基本的动画效果，可选 fade|slide
      effect: '',

      // 动画的持续时间
      duration: 250

    },

    setup: function () {
      Popup.superclass.setup.call(this);
      this._bindTrigger();
      this._blurHide(this.get('trigger'));

      // 默认绑定activeTrigger为第一个元素
      // for https://github.com/aralejs/popup/issues/6
      this.activeTrigger = this.get('trigger').eq(0);

      // 当使用委托事件时，_blurHide 方法对于新添加的节点会失效
      // 这时需要重新绑定
      var that = this;
      if (this.get('delegateNode')) {
        this.before('show', function () {
          that._relativeElements = that.get('trigger');
          that._relativeElements.push(that.element);
        });
      }
    },

    render: function () {
      Popup.superclass.render.call(this);

      // 通过 template 生成的元素默认也应该是不可见的
      // 所以插入元素前强制隐藏元素，#20
      this.element.hide();
      return this;
    },

    show: function () {
      if (this.get('disabled')) {
        return;
      }
      return Popup.superclass.show.call(this);
    },

    // triggerShimSync 为 true 时
    // 表示什么都不做，只是触发 hide 的 before/after 绑定方法
    hide: function (triggerShimSync) {
      if (!triggerShimSync) {
        return Popup.superclass.hide.call(this);
      }
      return this;
    },

    _bindTrigger: function () {
      var triggerType = this.get('triggerType');

      if (triggerType === 'click') {
        this._bindClick();
      } else if (triggerType === 'focus') {
        this._bindFocus();
      } else {
        // 默认是 hover
        this._bindHover();
      }
    },

    _bindClick: function () {
      var that = this;

      bindEvent('click', this.get('trigger'), function (e) {
        // this._active 这个变量表明了当前触发元素是激活状态
        if (this._active === true) {
          that.hide();
        } else {
          // 将当前trigger标为激活状态
          makeActive(this);
          that.show();
        }
      }, this.get('delegateNode'), this);

      // 隐藏前清空激活状态
      this.before('hide', function () {
        makeActive();
      });

      // 处理所有trigger的激活状态
      // 若 trigger 为空，相当于清除所有元素的激活状态


      function makeActive(trigger) {
        if (that.get('disabled')) {
          return;
        }
        that.get('trigger').each(function (i, item) {
          if (trigger == item) {
            item._active = true;
            // 标识当前点击的元素
            that.activeTrigger = $(item);
          } else {
            item._active = false;
          }
        });
      }
    },

    _bindFocus: function () {
      var that = this;

      bindEvent('focus', this.get('trigger'), function () {
        // 标识当前点击的元素
        that.activeTrigger = $(this);
        that.show();
      }, this.get('delegateNode'), this);

      bindEvent('blur', this.get('trigger'), function () {
        setTimeout(function () {
          (!that._downOnElement) && that.hide();
          that._downOnElement = false;
        }, that.get('delay'));
      }, this.get('delegateNode'), this);

      // 为了当input blur时能够选择和操作弹出层上的内容
      this.delegateEvents("mousedown", function (e) {
        this._downOnElement = true;
      });
    },

    _bindHover: function () {
      var trigger = this.get('trigger');
      var delegateNode = this.get('delegateNode');
      var delay = this.get('delay');

      var showTimer, hideTimer;
      var that = this;

      // 当 delay 为负数时
      // popup 变成 tooltip 的效果
      if (delay < 0) {
        this._bindTooltip();
        return;
      }

      bindEvent('mouseenter', trigger, function () {
        clearTimeout(hideTimer);
        hideTimer = null;

        // 标识当前点击的元素
        that.activeTrigger = $(this);
        showTimer = setTimeout(function () {
          that.show();
        }, delay);
      }, delegateNode, this);

      bindEvent('mouseleave', trigger, leaveHandler, delegateNode, this);

      // 鼠标在悬浮层上时不消失
      this.delegateEvents("mouseenter", function () {
        clearTimeout(hideTimer);
      });
      this.delegateEvents("mouseleave", leaveHandler);

      this.element.on('mouseleave', 'select', function (e) {
        e.stopPropagation();
      });

      function leaveHandler(e) {
        clearTimeout(showTimer);
        showTimer = null;

        if (that.get('visible')) {
          hideTimer = setTimeout(function () {
            that.hide();
          }, delay);
        }
      }
    },

    _bindTooltip: function () {
      var trigger = this.get('trigger');
      var delegateNode = this.get('delegateNode');
      var that = this;

      bindEvent('mouseenter', trigger, function () {
        // 标识当前点击的元素
        that.activeTrigger = $(this);
        that.show();
      }, delegateNode, this);

      bindEvent('mouseleave', trigger, function () {
        that.hide();
      }, delegateNode, this);
    },

    _onRenderVisible: function (val, originVal) {
      // originVal 为 undefined 时不继续执行
      if (val === !! originVal) {
        return;
      }

      var fade = (this.get('effect').indexOf('fade') !== -1);
      var slide = (this.get('effect').indexOf('slide') !== -1);
      var animConfig = {};
      slide && (animConfig.height = (val ? 'show' : 'hide'));
      fade && (animConfig.opacity = (val ? 'show' : 'hide'));

      // 需要在回调时强制调一下 hide
      // 来触发 iframe-shim 的 sync 方法
      // 修复 ie6 下 shim 未隐藏的问题
      // visible 只有从 true 变为 false 时，才调用这个 hide
      var that = this;
      var hideComplete = val ?
      function () {
        that.trigger('animated');
      } : function () {
        // 参数 true 代表只是为了触发 shim 方法
        that.hide(true);
        that.trigger('animated');
      };

      if (fade || slide) {
        this.element.stop(true, true).animate(animConfig, this.get('duration'), hideComplete).css({
          'visibility': 'visible'
        });
      } else {
        this.element[val ? 'show' : 'hide']();
      }
    }

  });

  Hui.Popup = Popup;

  // 一个绑定事件的简单封装


  function bindEvent(type, element, fn, delegateNode, context) {
    var hasDelegateNode = delegateNode && delegateNode[0];

    context.delegateEvents(
    hasDelegateNode ? delegateNode : element, hasDelegateNode ? type + " " + element.selector : type, function (e) {
      fn.call(e.currentTarget, e);
    });
  }

})(jQuery)

/**
 * Dialog 实现了 Overlay 的 可定位，可层叠。
 * 扩展了 Templatable 可以让默认模板引擎 handlebars 来处理复杂模板。
 * 实现了 显隐关闭、遮罩层、内嵌iframe、内容区域自定义 等功能，
 * 而 ConfirmBox 就实现了它的自定义内容区域
 */

var Hui = Hui || {};

(function($) {
  'use strict'

  var Overlay = Hui.Overlay,
      mask = Hui.Overlay.Mask,
      Events = Hui.Events,
      Templatable = Hui.Templatable,
      Messenger = Hui.Messenger;

  // Dialog
  // ---
  // Dialog 是通用对话框组件，提供显隐关闭、遮罩层、内嵌iframe、内容区域自定义功能。
  // 是所有对话框类型组件的基类。
  var Dialog = Overlay.extend({

    Implements: Templatable,

    attrs: {
      // 模板
      template: '<div class="{{classPrefix}}">\
                  <a class="{{classPrefix}}-close" title="Close" href="javascript:;" data-role="close"></a>\
                  <div class="{{classPrefix}}-content" data-role="content"></div>\
                </div>',

      // 对话框触发点
      trigger: {
        value: null,
        getter: function (val) {
          return $(val);
        }
      },

      // 统一样式前缀
      classPrefix: 'ui-dialog',

      // 指定内容元素，可以是 url 地址
      content: {
        value: null,
        setter: function (val) {
          // 判断是否是 url 地址
          if (/^(https?:\/\/|\/|\.\/|\.\.\/)/.test(val)) {
            this._type = 'iframe';
            // 用 ajax 的方式而不是 iframe 进行载入
            if (val.indexOf('?ajax') > 0 || val.indexOf('&ajax') > 0) {
              this._ajax = true;
            }
          }
          return val;
        }
      },

      // 是否有背景遮罩层
      hasMask: true,

      // 关闭按钮可以自定义
      closeTpl: '×',

      // 默认宽度
      width: 500,

      // 默认高度
      height: null,

      // iframe 类型时，dialog 的最初高度
      initialHeight: 300,

      // 简单的动画效果 none | fade
      effect: 'none',

      // 不用解释了吧
      zIndex: 999,

      // 是否自适应高度
      autoFit: true,

      // 默认定位左右居中，略微靠上
      align: {
        value: {
          selfXY: ['50%', '50%'],
          baseXY: ['50%', '42%']
        },
        getter: function (val) {
          // 高度超过窗口的 42/50 浮层头部顶住窗口
          // https://github.com/aralejs/dialog/issues/41
          if (this.element.height() > $(window).height() * 0.84) {
            return {
              selfXY: ['50%', '0'],
              baseXY: ['50%', '0']
            };
          }
          return val;
        }
      }
    },


    parseElement: function () {
      this.set("model", {
        classPrefix: this.get('classPrefix')
      });
      Dialog.superclass.parseElement.call(this);
      this.contentElement = this.$('[data-role=content]');

      // 必要的样式
      this.contentElement.css({
        height: '100%',
        zoom: 1
      });
      // 关闭按钮先隐藏
      // 后面当 onRenderCloseTpl 时，如果 closeTpl 不为空，会显示出来
      // 这样写是为了回避 arale.base 的一个问题：
      // 当属性初始值为''时，不会进入 onRender 方法
      // https://github.com/aralejs/base/issues/7
      this.$('>[data-role=close]').hide();
    },

    events: {
      'click [data-role=close]': function (e) {
        e.preventDefault();
        this.hide();
      }
    },

    show: function () {
      // iframe 要在载入完成才显示
      if (this._type === 'iframe') {
        // ajax 读入内容并 append 到容器中
        if (this._ajax) {
          this._ajaxHtml();
        } else {
          // iframe 还未请求完，先设置一个固定高度
          !this.get('height') && this.contentElement.css('height', this.get('initialHeight'));
          this._showIframe();
        }
      }

      Dialog.superclass.show.call(this);
      return this;
    },

    hide: function () {
      // 把 iframe 状态复原
      if (this._type === 'iframe' && this.iframe) {
        // 如果是跨域iframe，会抛出异常，所以需要加一层判断
        if (!this._isCrossDomainIframe) {
          this.iframe.attr({
            src: 'javascript:\'\';'
          });
        }
        // 原来只是将 iframe 的状态复原
        // 但是发现在 IE6 下，将 src 置为 javascript:''; 会出现 404 页面
        this.iframe.remove();
        this.iframe = null;
      }

      Dialog.superclass.hide.call(this);
      clearInterval(this._interval);
      delete this._interval;
      return this;
    },

    destroy: function () {
      this.element.remove();
      this._hideMask();
      clearInterval(this._interval);
      return Dialog.superclass.destroy.call(this);
    },

    setup: function () {
      Dialog.superclass.setup.call(this);

      this._setupTrigger();
      this._setupMask();
      this._setupKeyEvents();
      this._setupFocus();
      toTabed(this.element);
      toTabed(this.get('trigger'));

      // 默认当前触发器
      this.activeTrigger = this.get('trigger').eq(0);
    },

    // onRender
    // ---
    _onRenderContent: function (val) {
      if (this._type !== 'iframe') {
        var value;
        // 有些情况会报错
        try {
          value = $(val);
        } catch (e) {
          value = [];
        }
        if (value[0]) {
          this.contentElement.empty().append(value);
        } else {
          this.contentElement.empty().html(val);
        }
        // #38 #44
        this._setPosition();
      }
    },

    _onRenderCloseTpl: function (val) {
      if (val === '') {
        this.$('>[data-role=close]').html(val).hide();
      } else {
        this.$('>[data-role=close]').html(val).show();
      }
    },

    // 覆盖 overlay，提供动画
    _onRenderVisible: function (val) {
      if (val) {
        if (this.get('effect') === 'fade') {
          // 固定 300 的动画时长，暂不可定制
          this.element.fadeIn(300);
        } else {
          this.element.show();
        }
      } else {
        this.element.hide();
      }
    },

    // 私有方法
    // ---
    // 绑定触发对话框出现的事件
    _setupTrigger: function () {
      this.delegateEvents(this.get('trigger'), 'click', function (e) {
        e.preventDefault();
        // 标识当前点击的元素
        this.activeTrigger = $(e.currentTarget);
        this.show();
      });
    },

    // 绑定遮罩层事件
    _setupMask: function () {
      var that = this;

      // 存放 mask 对应的对话框
      mask._dialogs = mask._dialogs || [];

      this.after('show', function () {
        if (!this.get('hasMask')) {
          return;
        }
        // not using the z-index
        // because multiable dialogs may share same mask
        mask.set('zIndex', that.get('zIndex')).show();
        mask.element.insertBefore(that.element);

        // 避免重复存放
        var existed;
        for (var i=0; i<mask._dialogs.length; i++) {
          if (mask._dialogs[i] === that) {
            existed = mask._dialogs[i];
          }
        }
        if (existed) {
          // 把已存在的对话框提到最后一个
          erase(existed, mask._dialogs);
          mask._dialogs.push(existed);
        } else {
          // 存放新的对话框
          mask._dialogs.push(that);
        }
      });

      this.after('hide', this._hideMask);
    },

    // 隐藏 mask
    _hideMask: function () {
      if (!this.get('hasMask')) {
        return;
      }

      // 移除 mask._dialogs 当前实例对应的 dialog
      var dialogLength = mask._dialogs ? mask._dialogs.length : 0;
      for (var i=0; i<dialogLength; i++) {
        if (mask._dialogs[i] === this) {
          erase(this, mask._dialogs);

          // 如果 _dialogs 为空了，表示没有打开的 dialog 了
          // 则隐藏 mask
          if (mask._dialogs.length === 0) {
            mask.hide();
          }
          // 如果移除的是最后一个打开的 dialog
          // 则相应向下移动 mask
          else if (i === dialogLength - 1) {
            var last = mask._dialogs[mask._dialogs.length - 1];
            mask.set('zIndex', last.get('zIndex'));
            mask.element.insertBefore(last.element);
          }
        }
      }
    },

    // 绑定元素聚焦状态
    _setupFocus: function () {
      this.after('show', function () {
        this.element.focus();
      });
      this.after('hide', function () {
        // 关于网页中浮层消失后的焦点处理
        // http://www.qt06.com/post/280/
        this.activeTrigger && this.activeTrigger.focus();
      });
    },

    // 绑定键盘事件，ESC关闭窗口
    _setupKeyEvents: function () {
      this.delegateEvents($(document), 'keyup.esc', function (e) {
        if (e.keyCode === 27) {
          this.get('visible') && this.hide();
        }
      });
    },

    _showIframe: function () {
      var that = this;
      // 若未创建则新建一个
      if (!this.iframe) {
        this._createIframe();
      }

      // 开始请求 iframe
      this.iframe.attr({
        src: this._fixUrl(),
        name: 'dialog-iframe' + new Date().getTime()
      });

      // 因为在 IE 下 onload 无法触发
      // http://my.oschina.net/liangrockman/blog/24015
      // 所以使用 jquery 的 one 函数来代替 onload
      // one 比 on 好，因为它只执行一次，并在执行后自动销毁
      this.iframe.one('load', function () {
        // 如果 dialog 已经隐藏了，就不需要触发 onload
        if (!that.get('visible')) {
          return;
        }

        // 是否跨域的判断需要放入iframe load之后
        that._isCrossDomainIframe = isCrossDomainIframe(that.iframe);

        if (!that._isCrossDomainIframe) {
          // 绑定自动处理高度的事件
          if (that.get('autoFit')) {
            clearInterval(that._interval);
            that._interval = setInterval(function () {
              that._syncHeight();
            }, 300);
          }
          that._syncHeight();
        }

        that._setPosition();
        that.trigger('complete:show');
      });
    },

    _fixUrl: function () {
      var s = this.get('content').match(/([^?#]*)(\?[^#]*)?(#.*)?/);
      s.shift();
      s[1] = ((s[1] && s[1] !== '?') ? (s[1] + '&') : '?') + 't=' + new Date().getTime();
      return s.join('');
    },

    _createIframe: function () {
      var that = this;

      this.iframe = $('<iframe>', {
        src: 'javascript:\'\';',
        scrolling: 'no',
        frameborder: 'no',
        allowTransparency: 'true',
        css: {
          border: 'none',
          width: '100%',
          display: 'block',
          height: '100%',
          overflow: 'hidden'
        }
      }).appendTo(this.contentElement);

      // 给 iframe 绑一个 close 事件
      // iframe 内部可通过 window.frameElement.trigger('close') 关闭
      Events.mixTo(this.iframe[0]);
      this.iframe[0].on('close', function () {
        that.hide();
      });

      // 跨域则使用arale-messenger进行通信
      var m = new Messenger('parent', 'arale-dialog');
      this.iframe.one('load', function () {
        m.addTarget(that.iframe[0].contentWindow, 'iframe1');
        m.listen(function (data) {
          data = JSON.parse(data);
          switch (data.event) {
            case 'close':
              that.hide();
              break;
            case 'syncHeight':
              that._setHeight(data.height.toString().slice(-2) === 'px' ? data.height : data.height + 'px');
              break;
            default:
              break;
          }
        });
      });
    },

    _setHeight: function (h) {
      this.contentElement.css('height', h);
      // force to reflow in ie6
      // http://44ux.com/blog/2011/08/24/ie67-reflow-bug/
      this.element[0].className = this.element[0].className;
    },

    _syncHeight: function () {
      var h;
      // 如果未传 height，才会自动获取
      if (!this.get('height')) {
        try {
          this._errCount = 0;
          h = getIframeHeight(this.iframe) + 'px';
        } catch (err) {
          // 页面跳转也会抛错，最多失败6次
          this._errCount = (this._errCount || 0) + 1;
          if (this._errCount >= 6) {
            // 获取失败则给默认高度 300px
            // 跨域会抛错进入这个流程
            h = this.get('initialHeight');
            clearInterval(this._interval);
            delete this._interval;
          }
        }
        this._setHeight(h);

      } else {
        clearInterval(this._interval);
        delete this._interval;
      }
    },

    _ajaxHtml: function () {
      var that = this;
      this.contentElement.css('height', this.get('initialHeight'));
      this.contentElement.load(this.get('content'), function () {
        that._setPosition();
        that.contentElement.css('height', '');
        that.trigger('complete:show');
      });
    }

  });

  Hui.Dialog = Dialog;

  // Helpers
  // ----
  // 让目标节点可以被 Tab
  function toTabed(element) {
    if (element.attr('tabindex') == null) {
      element.attr('tabindex', '-1');
    }
  }

  // 获取 iframe 内部的高度
  function getIframeHeight(iframe) {
    var D = iframe[0].contentWindow.document;
    if (D.body.scrollHeight && D.documentElement.scrollHeight) {
      return Math.min(D.body.scrollHeight, D.documentElement.scrollHeight);
    } else if (D.documentElement.scrollHeight) {
      return D.documentElement.scrollHeight;
    } else if (D.body.scrollHeight) {
      return D.body.scrollHeight;
    }
  }


  // iframe 是否和当前页面跨域
  function isCrossDomainIframe(iframe) {
    var isCrossDomain = false;
    try {
      iframe[0].contentWindow.document;
    } catch (e) {
      isCrossDomain = true;
    }
    return isCrossDomain;
  }

  // erase item from array
  function erase(item, array) {
    var index = -1;
    for (var i=0; i<array.length; i++) {
      if (array[i] === item) {
        index = i;
        break;
      }
    }
    if (index !== -1) {
      array.splice(index, 1);
    }
  }

})(jQuery)

/**
 * ConfirmBox 是 Dialog 抽象类 的一个具体实现，具体实现了 content 内容部分
 * 定义了静态方法方便调用，使用完后移除 dom 元素
 * trigger 参数使用声明式的视图逻辑
 * show 方法又使用了命令式的视图逻辑
 */

var Hui = Hui || {};

(function($) {
  'use strict'

  var Dialog = Hui.Dialog;

  var template = '{{#if title}}\
                  <div class="{{classPrefix}}-title" data-role="title">{{{title}}}</div>\
                  {{/if}}\
                  <div class="{{classPrefix}}-container">\
                      <div class="{{classPrefix}}-message" data-role="message">{{{message}}}</div>\
                      {{#if hasFoot}}\
                      <div class="{{classPrefix}}-operation" data-role="foot">\
                          {{#if confirmTpl}}\
                          <div class="{{classPrefix}}-confirm" data-role="confirm">\
                              {{{confirmTpl}}}\
                          </div>\
                          {{/if}}\
                          {{#if cancelTpl}}\
                          <div class="{{classPrefix}}-cancel" data-role="cancel">\
                              {{{cancelTpl}}}\
                          </div>\
                          {{/if}}\
                      </div>\
                      {{/if}}\
                  </div>';

  // ConfirmBox
  // -------
  // ConfirmBox 是一个有基础模板和样式的对话框组件。
  var ConfirmBox = Dialog.extend({

    attrs: {
      title: '默认标题',

      confirmTpl: '<a class="ui-dialog-button-orange" href="javascript:;">确定</a>',

      cancelTpl: '<a class="ui-dialog-button-white" href="javascript:;">取消</a>',

      message: '默认内容'
    },

    setup: function () {
      ConfirmBox.superclass.setup.call(this);

      var model = {
        classPrefix: this.get('classPrefix'),
        message: this.get('message'),
        title: this.get('title'),
        confirmTpl: this.get('confirmTpl'),
        cancelTpl: this.get('cancelTpl'),
        hasFoot: this.get('confirmTpl') || this.get('cancelTpl')
      };
      this.set('content', this.compile(template, model));
    },

    events: {
      'click [data-role=confirm]': function (e) {
        e.preventDefault();
        this.trigger('confirm');
      },
      'click [data-role=cancel]': function (e) {
        e.preventDefault();
        this.trigger('cancel');
        this.hide();
      }
    },

    _onChangeMessage: function (val) {
      this.$('[data-role=message]').html(val);
    },

    _onChangeTitle: function (val) {
      this.$('[data-role=title]').html(val);
    },

    _onChangeConfirmTpl: function (val) {
      this.$('[data-role=confirm]').html(val);
    },

    _onChangeCancelTpl: function (val) {
      this.$('[data-role=cancel]').html(val);
    }

  });

  ConfirmBox.alert = function (message, callback, options) {
    var defaults = {
      message: message,
      title: '',
      cancelTpl: '',
      closeTpl: '',
      onConfirm: function () {
        callback && callback();
        this.hide();
      }
    };
    new ConfirmBox($.extend(null, defaults, options)).show().after('hide', function () {
      this.destroy();
    });
  };

  ConfirmBox.confirm = function (message, title, onConfirm, onCancel, options) {
    // support confirm(message, title, onConfirm, options)
    if (typeof onCancel === 'object' && !options) {
      options = onCancel;
      onCancel = null;
    }

    var defaults = {
      message: message,
      title: title || '确认框',
      closeTpl: '',
      onConfirm: function () {
        onConfirm && onConfirm();
        this.hide();
      },
      onCancel: function () {
        onCancel && onCancel();
        this.hide();
      }
    };
    new ConfirmBox($.extend(null, defaults, options)).show().after('hide', function () {
      this.destroy();
    });
  };

  ConfirmBox.show = function (message, callback, options) {
    var defaults = {
      message: message,
      title: '',
      confirmTpl: false,
      cancelTpl: false
    };
    new ConfirmBox($.extend(null, defaults, options)).show().before('hide', function () {
      callback && callback();
    }).after('hide', function () {
      this.destroy();
    });
  };

  Hui.Dialog.ConfirmBox = ConfirmBox;

})(jQuery)
 
// Based on Easing Equations (c) 2003 Robert Penner, all rights reserved.
// This work is subject to the terms in
// http://www.robertpenner.com/easing_terms_of_use.html
// Preview: http://www.robertpenner.com/Easing/easing_demo.html
//
// Thanks to:
//  - https://github.com/yui/yui3/blob/master/src/anim/js/anim-easing.js
//  - https://github.com/gilmoreorless/jquery-easing-molecules

!(function($) {
    'use strict'

    var PI = Math.PI;
    var pow = Math.pow;
    var sin = Math.sin;
    var MAGIC_NUM = 1.70158; // Penner's magic number


    /**
     * 和 YUI 的 Easing 相比，这里的 Easing 进行了归一化处理，参数调整为：
     * @param {Number} t Time value used to compute current value 0 =< t <= 1
     * @param {Number} b Starting value  b = 0
     * @param {Number} c Delta between start and end values  c = 1
     * @param {Number} d Total length of animation d = 1
     */
    var Easing = {

        /**
         * Uniform speed between points.
         */
        easeNone: function(t) {
            return t;
        },

        /**
         * Begins slowly and accelerates towards end. (quadratic)
         */
        easeIn: function(t) {
            return t * t;
        },

        /**
         * Begins quickly and decelerates towards end.  (quadratic)
         */
        easeOut: function(t) {
            return (2 - t) * t;
        },

        /**
         * Begins slowly and decelerates towards end. (quadratic)
         */
        easeBoth: function(t) {
            return (t *= 2) < 1 ?
                    .5 * t * t :
                    .5 * (1 - (--t) * (t - 2));
        },

        /**
         * Begins slowly and accelerates towards end. (quartic)
         */
        easeInStrong: function(t) {
            return t * t * t * t;
        },
        /**
         * Begins quickly and decelerates towards end.  (quartic)
         */
        easeOutStrong: function(t) {
            return 1 - (--t) * t * t * t;
        },

        /**
         * Begins slowly and decelerates towards end. (quartic)
         */
        easeBothStrong: function(t) {
            return (t *= 2) < 1 ?
                    .5 * t * t * t * t :
                    .5 * (2 - (t -= 2) * t * t * t);
        },

        /**
         * Backtracks slightly, then reverses direction and moves to end.
         */
        backIn: function(t) {
            if (t === 1) t -= .001;
            return t * t * ((MAGIC_NUM + 1) * t - MAGIC_NUM);
        },

        /**
         * Overshoots end, then reverses and comes back to end.
         */
        backOut: function(t) {
            return (t -= 1) * t * ((MAGIC_NUM + 1) * t + MAGIC_NUM) + 1;
        },

        /**
         * Backtracks slightly, then reverses direction, overshoots end,
         * then reverses and comes back to end.
         */
        backBoth: function(t) {
            var s = MAGIC_NUM;
            var m = (s *= 1.525) + 1;

            if ((t *= 2 ) < 1) {
                return .5 * (t * t * (m * t - s));
            }
            return .5 * ((t -= 2) * t * (m * t + s) + 2);
        },

        /**
         * Snap in elastic effect.
         */
        elasticIn: function(t) {
            var p = .3, s = p / 4;
            if (t === 0 || t === 1) return t;
            return -(pow(2, 10 * (t -= 1)) * sin((t - s) * (2 * PI) / p));
        },

        /**
         * Snap out elastic effect.
         */
        elasticOut: function(t) {
            var p = .3, s = p / 4;
            if (t === 0 || t === 1) return t;
            return pow(2, -10 * t) * sin((t - s) * (2 * PI) / p) + 1;
        },

        /**
         * Snap both elastic effect.
         */
        elasticBoth: function(t) {
            var p = .45, s = p / 4;
            if (t === 0 || (t *= 2) === 2) return t;

            if (t < 1) {
                return -.5 * (pow(2, 10 * (t -= 1)) *
                        sin((t - s) * (2 * PI) / p));
            }
            return pow(2, -10 * (t -= 1)) *
                    sin((t - s) * (2 * PI) / p) * .5 + 1;
        },

        /**
         * Bounce off of start.
         */
        bounceIn: function(t) {
            return 1 - Easing.bounceOut(1 - t);
        },

        /**
         * Bounces off end.
         */
        bounceOut: function(t) {
            var s = 7.5625, r;

            if (t < (1 / 2.75)) {
                r = s * t * t;
            }
            else if (t < (2 / 2.75)) {
                r = s * (t -= (1.5 / 2.75)) * t + .75;
            }
            else if (t < (2.5 / 2.75)) {
                r = s * (t -= (2.25 / 2.75)) * t + .9375;
            }
            else {
                r = s * (t -= (2.625 / 2.75)) * t + .984375;
            }

            return r;
        },

        /**
         * Bounces off start and end.
         */
        bounceBoth: function(t) {
            if (t < .5) {
                return Easing.bounceIn(t * 2) * .5;
            }
            return Easing.bounceOut(t * 2 - 1) * .5 + .5;
        }
    };

    // 可以通过 require 获取
    Hui.Easing = Easing;


    // 也可以直接通过 jQuery.easing 来使用
    $.extend($.easing, Easing);

})(jQuery)

// effects 切换效果插件
// ============================================

!(function($, Plugins) {
  'use strict'


  // require('arale-easing');

  var SCROLLX = 'scrollx';
  var SCROLLY = 'scrolly';
  var FADE = 'fade';


  // 切换效果插件
  Plugins.Effects = {
    attrs: {
      // 切换效果，可取 scrollx | scrolly | fade 或直接传入 effect function
      effect: 'none',
      easing: 'linear',
      duration: 500
    },

    isNeeded: function () {
      return this.get('effect') !== 'none';
    },

    install: function () {
      var panels = this.get('panels');

      // 注：
      // 1. 所有 panel 的尺寸应该相同
      //    最好指定第一个 panel 的 width 和 height
      //    因为 Safari 下，图片未加载时，读取的 offsetHeight 等值会不对
      // 2. 初始化 panels 样式
      //    这些特效需要将 panels 都显示出来
      // 3. 在 CSS 里，需要给 container 设定高宽和 overflow: hidden
      panels.show();
      var effect = this.get('effect');
      var step = this.get('step');

      var isFunction = $.isFunction(effect);

      // 初始化滚动效果
      if (!isFunction && effect.indexOf('scroll') === 0) {
        var content = this.content;
        var firstPanel = panels.eq(0);

        // 设置定位信息，为滚动效果做铺垫
        content.css('position', 'relative');

        // 注：content 的父级不一定是 container
        if (content.parent().css('position') === 'static') {
          content.parent().css('position', 'relative');
        }

        // 水平排列
        if (effect === SCROLLX) {
          panels.css('float', 'left');
          // 设置最大宽度，以保证有空间让 panels 水平排布
          // 35791197px 为 360 下 width 最大数值
          content.width('35791197px');
        }

        // 只有 scrollX, scrollY 需要设置 viewSize
        // 其他情况下不需要
        var viewSize = this.get('viewSize');
        if (!viewSize[0]) {
          viewSize[0] = firstPanel.outerWidth() * step;
          viewSize[1] = firstPanel.outerHeight() * step;
          this.set('viewSize', viewSize);
        }

        if (!viewSize[0]) {
          throw new Error('Please specify viewSize manually');
        }
      }
      // 初始化淡隐淡出效果
      else if (!isFunction && effect === FADE) {
        var activeIndex = this.get('activeIndex');
        var min = activeIndex * step;
        var max = min + step - 1;

        panels.each(function (i, panel) {
          var isActivePanel = i >= min && i <= max;
          $(panel).css({
            opacity: isActivePanel ? 1 : 0,
            position: 'absolute',
            zIndex: isActivePanel ? 9 : 1
          });
        });
      }

      // 覆盖 switchPanel 方法
      this._switchPanel = function (panelInfo) {
        var effect = this.get('effect');
        var fn = $.isFunction(effect) ? effect : Effects[effect];
        fn.call(this, panelInfo);
      };
    }
  };


  // 切换效果方法集
  var Effects = {

    // 淡隐淡现效果
    fade: function (panelInfo) {
      // 简单起见，目前不支持 step > 1 的情景。若需要此效果时，可修改结构来达成。
      if (this.get('step') > 1) {
        throw new Error('Effect "fade" only supports step === 1');
      }

      var fromPanel = panelInfo.fromPanels.eq(0);
      var toPanel = panelInfo.toPanels.eq(0);

      if (this.anim) {
        // 立刻停止，以开始新的
        this.anim.stop(false, true);
      }

      // 首先显示下一张
      toPanel.css('opacity', 1);
      toPanel.show();

      if (panelInfo.fromIndex > -1) {
        var that = this;
        var duration = this.get('duration');
        var easing = this.get('easing');

        // 动画切换
        this.anim = fromPanel.animate({
          opacity: 0
        }, duration, easing, function () {
          that.anim = null; // free
          // 切换 z-index
          toPanel.css('zIndex', 9);
          fromPanel.css('zIndex', 1);
          fromPanel.css('display', 'none');
        });
      }
      // 初始情况下没有必要动画切换
      else {
        toPanel.css('zIndex', 9);
      }
    },

    // 水平/垂直滚动效果
    scroll: function (panelInfo) {
      var isX = this.get('effect') === SCROLLX;
      var diff = this.get('viewSize')[isX ? 0 : 1] * panelInfo.toIndex;

      var props = {};
      props[isX ? 'left' : 'top'] = -diff + 'px';

      if (this.anim) {
        this.anim.stop();
      }

      if (panelInfo.fromIndex > -1) {
        var that = this;
        var duration = this.get('duration');
        var easing = this.get('easing');

        this.anim = this.content.animate(props, duration, easing, function () {
          that.anim = null; // free
        });
      }
      else {
        this.content.css(props);
      }
    }
  };

  Effects[SCROLLY] = Effects.scroll;
  Effects[SCROLLX] = Effects.scroll;

  Plugins.Effects.Effects = Effects;

})(jQuery, (Hui.Plugins = Hui.Plugins || {}))


// autoplay 自动播放插件
// ============================================

!(function($, Plugins) {
  'use strict'

  var win = $(window);

  // 自动播放插件
  Plugins.Autoplay = {

    attrs: {
      autoplay: false,

      // 自动播放的间隔时间
      interval: 5000
    },

    isNeeded: function () {
      return this.get('autoplay');
    },

    install: function () {
      var element = this.element;
      var EVENT_NS = '.' + this.cid;
      var timer;
      var interval = this.get('interval');
      var that = this;

      // start autoplay
      start();

      function start() {
        // 停止之前的
        stop();

        // 设置状态
        that.paused = false;

        // 开始现在的
        timer = setInterval(function () {
          if (that.paused) return;
          that.next();
        }, interval);
      }

      function stop() {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        that.paused = true;
      }

      // public api
      this.stop = stop;
      this.start = start;

      // 滚出可视区域后，停止自动播放
      this._scrollDetect = throttle(function () {
        that[isInViewport(element) ? 'start' : 'stop']();
      });
      win.on('scroll' + EVENT_NS, this._scrollDetect);

      // 鼠标悬停时，停止自动播放
      this.element.hover(stop, start);
    },

    destroy: function () {
      var EVENT_NS = '.' + this.cid;

      this.stop && this.stop();

      if (this._scrollDetect) {
        this._scrollDetect.stop();
        win.off('scroll' + EVENT_NS);
      }
    }
  };


  // Helpers
  // -------

  function throttle(fn, ms) {
    ms = ms || 200;
    var throttleTimer;

    function f() {
      f.stop();
      throttleTimer = setTimeout(fn, ms);
    }

    f.stop = function () {
      if (throttleTimer) {
        clearTimeout(throttleTimer);
        throttleTimer = 0;
      }
    };

    return f;
  }


  function isInViewport(element) {
    var scrollTop = win.scrollTop();
    var scrollBottom = scrollTop + win.height();
    var elementTop = element.offset().top;
    var elementBottom = elementTop + element.height();

    // 只判断垂直位置是否在可视区域，不判断水平。只有要部分区域在可视区域，就返回 true
    return elementTop < scrollBottom && elementBottom > scrollTop;
  }

})(jQuery, (Hui.Plugins = Hui.Plugins || {}))


// circular 无缝循环滚动插件
// ============================================

!(function($, Plugins) {
  'use strict'

  var SCROLLX = 'scrollx';
  var SCROLLY = 'scrolly';
  var Effects = Plugins.Effects.Effects;


  // 无缝循环滚动插件
  Plugins.Circular = {
    // 仅在开启滚动效果时需要
    isNeeded: function () {
      var effect = this.get('effect');
      var circular = this.get('circular');
      return circular && (effect === SCROLLX || effect === SCROLLY);
    },

    install: function () {
      this._scrollType = this.get('effect');
      this.set('effect', 'scrollCircular');
    }
  };

  Effects.scrollCircular = function (panelInfo) {
    var toIndex = panelInfo.toIndex;
    var fromIndex = panelInfo.fromIndex;
    var isX = this._scrollType === SCROLLX;
    var prop = isX ? 'left' : 'top';
    var viewDiff = this.get('viewSize')[isX ? 0 : 1];
    var diff = -viewDiff * toIndex;

    var props = {};
    props[prop] = diff + 'px';

    // 开始动画
    if (fromIndex > -1) {

      // 开始动画前，先停止掉上一动画
      if (this.anim) {
        this.anim.stop(false, true);
      }

      var len = this.get('length');
      // scroll 的 0 -> len-1 应该是正常的从 0->1->2->.. len-1 的切换
      var isBackwardCritical = fromIndex === 0 && toIndex === len - 1;
      // len-1 -> 0
      var isForwardCritical = fromIndex === len - 1 && toIndex === 0;
      var isBackward = this._isBackward === undefined ? toIndex < fromIndex : this._isBackward;
      // isBackward 使用下面的判断方式, 会在 nav 上 trigger 从 0 -> len-1 切换时,
      // 不经过 0->1->2->...-> len-1, 而是 0 反向切换到 len-1;
      // 而上面的判断方式, nav 上的 trigger 切换是正常的, 只有调用 prev 才从 0 反向切换到 len-1;
      //var isBackward = isBackwardCritical ||
      //    (!isForwardCritical && toIndex < fromIndex);
      // 从第一个反向滚动到最后一个 or 从最后一个正向滚动到第一个
      var isCritical = (isBackward && isBackwardCritical) || (!isBackward && isForwardCritical);

      // 在临界点时，先调整 panels 位置
      if (isCritical) {
        diff = adjustPosition.call(this, isBackward, prop, viewDiff);
        props[prop] = diff + 'px';
      }

      var duration = this.get('duration');
      var easing = this.get('easing');
      var that = this;

      this.anim = this.content.animate(props, duration, easing, function () {
        that.anim = null; // free
        // 复原位置
        if (isCritical) {
          resetPosition.call(that, isBackward, prop, viewDiff);
        }
      });
    }
    // 初始化
    else {
      this.content.css(props);
    }
  };

  // 调整位置


  function adjustPosition(isBackward, prop, viewDiff) {
    var step = this.get('step');
    var len = this.get('length');
    var start = isBackward ? len - 1 : 0;
    var from = start * step;
    var to = (start + 1) * step;
    var diff = isBackward ? viewDiff : -viewDiff * len;
    var panelDiff = isBackward ? -viewDiff * len : viewDiff * len;

    // 调整 panels 到下一个视图中
    var toPanels = $(this.get('panels').get().slice(from, to));
    toPanels.css('position', 'relative');
    toPanels.css(prop, panelDiff + 'px');

    // 返回偏移量
    return diff;
  }

  // 复原位置


  function resetPosition(isBackward, prop, viewDiff) {
    var step = this.get('step');
    var len = this.get('length');
    var start = isBackward ? len - 1 : 0;
    var from = start * step;
    var to = (start + 1) * step;

    // 滚动完成后，复位到正常状态
    var toPanels = $(this.get('panels').get().slice(from, to));
    toPanels.css('position', '');
    toPanels.css(prop, '');

    // 瞬移到正常位置
    this.content.css(prop, isBackward ? -viewDiff * (len - 1) : '');
  }

})(jQuery, (Hui.Plugins = Hui.Plugins || {}))

// Switchable
// -----------
// 可切换组件，核心特征是：有一组可切换的面板（Panel），可通过触点（Trigger）来触发。
// 感谢：
//  - https://github.com/kissyteam/kissy/tree/6707ecc4cdfddd59e21698c8eb4a50b65dbe7632/src/switchable

var Hui = Hui || {};

(function($) {
  'use strict'

  var Widget = Hui.Widget;

  var Effects = Hui.Plugins.Effects;
  var Autoplay = Hui.Plugins.Autoplay;
  var Circular = Hui.Plugins.Circular;

  var Switchable = Widget.extend({
    attrs: {

      // 用户传入的 triggers 和 panels
      // 可以是 Selector、jQuery 对象、或 DOM 元素集
      triggers: {
        value: [],
        getter: function (val) {
          return $(val);
        }
      },

      panels: {
        value: [],
        getter: function (val) {
          return $(val);
        }
      },

      classPrefix: 'ui-switchable',

      // 是否包含 triggers，用于没有传入 triggers 时，是否自动生成的判断标准
      hasTriggers: true,
      // 触发类型
      triggerType: 'hover',
      // or 'click'
      // 触发延迟
      delay: 100,

      // 初始切换到哪个面板
      activeIndex: {
        value: 0,
        setter: function (val) {
          return parseInt(val) || 0;
        }
      },

      // 一屏内有多少个 panels
      step: 1,
      // 有多少屏
      length: {
        readOnly: true,
        getter: function () {
          return Math.ceil(this.get('panels').length / this.get('step'));
        }
      },

      // 可见视图区域的大小。一般不需要设定此值，仅当获取值不正确时，用于手工指定大小
      viewSize: [],

      activeTriggerClass: {
        getter: function (val) {
          return val ? val : this.get("classPrefix") + '-active';
        }
      }
    },

    setup: function () {
      this._initConstClass();
      this._initElement();

      var role = this._getDatasetRole();
      this._initPanels(role);
      // 配置中的 triggers > dataset > 自动生成
      this._initTriggers(role);
      this._bindTriggers();
      this._initPlugins();

      // 渲染默认初始状态
      this.render();
    },

    _initConstClass: function () {
      this.CONST = constClass(this.get('classPrefix'));
    },
    _initElement: function () {
      this.element.addClass(this.CONST.UI_SWITCHABLE);
    },

    // 从 HTML 标记中获取各个 role, 替代原来的 markupType
    _getDatasetRole: function () {
      var self = this;
      var role = {};
      var roles = ['trigger', 'panel', 'nav', 'content'];
      $.each(roles, function (index, key) {
        var elems = self.$('[data-role=' + key + ']');
        if (elems.length) {
          role[key] = elems;
        }
      });
      return role;
    },

    _initPanels: function (role) {
      var panels = this.get('panels');

      // 先获取 panels 和 content
      if (panels.length > 0) {} else if (role.panel) {
        this.set('panels', panels = role.panel);
      } else if (role.content) {
        this.set('panels', panels = role.content.find('> *'));
        this.content = role.content;
      }

      if (panels.length === 0) {
        throw new Error('panels.length is ZERO');
      }
      if (!this.content) {
        this.content = panels.parent();
      }
      this.content.addClass(this.CONST.CONTENT_CLASS);
      this.get('panels').addClass(this.CONST.PANEL_CLASS);
    },

    _initTriggers: function (role) {
      var triggers = this.get('triggers');

      // 再获取 triggers 和 nav
      if (triggers.length > 0) {}
      // attr 里没找到时，才根据 data-role 来解析
      else if (role.trigger) {
        this.set('triggers', triggers = role.trigger);
      } else if (role.nav) {
        triggers = role.nav.find('> *');

        // 空的 nav 标记
        if (triggers.length === 0) {
          triggers = generateTriggersMarkup(
          this.get('length'), this.get('activeIndex'), this.get('activeTriggerClass'), true).appendTo(role.nav);
        }
        this.set('triggers', triggers);

        this.nav = role.nav;
      }
      // 用户没有传入 triggers，也没有通过 data-role 指定时，如果
      // hasTriggers 为 true，则自动生成 triggers
      else if (this.get('hasTriggers')) {
        this.nav = generateTriggersMarkup(
        this.get('length'), this.get('activeIndex'), this.get('activeTriggerClass')).appendTo(this.element);
        this.set('triggers', triggers = this.nav.children());
      }

      if (!this.nav && triggers.length) {
        this.nav = triggers.parent();
      }

      this.nav && this.nav.addClass(this.CONST.NAV_CLASS);
      triggers.addClass(this.CONST.TRIGGER_CLASS).each(function (i, trigger) {
        $(trigger).data('value', i);
      });
    },

    _bindTriggers: function () {
      var that = this,
          triggers = this.get('triggers');

      if (this.get('triggerType') === 'click') {
        triggers.click(focus);
      }
      // hover
      else {
        triggers.hover(focus, leave);
      }

      function focus(ev) {
        that._onFocusTrigger(ev.type, $(this).data('value'));
      }

      function leave() {
        clearTimeout(that._switchTimer);
      }
    },

    _onFocusTrigger: function (type, index) {
      var that = this;

      // click or tab 键激活时
      if (type === 'click') {
        this.switchTo(index);
      }

      // hover
      else {
        this._switchTimer = setTimeout(function () {
          that.switchTo(index);
        }, this.get('delay'));
      }
    },

    _initPlugins: function () {
      this._plugins = [];

      this._plug(Effects);
      this._plug(Autoplay);
      this._plug(Circular);
    },
    // 切换到指定 index
    switchTo: function (toIndex) {
      this.set('activeIndex', toIndex);
    },

    // change 事件触发的前提是当前值和先前值不一致, 所以无需验证 toIndex !== fromIndex
    _onRenderActiveIndex: function (toIndex, fromIndex) {
      this._switchTo(toIndex, fromIndex);
    },

    _switchTo: function (toIndex, fromIndex) {
      this.trigger('switch', toIndex, fromIndex);
      this._switchTrigger(toIndex, fromIndex);
      this._switchPanel(this._getPanelInfo(toIndex, fromIndex));
      this.trigger('switched', toIndex, fromIndex);

      // 恢复手工向后切换标识
      this._isBackward = undefined;
    },

    _switchTrigger: function (toIndex, fromIndex) {
      var triggers = this.get('triggers');
      if (triggers.length < 1) return;

      triggers.eq(fromIndex).removeClass(this.get('activeTriggerClass'));
      triggers.eq(toIndex).addClass(this.get('activeTriggerClass'));
    },

    _switchPanel: function (panelInfo) {
      // 默认是最简单的切换效果：直接隐藏/显示
      panelInfo.fromPanels.hide();
      panelInfo.toPanels.show();
    },

    _getPanelInfo: function (toIndex, fromIndex) {
      var panels = this.get('panels').get();
      var step = this.get('step');

      var fromPanels, toPanels;

      // 初始情况下 fromIndex 为 undefined
      if (fromIndex > -1) {
        fromPanels = panels.slice(fromIndex * step, (fromIndex + 1) * step);
      }

      toPanels = panels.slice(toIndex * step, (toIndex + 1) * step);

      return {
        toIndex: toIndex,
        fromIndex: fromIndex,
        toPanels: $(toPanels),
        fromPanels: $(fromPanels)
      };
    },

    // 切换到上一视图
    prev: function () {
      //  设置手工向后切换标识, 外部调用 prev 一样
      this._isBackward = true;

      var fromIndex = this.get('activeIndex');
      // 考虑循环切换的情况
      var index = (fromIndex - 1 + this.get('length')) % this.get('length');
      this.switchTo(index);
    },

    // 切换到下一视图
    next: function () {
      this._isBackward = false;

      var fromIndex = this.get('activeIndex');
      var index = (fromIndex + 1) % this.get('length');
      this.switchTo(index);
    },

    _plug: function (plugin) {
      var pluginAttrs = plugin.attrs;

      if (pluginAttrs) {
        for (var key in pluginAttrs) {
          if (pluginAttrs.hasOwnProperty(key) &&
          // 不覆盖用户传入的配置
          !(key in this.attrs)) {
            this.set(key, pluginAttrs[key]);
          }
        }
      }
      if (!plugin.isNeeded.call(this)) return;


      if (plugin.install) {
        plugin.install.call(this);
      }

      this._plugins.push(plugin);
    },


    destroy: function () {
      // todo: events
      var that = this;

      $.each(this._plugins, function (i, plugin) {
        if (plugin.destroy) {
          plugin.destroy.call(that);
        }
      });

      Switchable.superclass.destroy.call(this);
    }
  });

  Hui.Switchable = Switchable;


  // Helpers
  // -------

  function generateTriggersMarkup(length, activeIndex, activeTriggerClass, justChildren) {
    var nav = $('<ul>');

    for (var i = 0; i < length; i++) {
      var className = i === activeIndex ? activeTriggerClass : '';

      $('<li>', {
        'class': className,
        'html': i + 1
      }).appendTo(nav);
    }

    return justChildren ? nav.children() : nav;
  }


  // 内部默认的 className


  function constClass(classPrefix) {
    return {
      UI_SWITCHABLE: classPrefix || '',
      NAV_CLASS: classPrefix ? classPrefix + '-nav' : '',
      CONTENT_CLASS: classPrefix ? classPrefix + '-content' : '',
      TRIGGER_CLASS: classPrefix ? classPrefix + '-trigger' : '',
      PANEL_CLASS: classPrefix ? classPrefix + '-panel' : '',
      PREV_BTN_CLASS: classPrefix ? classPrefix + '-prev-btn' : '',
      NEXT_BTN_CLASS: classPrefix ? classPrefix + '-next-btn' : ''
    }
  }

})(jQuery)


// 展现型标签页组件
Hui.Switchable.Tabs = Hui.Switchable.extend({});

// 卡盘轮播组件
Hui.Switchable.Slide = Hui.Switchable.extend({
  attrs: {
    autoplay: true,
    circular: true
  }
});

!(function($) {
  'use strict'

  var Switchable = Hui.Switchable;

  // 旋转木马组件
  Hui.Switchable.Carousel = Switchable.extend({

    attrs: {
      circular: true,

      prevBtn: {
        getter: function (val) {
          return $(val).eq(0);
        }
      },

      nextBtn: {
        getter: function (val) {
          return $(val).eq(0);
        }
      },
      disabledBtnClass: {
        getter: function (val) {
          return val ? val : this.get("classPrefix") + '-disabled-btn';
        }
      }
    },

    _initTriggers: function (role) {
      Switchable.prototype._initTriggers.call(this, role);

      // attr 里没找到时，才根据 data-role 来解析
      var prevBtn = this.get('prevBtn');
      var nextBtn = this.get('nextBtn');

      if (!prevBtn[0] && role.prev) {
        prevBtn = role.prev;
        this.set('prevBtn', prevBtn);
      }

      if (!nextBtn[0] && role.next) {
        nextBtn = role.next;
        this.set('nextBtn', nextBtn);
      }

      prevBtn.addClass(this.CONST.PREV_BTN_CLASS);
      nextBtn.addClass(this.CONST.NEXT_BTN_CLASS);
    },

    _getDatasetRole: function () {
      var role = Switchable.prototype._getDatasetRole.call(this);

      var self = this;
      var roles = ['next', 'prev'];
      $.each(roles, function (index, key) {
        var elems = self.$('[data-role=' + key + ']');
        if (elems.length) {
          role[key] = elems;
        }
      });
      return role;
    },

    _bindTriggers: function () {
      Switchable.prototype._bindTriggers.call(this);

      var that = this;
      var circular = this.get('circular');

      this.get('prevBtn').click(function (ev) {
        ev.preventDefault();
        if (circular || that.get('activeIndex') > 0) {
          that.prev();
        }
      });

      this.get('nextBtn').click(function (ev) {
        ev.preventDefault();
        var len = that.get('length') - 1;
        if (circular || that.get('activeIndex') < len) {
          that.next();
        }
      });

      // 注册 switch 事件，处理 prevBtn/nextBtn 的 disable 状态
      // circular = true 时，无需处理
      if (!circular) {
        this.on('switch', function (toIndex) {
          that._updateButtonStatus(toIndex);
        });
      }
    },

    _updateButtonStatus: function (toIndex) {
      var prevBtn = this.get('prevBtn');
      var nextBtn = this.get('nextBtn');
      var disabledBtnClass = this.get("disabledBtnClass");

      prevBtn.removeClass(disabledBtnClass);
      nextBtn.removeClass(disabledBtnClass);

      if (toIndex === 0) {
        prevBtn.addClass(disabledBtnClass);
      }
      else if (toIndex === this.get('length') - 1) {
        nextBtn.addClass(disabledBtnClass);
      }
    }
  });

})(jQuery)

!(function(Hui) {
  'use strict'

  var Switchable = Hui.Switchable;


  // 手风琴组件
  var Accordion = Switchable.extend({
    attrs: {
      triggerType: 'click',

      // 是否运行展开多个
      multiple: false,

      autoplay: false
    },
    switchTo: function (toIndex) {
      if (this.get('multiple')) {
        this._switchTo(toIndex, toIndex);
      } else {
        Switchable.prototype.switchTo.call(this, toIndex);
      }
    },

    _switchTrigger: function (toIndex, fromIndex) {
      if (this.get('multiple')) {
        this.get('triggers').eq(toIndex).toggleClass(this.get('activeTriggerClass'));
      } else {
        Switchable.prototype._switchTrigger.call(this, toIndex, fromIndex);
      }
    },

    _switchPanel: function (panelInfo) {
      if (this.get('multiple')) {
        panelInfo.toPanels.toggle();
      } else {
        Switchable.prototype._switchPanel.call(this, panelInfo);
      }
    }
  });

  Hui.Switchable.Accordion = Accordion;

})(Hui)