// Class
// -----------------
// Thanks to:
//  - http://mootools.net/docs/core/Class/Class
//  - http://ejohn.org/blog/simple-javascript-inheritance/
//  - https://github.com/ded/klass
//  - http://documentcloud.github.com/backbone/#Model-extend
//  - https://github.com/joyent/node/blob/master/lib/util.js
//  - https://github.com/kissyteam/kissy/blob/master/src/seed/src/kissy.js

var Hui = Hui || {};

(function() {
  'use strict';

  // The base Class implementation.
  function Class(o) {
    // Convert existed function to Class.
    if (!(this instanceof Class) && isFunction(o)) {
      return classify(o)
    }
  }

  Hui.Class = Class;


  // Create a new Class.
  //
  //  var SuperPig = Class.create({
  //    Extends: Animal,
  //    Implements: Flyable,
  //    initialize: function() {
  //      SuperPig.superclass.initialize.apply(this, arguments)
  //    },
  //    Statics: {
  //      COLOR: 'red'
  //    }
  // })
  //
  Class.create = function(parent, properties) {
    if (!isFunction(parent)) {
      properties = parent
      parent = null
    }

    properties || (properties = {})
    parent || (parent = properties.Extends || Class)
    properties.Extends = parent

    // The created class constructor
    function SubClass() {
      // Call the parent constructor.
      parent.apply(this, arguments)

      // Only call initialize in self constructor.
      if (this.constructor === SubClass && this.initialize) {
        this.initialize.apply(this, arguments)
      }
    }

    // Inherit class (static) properties from parent.
    if (parent !== Class) {
      mix(SubClass, parent, parent.StaticsWhiteList)
    }

    // Add instance properties to the subclass.
    implement.call(SubClass, properties)

    // Make subclass extendable.
    return classify(SubClass)
  }


  function implement(properties) {
    var key, value

    for (key in properties) {
      value = properties[key]

      if (Class.Mutators.hasOwnProperty(key)) {
        Class.Mutators[key].call(this, value)
      } else {
        this.prototype[key] = value
      }
    }
  }


  // Create a sub Class based on `Class`.
  Class.extend = function(properties) {
    properties || (properties = {})
    properties.Extends = this

    return Class.create(properties)
  }


  function classify(cls) {
    cls.extend = Class.extend
    cls.implement = implement
    return cls
  }


  // Mutators define special properties.
  Class.Mutators = {

    'Extends': function(parent) {
      var existed = this.prototype
      var proto = createProto(parent.prototype)

      // Keep existed properties.
      mix(proto, existed)

      // Enforce the constructor to be what we expect.
      proto.constructor = this

      // Set the prototype chain to inherit from `parent`.
      this.prototype = proto

      // Set a convenience property in case the parent's prototype is
      // needed later.
      this.superclass = parent.prototype
    },

    'Implements': function(items) {
      isArray(items) || (items = [items])
      var proto = this.prototype, item

      while (item = items.shift()) {
        mix(proto, item.prototype || item)
      }
    },

    'Statics': function(staticProperties) {
      mix(this, staticProperties)
    }
  }


  // Shared empty constructor function to aid in prototype-chain creation.
  function Ctor() {
  }

  // See: http://jsperf.com/object-create-vs-new-ctor
  var createProto = Object.__proto__ ?
      function(proto) {
        return { __proto__: proto }
      } :
      function(proto) {
        Ctor.prototype = proto
        return new Ctor()
      }


  // Helpers
  // ------------

  function mix(r, s, wl) {
    // Copy "all" properties including inherited ones.
    for (var p in s) {
      if (s.hasOwnProperty(p)) {
        if (wl && indexOf(wl, p) === -1) continue

        // 在 iPhone 1 代等设备的 Safari 中，prototype 也会被枚举出来，需排除
        if (p !== 'prototype') {
          r[p] = s[p]
        }
      }
    }
  }


  var toString = Object.prototype.toString

  var isArray = Array.isArray || function(val) {
      return toString.call(val) === '[object Array]'
  }

  var isFunction = function(val) {
    return toString.call(val) === '[object Function]'
  }

  var indexOf = Array.prototype.indexOf ?
      function(arr, item) {
        return arr.indexOf(item)
      } :
      function(arr, item) {
        for (var i = 0, len = arr.length; i < len; i++) {
          if (arr[i] === item) {
            return i
          }
        }
        return -1
      }

})()
// Events
// -----------------
// Thanks to:
//  - https://github.com/documentcloud/backbone/blob/master/backbone.js
//  - https://github.com/joyent/node/blob/master/lib/events.js
var Hui = Hui || {};

(function() {
  'use strict';



  // Regular expression used to split event strings
  var eventSplitter = /\s+/


  // A module that can be mixed in to *any object* in order to provide it
  // with custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = new Events();
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  function Events() {
  }


  // Bind one or more space separated events, `events`, to a `callback`
  // function. Passing `"all"` will bind the callback to all events fired.
  Events.prototype.on = function(events, callback, context) {
    var cache, event, list
    if (!callback) return this

    cache = this.__events || (this.__events = {})
    events = events.split(eventSplitter)

    while (event = events.shift()) {
      list = cache[event] || (cache[event] = [])
      list.push(callback, context)
    }

    return this
  }

  Events.prototype.once = function(events, callback, context) {
    var that = this
    var cb = function() {
      that.off(events, cb)
      callback.apply(context || that, arguments)
    }
    return this.on(events, cb, context)
  }

  // Remove one or many callbacks. If `context` is null, removes all callbacks
  // with that function. If `callback` is null, removes all callbacks for the
  // event. If `events` is null, removes all bound callbacks for all events.
  Events.prototype.off = function(events, callback, context) {
    var cache, event, list, i

    // No events, or removing *all* events.
    if (!(cache = this.__events)) return this
    if (!(events || callback || context)) {
      delete this.__events
      return this
    }

    events = events ? events.split(eventSplitter) : keys(cache)

    // Loop through the callback list, splicing where appropriate.
    while (event = events.shift()) {
      list = cache[event]
      if (!list) continue

      if (!(callback || context)) {
        delete cache[event]
        continue
      }

      for (i = list.length - 2; i >= 0; i -= 2) {
        if (!(callback && list[i] !== callback ||
            context && list[i + 1] !== context)) {
          list.splice(i, 2)
        }
      }
    }

    return this
  }


  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  Events.prototype.trigger = function(events) {
    var cache, event, all, list, i, len, rest = [], args, returned = true;
    if (!(cache = this.__events)) return this

    events = events.split(eventSplitter)

    // Fill up `rest` with the callback arguments.  Since we're only copying
    // the tail of `arguments`, a loop is much faster than Array#slice.
    for (i = 1, len = arguments.length; i < len; i++) {
      rest[i - 1] = arguments[i]
    }

    // For each event, walk through the list of callbacks twice, first to
    // trigger the event, then to trigger any `"all"` callbacks.
    while (event = events.shift()) {
      // Copy callback lists to prevent modification.
      if (all = cache.all) all = all.slice()
      if (list = cache[event]) list = list.slice()

      // Execute event callbacks except one named "all"
      if (event !== 'all') {
        returned = triggerEvents(list, rest, this) && returned
      }

      // Execute "all" callbacks.
      returned = triggerEvents(all, [event].concat(rest), this) && returned
    }

    return returned
  }

  Events.prototype.emit = Events.prototype.trigger


  // Helpers
  // -------

  var keys = Object.keys

  if (!keys) {
    keys = function(o) {
      var result = []

      for (var name in o) {
        if (o.hasOwnProperty(name)) {
          result.push(name)
        }
      }
      return result
    }
  }

  // Mix `Events` to object instance or Class function.
  Events.mixTo = function(receiver) {
    receiver = isFunction(receiver) ? receiver.prototype : receiver
    var proto = Events.prototype

    var event = new Events
    for (var key in proto) {
      if (proto.hasOwnProperty(key)) {
        copyProto(key)
      }
    }

    function copyProto(key) {
      receiver[key] = function() {
        proto[key].apply(event, Array.prototype.slice.call(arguments))
        return this
      }
    }
  }

  // Execute callbacks
  function triggerEvents(list, args, context) {
    var pass = true

    if (list) {
      var i = 0, l = list.length, a1 = args[0], a2 = args[1], a3 = args[2]
      // call is faster than apply, optimize less than 3 argu
      // http://blog.csdn.net/zhengyinhui100/article/details/7837127
      switch (args.length) {
        case 0: for (; i < l; i += 2) {pass = list[i].call(list[i + 1] || context) !== false && pass} break;
        case 1: for (; i < l; i += 2) {pass = list[i].call(list[i + 1] || context, a1) !== false && pass} break;
        case 2: for (; i < l; i += 2) {pass = list[i].call(list[i + 1] || context, a1, a2) !== false && pass} break;
        case 3: for (; i < l; i += 2) {pass = list[i].call(list[i + 1] || context, a1, a2, a3) !== false && pass} break;
        default: for (; i < l; i += 2) {pass = list[i].apply(list[i + 1] || context, args) !== false && pass} break;
      }
    }
    // trigger will return false if one of the callbacks return false
    return pass;
  }

  function isFunction(func) {
    return Object.prototype.toString.call(func) === '[object Function]'
  }

  Hui.Events = Events;

})();
// Aspect
// ---------------------
// Thanks to:
//  - http://yuilibrary.com/yui/docs/api/classes/Do.html
//  - http://code.google.com/p/jquery-aop/
//  - http://lazutkin.com/blog/2008/may/18/aop-aspect-javascript-dojo/
var Hui = Hui || {};

(function() {
  'use strict';

  Hui.Aspect = {};

  // 在指定方法执行前，先执行 callback
  Hui.Aspect.before = function(methodName, callback, context) {
    return weave.call(this, 'before', methodName, callback, context);
  };


  // 在指定方法执行后，再执行 callback
  Hui.Aspect.after = function(methodName, callback, context) {
    return weave.call(this, 'after', methodName, callback, context);
  };


  // Helpers
  // -------

  var eventSplitter = /\s+/;

  function weave(when, methodName, callback, context) {
    var names = methodName.split(eventSplitter);
    var name, method;

    while (name = names.shift()) {
      method = getMethod(this, name);
      if (!method.__isAspected) {
        wrap.call(this, name);
      }
      this.on(when + ':' + name, callback, context);
    }

    return this;
  }


  function getMethod(host, methodName) {
    var method = host[methodName];
    if (!method) {
      throw new Error('Invalid method name: ' + methodName);
    }
    return method;
  }


  function wrap(methodName) {
    var old = this[methodName];

    this[methodName] = function() {
      var args = Array.prototype.slice.call(arguments);
      var beforeArgs = ['before:' + methodName].concat(args);

      // prevent if trigger return false
      if (this.trigger.apply(this, beforeArgs) === false) return;

      var ret = old.apply(this, arguments);
      var afterArgs = ['after:' + methodName, ret].concat(args);
      this.trigger.apply(this, afterArgs);

      return ret;
    };

    this[methodName].__isAspected = true;
  }

})()
// Attribute
// -----------------
// Thanks to:
//  - http://documentcloud.github.com/backbone/#Model
//  - http://yuilibrary.com/yui/docs/api/classes/AttributeCore.html
//  - https://github.com/berzniz/backbone.getters.setters
var Hui = Hui || {};

(function() {
  'use strict';

  Hui.Attribute = {};

  // 负责 attributes 的初始化
  // attributes 是与实例相关的状态信息，可读可写，发生变化时，会自动触发相关事件
  Hui.Attribute.initAttrs = function(config) {
    // initAttrs 是在初始化时调用的，默认情况下实例上肯定没有 attrs，不存在覆盖问题
    var attrs = this.attrs = {};

    // Get all inherited attributes.
    var specialProps = this.propsInAttrs || [];
    mergeInheritedAttrs(attrs, this, specialProps);

    // Merge user-specific attributes from config.
    if (config) {
      mergeUserValue(attrs, config);
    }

    // 对于有 setter 的属性，要用初始值 set 一下，以保证关联属性也一同初始化
    setSetterAttrs(this, attrs, config);

    // Convert `on/before/afterXxx` config to event handler.
    parseEventsFromAttrs(this, attrs);

    // 将 this.attrs 上的 special properties 放回 this 上
    copySpecialProps(specialProps, this, attrs, true);
  };


  // Get the value of an attribute.
  Hui.Attribute.get = function(key) {
    var attr = this.attrs[key] || {};
    var val = attr.value;
    return attr.getter ? attr.getter.call(this, val, key) : val;
  };


  // Set a hash of model attributes on the object, firing `"change"` unless
  // you choose to silence it.
  Hui.Attribute.set = function(key, val, options) {
    var attrs = {};

    // set("key", val, options)
    if (isString(key)) {
      attrs[key] = val;
    }
    // set({ "key": val, "key2": val2 }, options)
    else {
      attrs = key;
      options = val;
    }

    options || (options = {});
    var silent = options.silent;
    var override = options.override;

    var now = this.attrs;
    var changed = this.__changedAttrs || (this.__changedAttrs = {});

    for (key in attrs) {
      if (!attrs.hasOwnProperty(key)) continue;

      var attr = now[key] || (now[key] = {});
      val = attrs[key];

      if (attr.readOnly) {
        throw new Error('This attribute is readOnly: ' + key);
      }

      // invoke setter
      if (attr.setter) {
        val = attr.setter.call(this, val, key);
      }

      // 获取设置前的 prev 值
      var prev = this.get(key);

      // 获取需要设置的 val 值
      // 如果设置了 override 为 true，表示要强制覆盖，就不去 merge 了
      // 都为对象时，做 merge 操作，以保留 prev 上没有覆盖的值
      if (!override && isPlainObject(prev) && isPlainObject(val)) {
        val = merge(merge({}, prev), val);
      }

      // set finally
      now[key].value = val;

      // invoke change event
      // 初始化时对 set 的调用，不触发任何事件
      if (!this.__initializingAttrs && !isEqual(prev, val)) {
        if (silent) {
          changed[key] = [val, prev];
        }
        else {
          this.trigger('change:' + key, val, prev, key);
        }
      }
    }

    return this;
  };


  // Call this method to manually fire a `"change"` event for triggering
  // a `"change:attribute"` event for each changed attribute.
  Hui.Attribute.change = function() {
    var changed = this.__changedAttrs;

    if (changed) {
      for (var key in changed) {
        if (changed.hasOwnProperty(key)) {
          var args = changed[key];
          this.trigger('change:' + key, args[0], args[1], key);
        }
      }
      delete this.__changedAttrs;
    }

    return this;
  };

  // for test
  Hui.Attribute._isPlainObject = isPlainObject;

  // Helpers
  // -------

  var toString = Object.prototype.toString;
  var hasOwn = Object.prototype.hasOwnProperty;

  /**
   * Detect the JScript [[DontEnum]] bug:
   * In IE < 9 an objects own properties, shadowing non-enumerable ones, are
   * made non-enumerable as well.
   * https://github.com/bestiejs/lodash/blob/7520066fc916e205ef84cb97fbfe630d7c154158/lodash.js#L134-L144
   */
  /** Detect if own properties are iterated after inherited properties (IE < 9) */
  var iteratesOwnLast;
  (function() {
    var props = [];
    function Ctor() { this.x = 1; }
    Ctor.prototype = { 'valueOf': 1, 'y': 1 };
    for (var prop in new Ctor()) { props.push(prop); }
    iteratesOwnLast = props[0] !== 'x';
  }());

  var isArray = Array.isArray || function(val) {
    return toString.call(val) === '[object Array]';
  };

  function isString(val) {
    return toString.call(val) === '[object String]';
  }

  function isFunction(val) {
    return toString.call(val) === '[object Function]';
  }

  function isWindow(o) {
    return o != null && o == o.window;
  }

  function isPlainObject(o) {
    // Must be an Object.
    // Because of IE, we also have to check the presence of the constructor
    // property. Make sure that DOM nodes and window objects don't
    // pass through, as well
    if (!o || toString.call(o) !== "[object Object]" ||
        o.nodeType || isWindow(o)) {
      return false;
    }

    try {
      // Not own constructor property must be Object
      if (o.constructor &&
          !hasOwn.call(o, "constructor") &&
          !hasOwn.call(o.constructor.prototype, "isPrototypeOf")) {
        return false;
      }
    } catch (e) {
      // IE8,9 Will throw exceptions on certain host objects #9897
      return false;
    }

    var key;

    // Support: IE<9
    // Handle iteration over inherited properties before own properties.
    // http://bugs.jquery.com/ticket/12199
    if (iteratesOwnLast) {
      for (key in o) {
        return hasOwn.call(o, key);
      }
    }

    // Own properties are enumerated firstly, so to speed up,
    // if last one is own, then all properties are own.
    for (key in o) {}

    return key === undefined || hasOwn.call(o, key);
  }

  function isEmptyObject(o) {
    if (!o || toString.call(o) !== "[object Object]" ||
        o.nodeType || isWindow(o) || !o.hasOwnProperty) {
      return false;
    }

    for (var p in o) {
      if (o.hasOwnProperty(p)) return false;
    }
    return true;
  }

  function merge(receiver, supplier) {
    var key, value;

    for (key in supplier) {
      if (supplier.hasOwnProperty(key)) {
        receiver[key] = cloneValue(supplier[key], receiver[key]);
      }
    }

    return receiver;
  }

  // 只 clone 数组和 plain object，其他的保持不变
  function cloneValue(value, prev){
    if (isArray(value)) {
      value = value.slice();
    }
    else if (isPlainObject(value)) {
      isPlainObject(prev) || (prev = {});

      value = merge(prev, value);
    }

    return value;
  }

  var keys = Object.keys;

  if (!keys) {
    keys = function(o) {
      var result = [];

      for (var name in o) {
        if (o.hasOwnProperty(name)) {
          result.push(name);
        }
      }
      return result;
    };
  }

  function mergeInheritedAttrs(attrs, instance, specialProps) {
    var inherited = [];
    var proto = instance.constructor.prototype;

    while (proto) {
      // 不要拿到 prototype 上的
      if (!proto.hasOwnProperty('attrs')) {
        proto.attrs = {};
      }

      // 将 proto 上的特殊 properties 放到 proto.attrs 上，以便合并
      copySpecialProps(specialProps, proto.attrs, proto);

      // 为空时不添加
      if (!isEmptyObject(proto.attrs)) {
        inherited.unshift(proto.attrs);
      }

      // 向上回溯一级
      proto = proto.constructor.superclass;
    }

    // Merge and clone default values to instance.
    for (var i = 0, len = inherited.length; i < len; i++) {
      mergeAttrs(attrs, normalize(inherited[i]));
    }
  }

  function mergeUserValue(attrs, config) {
    mergeAttrs(attrs, normalize(config, true), true);
  }

  function copySpecialProps(specialProps, receiver, supplier, isAttr2Prop) {
    for (var i = 0, len = specialProps.length; i < len; i++) {
      var key = specialProps[i];

      if (supplier.hasOwnProperty(key)) {
        receiver[key] = isAttr2Prop ? receiver.get(key) : supplier[key];
      }
    }
  }


  var EVENT_PATTERN = /^(on|before|after)([A-Z].*)$/;
  var EVENT_NAME_PATTERN = /^(Change)?([A-Z])(.*)/;

  function parseEventsFromAttrs(host, attrs) {
    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        var value = attrs[key].value, m;

        if (isFunction(value) && (m = key.match(EVENT_PATTERN))) {
          host[m[1]](getEventName(m[2]), value);
          delete attrs[key];
        }
      }
    }
  }

  // Converts `Show` to `show` and `ChangeTitle` to `change:title`
  function getEventName(name) {
    var m = name.match(EVENT_NAME_PATTERN);
    var ret = m[1] ? 'change:' : '';
    ret += m[2].toLowerCase() + m[3];
    return ret;
  }


  function setSetterAttrs(host, attrs, config) {
    var options = { silent: true };
    host.__initializingAttrs = true;

    for (var key in config) {
      if (config.hasOwnProperty(key)) {
        if (attrs[key].setter) {
          host.set(key, config[key], options);
        }
      }
    }

    delete host.__initializingAttrs;
  }


  var ATTR_SPECIAL_KEYS = ['value', 'getter', 'setter', 'readOnly'];

  // normalize `attrs` to
  //
  //   {
  //      value: 'xx',
  //      getter: fn,
  //      setter: fn,
  //      readOnly: boolean
  //   }
  //
  function normalize(attrs, isUserValue) {
    var newAttrs = {};

    for (var key in attrs) {
      var attr = attrs[key];

      if (!isUserValue &&
          isPlainObject(attr) &&
          hasOwnProperties(attr, ATTR_SPECIAL_KEYS)) {
        newAttrs[key] = attr;
        continue;
      }

      newAttrs[key] = {
        value: attr
      };
    }

    return newAttrs;
  }

  var ATTR_OPTIONS = ['setter', 'getter', 'readOnly'];
  // 专用于 attrs 的 merge 方法
  function mergeAttrs(attrs, inheritedAttrs, isUserValue){
    var key, value;
    var attr;

    for (key in inheritedAttrs) {
      if (inheritedAttrs.hasOwnProperty(key)) {
        value = inheritedAttrs[key];
        attr = attrs[key];

        if (!attr) {
          attr = attrs[key] = {};
        }

        // 从严谨上来说，遍历 ATTR_SPECIAL_KEYS 更好
        // 从性能来说，直接 人肉赋值 更快
        // 这里还是选择 性能优先

        // 只有 value 要复制原值，其他的直接覆盖即可
        (value['value'] !== undefined) && (attr['value'] = cloneValue(value['value'], attr['value']));

        // 如果是用户赋值，只要考虑value
        if (isUserValue) continue;

        for (var i in ATTR_OPTIONS) {
          var option = ATTR_OPTIONS[i];
          if (value[option] !== undefined) {
            attr[option] = value[option];
          }
        }
      }
    }

    return attrs;
  }

  function hasOwnProperties(object, properties) {
    for (var i = 0, len = properties.length; i < len; i++) {
      if (object.hasOwnProperty(properties[i])) {
        return true;
      }
    }
    return false;
  }


  // 对于 attrs 的 value 来说，以下值都认为是空值： null, undefined, '', [], {}
  function isEmptyAttrValue(o) {
    return o == null || // null, undefined
        (isString(o) || isArray(o)) && o.length === 0 || // '', []
        isEmptyObject(o); // {}
  }

  // 判断属性值 a 和 b 是否相等，注意仅适用于属性值的判断，非普适的 === 或 == 判断。
  function isEqual(a, b) {
    if (a === b) return true;

    if (isEmptyAttrValue(a) && isEmptyAttrValue(b)) return true;

    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;

    switch (className) {

      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are
        // equivalent; thus, `"5"` is equivalent to `new String("5")`.
        return a == String(b);

      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `equal`
        // comparison is performed for other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);

      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values.
        // Dates are compared by their millisecond representations.
        // Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;

      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
            a.global == b.global &&
            a.multiline == b.multiline &&
            a.ignoreCase == b.ignoreCase;

      // 简单判断数组包含的 primitive 值是否相等
      case '[object Array]':
        var aString = a.toString();
        var bString = b.toString();

        // 只要包含非 primitive 值，为了稳妥起见，都返回 false
        return aString.indexOf('[object') === -1 &&
            bString.indexOf('[object') === -1 &&
            aString === bString;
    }

    if (typeof a != 'object' || typeof b != 'object') return false;

    // 简单判断两个对象是否相等，只判断第一层
    if (isPlainObject(a) && isPlainObject(b)) {

      // 键值不相等，立刻返回 false
      if (!isEqual(keys(a), keys(b))) {
        return false;
      }

      // 键相同，但有值不等，立刻返回 false
      for (var p in a) {
        if (a[p] !== b[p]) return false;
      }

      return true;
    }

    // 其他情况返回 false, 以避免误判导致 change 事件没发生
    return false;
  }

})();

// Base
// ---------
// Base 是一个基础类，提供 Class、Events、Attrs 和 Aspect 支持。

var Hui = Hui || {};

(function(){

  'use strict';

  var Class = Hui.Class;
  var Events = Hui.Events;
  var Aspect = Hui.Aspect;
  var Attribute = Hui.Attribute;


  Hui.Base = Class.create({
    Implements: [Events, Aspect, Attribute],

    initialize: function(config) {
      this.initAttrs(config);

      // Automatically register `this._onChangeAttr` method as
      // a `change:attr` event handler.
      parseEventsFromInstance(this, this.attrs);
    },

    destroy: function() {
      this.off();

      for (var p in this) {
        if (this.hasOwnProperty(p)) {
          delete this[p];
        }
      }

      // Destroy should be called only once, generate a fake destroy after called
      // https://github.com/aralejs/widget/issues/50
      this.destroy = function() {};
    }
  });


  function parseEventsFromInstance(host, attrs) {
    for (var attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        var m = '_onChange' + ucfirst(attr);
        if (host[m]) {
          host.on('change:' + attr, host[m]);
        }
      }
    }
  }

  function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  }

})()

var Hui = Hui || {};

(function($) {
  'use strict';

  Hui.AutoRender = {};

  var DATA_WIDGET_AUTO_RENDERED = 'data-widget-auto-rendered'


  // 自动渲染接口，子类可根据自己的初始化逻辑进行覆盖
  Hui.AutoRender.autoRender = function(config) {
    return new this(config).render()
  }


  // 根据 data-widget 属性，自动渲染所有开启了 data-api 的 widget 组件
  Hui.AutoRender.autoRenderAll = function(root, callback) {
    if (typeof root === 'function') {
      callback = root
      root = null
    }

    root = $(root || document.body)
    var modules = []
    var elements = []

    root.find('[data-widget]').each(function(i, element) {
      if (!exports.isDataApiOff(element)) {
        modules.push(element.getAttribute('data-widget').toLowerCase())
        elements.push(element)
      }
    })

    if (modules.length) {
      seajs.use(modules, function() {

        for (var i = 0; i < arguments.length; i++) {
          var SubWidget = arguments[i]
          var element = $(elements[i])

          // 已经渲染过
          if (element.attr(DATA_WIDGET_AUTO_RENDERED)) continue

          var config = {
            initElement: element,
            renderType: 'auto'
          };

          // data-widget-role 是指将当前的 DOM 作为 role 的属性去实例化，默认的 role 为 element
          var role = element.attr('data-widget-role')
          config[role ? role : 'element'] = element

          // 调用自动渲染接口
          SubWidget.autoRender && SubWidget.autoRender(config)

          // 标记已经渲染过
          element.attr(DATA_WIDGET_AUTO_RENDERED, 'true')
        }

        // 在所有自动渲染完成后，执行回调
        callback && callback()
      })
    }
  }


  var isDefaultOff = $(document.body).attr('data-api') === 'off'

  // 是否没开启 data-api
  Hui.AutoRender.isDataApiOff = function(element) {
    var elementDataApi = $(element).attr('data-api')

    // data-api 默认开启，关闭只有两种方式：
    //  1. element 上有 data-api="off"，表示关闭单个
    //  2. document.body 上有 data-api="off"，表示关闭所有
    return  elementDataApi === 'off' ||
        (elementDataApi !== 'on' && isDefaultOff)
  }

})(jQuery);
// DAParser
// --------
// data api 解析器，提供对单个 element 的解析，可用来初始化页面中的所有 Widget 组件。
var Hui = Hui || {};

(function($, win) {
  'use strict';

  Hui.DAParser = {};


  // 得到某个 DOM 元素的 dataset
  Hui.DAParser.parseElement = function(element, raw) {
    element = $(element)[0]
    var dataset = {}

    // ref: https://developer.mozilla.org/en/DOM/element.dataset
    if (element.dataset) {
      // 转换成普通对象
      dataset = $.extend({}, element.dataset)
    }
    else {
      var attrs = element.attributes

      for (var i = 0, len = attrs.length; i < len; i++) {
        var attr = attrs[i]
        var name = attr.name

        if (name.indexOf('data-') === 0) {
          name = camelCase(name.substring(5))
          dataset[name] = attr.value
        }
      }
    }

    return raw === true ? dataset : normalizeValues(dataset)
  }


  // Helpers
  // ------

  var RE_DASH_WORD = /-([a-z])/g
  var JSON_LITERAL_PATTERN = /^\s*[\[{].*[\]}]\s*$/
  var parseJSON = win.JSON ? JSON.parse : $.parseJSON

  // 仅处理字母开头的，其他情况转换为小写："data-x-y-123-_A" --> xY-123-_a
  function camelCase(str) {
    return str.toLowerCase().replace(RE_DASH_WORD, function(all, letter) {
      return (letter + '').toUpperCase()
    })
  }

  // 解析并归一化配置中的值
  function normalizeValues(data) {
    for (var key in data) {
      if (data.hasOwnProperty(key)) {

        var val = data[key]
        if (typeof val !== 'string') continue

        if (JSON_LITERAL_PATTERN.test(val)) {
          val = val.replace(/'/g, '"')
          data[key] = normalizeValues(parseJSON(val))
        }
        else {
          data[key] = normalizeValue(val)
        }
      }
    }

    return data
  }

  // 将 'false' 转换为 false
  // 'true' 转换为 true
  // '3253.34' 转换为 3253.34
  function normalizeValue(val) {
    if (val.toLowerCase() === 'false') {
      val = false
    }
    else if (val.toLowerCase() === 'true') {
      val = true
    }
    else if (/\d/.test(val) && /[^a-z]/i.test(val)) {
      var number = parseFloat(val)
      if (number + '' === val) {
        val = number
      }
    }

    return val
  }

})(jQuery, window);
// Widget
// ---------
// Widget 是与 DOM 元素相关联的非工具类组件，主要负责 View 层的管理。
// Widget 组件具有四个要素：描述状态的 attributes 和 properties，描述行为的 events
// 和 methods。Widget 基类约定了这四要素创建时的基本流程和最佳实践。
var Hui = Hui || {};

(function($) {
  'use strict';

  var Base = Hui.Base;
  var DAParser = Hui.DAParser;
  var AutoRender = Hui.AutoRender;

  var DELEGATE_EVENT_NS = '.delegate-events-'
  var ON_RENDER = '_onRender'
  var DATA_WIDGET_CID = 'data-widget-cid'

  // 所有初始化过的 Widget 实例
  var cachedInstances = {}

  var Widget = Base.extend({

    // config 中的这些键值会直接添加到实例上，转换成 properties
    propsInAttrs: ['initElement', 'element', 'events'],

    // 与 widget 关联的 DOM 元素
    element: null,

    // 事件代理，格式为：
    //   {
    //     'mousedown .title': 'edit',
    //     'click {{attrs.saveButton}}': 'save'
    //     'click .open': function(ev) { ... }
    //   }
    events: null,

    // 属性列表
    attrs: {
      // 基本属性
      id: null,
      className: null,
      style: null,

      // 默认模板
      template: '<div></div>',

      // 默认数据模型
      model: null,

      // 组件的默认父节点
      parentNode: document.body
    },

    // 初始化方法，确定组件创建时的基本流程：
    // 初始化 attrs --》 初始化 props --》 初始化 events --》 子类的初始化
    initialize: function(config) {
      this.cid = uniqueCid()

      // 初始化 attrs
      var dataAttrsConfig = this._parseDataAttrsConfig(config)
      Widget.superclass.initialize.call(this, config ? $.extend(dataAttrsConfig, config) : dataAttrsConfig)

      // 初始化 props
      this.parseElement()
      this.initProps()

      // 初始化 events
      this.delegateEvents()

      // 子类自定义的初始化
      this.setup()

      // 保存实例信息
      this._stamp()

      // 是否由 template 初始化
      this._isTemplate = !(config && config.element)
    },

    // 解析通过 data-attr 设置的 api
    _parseDataAttrsConfig: function(config) {
      var element, dataAttrsConfig
      if (config) {
        element = config.initElement ? $(config.initElement) : $(config.element)
      }

      // 解析 data-api 时，只考虑用户传入的 element，不考虑来自继承或从模板构建的
      if (element && element[0] && !AutoRender.isDataApiOff(element)) {
        dataAttrsConfig = DAParser.parseElement(element)
      }

      return dataAttrsConfig
    },

    // 构建 this.element
    parseElement: function() {
      var element = this.element

      if (element) {
        this.element = $(element)
      }
      // 未传入 element 时，从 template 构建
      else if (this.get('template')) {
        this.parseElementFromTemplate()
      }

      // 如果对应的 DOM 元素不存在，则报错
      if (!this.element || !this.element[0]) {
        throw new Error('element is invalid')
      }
    },

    // 从模板中构建 this.element
    parseElementFromTemplate: function() {
      this.element = $(this.get('template'))
    },

    // 负责 properties 的初始化，提供给子类覆盖
    initProps: function() {
    },

    // 注册事件代理
    delegateEvents: function(element, events, handler) {
      var argus = trimRightUndefine(Array.prototype.slice.call(arguments));
      // widget.delegateEvents()
      if (argus.length === 0) {
        events = getEvents(this)
        element = this.element
      }

      // widget.delegateEvents({
      //   'click p': 'fn1',
      //   'click li': 'fn2'
      // })
      else if (argus.length === 1) {
        events = element
        element = this.element
      }

      // widget.delegateEvents('click p', function(ev) { ... })
      else if (argus.length === 2) {
        handler = events
        events = element
        element = this.element
      }

      // widget.delegateEvents(element, 'click p', function(ev) { ... })
      else {
        element || (element = this.element)
        this._delegateElements || (this._delegateElements = [])
        this._delegateElements.push($(element))
      }

      // 'click p' => {'click p': handler}
      if (isString(events) && isFunction(handler)) {
        var o = {}
        o[events] = handler
        events = o
      }

      // key 为 'event selector'
      for (var key in events) {
        if (!events.hasOwnProperty(key)) continue

        var args = parseEventKey(key, this)
        var eventType = args.type
        var selector = args.selector

        ;(function(handler, widget) {

          var callback = function(ev) {
            if (isFunction(handler)) {
              handler.call(widget, ev)
            } else {
              widget[handler](ev)
            }
          }

          // delegate
          if (selector) {
            $(element).on(eventType, selector, callback)
          }
          // normal bind
          // 分开写是为了兼容 zepto，zepto 的判断不如 jquery 强劲有力
          else {
            $(element).on(eventType, callback)
          }

        })(events[key], this)
      }

      return this
    },

    // 卸载事件代理
    undelegateEvents: function(element, eventKey) {
      var argus = trimRightUndefine(Array.prototype.slice.call(arguments));

      if (!eventKey) {
        eventKey = element
        element = null
      }

      // 卸载所有
      // .undelegateEvents()
      if (argus.length === 0) {
        var type = DELEGATE_EVENT_NS + this.cid

        this.element && this.element.off(type)

        // 卸载所有外部传入的 element
        if (this._delegateElements) {
          for (var de in this._delegateElements) {
            if (!this._delegateElements.hasOwnProperty(de)) continue
            this._delegateElements[de].off(type)
          }
        }

      } else {
        var args = parseEventKey(eventKey, this)

        // 卸载 this.element
        // .undelegateEvents(events)
        if (!element) {
          this.element && this.element.off(args.type, args.selector)
        }

        // 卸载外部 element
        // .undelegateEvents(element, events)
        else {
          $(element).off(args.type, args.selector)
        }
      }
      return this
    },

    // 提供给子类覆盖的初始化方法
    setup: function() {
    },

    // 将 widget 渲染到页面上
    // 渲染不仅仅包括插入到 DOM 树中，还包括样式渲染等
    // 约定：子类覆盖时，需保持 `return this`
    render: function() {

      // 让渲染相关属性的初始值生效，并绑定到 change 事件
      if (!this.rendered) {
        this._renderAndBindAttrs()
        this.rendered = true
      }

      // 插入到文档流中
      var parentNode = this.get('parentNode')
      if (parentNode && !isInDocument(this.element[0])) {
        // 隔离样式，添加统一的命名空间
        // https://github.com/aliceui/aliceui.org/issues/9
        var outerBoxClass = this.constructor.outerBoxClass
        if (outerBoxClass) {
          var outerBox = this._outerBox = $('<div></div>').addClass(outerBoxClass)
          outerBox.append(this.element).appendTo(parentNode)
        } else {
          this.element.appendTo(parentNode)
        }
      }

      return this
    },

    // 让属性的初始值生效，并绑定到 change:attr 事件上
    _renderAndBindAttrs: function() {
      var widget = this
      var attrs = widget.attrs

      for (var attr in attrs) {
        if (!attrs.hasOwnProperty(attr)) continue
        var m = ON_RENDER + ucfirst(attr)

        if (this[m]) {
          var val = this.get(attr)

          // 让属性的初始值生效。注：默认空值不触发
          if (!isEmptyAttrValue(val)) {
            this[m](val, undefined, attr)
          }

          // 将 _onRenderXx 自动绑定到 change:xx 事件上
          (function(m) {
            widget.on('change:' + attr, function(val, prev, key) {
              widget[m](val, prev, key)
            })
          })(m)
        }
      }
    },

    _onRenderId: function(val) {
      this.element.attr('id', val)
    },

    _onRenderClassName: function(val) {
      this.element.addClass(val)
    },

    _onRenderStyle: function(val) {
      this.element.css(val)
    },

    // 让 element 与 Widget 实例建立关联
    _stamp: function() {
      var cid = this.cid;

      (this.initElement || this.element).attr(DATA_WIDGET_CID, cid)
      cachedInstances[cid] = this
    },

    // 在 this.element 内寻找匹配节点
    $: function(selector) {
      return this.element.find(selector)
    },

    destroy: function() {
      this.undelegateEvents()
      delete cachedInstances[this.cid]

      // For memory leak
      if (this.element && this._isTemplate) {
        this.element.off()
        // 如果是 widget 生成的 element 则去除
        if (this._outerBox) {
          this._outerBox.remove()
        } else {
          this.element.remove()
        }
      }
      this.element = null

      Widget.superclass.destroy.call(this)
    }
  })

  // For memory leak
  $(window).unload(function() {
    for(var cid in cachedInstances) {
      cachedInstances[cid].destroy()
    }
  })

  // 查询与 selector 匹配的第一个 DOM 节点，得到与该 DOM 节点相关联的 Widget 实例
  Widget.query = function(selector) {
    var element = $(selector).eq(0)
    var cid

    element && (cid = element.attr(DATA_WIDGET_CID))
    return cachedInstances[cid]
  }


  Widget.autoRender = AutoRender.autoRender
  Widget.autoRenderAll = AutoRender.autoRenderAll
  Widget.StaticsWhiteList = ['autoRender']

  Hui.Widget = Widget


  // Helpers
  // ------

  var toString = Object.prototype.toString
  var cidCounter = 0

  function uniqueCid() {
    return 'widget-' + cidCounter++
  }

  function isString(val) {
    return toString.call(val) === '[object String]'
  }

  function isFunction(val) {
    return toString.call(val) === '[object Function]'
  }

  // Zepto 上没有 contains 方法
  var contains = $.contains || function(a, b) {
    //noinspection JSBitwiseOperatorUsage
    return !!(a.compareDocumentPosition(b) & 16)
  }

  function isInDocument(element) {
    return contains(document.documentElement, element)
  }

  function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.substring(1)
  }


  var EVENT_KEY_SPLITTER = /^(\S+)\s*(.*)$/
  var EXPRESSION_FLAG = /{{([^}]+)}}/g
  var INVALID_SELECTOR = 'INVALID_SELECTOR'

  function getEvents(widget) {
    if (isFunction(widget.events)) {
      widget.events = widget.events()
    }
    return widget.events
  }

  function parseEventKey(eventKey, widget) {
    var match = eventKey.match(EVENT_KEY_SPLITTER)
    var eventType = match[1] + DELEGATE_EVENT_NS + widget.cid

    // 当没有 selector 时，需要设置为 undefined，以使得 zepto 能正确转换为 bind
    var selector = match[2] || undefined

    if (selector && selector.indexOf('{{') > -1) {
      selector = parseExpressionInEventKey(selector, widget)
    }

    return {
      type: eventType,
      selector: selector
    }
  }

  // 解析 eventKey 中的 {{xx}}, {{yy}}
  function parseExpressionInEventKey(selector, widget) {

    return selector.replace(EXPRESSION_FLAG, function(m, name) {
      var parts = name.split('.')
      var point = widget, part

      while (part = parts.shift()) {
        if (point === widget.attrs) {
          point = widget.get(part)
        } else {
          point = point[part]
        }
      }

      // 已经是 className，比如来自 dataset 的
      if (isString(point)) {
        return point
      }

      // 不能识别的，返回无效标识
      return INVALID_SELECTOR
    })
  }


  // 对于 attrs 的 value 来说，以下值都认为是空值： null, undefined
  function isEmptyAttrValue(o) {
    return o == null || o === undefined
  }

  function trimRightUndefine(argus) {
    for (var i = argus.length - 1; i >= 0; i--) {
      if (argus[i] === undefined) {
        argus.pop();
      } else {
        break;
      }
    }
    return argus;
  }

})(jQuery);