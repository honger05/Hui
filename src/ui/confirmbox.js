
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
 