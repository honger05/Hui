
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