var Hui=Hui||{};!function(t){"use strict";function e(e){e=a(e)||{},e.nodeType&&(e={element:e});var i=a(e.element)||c;if(1!==i.nodeType)throw new Error("posObject.element is invalid.");var n={element:i,x:e.x||0,y:e.y||0},s=i===c||"VIEWPORT"===i._id;return n.offset=function(){return h?{left:0,top:0}:s?{left:t(document).scrollLeft(),top:t(document).scrollTop()}:o(t(i)[0])},n.size=function(){var e=t(s?window:i);return{width:e.outerWidth(),height:e.outerHeight()}},n}function i(t){t.x=n(t.x,t,"width"),t.y=n(t.y,t,"height")}function n(t,e,i){if(t+="",t=t.replace(/px/gi,""),/\D/.test(t)&&(t=t.replace(/(?:top|left)/gi,"0%").replace(/center/gi,"50%").replace(/(?:bottom|right)/gi,"100%")),-1!==t.indexOf("%")&&(t=t.replace(/(\d+(?:\.\d+)?)%/gi,function(t,n){return e.size()[i]*(n/100)})),/[+\-*\/]/.test(t))try{t=new Function("return "+t)()}catch(n){throw new Error("Invalid position value: "+t)}return r(t)}function s(e){var i=e.offsetParent();i[0]===document.documentElement&&(i=t(document.body)),f&&i.css("zoom",1);var n;return n=i[0]===document.body&&"static"===i.css("position")?{top:0,left:0}:o(i[0]),n.top+=r(i.css("border-top-width")),n.left+=r(i.css("border-left-width")),n}function r(t){return parseFloat(t,10)||0}function a(e){return t(e)[0]}function o(t){var e=t.getBoundingClientRect(),i=document.documentElement;return{left:e.left+(window.pageXOffset||i.scrollLeft)-(i.clientLeft||document.body.clientLeft||0),top:e.top+(window.pageYOffset||i.scrollTop)-(i.clientTop||document.body.clientTop||0)}}var l=Hui.Position={},c={_id:"VIEWPORT",nodeType:1},h=!1,u=(window.navigator.userAgent||"").toLowerCase(),f=-1!==u.indexOf("msie 6");l.pin=function(n,r){if(n=e(n),r=e(r),n.element!==c&&"VIEWPORT"!==n.element._id){var a=t(n.element);"fixed"!==a.css("position")||f?(a.css("position","absolute"),h=!1):h=!0,i(n),i(r);var o=s(a),l=r.offset(),u=l.top+r.y-n.y-o.top,g=l.left+r.x-n.x-o.left;a.css({left:g,top:u})}},l.center=function(t,e){l.pin({element:t,x:"50%",y:"50%"},{element:e,x:"50%",y:"50%"})},l.VIEWPORT=c}(jQuery);var Hui=Hui||{};!function(t){"use strict";function e(e){this.target=t(e).eq(0)}function i(){}function n(e){var i={display:"none",border:"none",opacity:0,position:"absolute"},n=e.css("zIndex");return n&&n>0&&(i.zIndex=n-1),t("<iframe>",{src:"javascript:''",frameborder:0,css:i}).insertBefore(e)}var s=Hui.Position,r=-1!==(window.navigator.userAgent||"").toLowerCase().indexOf("msie 6");e.prototype.sync=function(){var t=this.target,e=this.iframe;if(!t.length)return this;var i=t.outerHeight(),r=t.outerWidth();return i&&r&&!t.is(":hidden")?(e||(e=this.iframe=n(t)),e.css({height:i,width:r}),s.pin(e[0],t[0]),e.show()):e&&e.hide(),this},e.prototype.destroy=function(){this.iframe&&(this.iframe.remove(),delete this.iframe),delete this.target},r?Hui.Shim=e:(i.prototype.sync=function(){return this},i.prototype.destroy=i,Hui.Shim=i)}(jQuery);var Hui=Hui||{};Hui.Messenger=function(){"use strict";function t(t,e){var i="";if(arguments.length<2?i="target error - target and name are both required":"object"!=typeof t?i="target error - target itself must be window object":"string"!=typeof e&&(i="target error - target name must be string type"),i)throw new Error(i);this.target=t,this.name=e}function e(t,e){this.targets={},this.name=t,this.listenFunc=[],i=e||i,this.initListen()}var i="arale-messenger",n="postMessage"in window;return n?t.prototype.send=function(t){this.target.postMessage(i+t,"*")}:t.prototype.send=function(t){var e=window.navigator[i+this.name];if("function"!=typeof e)throw new Error("target callback function is not defined");e(i+t,window)},e.prototype.addTarget=function(e,i){var n=new t(e,i);this.targets[i]=n},e.prototype.initListen=function(){var t=this,e=function(e){"object"==typeof e&&e.data&&(e=e.data),e=e.slice(i.length);for(var n=0;n<t.listenFunc.length;n++)t.listenFunc[n](e)};n?"addEventListener"in document?window.addEventListener("message",e,!1):"attachEvent"in document&&window.attachEvent("onmessage",e):window.navigator[i+this.name]=e},e.prototype.listen=function(t){this.listenFunc.push(t)},e.prototype.clear=function(){this.listenFunc=[]},e.prototype.send=function(t){var e,i=this.targets;for(e in i)i.hasOwnProperty(e)&&i[e].send(t)},e}();var Hui=Hui||{};!function(t,e){"use strict";function i(e){return a(e)?null:t(s(e))}function n(t,e){if(t){var i;if(e){if(i=t.find(e),0===i.length)throw new Error("Invalid template selector: "+e)}else i=t;return r(i.html())}}function s(t){return t.replace(/({[^}]+}})/g,"<!--$1-->").replace(/\s(src|href)\s*=\s*(['"])(.*?\{.+?)\2/g," data-templatable-$1=$2$3$2")}function r(t){return t.replace(/(?:<|&lt;)!--({{[^}]+}})--(?:>|&gt;)/g,"$1").replace(/data-templatable-/gi,"")}function a(t){return"function"==typeof t}function o(t){if(!t)return{};var i={};for(var n in t){var s=t[n];i[n]=a(s)?s:e.compile(s)}return i}var l={};Hui.Templatable={templateHelpers:null,templatePartials:null,templateObject:null,parseElementFromTemplate:function(){var e,n=this.get("template");/^#/.test(n)&&(e=document.getElementById(n.substring(1)))&&(n=e.innerHTML,this.set("template",n)),this.templateObject=i(n),this.element=t(this.compile())},compile:function(t,i){if(t||(t=this.get("template")),i||(i=this.get("model"))||(i={}),i.toJSON&&(i=i.toJSON()),a(t))return t(i,{helpers:this.templateHelpers,partials:o(this.templatePartials)});var n,s,r=this.templateHelpers,c=this.templatePartials;if(r)for(n in r)r.hasOwnProperty(n)&&e.registerHelper(n,r[n]);if(c)for(s in c)c.hasOwnProperty(s)&&e.registerPartial(s,c[s]);var h=l[t];h||(h=l[t]=e.compile(t));var u=h(i);if(r)for(n in r)r.hasOwnProperty(n)&&delete e.helpers[n];if(c)for(s in c)c.hasOwnProperty(s)&&delete e.partials[s];return u},renderPartial:function(e){if(this.templateObject){var i=n(this.templateObject,e);i?e?this.$(e).html(this.compile(i)):this.element.html(this.compile(i)):this.element.html(this.compile())}else{var s=t(this.compile()),r=s.find(e);r.length?this.$(e).html(r.html()):this.element.html(s.html())}return this}};var c=e.compile;e.compile=function(t){return a(t)?t:c.call(e,t)}}(jQuery,Handlebars);var Hui=Hui||{};!function(t){function e(e){return t.contains(document.documentElement,e)}function i(e){t(o.blurOverlays).each(function(i,n){if(n&&n.get("visible")){for(var s=0;s<n._relativeElements.length;s++){var r=t(n._relativeElements[s])[0];if(r===e.target||t.contains(r,e.target))return}n.hide()}})}function n(t,e){for(var i=0;i<e.length;i++)if(t===e[i])return e.splice(i,1),e}var s=Hui.Position,r=Hui.Shim,a=Hui.Widget,o=a.extend({attrs:{width:null,height:null,zIndex:99,visible:!1,align:{selfXY:[0,0],baseElement:s.VIEWPORT,baseXY:[0,0]},parentNode:document.body},show:function(){return this.rendered||this.render(),this.set("visible",!0),this},hide:function(){return this.set("visible",!1),this},setup:function(){var t=this;this._setupShim(),this._setupResize(),this.after("render",function(){var t=this.element.css("position");("static"===t||"relative"===t)&&this.element.css({position:"absolute",left:"-9999px",top:"-9999px"})}),this.after("show",function(){t._setPosition()})},destroy:function(){return n(this,o.allOverlays),n(this,o.blurOverlays),o.superclass.destroy.call(this)},_setPosition:function(t){if(e(this.element[0])&&(t||(t=this.get("align")),t)){var i="none"===this.element.css("display");return i&&this.element.css({visibility:"hidden",display:"block"}),s.pin({element:this.element,x:t.selfXY[0],y:t.selfXY[1]},{element:t.baseElement,x:t.baseXY[0],y:t.baseXY[1]}),i&&this.element.css({visibility:"",display:"none"}),this}},_setupShim:function(){var t=new r(this.element);this.after("hide _setPosition",t.sync,t);var e=["width","height"];for(var i in e)e.hasOwnProperty(i)&&this.on("change:"+i,t.sync,t);this.before("destroy",t.destroy,t)},_setupResize:function(){o.allOverlays.push(this)},_blurHide:function(e){e=t.makeArray(e),e.push(this.element),this._relativeElements=e,o.blurOverlays.push(this)},_onRenderWidth:function(t){this.element.css("width",t)},_onRenderHeight:function(t){this.element.css("height",t)},_onRenderZIndex:function(t){this.element.css("zIndex",t)},_onRenderAlign:function(t){this._setPosition(t)},_onRenderVisible:function(t){this.element[t?"show":"hide"]()}});o.blurOverlays=[],t(document).on("click",function(t){i(t)});var l,c=t(window).width(),h=t(window).height();o.allOverlays=[],t(window).resize(function(){l&&clearTimeout(l),l=setTimeout(function(){var e=t(window).width(),i=t(window).height();(c!==e||h!==i)&&t(o.allOverlays).each(function(t,e){e&&e.get("visible")&&e._setPosition()}),c=e,h=i},80)}),Hui.Overlay=o}(jQuery);var Hui=Hui||{};!function(t){"use strict";var e=Hui.Overlay,i=(window.navigator.userAgent||"").toLowerCase(),n=-1!==i.indexOf("msie 6"),s=t(document.body),r=t(document),a=e.extend({attrs:{width:n?r.outerWidth(!0):"100%",height:n?r.outerHeight(!0):"100%",className:"ui-mask",opacity:.2,backgroundColor:"#000",style:{position:n?"absolute":"fixed",top:0,left:0},align:{baseElement:n?s:void 0}},show:function(){return n&&(this.set("width",r.outerWidth(!0)),this.set("height",r.outerHeight(!0))),a.superclass.show.call(this)},_onRenderBackgroundColor:function(t){this.element.css("backgroundColor",t)},_onRenderOpacity:function(t){this.element.css("opacity",t)}});Hui.Overlay.Mask=new a}(jQuery);var Hui=Hui||{};!function(t){"use strict";function e(t,e,i,n,s){var r=n&&n[0];s.delegateEvents(r?n:e,r?t+" "+e.selector:t,function(t){i.call(t.currentTarget,t)})}var i=Hui.Overlay,n=i.extend({attrs:{trigger:{value:null,getter:function(e){return t(e)}},triggerType:"hover",delegateNode:{value:null,getter:function(e){return t(e)}},align:{value:{baseXY:[0,"100%"],selfXY:[0,0]},setter:function(t){return t?(t.baseElement?this._specifiedBaseElement=!0:this.activeTrigger&&(t.baseElement=this.activeTrigger),t):void 0},getter:function(e){return t.extend({},e,this._specifiedBaseElement?{}:{baseElement:this.activeTrigger})}},delay:70,disabled:!1,effect:"",duration:250},setup:function(){n.superclass.setup.call(this),this._bindTrigger(),this._blurHide(this.get("trigger")),this.activeTrigger=this.get("trigger").eq(0);var t=this;this.get("delegateNode")&&this.before("show",function(){t._relativeElements=t.get("trigger"),t._relativeElements.push(t.element)})},render:function(){return n.superclass.render.call(this),this.element.hide(),this},show:function(){return this.get("disabled")?void 0:n.superclass.show.call(this)},hide:function(t){return t?this:n.superclass.hide.call(this)},_bindTrigger:function(){var t=this.get("triggerType");"click"===t?this._bindClick():"focus"===t?this._bindFocus():this._bindHover()},_bindClick:function(){function i(e){n.get("disabled")||n.get("trigger").each(function(i,s){e==s?(s._active=!0,n.activeTrigger=t(s)):s._active=!1})}var n=this;e("click",this.get("trigger"),function(t){this._active===!0?n.hide():(i(this),n.show())},this.get("delegateNode"),this),this.before("hide",function(){i()})},_bindFocus:function(){var i=this;e("focus",this.get("trigger"),function(){i.activeTrigger=t(this),i.show()},this.get("delegateNode"),this),e("blur",this.get("trigger"),function(){setTimeout(function(){!i._downOnElement&&i.hide(),i._downOnElement=!1},i.get("delay"))},this.get("delegateNode"),this),this.delegateEvents("mousedown",function(t){this._downOnElement=!0})},_bindHover:function(){function i(t){clearTimeout(n),n=null,l.get("visible")&&(s=setTimeout(function(){l.hide()},o))}var n,s,r=this.get("trigger"),a=this.get("delegateNode"),o=this.get("delay"),l=this;return 0>o?void this._bindTooltip():(e("mouseenter",r,function(){clearTimeout(s),s=null,l.activeTrigger=t(this),n=setTimeout(function(){l.show()},o)},a,this),e("mouseleave",r,i,a,this),this.delegateEvents("mouseenter",function(){clearTimeout(s)}),this.delegateEvents("mouseleave",i),void this.element.on("mouseleave","select",function(t){t.stopPropagation()}))},_bindTooltip:function(){var i=this.get("trigger"),n=this.get("delegateNode"),s=this;e("mouseenter",i,function(){s.activeTrigger=t(this),s.show()},n,this),e("mouseleave",i,function(){s.hide()},n,this)},_onRenderVisible:function(t,e){if(t!==!!e){var i=-1!==this.get("effect").indexOf("fade"),n=-1!==this.get("effect").indexOf("slide"),s={};n&&(s.height=t?"show":"hide"),i&&(s.opacity=t?"show":"hide");var r=this,a=t?function(){r.trigger("animated")}:function(){r.hide(!0),r.trigger("animated")};i||n?this.element.stop(!0,!0).animate(s,this.get("duration"),a).css({visibility:"visible"}):this.element[t?"show":"hide"]()}}});Hui.Popup=n}(jQuery);var Hui=Hui||{};!function(t){"use strict";function e(t){null==t.attr("tabindex")&&t.attr("tabindex","-1")}function i(t){var e=t[0].contentWindow.document;return e.body.scrollHeight&&e.documentElement.scrollHeight?Math.min(e.body.scrollHeight,e.documentElement.scrollHeight):e.documentElement.scrollHeight?e.documentElement.scrollHeight:e.body.scrollHeight?e.body.scrollHeight:void 0}function n(t){var e=!1;try{t[0].contentWindow.document}catch(i){e=!0}return e}function s(t,e){for(var i=-1,n=0;n<e.length;n++)if(e[n]===t){i=n;break}-1!==i&&e.splice(i,1)}var r=Hui.Overlay,a=Hui.Overlay.Mask,o=Hui.Events,l=Hui.Templatable,c=Hui.Messenger,h=r.extend({Implements:l,attrs:{template:'<div class="{{classPrefix}}">                  <a class="{{classPrefix}}-close" title="Close" href="javascript:;" data-role="close"></a>                  <div class="{{classPrefix}}-content" data-role="content"></div>                </div>',trigger:{value:null,getter:function(e){return t(e)}},classPrefix:"ui-dialog",content:{value:null,setter:function(t){return/^(https?:\/\/|\/|\.\/|\.\.\/)/.test(t)&&(this._type="iframe",(t.indexOf("?ajax")>0||t.indexOf("&ajax")>0)&&(this._ajax=!0)),t}},hasMask:!0,closeTpl:"×",width:500,height:null,initialHeight:300,effect:"none",zIndex:999,autoFit:!0,align:{value:{selfXY:["50%","50%"],baseXY:["50%","42%"]},getter:function(e){return this.element.height()>.84*t(window).height()?{selfXY:["50%","0"],baseXY:["50%","0"]}:e}}},parseElement:function(){this.set("model",{classPrefix:this.get("classPrefix")}),h.superclass.parseElement.call(this),this.contentElement=this.$("[data-role=content]"),this.contentElement.css({height:"100%",zoom:1}),this.$(">[data-role=close]").hide()},events:{"click [data-role=close]":function(t){t.preventDefault(),this.hide()}},show:function(){return"iframe"===this._type&&(this._ajax?this._ajaxHtml():(!this.get("height")&&this.contentElement.css("height",this.get("initialHeight")),this._showIframe())),h.superclass.show.call(this),this},hide:function(){return"iframe"===this._type&&this.iframe&&(this._isCrossDomainIframe||this.iframe.attr({src:"javascript:'';"}),this.iframe.remove(),this.iframe=null),h.superclass.hide.call(this),clearInterval(this._interval),delete this._interval,this},destroy:function(){return this.element.remove(),this._hideMask(),clearInterval(this._interval),h.superclass.destroy.call(this)},setup:function(){h.superclass.setup.call(this),this._setupTrigger(),this._setupMask(),this._setupKeyEvents(),this._setupFocus(),e(this.element),e(this.get("trigger")),this.activeTrigger=this.get("trigger").eq(0)},_onRenderContent:function(e){if("iframe"!==this._type){var i;try{i=t(e)}catch(n){i=[]}i[0]?this.contentElement.empty().append(i):this.contentElement.empty().html(e),this._setPosition()}},_onRenderCloseTpl:function(t){""===t?this.$(">[data-role=close]").html(t).hide():this.$(">[data-role=close]").html(t).show()},_onRenderVisible:function(t){t?"fade"===this.get("effect")?this.element.fadeIn(300):this.element.show():this.element.hide()},_setupTrigger:function(){this.delegateEvents(this.get("trigger"),"click",function(e){e.preventDefault(),this.activeTrigger=t(e.currentTarget),this.show()})},_setupMask:function(){var t=this;a._dialogs=a._dialogs||[],this.after("show",function(){if(this.get("hasMask")){a.set("zIndex",t.get("zIndex")).show(),a.element.insertBefore(t.element);for(var e,i=0;i<a._dialogs.length;i++)a._dialogs[i]===t&&(e=a._dialogs[i]);e?(s(e,a._dialogs),a._dialogs.push(e)):a._dialogs.push(t)}}),this.after("hide",this._hideMask)},_hideMask:function(){if(this.get("hasMask"))for(var t=a._dialogs?a._dialogs.length:0,e=0;t>e;e++)if(a._dialogs[e]===this)if(s(this,a._dialogs),0===a._dialogs.length)a.hide();else if(e===t-1){var i=a._dialogs[a._dialogs.length-1];a.set("zIndex",i.get("zIndex")),a.element.insertBefore(i.element)}},_setupFocus:function(){this.after("show",function(){this.element.focus()}),this.after("hide",function(){this.activeTrigger&&this.activeTrigger.focus()})},_setupKeyEvents:function(){this.delegateEvents(t(document),"keyup.esc",function(t){27===t.keyCode&&this.get("visible")&&this.hide()})},_showIframe:function(){var t=this;this.iframe||this._createIframe(),this.iframe.attr({src:this._fixUrl(),name:"dialog-iframe"+(new Date).getTime()}),this.iframe.one("load",function(){t.get("visible")&&(t._isCrossDomainIframe=n(t.iframe),t._isCrossDomainIframe||(t.get("autoFit")&&(clearInterval(t._interval),t._interval=setInterval(function(){t._syncHeight()},300)),t._syncHeight()),t._setPosition(),t.trigger("complete:show"))})},_fixUrl:function(){var t=this.get("content").match(/([^?#]*)(\?[^#]*)?(#.*)?/);return t.shift(),t[1]=(t[1]&&"?"!==t[1]?t[1]+"&":"?")+"t="+(new Date).getTime(),t.join("")},_createIframe:function(){var e=this;this.iframe=t("<iframe>",{src:"javascript:'';",scrolling:"no",frameborder:"no",allowTransparency:"true",css:{border:"none",width:"100%",display:"block",height:"100%",overflow:"hidden"}}).appendTo(this.contentElement),o.mixTo(this.iframe[0]),this.iframe[0].on("close",function(){e.hide()});var i=new c("parent","arale-dialog");this.iframe.one("load",function(){i.addTarget(e.iframe[0].contentWindow,"iframe1"),i.listen(function(t){switch(t=JSON.parse(t),t.event){case"close":e.hide();break;case"syncHeight":e._setHeight("px"===t.height.toString().slice(-2)?t.height:t.height+"px")}})})},_setHeight:function(t){this.contentElement.css("height",t),this.element[0].className=this.element[0].className},_syncHeight:function(){var t;if(this.get("height"))clearInterval(this._interval),delete this._interval;else{try{this._errCount=0,t=i(this.iframe)+"px"}catch(e){this._errCount=(this._errCount||0)+1,this._errCount>=6&&(t=this.get("initialHeight"),clearInterval(this._interval),delete this._interval)}this._setHeight(t)}},_ajaxHtml:function(){var t=this;this.contentElement.css("height",this.get("initialHeight")),this.contentElement.load(this.get("content"),function(){t._setPosition(),t.contentElement.css("height",""),t.trigger("complete:show")})}});Hui.Dialog=h}(jQuery);var Hui=Hui||{};!function(t){"use strict";var e=Hui.Dialog,i='{{#if title}}                  <div class="{{classPrefix}}-title" data-role="title">{{{title}}}</div>                  {{/if}}                  <div class="{{classPrefix}}-container">                      <div class="{{classPrefix}}-message" data-role="message">{{{message}}}</div>                      {{#if hasFoot}}                      <div class="{{classPrefix}}-operation" data-role="foot">                          {{#if confirmTpl}}                          <div class="{{classPrefix}}-confirm" data-role="confirm">                              {{{confirmTpl}}}                          </div>                          {{/if}}                          {{#if cancelTpl}}                          <div class="{{classPrefix}}-cancel" data-role="cancel">                              {{{cancelTpl}}}                          </div>                          {{/if}}                      </div>                      {{/if}}                  </div>',n=e.extend({attrs:{title:"默认标题",confirmTpl:'<a class="ui-dialog-button-orange" href="javascript:;">确定</a>',cancelTpl:'<a class="ui-dialog-button-white" href="javascript:;">取消</a>',message:"默认内容"},setup:function(){n.superclass.setup.call(this);var t={classPrefix:this.get("classPrefix"),message:this.get("message"),title:this.get("title"),confirmTpl:this.get("confirmTpl"),cancelTpl:this.get("cancelTpl"),hasFoot:this.get("confirmTpl")||this.get("cancelTpl")};this.set("content",this.compile(i,t))},events:{"click [data-role=confirm]":function(t){t.preventDefault(),this.trigger("confirm")},"click [data-role=cancel]":function(t){t.preventDefault(),this.trigger("cancel"),this.hide()}},_onChangeMessage:function(t){this.$("[data-role=message]").html(t)},_onChangeTitle:function(t){this.$("[data-role=title]").html(t)},_onChangeConfirmTpl:function(t){this.$("[data-role=confirm]").html(t)},_onChangeCancelTpl:function(t){this.$("[data-role=cancel]").html(t)}});n.alert=function(e,i,s){var r={message:e,title:"",cancelTpl:"",closeTpl:"",onConfirm:function(){i&&i(),this.hide()}};new n(t.extend(null,r,s)).show().after("hide",function(){this.destroy()})},n.confirm=function(e,i,s,r,a){"object"!=typeof r||a||(a=r,r=null);var o={message:e,title:i||"确认框",closeTpl:"",onConfirm:function(){s&&s(),this.hide()},onCancel:function(){r&&r(),this.hide()}};new n(t.extend(null,o,a)).show().after("hide",function(){this.destroy()})},n.show=function(e,i,s){var r={message:e,title:"",confirmTpl:!1,cancelTpl:!1};new n(t.extend(null,r,s)).show().before("hide",function(){i&&i()}).after("hide",function(){this.destroy()})},Hui.Dialog.ConfirmBox=n}(jQuery),!function(t){"use strict";var e=Math.PI,i=Math.pow,n=Math.sin,s=1.70158,r={easeNone:function(t){return t},easeIn:function(t){return t*t},easeOut:function(t){return(2-t)*t},easeBoth:function(t){return(t*=2)<1?.5*t*t:.5*(1- --t*(t-2))},easeInStrong:function(t){return t*t*t*t},easeOutStrong:function(t){return 1- --t*t*t*t},easeBothStrong:function(t){return(t*=2)<1?.5*t*t*t*t:.5*(2-(t-=2)*t*t*t)},backIn:function(t){return 1===t&&(t-=.001),t*t*((s+1)*t-s)},backOut:function(t){return(t-=1)*t*((s+1)*t+s)+1},backBoth:function(t){var e=s,i=(e*=1.525)+1;return(t*=2)<1?.5*(t*t*(i*t-e)):.5*((t-=2)*t*(i*t+e)+2)},elasticIn:function(t){var s=.3,r=s/4;return 0===t||1===t?t:-(i(2,10*(t-=1))*n((t-r)*(2*e)/s))},elasticOut:function(t){var s=.3,r=s/4;return 0===t||1===t?t:i(2,-10*t)*n((t-r)*(2*e)/s)+1},elasticBoth:function(t){var s=.45,r=s/4;return 0===t||2===(t*=2)?t:1>t?-.5*(i(2,10*(t-=1))*n((t-r)*(2*e)/s)):i(2,-10*(t-=1))*n((t-r)*(2*e)/s)*.5+1},bounceIn:function(t){return 1-r.bounceOut(1-t)},bounceOut:function(t){var e,i=7.5625;return e=1/2.75>t?i*t*t:2/2.75>t?i*(t-=1.5/2.75)*t+.75:2.5/2.75>t?i*(t-=2.25/2.75)*t+.9375:i*(t-=2.625/2.75)*t+.984375},bounceBoth:function(t){return.5>t?.5*r.bounceIn(2*t):.5*r.bounceOut(2*t-1)+.5}};Hui.Easing=r,t.extend(t.easing,r)}(jQuery),!function(t,e){"use strict";var i="scrollx",n="scrolly",s="fade";e.Effects={attrs:{effect:"none",easing:"linear",duration:500},isNeeded:function(){return"none"!==this.get("effect")},install:function(){var e=this.get("panels");e.show();var n=this.get("effect"),a=this.get("step"),o=t.isFunction(n);if(o||0!==n.indexOf("scroll")){if(!o&&n===s){var l=this.get("activeIndex"),c=l*a,h=c+a-1;e.each(function(e,i){var n=e>=c&&h>=e;t(i).css({opacity:n?1:0,position:"absolute",zIndex:n?9:1})})}}else{var u=this.content,f=e.eq(0);u.css("position","relative"),"static"===u.parent().css("position")&&u.parent().css("position","relative"),n===i&&(e.css("float","left"),u.width("35791197px"));var g=this.get("viewSize");if(g[0]||(g[0]=f.outerWidth()*a,g[1]=f.outerHeight()*a,this.set("viewSize",g)),!g[0])throw new Error("Please specify viewSize manually")}this._switchPanel=function(e){var i=this.get("effect"),n=t.isFunction(i)?i:r[i];n.call(this,e)}}};var r={fade:function(t){if(this.get("step")>1)throw new Error('Effect "fade" only supports step === 1');var e=t.fromPanels.eq(0),i=t.toPanels.eq(0);if(this.anim&&this.anim.stop(!1,!0),i.css("opacity",1),i.show(),t.fromIndex>-1){var n=this,s=this.get("duration"),r=this.get("easing");this.anim=e.animate({opacity:0},s,r,function(){n.anim=null,i.css("zIndex",9),e.css("zIndex",1),e.css("display","none")})}else i.css("zIndex",9)},scroll:function(t){var e=this.get("effect")===i,n=this.get("viewSize")[e?0:1]*t.toIndex,s={};if(s[e?"left":"top"]=-n+"px",this.anim&&this.anim.stop(),t.fromIndex>-1){var r=this,a=this.get("duration"),o=this.get("easing");this.anim=this.content.animate(s,a,o,function(){r.anim=null})}else this.content.css(s)}};r[n]=r.scroll,r[i]=r.scroll,e.Effects.Effects=r}(jQuery,Hui.Plugins=Hui.Plugins||{}),!function(t,e){"use strict";function i(t,e){function i(){i.stop(),n=setTimeout(t,e)}e=e||200;var n;return i.stop=function(){n&&(clearTimeout(n),n=0)},i}function n(t){var e=s.scrollTop(),i=e+s.height(),n=t.offset().top,r=n+t.height();return i>n&&r>e}var s=t(window);e.Autoplay={attrs:{autoplay:!1,interval:5e3},isNeeded:function(){return this.get("autoplay")},install:function(){function t(){e(),c.paused=!1,r=setInterval(function(){c.paused||c.next()},l)}function e(){r&&(clearInterval(r),r=null),c.paused=!0}var r,a=this.element,o="."+this.cid,l=this.get("interval"),c=this;t(),this.stop=e,this.start=t,this._scrollDetect=i(function(){c[n(a)?"start":"stop"]()}),s.on("scroll"+o,this._scrollDetect),this.element.hover(e,t)},destroy:function(){var t="."+this.cid;this.stop&&this.stop(),this._scrollDetect&&(this._scrollDetect.stop(),s.off("scroll"+t))}}}(jQuery,Hui.Plugins=Hui.Plugins||{}),!function(t,e){"use strict";function i(e,i,n){var s=this.get("step"),r=this.get("length"),a=e?r-1:0,o=a*s,l=(a+1)*s,c=e?n:-n*r,h=e?-n*r:n*r,u=t(this.get("panels").get().slice(o,l));return u.css("position","relative"),u.css(i,h+"px"),c}function n(e,i,n){var s=this.get("step"),r=this.get("length"),a=e?r-1:0,o=a*s,l=(a+1)*s,c=t(this.get("panels").get().slice(o,l));c.css("position",""),c.css(i,""),this.content.css(i,e?-n*(r-1):"")}var s="scrollx",r="scrolly",a=e.Effects.Effects;e.Circular={isNeeded:function(){var t=this.get("effect"),e=this.get("circular");return e&&(t===s||t===r)},install:function(){this._scrollType=this.get("effect"),this.set("effect","scrollCircular")}},a.scrollCircular=function(t){var e=t.toIndex,r=t.fromIndex,a=this._scrollType===s,o=a?"left":"top",l=this.get("viewSize")[a?0:1],c=-l*e,h={};if(h[o]=c+"px",r>-1){this.anim&&this.anim.stop(!1,!0);var u=this.get("length"),f=0===r&&e===u-1,g=r===u-1&&0===e,d=void 0===this._isBackward?r>e:this._isBackward,p=d&&f||!d&&g;p&&(c=i.call(this,d,o,l),h[o]=c+"px");var v=this.get("duration"),m=this.get("easing"),_=this;this.anim=this.content.animate(h,v,m,function(){_.anim=null,p&&n.call(_,d,o,l)})}else this.content.css(h)}}(jQuery,Hui.Plugins=Hui.Plugins||{});var Hui=Hui||{};!function(t){"use strict";function e(e,i,n,s){for(var r=t("<ul>"),a=0;e>a;a++){var o=a===i?n:"";t("<li>",{"class":o,html:a+1}).appendTo(r)}return s?r.children():r}function i(t){return{UI_SWITCHABLE:t||"",NAV_CLASS:t?t+"-nav":"",CONTENT_CLASS:t?t+"-content":"",TRIGGER_CLASS:t?t+"-trigger":"",PANEL_CLASS:t?t+"-panel":"",PREV_BTN_CLASS:t?t+"-prev-btn":"",NEXT_BTN_CLASS:t?t+"-next-btn":""}}var n=Hui.Widget,s=Hui.Plugins.Effects,r=Hui.Plugins.Autoplay,a=Hui.Plugins.Circular,o=n.extend({attrs:{triggers:{value:[],getter:function(e){return t(e)}},panels:{value:[],getter:function(e){return t(e)}},classPrefix:"ui-switchable",hasTriggers:!0,triggerType:"hover",delay:100,activeIndex:{value:0,setter:function(t){return parseInt(t)||0}},step:1,length:{readOnly:!0,getter:function(){return Math.ceil(this.get("panels").length/this.get("step"))}},viewSize:[],activeTriggerClass:{getter:function(t){return t?t:this.get("classPrefix")+"-active"}}},setup:function(){this._initConstClass(),this._initElement();var t=this._getDatasetRole();this._initPanels(t),this._initTriggers(t),this._bindTriggers(),this._initPlugins(),this.render()},_initConstClass:function(){this.CONST=i(this.get("classPrefix"))},_initElement:function(){this.element.addClass(this.CONST.UI_SWITCHABLE)},_getDatasetRole:function(){var e=this,i={},n=["trigger","panel","nav","content"];return t.each(n,function(t,n){var s=e.$("[data-role="+n+"]");s.length&&(i[n]=s)}),i},_initPanels:function(t){var e=this.get("panels");if(e.length>0||(t.panel?this.set("panels",e=t.panel):t.content&&(this.set("panels",e=t.content.find("> *")),this.content=t.content)),0===e.length)throw new Error("panels.length is ZERO");this.content||(this.content=e.parent()),this.content.addClass(this.CONST.CONTENT_CLASS),this.get("panels").addClass(this.CONST.PANEL_CLASS)},_initTriggers:function(i){var n=this.get("triggers");n.length>0||(i.trigger?this.set("triggers",n=i.trigger):i.nav?(n=i.nav.find("> *"),0===n.length&&(n=e(this.get("length"),this.get("activeIndex"),this.get("activeTriggerClass"),!0).appendTo(i.nav)),this.set("triggers",n),this.nav=i.nav):this.get("hasTriggers")&&(this.nav=e(this.get("length"),this.get("activeIndex"),this.get("activeTriggerClass")).appendTo(this.element),this.set("triggers",n=this.nav.children()))),!this.nav&&n.length&&(this.nav=n.parent()),this.nav&&this.nav.addClass(this.CONST.NAV_CLASS),n.addClass(this.CONST.TRIGGER_CLASS).each(function(e,i){t(i).data("value",e)})},_bindTriggers:function(){function e(e){n._onFocusTrigger(e.type,t(this).data("value"))}function i(){clearTimeout(n._switchTimer)}var n=this,s=this.get("triggers");"click"===this.get("triggerType")?s.click(e):s.hover(e,i)},_onFocusTrigger:function(t,e){var i=this;"click"===t?this.switchTo(e):this._switchTimer=setTimeout(function(){i.switchTo(e)},this.get("delay"))},_initPlugins:function(){this._plugins=[],this._plug(s),this._plug(r),this._plug(a)},switchTo:function(t){this.set("activeIndex",t)},_onRenderActiveIndex:function(t,e){this._switchTo(t,e)},_switchTo:function(t,e){this.trigger("switch",t,e),this._switchTrigger(t,e),this._switchPanel(this._getPanelInfo(t,e)),this.trigger("switched",t,e),this._isBackward=void 0},_switchTrigger:function(t,e){var i=this.get("triggers");i.length<1||(i.eq(e).removeClass(this.get("activeTriggerClass")),i.eq(t).addClass(this.get("activeTriggerClass")))},_switchPanel:function(t){t.fromPanels.hide(),t.toPanels.show()},_getPanelInfo:function(e,i){var n,s,r=this.get("panels").get(),a=this.get("step");return i>-1&&(n=r.slice(i*a,(i+1)*a)),s=r.slice(e*a,(e+1)*a),{toIndex:e,fromIndex:i,toPanels:t(s),fromPanels:t(n)}},prev:function(){this._isBackward=!0;var t=this.get("activeIndex"),e=(t-1+this.get("length"))%this.get("length");this.switchTo(e)},next:function(){this._isBackward=!1;var t=this.get("activeIndex"),e=(t+1)%this.get("length");this.switchTo(e)},_plug:function(t){var e=t.attrs;if(e)for(var i in e)!e.hasOwnProperty(i)||i in this.attrs||this.set(i,e[i]);t.isNeeded.call(this)&&(t.install&&t.install.call(this),this._plugins.push(t))},destroy:function(){var e=this;t.each(this._plugins,function(t,i){i.destroy&&i.destroy.call(e)}),o.superclass.destroy.call(this)}});Hui.Switchable=o}(jQuery),Hui.Switchable.Tabs=Hui.Switchable.extend({}),Hui.Switchable.Slide=Hui.Switchable.extend({attrs:{autoplay:!0,circular:!0}}),!function(t){"use strict";var e=Hui.Switchable;Hui.Switchable.Carousel=e.extend({attrs:{circular:!0,prevBtn:{getter:function(e){return t(e).eq(0)}},nextBtn:{getter:function(e){return t(e).eq(0)}},disabledBtnClass:{getter:function(t){return t?t:this.get("classPrefix")+"-disabled-btn"}}},_initTriggers:function(t){e.prototype._initTriggers.call(this,t);var i=this.get("prevBtn"),n=this.get("nextBtn");!i[0]&&t.prev&&(i=t.prev,this.set("prevBtn",i)),!n[0]&&t.next&&(n=t.next,this.set("nextBtn",n)),i.addClass(this.CONST.PREV_BTN_CLASS),n.addClass(this.CONST.NEXT_BTN_CLASS)},_getDatasetRole:function(){var i=e.prototype._getDatasetRole.call(this),n=this,s=["next","prev"];return t.each(s,function(t,e){var s=n.$("[data-role="+e+"]");s.length&&(i[e]=s)}),i},_bindTriggers:function(){e.prototype._bindTriggers.call(this);var t=this,i=this.get("circular");this.get("prevBtn").click(function(e){e.preventDefault(),(i||t.get("activeIndex")>0)&&t.prev()}),this.get("nextBtn").click(function(e){e.preventDefault();var n=t.get("length")-1;(i||t.get("activeIndex")<n)&&t.next()}),i||this.on("switch",function(e){t._updateButtonStatus(e)})},_updateButtonStatus:function(t){var e=this.get("prevBtn"),i=this.get("nextBtn"),n=this.get("disabledBtnClass");e.removeClass(n),i.removeClass(n),0===t?e.addClass(n):t===this.get("length")-1&&i.addClass(n)}})}(jQuery),!function(t){"use strict";var e=t.Switchable,i=e.extend({
attrs:{triggerType:"click",multiple:!1,autoplay:!1},switchTo:function(t){this.get("multiple")?this._switchTo(t,t):e.prototype.switchTo.call(this,t)},_switchTrigger:function(t,i){this.get("multiple")?this.get("triggers").eq(t).toggleClass(this.get("activeTriggerClass")):e.prototype._switchTrigger.call(this,t,i)},_switchPanel:function(t){this.get("multiple")?t.toPanels.toggle():e.prototype._switchPanel.call(this,t)}});t.Switchable.Accordion=i}(Hui);