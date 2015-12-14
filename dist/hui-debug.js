
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
  Hui.Mask = new Mask();

})(jQuery)

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