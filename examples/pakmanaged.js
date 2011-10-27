var global = Function("return this;")()
/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)
  * http://ender.no.de
  * License MIT
  */
!function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context.$

  function require (identifier) {
    // modules can be required from ender's build system, or found on the window
    var module = modules[identifier] || window[identifier]
    if (!module) throw new Error("Requested module '" + identifier + "' has not been defined.")
    return module
  }

  function provide (name, what) {
    return (modules[name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  function boosh(s, r, els) {
    // string || node || nodelist || window
    if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      els = ender._select(s, r)
      els.selector = s
    } else els = isFinite(s.length) ? s : [s]
    return aug(els, boosh)
  }

  function ender(s, r) {
    return boosh(s, r)
  }

  aug(ender, {
      _VERSION: '0.3.6'
    , fn: boosh // for easy compat to jQuery plugins
    , ender: function (o, chain) {
        aug(chain ? boosh : ender, o)
      }
    , _select: function (s, r) {
        return (r || document).querySelectorAll(s)
      }
  })

  aug(boosh, {
    forEach: function (fn, scope, i) {
      // opt out of native forEach so we can intentionally call our own scope
      // defaulting to the current item and be able to return self
      for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(scope || this[i], this[i], i, this)
      // return self for chaining
      return this
    },
    $: ender // handy reference to self
  })

  ender.noConflict = function () {
    context.$ = old
    return this
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ender
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = context['ender'] || ender

}(this);
// ender:domready as domready
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  !function (name, definition) {
    if (typeof define == 'function') define(definition)
    else if (typeof module != 'undefined') module.exports = definition()
    else this[name] = this['domReady'] = definition()
  }('domready', function (ready) {
  
    var fns = [], fn, f = false
      , doc = document
      , testEl = doc.documentElement
      , hack = testEl.doScroll
      , domContentLoaded = 'DOMContentLoaded'
      , addEventListener = 'addEventListener'
      , onreadystatechange = 'onreadystatechange'
      , loaded = /^loade|c/.test(doc.readyState)
  
    function flush(f) {
      loaded = 1
      while (f = fns.shift()) f()
    }
  
    doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
      doc.removeEventListener(domContentLoaded, fn, f)
      flush()
    }, f)
  
  
    hack && doc.attachEvent(onreadystatechange, (fn = function () {
      if (/^c/.test(doc.readyState)) {
        doc.detachEvent(onreadystatechange, fn)
        flush()
      }
    }))
  
    return (ready = hack ?
      function (fn) {
        self != top ?
          loaded ? fn() : fns.push(fn) :
          function () {
            try {
              testEl.doScroll('left')
            } catch (e) {
              return setTimeout(function() { ready(fn) }, 50)
            }
            fn()
          }()
      } :
      function (fn) {
        loaded ? fn() : fns.push(fn)
      })
  })

  provide("domready", module.exports);
  $.ender(module.exports);
}(global));

// ender:domready/ender-bridge as domready/ender-bridge
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  !function ($) {
    var ready =  require('domready')
    $.ender({domReady: ready})
    $.ender({
      ready: function (f) {
        ready(f)
        return this
      }
    }, true)
  }(ender);

  provide("domready/ender-bridge", module.exports);
  $.ender(module.exports);
}(global));

// ender:qwery as qwery
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  /*!
    * Qwery - A Blazing Fast query selector engine
    * https://github.com/ded/qwery
    * copyright Dustin Diaz & Jacob Thornton 2011
    * MIT License
    */
  
  !function (name, definition) {
    if (typeof module != 'undefined') module.exports = definition()
    else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
    else this[name] = definition()
  }('qwery', function () {
    var context = this
      , doc = document
      , old = context.qwery
      , c, i, j, k, l, m, o, p, r, v
      , el, node, found, classes, item, items, token
      , html = doc.documentElement
      , id = /#([\w\-]+)/
      , clas = /\.[\w\-]+/g
      , idOnly = /^#([\w\-]+$)/
      , classOnly = /^\.([\w\-]+)$/
      , tagOnly = /^([\w\-]+)$/
      , tagAndOrClass = /^([\w]+)?\.([\w\-]+)$/
      , normalizr = /\s*([\s\+\~>])\s*/g
      , splitters = /[\s\>\+\~]/
      , splittersMore = /(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\]|[\s\w\+\-]*\))/
      , specialChars = /([.*+?\^=!:${}()|\[\]\/\\])/g
      , simple = /^([a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/
      , attr = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/
      , pseudo = /:([\w\-]+)(\(['"]?([\s\w\+\-]+)['"]?\))?/
      , dividers = new RegExp('(' + splitters.source + ')' + splittersMore.source, 'g')
      , tokenizr = new RegExp(splitters.source + splittersMore.source)
      , chunker = new RegExp(simple.source + '(' + attr.source + ')?' + '(' + pseudo.source + ')?')
      , walker = {
        ' ': function (node) {
          return node && node !== html && node.parentNode
        }
      , '>': function (node, contestant) {
          return node && node.parentNode == contestant.parentNode && node.parentNode
        }
      , '~': function (node) {
          return node && node.previousSibling
        }
      , '+': function (node, contestant, p1, p2) {
          if (!node) return false
          p1 = previous(node)
          p2 = previous(contestant)
          return p1 && p2 && p1 == p2 && p1
        }
    }
    function cache() {
      this.c = {}
    }
    cache.prototype = {
        g: function (k) {
          return this.c[k] || undefined
        }
      , s: function (k, v) {
          this.c[k] = v
          return v
        }
    }
  
    var classCache = new cache()
      , cleanCache = new cache()
      , attrCache = new cache()
      , tokenCache = new cache()
  
    function flatten(ar) {
      r = []
      for (i = 0, l = ar.length; i < l; i++) {
        if (arrayLike(ar[i])) r = r.concat(ar[i])
        else r.push(ar[i])
      }
      return r
    }
  
    function previous(n) {
      while (n = n.previousSibling) if (n.nodeType == 1) break;
      return n
    }
  
    function q(query) {
      return query.match(chunker)
    }
  
    // this next method expect at most these args
    // given => div.hello[title="world"]:foo('bar')
  
    // div.hello[title="world"]:foo('bar'), div, .hello, [title="world"], title, =, world, :foo('bar'), foo, ('bar'), bar]
  
    function interpret(whole, tag, idsAndClasses, wholeAttribute, attribute, qualifier, value, wholePseudo, pseudo, wholePseudoVal, pseudoVal) {
      var m, c, k;
      if (tag && this.tagName.toLowerCase() !== tag) return false
      if (idsAndClasses && (m = idsAndClasses.match(id)) && m[1] !== this.id) return false
      if (idsAndClasses && (classes = idsAndClasses.match(clas))) {
        for (i = classes.length; i--;) {
          c = classes[i].slice(1)
          if (!(classCache.g(c) || classCache.s(c, new RegExp('(^|\\s+)' + c + '(\\s+|$)'))).test(this.className)) {
            return false
          }
        }
      }
      if (pseudo && qwery.pseudos[pseudo] && !qwery.pseudos[pseudo](this, pseudoVal)) {
        return false
      }
      if (wholeAttribute && !value) {
        o = this.attributes
        for (k in o) {
          if (Object.prototype.hasOwnProperty.call(o, k) && (o[k].name || k) == attribute) {
            return this
          }
        }
      }
      if (wholeAttribute && !checkAttr(qualifier, this.getAttribute(attribute) || '', value)) {
        return false
      }
      return this
    }
  
    function clean(s) {
      return cleanCache.g(s) || cleanCache.s(s, s.replace(specialChars, '\\$1'))
    }
  
    function checkAttr(qualify, actual, val) {
      switch (qualify) {
      case '=':
        return actual == val
      case '^=':
        return actual.match(attrCache.g('^=' + val) || attrCache.s('^=' + val, new RegExp('^' + clean(val))))
      case '$=':
        return actual.match(attrCache.g('$=' + val) || attrCache.s('$=' + val, new RegExp(clean(val) + '$')))
      case '*=':
        return actual.match(attrCache.g(val) || attrCache.s(val, new RegExp(clean(val))))
      case '~=':
        return actual.match(attrCache.g('~=' + val) || attrCache.s('~=' + val, new RegExp('(?:^|\\s+)' + clean(val) + '(?:\\s+|$)')))
      case '|=':
        return actual.match(attrCache.g('|=' + val) || attrCache.s('|=' + val, new RegExp('^' + clean(val) + '(-|$)')))
      }
      return 0
    }
  
    function _qwery(selector) {
      var r = [], ret = [], i, j = 0, k, l, m, p, token, tag, els, root, intr, item, children
        , tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
        , dividedTokens = selector.match(dividers), dividedToken
      tokens = tokens.slice(0) // this makes a copy of the array so the cached original is not effected
  
      if (!tokens.length) return r
  
      token = tokens.pop()
      root = tokens.length && (m = tokens[tokens.length - 1].match(idOnly)) ? doc.getElementById(m[1]) : doc
  
      if (!root) return r
  
      intr = q(token)
      els = dividedTokens && /^[+~]$/.test(dividedTokens[dividedTokens.length - 1]) ? function (r) {
          while (root = root.nextSibling) {
            root.nodeType == 1 && (intr[1] ? intr[1] == root.tagName.toLowerCase() : 1) && r.push(root)
          }
          return r
        }([]) :
        root.getElementsByTagName(intr[1] || '*')
      for (i = 0, l = els.length; i < l; i++) if (item = interpret.apply(els[i], intr)) r[j++] = item
      if (!tokens.length) return r
  
      // loop through all descendent tokens
      for (j = 0, l = r.length, k = 0; j < l; j++) {
        p = r[j]
        // loop through each token backwards crawling up tree
        for (i = tokens.length; i--;) {
          // loop through parent nodes
          while (p = walker[dividedTokens[i]](p, r[j])) {
            if (found = interpret.apply(p, q(tokens[i]))) break;
          }
        }
        found && (ret[k++] = r[j])
      }
      return ret
    }
  
    function isNode(el) {
      return (el && el.nodeType && (el.nodeType == 1 || el.nodeType == 9))
    }
  
    function uniq(ar) {
      var a = [], i, j;
      label:
      for (i = 0; i < ar.length; i++) {
        for (j = 0; j < a.length; j++) {
          if (a[j] == ar[i]) continue label;
        }
        a[a.length] = ar[i]
      }
      return a
    }
  
    function arrayLike(o) {
      return (typeof o === 'object' && isFinite(o.length))
    }
  
    function normalizeRoot(root) {
      if (!root) return doc
      if (typeof root == 'string') return qwery(root)[0]
      if (arrayLike(root)) return root[0]
      return root
    }
  
    function qwery(selector, _root) {
      var root = normalizeRoot(_root)
  
      if (!root || !selector) return []
      if (selector === window || isNode(selector)) {
        return !_root || (selector !== window && isNode(root) && isAncestor(selector, root)) ? [selector] : []
      }
      if (selector && arrayLike(selector)) return flatten(selector)
      if (m = selector.match(idOnly)) return (el = doc.getElementById(m[1])) ? [el] : []
      if (m = selector.match(tagOnly)) return flatten(root.getElementsByTagName(m[1]))
      return select(selector, root)
    }
  
    var isAncestor = 'compareDocumentPosition' in html ?
      function (element, container) {
        return (container.compareDocumentPosition(element) & 16) == 16
      } : 'contains' in html ?
      function (element, container) {
        container = container == doc || container == window ? html : container
        return container !== element && container.contains(element)
      } :
      function (element, container) {
        while (element = element.parentNode) if (element === container) return 1
        return 0
      },
  
    supportsCSS3 = function () {
      if (!doc.querySelector || !doc.querySelectorAll) return false
  
      try { return (doc.querySelectorAll(':nth-of-type(1)').length) }
      catch (e) { return false }
    }(),
  
    select = supportsCSS3 ?
      function (selector, root) {
        return doc.getElementsByClassName && (m = selector.match(classOnly)) ?
          flatten(root.getElementsByClassName(m[1])) :
          flatten(root.querySelectorAll(selector))
      } :
      function (selector, root) {
        selector = selector.replace(normalizr, '$1')
        var result = [], element, collection, collections = [], i
        if (m = selector.match(tagAndOrClass)) {
          items = root.getElementsByTagName(m[1] || '*');
          r = classCache.g(m[2]) || classCache.s(m[2], new RegExp('(^|\\s+)' + m[2] + '(\\s+|$)'));
          for (i = 0, l = items.length, j = 0; i < l; i++) {
            r.test(items[i].className) && (result[j++] = items[i]);
          }
          return result
        }
        for (i = 0, items = selector.split(','), l = items.length; i < l; i++) {
          collections[i] = _qwery(items[i])
        }
        for (i = 0, l = collections.length; i < l && (collection = collections[i]); i++) {
          var ret = collection
          if (root !== doc) {
            ret = []
            for (j = 0, m = collection.length; j < m && (element = collection[j]); j++) {
              // make sure element is a descendent of root
              isAncestor(element, root) && ret.push(element)
            }
          }
          result = result.concat(ret)
        }
        return uniq(result)
      }
  
    qwery.uniq = uniq
    qwery.pseudos = {}
  
    qwery.noConflict = function () {
      context.qwery = old
      return this
    }
  
    return qwery
  })

  provide("qwery", module.exports);
  $.ender(module.exports);
}(global));

// ender:qwery/ender-bridge as qwery/ender-bridge
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  !function (doc, $) {
    var q =  require('qwery')
      , table = 'table'
      , nodeMap = {
            thead: table
          , tbody: table
          , tfoot: table
          , tr: 'tbody'
          , th: 'tr'
          , td: 'tr'
          , fieldset: 'form'
          , option: 'select'
        }
    function create(node, root) {
      var tag = /^\s*<([^\s>]+)\s*/.exec(node)[1]
        , el = (root || doc).createElement(nodeMap[tag] || 'div'), els = []
  
      el.innerHTML = node
      var nodes = el.childNodes
      el = el.firstChild
      el.nodeType == 1 && els.push(el)
      while (el = el.nextSibling) (el.nodeType == 1) && els.push(el)
      return els
    }
  
    $._select = function (s, r) {
      return /^\s*</.test(s) ? create(s, r) : q(s, r)
    }
  
    $.pseudos = q.pseudos
  
    $.ender({
      find: function (s) {
        var r = [], i, l, j, k, els
        for (i = 0, l = this.length; i < l; i++) {
          els = q(s, this[i])
          for (j = 0, k = els.length; j < k; j++) r.push(els[j])
        }
        return $(q.uniq(r))
      }
      , and: function (s) {
        var plus = $(s)
        for (var i = this.length, j = 0, l = this.length + plus.length; i < l; i++, j++) {
          this[i] = plus[j]
        }
        return this
      }
    }, true)
  }(document, ender);
  

  provide("qwery/ender-bridge", module.exports);
  $.ender(module.exports);
}(global));

// ender:bonzo as bonzo
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  /*!
    * Bonzo: DOM Utility (c) Dustin Diaz 2011
    * https://github.com/ded/bonzo
    * License MIT
    */
  !function (name, definition) {
    if (typeof module != 'undefined') module.exports = definition()
    else if (typeof define == 'function' && define.amd) define(name, definition)
    else this[name] = definition()
  }('bonzo', function() {
    var context = this
      , old = context.bonzo
      , win = window
      , doc = win.document
      , html = doc.documentElement
      , parentNode = 'parentNode'
      , query = null
      , specialAttributes = /^checked|value|selected$/
      , specialTags = /select|fieldset|table|tbody|tfoot|td|tr|colgroup/i
      , table = [ '<table>', '</table>', 1 ]
      , td = [ '<table><tbody><tr>', '</tr></tbody></table>', 3 ]
      , option = [ '<select>', '</select>', 1 ]
      , tagMap = {
          thead: table, tbody: table, tfoot: table, colgroup: table, caption: table
          , tr: [ '<table><tbody>', '</tbody></table>', 2 ]
          , th: td , td: td
          , col: [ '<table><colgroup>', '</colgroup></table>', 2 ]
          , fieldset: [ '<form>', '</form>', 1 ]
          , legend: [ '<form><fieldset>', '</fieldset></form>', 2 ]
          , option: option
          , optgroup: option }
      , stateAttributes = /^checked|selected$/
      , ie = /msie/i.test(navigator.userAgent)
      , uidList = []
      , uuids = 0
      , digit = /^-?[\d\.]+$/
      , px = 'px'
      , setAttribute = 'setAttribute'
      , getAttribute = 'getAttribute'
      , byTag = 'getElementsByTagName'
      , features = function() {
          var e = doc.createElement('p')
          e.innerHTML = '<a href="#x">x</a><table style="float:left;"></table>'
          return {
            hrefExtended: e[byTag]('a')[0][getAttribute]('href') != '#x' // IE < 8
            , autoTbody: e[byTag]('tbody').length !== 0 // IE < 8
            , computedStyle: doc.defaultView && doc.defaultView.getComputedStyle
            , cssFloat: e[byTag]('table')[0].style.styleFloat ? 'styleFloat' : 'cssFloat'
            , transform: function () {
                var props = ['webkitTransform', 'MozTransform', 'OTransform', 'msTransform', 'Transform'], i
                for (i = 0; i < props.length; i++) {
                  if (props[i] in e.style) return props[i]
                }
              }()
          }
        }()
      , trimReplace = /(^\s*|\s*$)/g
      , unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1 }
      , trim = String.prototype.trim ?
          function (s) {
            return s.trim()
          } :
          function (s) {
            return s.replace(trimReplace, '')
          }
  
    function classReg(c) {
      return new RegExp("(^|\\s+)" + c + "(\\s+|$)")
    }
  
    function each(ar, fn, scope) {
      for (var i = 0, l = ar.length; i < l; i++) fn.call(scope || ar[i], ar[i], i, ar)
      return ar
    }
  
    function camelize(s) {
      return s.replace(/-(.)/g, function (m, m1) {
        return m1.toUpperCase()
      })
    }
  
    function isNode(node) {
      return node && node.nodeName && node.nodeType == 1
    }
  
    function some(ar, fn, scope, i) {
      for (i = 0, j = ar.length; i < j; ++i) if (fn.call(scope, ar[i], i, ar)) return true
      return false
    }
  
    function styleProperty(p) {
        (p == 'transform' && (p = features.transform)) ||
          (/^transform-?[Oo]rigin$/.test(p) && (p = features.transform + "Origin")) ||
          (p == 'float' && (p = features.cssFloat))
        return p ? camelize(p) : null
    }
  
    var getStyle = features.computedStyle ?
      function (el, property) {
        var value = null
          , computed = doc.defaultView.getComputedStyle(el, '')
        computed && (value = computed[property])
        return el.style[property] || value
      } :
  
      (ie && html.currentStyle) ?
  
      function (el, property) {
        if (property == 'opacity') {
          var val = 100
          try {
            val = el.filters['DXImageTransform.Microsoft.Alpha'].opacity
          } catch (e1) {
            try {
              val = el.filters('alpha').opacity
            } catch (e2) {}
          }
          return val / 100
        }
        var value = el.currentStyle ? el.currentStyle[property] : null
        return el.style[property] || value
      } :
  
      function (el, property) {
        return el.style[property]
      }
  
    // this insert method is intense
    function insert(target, host, fn) {
      var i = 0, self = host || this, r = []
        // target nodes could be a css selector if it's a string and a selector engine is present
        // otherwise, just use target
        , nodes = query && typeof target == 'string' && target.charAt(0) != '<' ? query(target) : target
      // normalize each node in case it's still a string and we need to create nodes on the fly
      each(normalize(nodes), function (t) {
        each(self, function (el) {
          var n = !el[parentNode] || (el[parentNode] && !el[parentNode][parentNode]) ?
            function () {
              var c = el.cloneNode(true)
              // check for existence of an event cloner
              // preferably https://github.com/fat/bean
              // otherwise Bonzo won't do this for you
              self.$ && self.cloneEvents && self.$(c).cloneEvents(el)
              return c
            }() : el
          fn(t, n)
          r[i] = n
          i++
        })
      }, this)
      each(r, function (e, i) {
        self[i] = e
      })
      self.length = i
      return self
    }
  
    function xy(el, x, y) {
      var $el = bonzo(el)
        , style = $el.css('position')
        , offset = $el.offset()
        , rel = 'relative'
        , isRel = style == rel
        , delta = [parseInt($el.css('left'), 10), parseInt($el.css('top'), 10)]
  
      if (style == 'static') {
        $el.css('position', rel)
        style = rel
      }
  
      isNaN(delta[0]) && (delta[0] = isRel ? 0 : el.offsetLeft)
      isNaN(delta[1]) && (delta[1] = isRel ? 0 : el.offsetTop)
  
      x != null && (el.style.left = x - offset.left + delta[0] + px)
      y != null && (el.style.top = y - offset.top + delta[1] + px)
  
    }
  
    function hasClass(el, c) {
      return classReg(c).test(el.className)
    }
    function addClass(el, c) {
      el.className = trim(el.className + ' ' + c)
    }
    function removeClass(el, c) {
      el.className = trim(el.className.replace(classReg(c), ' '))
    }
  
    // this allows method calling for setting values
    // example:
  
    // bonzo(elements).css('color', function (el) {
    //   return el.getAttribute('data-original-color')
    // })
  
    function setter(el, v) {
      return typeof v == 'function' ? v(el) : v
    }
  
    function Bonzo(elements) {
      this.length = 0
      if (elements) {
        elements = typeof elements !== 'string' &&
          !elements.nodeType &&
          typeof elements.length !== 'undefined' ?
            elements :
            [elements]
        this.length = elements.length
        for (var i = 0; i < elements.length; i++) {
          this[i] = elements[i]
        }
      }
    }
  
    Bonzo.prototype = {
  
        get: function (index) {
          return this[index]
        }
  
      , each: function (fn, scope) {
          return each(this, fn, scope)
        }
  
      , map: function (fn, reject) {
          var m = [], n, i
          for (i = 0; i < this.length; i++) {
            n = fn.call(this, this[i], i)
            reject ? (reject(n) && m.push(n)) : m.push(n)
          }
          return m
        }
  
      , first: function () {
          return bonzo(this[0])
        }
  
      , last: function () {
          return bonzo(this[this.length - 1])
        }
  
      , html: function (h, text) {
          var method = text ?
            html.textContent === undefined ?
              'innerText' :
              'textContent' :
            'innerHTML', m;
          function append(el) {
            while (el.firstChild) el.removeChild(el.firstChild)
            each(normalize(h), function (node) {
              el.appendChild(node)
            })
          }
          return typeof h !== 'undefined' ?
              this.each(function (el) {
                !text && (m = el.tagName.match(specialTags)) ?
                  append(el, m[0]) :
                  (el[method] = h)
              }) :
            this[0] ? this[0][method] : ''
        }
  
      , text: function (text) {
          return this.html(text, 1)
        }
  
      , addClass: function (c) {
          return this.each(function (el) {
            hasClass(el, setter(el, c)) || addClass(el, setter(el, c))
          })
        }
  
      , removeClass: function (c) {
          return this.each(function (el) {
            hasClass(el, setter(el, c)) && removeClass(el, setter(el, c))
          })
        }
  
      , hasClass: function (c) {
          return some(this, function (el) {
            return hasClass(el, c)
          })
        }
  
      , toggleClass: function (c, condition) {
          return this.each(function (el) {
            typeof condition !== 'undefined' ?
              condition ? addClass(el, c) : removeClass(el, c) :
              hasClass(el, c) ? removeClass(el, c) : addClass(el, c)
          })
        }
  
      , show: function (type) {
          return this.each(function (el) {
            el.style.display = type || ''
          })
        }
  
      , hide: function () {
          return this.each(function (el) {
            el.style.display = 'none'
          })
        }
  
      , append: function (node) {
          return this.each(function (el) {
            each(normalize(node), function (i) {
              el.appendChild(i)
            })
          })
        }
  
      , prepend: function (node) {
          return this.each(function (el) {
            var first = el.firstChild
            each(normalize(node), function (i) {
              el.insertBefore(i, first)
            })
          })
        }
  
      , appendTo: function (target, host) {
          return insert.call(this, target, host, function (t, el) {
            t.appendChild(el)
          })
        }
  
      , prependTo: function (target, host) {
          return insert.call(this, target, host, function (t, el) {
            t.insertBefore(el, t.firstChild)
          })
        }
  
      , next: function () {
          return this.related('nextSibling')
        }
  
      , previous: function () {
          return this.related('previousSibling')
        }
  
      , related: function (method) {
          return this.map(
            function (el) {
              el = el[method]
              while (el && el.nodeType !== 1) {
                el = el[method]
              }
              return el || 0
            },
            function (el) {
              return el
            }
          )
        }
  
      , before: function (node) {
          return this.each(function (el) {
            each(bonzo.create(node), function (i) {
              el[parentNode].insertBefore(i, el)
            })
          })
        }
  
      , after: function (node) {
          return this.each(function (el) {
            each(bonzo.create(node), function (i) {
              el[parentNode].insertBefore(i, el.nextSibling)
            })
          })
        }
  
      , insertBefore: function (target, host) {
          return insert.call(this, target, host, function (t, el) {
            t[parentNode].insertBefore(el, t)
          })
        }
  
      , insertAfter: function (target, host) {
          return insert.call(this, target, host, function (t, el) {
            var sibling = t.nextSibling
            if (sibling) {
              t[parentNode].insertBefore(el, sibling);
            }
            else {
              t[parentNode].appendChild(el)
            }
          })
        }
  
      , replaceWith: function(html) {
          return this.each(function (el) {
            el.parentNode.replaceChild(bonzo.create(html)[0], el)
          })
        }
  
      , css: function (o, v, p) {
          // is this a request for just getting a style?
          if (v === undefined && typeof o == 'string') {
            // repurpose 'v'
            v = this[0]
            if (!v) {
              return null
            }
            if (v === doc || v === win) {
              p = (v === doc) ? bonzo.doc() : bonzo.viewport()
              return o == 'width' ? p.width : o == 'height' ? p.height : ''
            }
            return (o = styleProperty(o)) ? getStyle(v, o) : null
          }
          var iter = o
          if (typeof o == 'string') {
            iter = {}
            iter[o] = v
          }
  
          if (ie && iter.opacity) {
            // oh this 'ol gamut
            iter.filter = 'alpha(opacity=' + (iter.opacity * 100) + ')'
            // give it layout
            iter.zoom = o.zoom || 1;
            delete iter.opacity;
          }
  
          function fn(el, p, v) {
            for (var k in iter) {
              if (iter.hasOwnProperty(k)) {
                v = iter[k];
                // change "5" to "5px" - unless you're line-height, which is allowed
                (p = styleProperty(k)) && digit.test(v) && !(p in unitless) && (v += px)
                el.style[p] = setter(el, v)
              }
            }
          }
          return this.each(fn)
        }
  
      , offset: function (x, y) {
          if (typeof x == 'number' || typeof y == 'number') {
            return this.each(function (el) {
              xy(el, x, y)
            })
          }
          var el = this[0]
            , width = el.offsetWidth
            , height = el.offsetHeight
            , top = el.offsetTop
            , left = el.offsetLeft
          while (el = el.offsetParent) {
            top = top + el.offsetTop
            left = left + el.offsetLeft
          }
  
          return {
              top: top
            , left: left
            , height: height
            , width: width
          }
        }
  
      , dim: function () {
          var el = this[0]
            , orig = !el.offsetWidth && !el.offsetHeight ?
               // el isn't visible, can't be measured properly, so fix that
               function (t, s) {
                  s = {
                      position: el.style.position || ''
                    , visibility: el.style.visibility || ''
                    , display: el.style.display || ''
                  }
                  t.first().css({
                      position: 'absolute'
                    , visibility: 'hidden'
                    , display: 'block'
                  })
                  return s
                }(this) : null
            , width = el.offsetWidth
            , height = el.offsetHeight
  
          orig && this.first().css(orig)
          return {
              height: height
            , width: width
          }
        }
  
      , attr: function (k, v) {
          var el = this[0]
          if (typeof k != 'string' && !(k instanceof String)) {
            for (var n in k) {
              k.hasOwnProperty(n) && this.attr(n, k[n])
            }
            return this
          }
          return typeof v == 'undefined' ?
            specialAttributes.test(k) ?
              stateAttributes.test(k) && typeof el[k] == 'string' ?
                true : el[k] : (k == 'href' || k =='src') && features.hrefExtended ?
                  el[getAttribute](k, 2) : el[getAttribute](k) :
            this.each(function (el) {
              specialAttributes.test(k) ? (el[k] = setter(el, v)) : el[setAttribute](k, setter(el, v))
            })
        }
  
      , val: function (s) {
          return (typeof s == 'string') ? this.attr('value', s) : this[0].value
        }
  
      , removeAttr: function (k) {
          return this.each(function (el) {
            stateAttributes.test(k) ? (el[k] = false) : el.removeAttribute(k)
          })
        }
  
      , data: function (k, v) {
          var el = this[0], uid, o
          if (typeof v === 'undefined') {
            el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids)
            uid = el[getAttribute]('data-node-uid')
            uidList[uid] || (uidList[uid] = {})
            return uidList[uid][k]
          } else {
            return this.each(function (el) {
              el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids)
              uid = el[getAttribute]('data-node-uid')
              o = uidList[uid] || (uidList[uid] = {})
              o[k] = v
            })
          }
        }
  
      , remove: function () {
          return this.each(function (el) {
            el[parentNode] && el[parentNode].removeChild(el)
          })
        }
  
      , empty: function () {
          return this.each(function (el) {
            while (el.firstChild) {
              el.removeChild(el.firstChild)
            }
          })
        }
  
      , detach: function () {
          return this.map(function (el) {
            return el[parentNode].removeChild(el)
          })
        }
  
      , scrollTop: function (y) {
          return scroll.call(this, null, y, 'y')
        }
  
      , scrollLeft: function (x) {
          return scroll.call(this, x, null, 'x')
        }
  
      , toggle: function(callback) {
          this.each(function (el) {
            el.style.display = (el.offsetWidth || el.offsetHeight) ? 'none' : 'block'
          })
          callback && callback()
          return this
        }
    }
  
    function normalize(node) {
      return typeof node == 'string' ? bonzo.create(node) : isNode(node) ? [node] : node // assume [nodes]
    }
  
    function scroll(x, y, type) {
      var el = this[0]
      if (x == null && y == null) {
        return (isBody(el) ? getWindowScroll() : { x: el.scrollLeft, y: el.scrollTop })[type]
      }
      if (isBody(el)) {
        win.scrollTo(x, y)
      } else {
        x != null && (el.scrollLeft = x)
        y != null && (el.scrollTop = y)
      }
      return this
    }
  
    function isBody(element) {
      return element === win || (/^(?:body|html)$/i).test(element.tagName)
    }
  
    function getWindowScroll() {
      return { x: win.pageXOffset || html.scrollLeft, y: win.pageYOffset || html.scrollTop }
    }
  
    function bonzo(els, host) {
      return new Bonzo(els, host)
    }
  
    bonzo.setQueryEngine = function (q) {
      query = q;
      delete bonzo.setQueryEngine
    }
  
    bonzo.aug = function (o, target) {
      for (var k in o) {
        o.hasOwnProperty(k) && ((target || Bonzo.prototype)[k] = o[k])
      }
    }
  
    bonzo.create = function (node) {
      return typeof node == 'string' && node !== '' ?
        function () {
          var tag = /^\s*<([^\s>]+)/.exec(node)
            , el = doc.createElement('div')
            , els = []
            , p = tag ? tagMap[tag[1].toLowerCase()] : null
            , dep = p ? p[2] + 1 : 1
            , pn = parentNode
            , tb = features.autoTbody && p && p[0] == '<table>' && !(/<tbody/i).test(node)
  
          el.innerHTML = p ? (p[0] + node + p[1]) : node
          while (dep--) el = el.firstChild
          do {
            // tbody special case for IE<8, creates tbody on any empty table
            // we don't want it if we're just after a <thead>, <caption>, etc.
            if ((!tag || el.nodeType == 1) && (!tb || el.tagName.toLowerCase() != 'tbody')) {
              els.push(el)
            }
          } while (el = el.nextSibling)
          // IE < 9 gives us a parentNode which messes up insert() check for cloning
          // `dep` > 1 can also cause problems with the insert() check (must do this last)
          each(els, function(el) { el[pn] && el[pn].removeChild(el) })
          return els
  
        }() : isNode(node) ? [node.cloneNode(true)] : []
    }
  
    bonzo.doc = function () {
      var vp = bonzo.viewport()
      return {
          width: Math.max(doc.body.scrollWidth, html.scrollWidth, vp.width)
        , height: Math.max(doc.body.scrollHeight, html.scrollHeight, vp.height)
      }
    }
  
    bonzo.firstChild = function (el) {
      for (var c = el.childNodes, i = 0, j = (c && c.length) || 0, e; i < j; i++) {
        if (c[i].nodeType === 1) e = c[j = i]
      }
      return e
    }
  
    bonzo.viewport = function () {
      return {
          width: ie ? html.clientWidth : self.innerWidth
        , height: ie ? html.clientHeight : self.innerHeight
      }
    }
  
    bonzo.isAncestor = 'compareDocumentPosition' in html ?
      function (container, element) {
        return (container.compareDocumentPosition(element) & 16) == 16
      } : 'contains' in html ?
      function (container, element) {
        return container !== element && container.contains(element);
      } :
      function (container, element) {
        while (element = element[parentNode]) {
          if (element === container) {
            return true
          }
        }
        return false
      }
  
    bonzo.noConflict = function () {
      context.bonzo = old
      return this
    }
  
    return bonzo
  })
  

  provide("bonzo", module.exports);
  $.ender(module.exports);
}(global));

// ender:bonzo/ender-bridge as bonzo/ender-bridge
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  !function ($) {
  
    var b =  require('bonzo')
    b.setQueryEngine($)
    $.ender(b)
    $.ender(b(), true)
    $.ender({
      create: function (node) {
        return $(b.create(node))
      }
    })
  
    $.id = function (id) {
      return $([document.getElementById(id)])
    }
  
    function indexOf(ar, val) {
      for (var i = 0; i < ar.length; i++) {
        if (ar[i] === val) return i
      }
      return -1
    }
  
    function uniq(ar) {
      var a = [], i, j
      label:
      for (i = 0; i < ar.length; i++) {
        for (j = 0; j < a.length; j++) {
          if (a[j] == ar[i]) {
            continue label
          }
        }
        a[a.length] = ar[i]
      }
      return a
    }
  
    $.ender({
      parents: function (selector, closest) {
        var collection = $(selector), j, k, p, r = []
        for (j = 0, k = this.length; j < k; j++) {
          p = this[j]
          while (p = p.parentNode) {
            if (~indexOf(collection, p)) {
              r.push(p)
              if (closest) break;
            }
          }
        }
        return $(uniq(r))
      },
  
      closest: function (selector) {
        return this.parents(selector, true)
      },
  
      first: function () {
        return $(this[0])
      },
  
      last: function () {
        return $(this[this.length - 1])
      },
  
      next: function () {
        return $(b(this).next())
      },
  
      previous: function () {
        return $(b(this).previous())
      },
  
      appendTo: function (t) {
        return b(this.selector).appendTo(t, this)
      },
  
      prependTo: function (t) {
        return b(this.selector).prependTo(t, this)
      },
  
      insertAfter: function (t) {
        return b(this.selector).insertAfter(t, this)
      },
  
      insertBefore: function (t) {
        return b(this.selector).insertBefore(t, this)
      },
  
      siblings: function () {
        var i, l, p, r = []
        for (i = 0, l = this.length; i < l; i++) {
          p = this[i]
          while (p = p.previousSibling) p.nodeType == 1 && r.push(p)
          p = this[i]
          while (p = p.nextSibling) p.nodeType == 1 && r.push(p)
        }
        return $(r)
      },
  
      children: function () {
        var i, el, r = []
        for (i = 0, l = this.length; i < l; i++) {
          if (!(el = b.firstChild(this[i]))) continue;
          r.push(el)
          while (el = el.nextSibling) el.nodeType == 1 && r.push(el)
        }
        return $(uniq(r))
      },
  
      height: function (v) {
        return dimension(v, this, 'height')
      },
  
      width: function (v) {
        return dimension(v, this, 'width')
      }
    }, true)
  
    function dimension(v, self, which) {
      return v ?
        self.css(which, v) :
        function (r) {
          r = parseInt(self.css(which), 10);
          return isNaN(r) ? self[0]['offset' + which.replace(/^\w/, function (m) {return m.toUpperCase()})] : r
        }()
    }
  
  }(ender);
  

  provide("bonzo/ender-bridge", module.exports);
  $.ender(module.exports);
}(global));

// ender:bean as bean
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  /*!
    * bean.js - copyright Jacob Thornton 2011
    * https://github.com/fat/bean
    * MIT License
    * special thanks to:
    * dean edwards: http://dean.edwards.name/
    * dperini: https://github.com/dperini/nwevents
    * the entire mootools team: github.com/mootools/mootools-core
    */
  !function (name, definition) {
    if (typeof module != 'undefined') module.exports = definition();
    else if (typeof define == 'function' && typeof define.amd  == 'object') define(definition);
    else this[name] = definition();
  }('bean', function () {
    var win = window,
        __uid = 1,
        registry = {},
        collected = {},
        overOut = /over|out/,
        namespace = /[^\.]*(?=\..*)\.|.*/,
        stripName = /\..*/,
        addEvent = 'addEventListener',
        attachEvent = 'attachEvent',
        removeEvent = 'removeEventListener',
        detachEvent = 'detachEvent',
        doc = document || {},
        root = doc.documentElement || {},
        W3C_MODEL = root[addEvent],
        eventSupport = W3C_MODEL ? addEvent : attachEvent,
  
    isDescendant = function (parent, child) {
      var node = child.parentNode;
      while (node !== null) {
        if (node == parent) {
          return true;
        }
        node = node.parentNode;
      }
    },
  
    retrieveUid = function (obj, uid) {
      return (obj.__uid = uid && (uid + '::' + __uid++) || obj.__uid || __uid++);
    },
  
    retrieveEvents = function (element) {
      var uid = retrieveUid(element);
      return (registry[uid] = registry[uid] || {});
    },
  
    listener = W3C_MODEL ? function (element, type, fn, add) {
      element[add ? addEvent : removeEvent](type, fn, false);
    } : function (element, type, fn, add, custom) {
      if (custom && add && element['_on' + custom] === null) {
        element['_on' + custom] = 0;
      }
      element[add ? attachEvent : detachEvent]('on' + type, fn);
    },
  
    nativeHandler = function (element, fn, args) {
      return function (event) {
        event = fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || win).event);
        return fn.apply(element, [event].concat(args));
      };
    },
  
    customHandler = function (element, fn, type, condition, args) {
      return function (event) {
        if (condition ? condition.apply(this, arguments) : W3C_MODEL ? true : event && event.propertyName == '_on' + type || !event) {
          event = event ? fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || win).event) : null;
          fn.apply(element, Array.prototype.slice.call(arguments, event ? 0 : 1).concat(args));
        }
      };
    },
  
    addListener = function (element, orgType, fn, args) {
      var type = orgType.replace(stripName, ''),
          events = retrieveEvents(element),
          handlers = events[type] || (events[type] = {}),
          originalFn = fn,
          uid = retrieveUid(fn, orgType.replace(namespace, ''));
      if (handlers[uid]) {
        return element;
      }
      var custom = customEvents[type];
      if (custom) {
        fn = custom.condition ? customHandler(element, fn, type, custom.condition) : fn;
        type = custom.base || type;
      }
      var isNative = nativeEvents[type];
      fn = isNative ? nativeHandler(element, fn, args) : customHandler(element, fn, type, false, args);
      isNative = W3C_MODEL || isNative;
      if (type == 'unload') {
        var org = fn;
        fn = function () {
          removeListener(element, type, fn) && org();
        };
      }
      element[eventSupport] && listener(element, isNative ? type : 'propertychange', fn, true, !isNative && type);
      handlers[uid] = fn;
      fn.__uid = uid;
      fn.__originalFn = originalFn;
      return type == 'unload' ? element : (collected[retrieveUid(element)] = element);
    },
  
    removeListener = function (element, orgType, handler) {
      var uid, names, uids, i, events = retrieveEvents(element), type = orgType.replace(stripName, '');
      if (!events || !events[type]) {
        return element;
      }
      names = orgType.replace(namespace, '');
      uids = names ? names.split('.') : [handler.__uid];
  
      function destroyHandler(uid) {
        handler = events[type][uid];
        if (!handler) {
          return;
        }
        delete events[type][uid];
        if (element[eventSupport]) {
          type = customEvents[type] ? customEvents[type].base : type;
          var isNative = W3C_MODEL || nativeEvents[type];
          listener(element, isNative ? type : 'propertychange', handler, false, !isNative && type);
        }
      }
  
      destroyHandler(names); //get combos
      for (i = uids.length; i--; destroyHandler(uids[i])) {} //get singles
  
      return element;
    },
  
    del = function (selector, fn, $) {
      return function (e) {
        var array = typeof selector == 'string' ? $(selector, this) : selector;
        for (var target = e.target; target && target != this; target = target.parentNode) {
          for (var i = array.length; i--;) {
            if (array[i] == target) {
              return fn.apply(target, arguments);
            }
          }
        }
      };
    },
  
    add = function (element, events, fn, delfn, $) {
      if (typeof events == 'object' && !fn) {
        for (var type in events) {
          events.hasOwnProperty(type) && add(element, type, events[type]);
        }
      } else {
        var isDel = typeof fn == 'string', types = (isDel ? fn : events).split(' ');
        fn = isDel ? del(events, delfn, $) : fn;
        for (var i = types.length; i--;) {
          addListener(element, types[i], fn, Array.prototype.slice.call(arguments, isDel ? 4 : 3));
        }
      }
      return element;
    },
  
    remove = function (element, orgEvents, fn) {
      var k, m, type, events, i,
          isString = typeof(orgEvents) == 'string',
          names = isString && orgEvents.replace(namespace, ''),
          rm = removeListener,
          attached = retrieveEvents(element);
      names = names && names.split('.');
      if (isString && /\s/.test(orgEvents)) {
        orgEvents = orgEvents.split(' ');
        i = orgEvents.length - 1;
        while (remove(element, orgEvents[i]) && i--) {}
        return element;
      }
      events = isString ? orgEvents.replace(stripName, '') : orgEvents;
      if (!attached || names || (isString && !attached[events])) {
        for (k in attached) {
          if (attached.hasOwnProperty(k)) {
            for (i in attached[k]) {
              for (m = names.length; m--;) {
                attached[k].hasOwnProperty(i) && new RegExp('^' + names[m] + '::\\d*(\\..*)?$').test(i) && rm(element, [k, i].join('.'));
              }
            }
          }
        }
        return element;
      }
      if (typeof fn == 'function') {
        rm(element, events, fn);
      } else if (names) {
        rm(element, orgEvents);
      } else {
        rm = events ? rm : remove;
        type = isString && events;
        events = events ? (fn || attached[events] || events) : attached;
        for (k in events) {
          if (events.hasOwnProperty(k)) {
            rm(element, type || k, events[k]);
            delete events[k]; // remove unused leaf keys
          }
        }
      }
      return element;
    },
  
    fire = function (element, type, args) {
      var evt, k, i, m, types = type.split(' ');
      for (i = types.length; i--;) {
        type = types[i].replace(stripName, '');
        var isNative = nativeEvents[type],
            isNamespace = types[i].replace(namespace, ''),
            handlers = retrieveEvents(element)[type];
        if (isNamespace) {
          isNamespace = isNamespace.split('.');
          for (k = isNamespace.length; k--;) {
            for (m in handlers) {
              handlers.hasOwnProperty(m) && new RegExp('^' + isNamespace[k] + '::\\d*(\\..*)?$').test(m) && handlers[m].apply(element, [false].concat(args));
            }
          }
        } else if (!args && element[eventSupport]) {
          fireListener(isNative, type, element);
        } else {
          for (k in handlers) {
            handlers.hasOwnProperty(k) && handlers[k].apply(element, [false].concat(args));
          }
        }
      }
      return element;
    },
  
    fireListener = W3C_MODEL ? function (isNative, type, element) {
      evt = document.createEvent(isNative ? "HTMLEvents" : "UIEvents");
      evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, win, 1);
      element.dispatchEvent(evt);
    } : function (isNative, type, element) {
      isNative ? element.fireEvent('on' + type, document.createEventObject()) : element['_on' + type]++;
    },
  
    clone = function (element, from, type) {
      var events = retrieveEvents(from), obj, k;
      var uid = retrieveUid(element);
      obj = type ? events[type] : events;
      for (k in obj) {
        obj.hasOwnProperty(k) && (type ? add : clone)(element, type || from, type ? obj[k].__originalFn : k);
      }
      return element;
    },
  
    fixEvent = function (e) {
      var result = {};
      if (!e) {
        return result;
      }
      var type = e.type, target = e.target || e.srcElement;
      result.preventDefault = fixEvent.preventDefault(e);
      result.stopPropagation = fixEvent.stopPropagation(e);
      result.target = target && target.nodeType == 3 ? target.parentNode : target;
      if (~type.indexOf('key')) {
        result.keyCode = e.which || e.keyCode;
      } else if ((/click|mouse|menu/i).test(type)) {
        result.rightClick = e.which == 3 || e.button == 2;
        result.pos = { x: 0, y: 0 };
        if (e.pageX || e.pageY) {
          result.clientX = e.pageX;
          result.clientY = e.pageY;
        } else if (e.clientX || e.clientY) {
          result.clientX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
          result.clientY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        overOut.test(type) && (result.relatedTarget = e.relatedTarget || e[(type == 'mouseover' ? 'from' : 'to') + 'Element']);
      }
      for (var k in e) {
        if (!(k in result)) {
          result[k] = e[k];
        }
      }
      return result;
    };
  
    fixEvent.preventDefault = function (e) {
      return function () {
        if (e.preventDefault) {
          e.preventDefault();
        }
        else {
          e.returnValue = false;
        }
      };
    };
  
    fixEvent.stopPropagation = function (e) {
      return function () {
        if (e.stopPropagation) {
          e.stopPropagation();
        } else {
          e.cancelBubble = true;
        }
      };
    };
  
    var nativeEvents = { click: 1, dblclick: 1, mouseup: 1, mousedown: 1, contextmenu: 1, //mouse buttons
      mousewheel: 1, DOMMouseScroll: 1, //mouse wheel
      mouseover: 1, mouseout: 1, mousemove: 1, selectstart: 1, selectend: 1, //mouse movement
      keydown: 1, keypress: 1, keyup: 1, //keyboard
      orientationchange: 1, // mobile
      touchstart: 1, touchmove: 1, touchend: 1, touchcancel: 1, // touch
      gesturestart: 1, gesturechange: 1, gestureend: 1, // gesture
      focus: 1, blur: 1, change: 1, reset: 1, select: 1, submit: 1, //form elements
      load: 1, unload: 1, beforeunload: 1, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
      error: 1, abort: 1, scroll: 1 }; //misc
  
    function check(event) {
      var related = event.relatedTarget;
      if (!related) {
        return related === null;
      }
      return (related != this && related.prefix != 'xul' && !/document/.test(this.toString()) && !isDescendant(this, related));
    }
  
    var customEvents = {
      mouseenter: { base: 'mouseover', condition: check },
      mouseleave: { base: 'mouseout', condition: check },
      mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
    };
  
    var bean = { add: add, remove: remove, clone: clone, fire: fire };
  
    var clean = function (el) {
      var uid = remove(el).__uid;
      if (uid) {
        delete collected[uid];
        delete registry[uid];
      }
    };
  
    if (win[attachEvent]) {
      add(win, 'unload', function () {
        for (var k in collected) {
          collected.hasOwnProperty(k) && clean(collected[k]);
        }
        win.CollectGarbage && CollectGarbage();
      });
    }
  
    bean.noConflict = function () {
      context.bean = old;
      return this;
    };
  
    return bean;
  });

  provide("bean", module.exports);
  $.ender(module.exports);
}(global));

// ender:bean/ender-bridge as bean/ender-bridge
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  !function ($) {
    var b =  require('bean'),
        integrate = function (method, type, method2) {
          var _args = type ? [type] : [];
          return function () {
            for (var args, i = 0, l = this.length; i < l; i++) {
              args = [this[i]].concat(_args, Array.prototype.slice.call(arguments, 0));
              args.length == 4 && args.push($);
              !arguments.length && method == 'add' && type && (method = 'fire');
              b[method].apply(this, args);
            }
            return this;
          };
        };
  
    var add = integrate('add'),
        remove = integrate('remove'),
        fire = integrate('fire');
  
    var methods = {
  
      on: add,
      addListener: add,
      bind: add,
      listen: add,
      delegate: add,
  
      unbind: remove,
      unlisten: remove,
      removeListener: remove,
      undelegate: remove,
  
      emit: fire,
      trigger: fire,
  
      cloneEvents: integrate('clone'),
  
      hover: function (enter, leave, i) { // i for internal
        for (i = this.length; i--;) {
          b.add.call(this, this[i], 'mouseenter', enter);
          b.add.call(this, this[i], 'mouseleave', leave);
        }
        return this;
      }
    };
  
    var i, shortcuts = [
      'blur', 'change', 'click', 'dblclick', 'error', 'focus', 'focusin',
      'focusout', 'keydown', 'keypress', 'keyup', 'load', 'mousedown',
      'mouseenter', 'mouseleave', 'mouseout', 'mouseover', 'mouseup', 'mousemove',
      'resize', 'scroll', 'select', 'submit', 'unload'
    ];
  
    for (i = shortcuts.length; i--;) {
      methods[shortcuts[i]] = integrate('add', shortcuts[i]);
    }
  
    $.ender(methods, true);
  }(ender);

  provide("bean/ender-bridge", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/utm/help as examples/.lib/utm/help
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var CONSTANTS = {};
  
      /*
       * Finds the set for a given zone.
       *
       * There are six unique sets, corresponding to individual grid numbers in 
       * sets 1-6, 7-12, 13-18, etc. Set 1 is the same as sets 7, 13, ..; Set 2 
       * is the same as sets 8, 14, ..
       *
       * See p. 10 of the "United States National Grid" white paper.
       */
      function findSet (zoneNum) {
          var tReturn;
  
          zoneNum = parseInt(zoneNum, 10);
          zoneNum = zoneNum % 6;
  
          switch (zoneNum) {
              case 0:
                  tReturn = 6;
                  break;
  
              case 1:
                  tReturn = 1; 
                  break;
  
              case 2:
                  tReturn = 2;
                  break;
  
              case 3:
                  tReturn = 3;
                  break;
  
              case 4:
                  tReturn = 4;
                  break;
  
              case 5:
                  tReturn = 5;
                  break;
  
              default:
                  tReturn = -1;
                  break;
          }
  
          return tReturn;
      }
  
      /*
       * Retrieve the Square Identification (two-character letter code), for the
       * given row, column and set identifier (set refers to the zone set: 
       * zones 1-6 have a unique set of square identifiers; these identifiers are 
       * repeated for zones 7-12, etc.) 
  
       * See p. 10 of the "United States National Grid" white paper for a diagram
       * of the zone sets.
       */
      function lettersHelper(set, row, col) {
          var l1, l2;
  
          // handle case of last row
          if (row === 0) {
              row = CONSTANTS.GRIDSQUARE_SET_ROW_SIZE - 1;
          } else {
              row -= 1;
          }
  
          // handle case of last column
          if (col === 0) {
              col = CONSTANTS.GRIDSQUARE_SET_COL_SIZE - 1;
          } else {
              col -= 1;
          }
  
          switch (set) {
              case 1:
                  l1 = "ABCDEFGH";              // column ids
                  l2 = "ABCDEFGHJKLMNPQRSTUV";  // row ids
                  break;
  
              case 2:
                  l1 = "JKLMNPQR";
                  l2 = "FGHJKLMNPQRSTUVABCDE";
                  break;
  
              case 3:
                  l1 = "STUVWXYZ";
                  l2 = "ABCDEFGHJKLMNPQRSTUV";
                  break;
  
              case 4:
                  l1 = "ABCDEFGH";
                  l2 = "FGHJKLMNPQRSTUVABCDE";
                  break;
  
              case 5:
                  l1 = "JKLMNPQR";
                  l2 = "ABCDEFGHJKLMNPQRSTUV";
                   break;
  
              case 6:
                  l1 = "STUVWXYZ";
                  l2 = "FGHJKLMNPQRSTUVABCDE";
                  break;
          }
  
          return l1.charAt(col) + l2.charAt(row);
      }
  
      /*
       * Retrieves the square identification for a given coordinate pair & zone.
       * See "lettersHelper" function documentation for more details.
       */
      function findGridLetters(zoneNum, northing, easting) {
          var north_1m, east_1m, row, col;
  
          zoneNum  = parseInt(zoneNum, 10);
          northing = parseFloat(northing);
          easting  = parseFloat(easting);
          row = 1;
  
          // northing coordinate to single-meter precision
          north_1m = Math.round(northing);
  
          // Get the row position for the square identifier that contains the point
          while (north_1m >= CONSTANTS.BLOCK_SIZE) {
              north_1m = north_1m - CONSTANTS.BLOCK_SIZE;
              row += 1;
          }
  
          // cycle repeats (wraps) after 20 rows
          row = row % CONSTANTS.GRIDSQUARE_SET_ROW_SIZE;
          col = 0;
  
          // easting coordinate to single-meter precision
          east_1m = Math.round(easting);
  
          // Get the column position for the square identifier that contains the point
          while (east_1m >= CONSTANTS.BLOCK_SIZE){
              east_1m = east_1m - CONSTANTS.BLOCK_SIZE;
              col += 1;
          }
  
          // cycle repeats (wraps) after 8 columns
          col = col % CONSTANTS.GRIDSQUARE_SET_COL_SIZE;
  
          return lettersHelper(findSet(zoneNum), row, col);
      }
  
      module.exports = function (constants) {
          CONSTANTS = constants;
  
          return {
              findGridLetters: findGridLetters
          };
      };
  }());
  

  provide("examples/.lib/utm/help", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/constants as examples/.lib/constants
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var DEG_2_RAD = Math.PI / 180,
          RAD_2_DEG = 180.0 / Math.PI,
          EQUATORIAL_RADIUS,
          ECC_SQUARED,
          ECC_PRIME_SQUARED,
          IS_NAD83_DATUM = true,
          EASTING_OFFSET = 500000.0,
          NORTHING_OFFSET = 10000000.0,
          GRIDSQUARE_SET_COL_SIZE = 8,  // column width of grid square set
          GRIDSQUARE_SET_ROW_SIZE = 20, // row height of grid square set
          BLOCK_SIZE  = 100000, // size of square identifier (within grid zone designation),
          E1,
          k0 = 0.9996; // scale factor of central meridian
  
      // check for NAD83
      if (IS_NAD83_DATUM) {
          EQUATORIAL_RADIUS = 6378137.0; // GRS80 ellipsoid (meters)
          ECC_SQUARED = 0.006694380023; 
      } else {
          // else NAD27 datum is assumed
          EQUATORIAL_RADIUS = 6378206.4; // Clarke 1866 ellipsoid (meters)
          ECC_SQUARED = 0.006768658;
      }
  
      // variable used in inverse formulas (UTMtoLL function)
      E1 = (1 - Math.sqrt(1 - ECC_SQUARED)) / (1 + Math.sqrt(1 - ECC_SQUARED));
  
      ECC_PRIME_SQUARED = ECC_SQUARED / (1 - ECC_SQUARED);
  
      module.exports.DEG_2_RAD = DEG_2_RAD;
      module.exports.RAD_2_DEG = RAD_2_DEG;
      module.exports.EQUATORIAL_RADIUS = EQUATORIAL_RADIUS;
      module.exports.ECC_SQUARED = ECC_SQUARED;
      module.exports.ECC_PRIME_SQUARED = ECC_PRIME_SQUARED;
      module.exports.EASTING_OFFSET = EASTING_OFFSET;
      module.exports.NORTHING_OFFSET = NORTHING_OFFSET;
      module.exports.GRIDSQUARE_SET_COL_SIZE = GRIDSQUARE_SET_COL_SIZE;
      module.exports.GRIDSQUARE_SET_ROW_SIZE = GRIDSQUARE_SET_ROW_SIZE;
      module.exports.BLOCK_SIZE = BLOCK_SIZE;
      module.exports.E1 = E1;
      module.exports.k0 = k0;
  }());
  

  provide("examples/.lib/constants", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/utm/utmToLatLong as examples/.lib/utm/utmToLatLong
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var CONSTANTS = {};
  
      /*
       * Converts UTM coordinates to decimal degrees.
       *
       * Equations from USGS Bulletin 1532 (or USGS Professional Paper 1395)
       * East Longitudes are positive, West longitudes are negative. 
       * North latitudes are positive, South latitudes are negative.
       *
       * @param UTMNorthing- northing-m (numeric), eg. 432001.8  
       * @param UTMEasting- easting-m  (numeric), eg. 4000000.0
       * @param UTMZoneNumber- 6-deg longitudinal zone (numeric), eg. 18
       * @return Property with two properties, lat & lon
       */
      function utmToLatLong(UTMNorthing, UTMEasting, UTMZoneNumber) {
          var xUTM,
              yUTM,
              zoneNumber,
              lonOrigin,
              M, // M is the "true distance along the central meridian from the Equator to phi (latitude)
              mu,
              phi1Rad,
              phi1,
              N1,
              T1,
              C1,
              R1,
              D,
              lat,
              lon,
              ret = {};
  
          // remove 500,000 meter offset for longitude
          xUTM = parseFloat(UTMEasting) - CONSTANTS.EASTING_OFFSET; 
          yUTM = parseFloat(UTMNorthing);
          zoneNumber = parseInt(UTMZoneNumber, 10);
  
          // origin longitude for the zone (+3 puts origin in zone center) 
          lonOrigin = (zoneNumber - 1) * 6 - 180 + 3; 
  
          M = yUTM / CONSTANTS.k0;
          mu = M / ( CONSTANTS.EQUATORIAL_RADIUS * (1 - CONSTANTS.ECC_SQUARED / 4 - 3 * CONSTANTS.ECC_SQUARED * 
                          CONSTANTS.ECC_SQUARED / 64 - 5 * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED / 256 ));
  
          // phi1 is the "footprint latitude" or the latitude at the central meridian which
          // has the same y coordinate as that of the point (phi (lat), lambda (lon) ).
          phi1Rad = mu + (3 * CONSTANTS.E1 / 2 - 27 * CONSTANTS.E1 * CONSTANTS.E1 * CONSTANTS.E1 / 32 ) * Math.sin( 2 * mu) + ( 21 * CONSTANTS.E1 * CONSTANTS.E1 / 16 - 55 * CONSTANTS.E1 * CONSTANTS.E1 * CONSTANTS.E1 * CONSTANTS.E1 / 32) * Math.sin( 4 * mu) + (151 * CONSTANTS.E1 * CONSTANTS.E1 * CONSTANTS.E1 / 96) * Math.sin(6 * mu);
          phi1 = phi1Rad * CONSTANTS.RAD_2_DEG;
  
          // Terms used in the conversion equations
          N1 = CONSTANTS.EQUATORIAL_RADIUS / Math.sqrt( 1 - CONSTANTS.ECC_SQUARED * Math.sin(phi1Rad) * 
                      Math.sin(phi1Rad));
          T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
          C1 = CONSTANTS.ECC_PRIME_SQUARED * Math.cos(phi1Rad) * Math.cos(phi1Rad);
          R1 = CONSTANTS.EQUATORIAL_RADIUS * (1 - CONSTANTS.ECC_SQUARED) / Math.pow(1 - CONSTANTS.ECC_SQUARED * 
                        Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
          D = xUTM / (N1 * CONSTANTS.k0);
  
          // Calculate latitude, in decimal degrees
          lat = phi1Rad - ( N1 * Math.tan(phi1Rad) / R1) * (D * D / 2 - (5 + 3 * T1 + 10
                * C1 - 4 * C1 * C1 - 9 * CONSTANTS.ECC_PRIME_SQUARED) * D * D * D * D / 24 + (61 + 90 * 
                  T1 + 298 * C1 + 45 * T1 * T1 - 252 * CONSTANTS.ECC_PRIME_SQUARED - 3 * C1 * C1) * D * D *
                  D * D * D * D / 720);
          lat = lat * CONSTANTS.RAD_2_DEG;
  
          // Calculate longitude, in decimal degrees
          lon = (D - (1 + 2 * T1 + C1) * D * D * D / 6 + (5 - 2 * C1 + 28 * T1 - 3 * 
                    C1 * C1 + 8 * CONSTANTS.ECC_PRIME_SQUARED + 24 * T1 * T1) * D * D * D * D * D / 120) /
                    Math.cos(phi1Rad);
  
          lon = lonOrigin + lon * CONSTANTS.RAD_2_DEG;
  
          ret.latitude = lat;
          ret.longitude = lon;
  
          return ret;
      }
  
      module.exports = function (constants) {
          CONSTANTS = constants;
  
          return utmToLatLong;
      };
  }());
  

  provide("examples/.lib/utm/utmToLatLong", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/utm/utmToUsng as examples/.lib/utm/utmToUsng
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var helpers =  require('examples/.lib/utm/help'),
          CONSTANTS = {};
  
      /*
       * Converts a UTM coordinate to USNG:
       * 
       * @param coords- object with parts of a UTM coordinate
       * @param precision- How many decimal places (1-5) in USNG (default 5)
       * @param output- Format to output. Options include: 'string' and 'object'
       * @return String of the format- DDL LL DDDDD DDDDD (5-digit precision)
       */
      function utmToUsng(coords, precision, output) {
          var utmEasting,
              utmNorthing,
              letters,
              usngNorthing,
              usngEasting,
              usng,
              i;
  
          if (typeof precision === 'string') {
              precision = parseInt(precision, 10);
          }
  
          precision = precision ? precision : 5;
  
          utmEasting = coords.easting;
          utmNorthing = coords.northing;
  
          // southern hemisphere case
          if (coords.hemisphere === 'S') {
              // Use offset for southern hemisphere
              utmNorthing += CONSTANTS.NORTHING_OFFSET; 
          }
  
          letters  = helpers.findGridLetters(coords.zoneNumber, utmNorthing, utmEasting);
          usngNorthing = Math.round(utmNorthing) % CONSTANTS.BLOCK_SIZE;
          usngEasting  = Math.round(utmEasting)  % CONSTANTS.BLOCK_SIZE;
  
          // added... truncate digits to achieve specified precision
          usngNorthing = Math.floor(usngNorthing / Math.pow(10,(5-precision)));
          usngEasting = Math.floor(usngEasting / Math.pow(10,(5-precision)));
  
          // REVISIT: Modify to incorporate dynamic precision ?
          for (i = String(usngEasting).length; i < precision; i += 1) {
               usngEasting = "0" + usngEasting;
          }
  
          for (i = String(usngNorthing).length; i < precision; i += 1) {
              usngNorthing = "0" + usngNorthing;
          }
  
          if (typeof output === 'string' && output === 'object') {
              usng = {
                  zone: coords.zoneNumber + coords.zoneLetter,
                  square: letters,
                  easting: usngEasting,
                  northing: usngNorthing
              };
          } else {
              usng = coords.zoneNumber + coords.zoneLetter + " " + letters + " " + 
                    usngEasting + " " + usngNorthing;
          }
  
          return usng;
      }
  
      module.exports = function (constants) {
          CONSTANTS = constants;
  
          helpers = helpers(constants);
  
          return utmToUsng;
      };
  }());
  

  provide("examples/.lib/utm/utmToUsng", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/latlong/helpers as examples/.lib/latlong/helpers
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var CONSTANTS = {};
  
      /*
       * Finds the set for a given zone.
       *
       * There are six unique sets, corresponding to individual grid numbers in 
       * sets 1-6, 7-12, 13-18, etc. Set 1 is the same as sets 7, 13, ..; Set 2 
       * is the same as sets 8, 14, ..
       *
       * See p. 10 of the "United States National Grid" white paper.
       */
      function findSet (zoneNum) {
          var tReturn;
  
          zoneNum = parseInt(zoneNum, 10);
          zoneNum = zoneNum % 6;
  
          switch (zoneNum) {
              case 0:
                  tReturn = 6;
                  break;
  
              case 1:
                  tReturn = 1; 
                  break;
  
              case 2:
                  tReturn = 2;
                  break;
  
              case 3:
                  tReturn = 3;
                  break;
  
              case 4:
                  tReturn = 4;
                  break;
  
              case 5:
                  tReturn = 5;
                  break;
  
              default:
                  tReturn = -1;
                  break;
          }
  
          return tReturn;
      }
  
      /*
       * Retrieve the Square Identification (two-character letter code), for the
       * given row, column and set identifier (set refers to the zone set: 
       * zones 1-6 have a unique set of square identifiers; these identifiers are 
       * repeated for zones 7-12, etc.) 
  
       * See p. 10 of the "United States National Grid" white paper for a diagram
       * of the zone sets.
       */
      function lettersHelper(set, row, col) {
          var l1, l2;
  
          // handle case of last row
          if (row === 0) {
              row = CONSTANTS.GRIDSQUARE_SET_ROW_SIZE - 1;
          } else {
              row -= 1;
          }
  
          // handle case of last column
          if (col === 0) {
              col = CONSTANTS.GRIDSQUARE_SET_COL_SIZE - 1;
          } else {
              col -= 1;
          }
  
          switch (set) {
              case 1:
                  l1 = "ABCDEFGH";              // column ids
                  l2 = "ABCDEFGHJKLMNPQRSTUV";  // row ids
                  break;
  
              case 2:
                  l1 = "JKLMNPQR";
                  l2 = "FGHJKLMNPQRSTUVABCDE";
                  break;
  
              case 3:
                  l1 = "STUVWXYZ";
                  l2 = "ABCDEFGHJKLMNPQRSTUV";
                  break;
  
              case 4:
                  l1 = "ABCDEFGH";
                  l2 = "FGHJKLMNPQRSTUVABCDE";
                  break;
  
              case 5:
                  l1 = "JKLMNPQR";
                  l2 = "ABCDEFGHJKLMNPQRSTUV";
                   break;
  
              case 6:
                  l1 = "STUVWXYZ";
                  l2 = "FGHJKLMNPQRSTUVABCDE";
                  break;
          }
  
          return l1.charAt(col) + l2.charAt(row);
      }
  
      /*
       * Retrieves the square identification for a given coordinate pair & zone.
       * See "lettersHelper" function documentation for more details.
       */
      function findGridLetters(zoneNum, northing, easting) {
          var north_1m, east_1m, row, col;
  
          zoneNum  = parseInt(zoneNum, 10);
          northing = parseFloat(northing);
          easting  = parseFloat(easting);
          row = 1;
  
          // northing coordinate to single-meter precision
          north_1m = Math.round(northing);
  
          // Get the row position for the square identifier that contains the point
          while (north_1m >= CONSTANTS.BLOCK_SIZE) {
              north_1m = north_1m - CONSTANTS.BLOCK_SIZE;
              row += 1;
          }
  
          // cycle repeats (wraps) after 20 rows
          row = row % CONSTANTS.GRIDSQUARE_SET_ROW_SIZE;
          col = 0;
  
          // easting coordinate to single-meter precision
          east_1m = Math.round(easting);
  
          // Get the column position for the square identifier that contains the point
          while (east_1m >= CONSTANTS.BLOCK_SIZE){
              east_1m = east_1m - CONSTANTS.BLOCK_SIZE;
              col += 1;
          }
  
          // cycle repeats (wraps) after 8 columns
          col = col % CONSTANTS.GRIDSQUARE_SET_COL_SIZE;
  
          return lettersHelper(findSet(zoneNum), row, col);
      }
  
      /*
       * Retrieves grid zone designator letter.
       *
       * This routine determines the correct UTM letter designator for the given 
       * latitude returns 'Z' if latitude is outside the UTM limits of 84N to 80S
       *
       * Returns letter designator for a given latitude. 
       * Letters range from C (-80 lat) to X (+84 lat), with each zone spanning
       * 8 degrees of latitude.
       */
      function utmLetterDesignator(lat) {
          var letterDesignator;
  
          lat = parseFloat(lat);
  
          if ((84 >= lat) && (lat >= 72)) {
              letterDesignator = 'X';
          } else if ((72 > lat) && (lat >= 64)) {
              letterDesignator = 'W';
          } else if ((64 > lat) && (lat >= 56)) {
              letterDesignator = 'V';
          } else if ((56 > lat) && (lat >= 48)) {
              letterDesignator = 'U';
          } else if ((48 > lat) && (lat >= 40)) {
              letterDesignator = 'T';
          } else if ((40 > lat) && (lat >= 32)) {
              letterDesignator = 'S';
          } else if ((32 > lat) && (lat >= 24)) {
              letterDesignator = 'R';
          } else if ((24 > lat) && (lat >= 16)) {
              letterDesignator = 'Q';
          } else if ((16 > lat) && (lat >= 8)) {
              letterDesignator = 'P';
          } else if (( 8 > lat) && (lat >= 0)) {
              letterDesignator = 'N';
          } else if (( 0 > lat) && (lat >= -8)) {
              letterDesignator = 'M';
          } else if ((-8> lat) && (lat >= -16)) {
              letterDesignator = 'L';
          } else if ((-16 > lat) && (lat >= -24)) {
              letterDesignator = 'K';
          } else if ((-24 > lat) && (lat >= -32)) {
              letterDesignator = 'J';
          } else if ((-32 > lat) && (lat >= -40)) {
              letterDesignator = 'H';
          } else if ((-40 > lat) && (lat >= -48)) {
              letterDesignator = 'G';
          } else if ((-48 > lat) && (lat >= -56)) {
              letterDesignator = 'F';
          } else if ((-56 > lat) && (lat >= -64)) {
              letterDesignator = 'E';
          } else if ((-64 > lat) && (lat >= -72)) {
              letterDesignator = 'D';
          } else if ((-72 > lat) && (lat >= -80)) {
              letterDesignator = 'C';
          } else {
              letterDesignator = 'Z'; // This is here as an error flag to show 
                                    // that the latitude is outside the UTM limits
          }
          
          return letterDesignator;
      }
  
      /*
       * Verifies a coordinate object by following these steps:
       * - converts string members (degrees, minutes, seconds) to numbers
       * - if direction is present, makes degree positive or negative accordingly
       * 
       * @param coord- object with at least degrees, minutes, and seconds
       * @return New, cleaned object (doesn't have direction)
       */
      function dmsVerify(coord) {
          var newCoord = {};
  
          if (typeof coord !== 'object' || !coord.degrees || !coord.minutes || !coord.seconds) {
              return false;
          }
  
          if (typeof coord.degrees === 'string') {
              newCoord.degrees = parseInt(coord.degrees, 10);
          } else {
              newCoord.degrees = coord.degrees;
          }
  
          if (coord.direction) {
              if (coord.direction === 'S' || coord.direction === 'W') {
                  newCoord.degrees *= -Math.abs(newCoord.degrees);
              } else {
                  newCoord.degrees *= Math.abs(newCoord.degrees);
              }
          }
  
          if (typeof coord.minutes === 'string') {
              newCoord.minutes = Math.abs(parseInt(coord.minutes, 10));
          } else {
              newCoord.minutes = Math.abs(coord.minutes);
          }
  
          if (typeof coord.seconds === 'string') {
              newCoord.seconds = Math.abs(parseInt(coord.seconds, 10));
          } else {
              newCoord.seconds = Math.abs(coord.seconds);
          }
      }
  
      function dmsToDecimal(angle) {
          var reg = /^[NSEW\-]?\d{1,3}[° ]\d{1,2}[' ]\d{1,2}(\.\d{1,3})?[" ][NSEW]?$/,
              regSplit = /-?\d+(\.\d+)?/g,
              dms = {},
              tmp,
              ret;
  
          if (typeof angle === 'object') {
              dms = dmsVerify(angle);
          } else {
              if (!reg.test(angle)) {
                  throw "Angle not formatted correctly: " + angle;
              }
              tmp = angle.match(regSplit);
               
              dms.degrees = parseInt(tmp[0], 10);
              dms.minutes = parseInt(tmp[1], 10);
              dms.seconds = parseFloat(tmp[2]);
          }
  
          tmp = String(dms.minutes / 60 + dms.seconds / 3600);
          ret = dms.degrees + '.' + tmp.substring(tmp.indexOf('.') + 1);
  
          return parseFloat(ret);
      }
  
      /*
       * Retrieves zone number from latitude and longitude.
       *
       * Zone numbers range from 1 - 60 over the range [-180 to +180]. Each
       * range is 6 degrees wide. Special cases for points outside normal
       * [-80 to +84] latitude zone.
       */
      function getZoneNumber(lat, lon) {
          var zoneNumber;
  
          lat = parseFloat(lat);
          lon = parseFloat(lon);
  
          // sanity check on input, remove for production
          if (lon > 360 || lon < -180 || lat > 90 || lat < -90) {
              throw "Bad input. lat: " + lat + " lon: " + lon;
          }
  
          zoneNumber = parseInt((lon + 180) / 6, 10) + 1;
  
          // Handle special case of west coast of Norway
          if (lat >= 56.0 && lat < 64.0 && lon >= 3.0 && lon < 12.0) {
              zoneNumber = 32;
          }
  
          // Special zones for Svalbard
          if (lat >= 72.0 && lat < 84.0) {
              if (lon >= 0.0  && lon <  9.0) {
                  zoneNumber = 31;
              } else if (lon >= 9.0  && lon < 21.0) {
                  zoneNumber = 33;
              } else if (lon >= 21.0 && lon < 33.0) {
                  zoneNumber = 35;
              } else if (lon >= 33.0 && lon < 42.0) {
                  zoneNumber = 37;
              }
          }
  
          return zoneNumber;  
      }
  
      module.exports = function (constants) {
          // set global functions
          CONSTANTS = constants;
  
          return {
              dmsVerify: dmsVerify,
              dmsToDecimal: dmsToDecimal,
              getZoneNumber: getZoneNumber,
              utmLetterDesignator: utmLetterDesignator,
              findGridLetters: findGridLetters
          };
      };
  }());
  

  provide("examples/.lib/latlong/helpers", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/usng/usngToUtm as examples/.lib/usng/usngToUtm
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      /*
       * Converts USNG to UTM.
       *
       * @param usngStr- string representing a USNG string
       * @return Returns an object with zoneNumber, zoneLetter, easting and northing
       */ 
      function usngToUtm(usng) { 
          var zoneBase,
              segBase,
              eSqrs,
              appxEast,
              appxNorth,
              letNorth,
              nSqrs,
              zoneStart,
              USNGSqEast = "ABCDEFGHJKLMNPQRSTUVWXYZ",
              ret = {},
              usng;
  
          //Starts (southern edge) of N-S zones in millons of meters
          zoneBase = [
              1.1, 2.0, 2.8, 3.7, 4.6, 5.5, 6.4, 7.3, 8.2, 9.1,
              0, 0.8, 1.7, 2.6, 3.5, 4.4, 5.3, 6.2, 7.0, 7.9
          ];
  
          //Starts of 2 million meter segments, indexed by zone 
          segBase = [
              0, 2, 2, 2, 4, 4, 6, 6, 8, 8,
              0, 0, 0, 2, 2, 4, 4, 6, 6, 6
          ];
  
          // convert easting to UTM
          eSqrs = USNGSqEast.indexOf(usng.sq1);          
          appxEast = 1 + eSqrs % 8; 
  
          // convert northing to UTM
          letNorth = "CDEFGHJKLMNPQRSTUVWX".indexOf(usng.zoneLetter);
          if (usng.zoneNumber % 2) {
              //odd number zone
              nSqrs = "ABCDEFGHJKLMNPQRSTUV".indexOf(usng.sq2);
          } else {
              // even number zone
              nSqrs = "FGHJKLMNPQRSTUVABCDE".indexOf(usng.sq2);
          }
  
          zoneStart = zoneBase[letNorth];
          appxNorth = segBase[letNorth] + nSqrs / 10;
          if (appxNorth < zoneStart) {
              appxNorth += 2;
          }
  
          ret.northing = appxNorth * 1000000 + usng.north * Math.pow(10, 5 - String(usng.north).length);
          ret.easting = appxEast * 100000 + usng.east * Math.pow(10, 5 - String(usng.east).length);
          ret.zoneNumber = usng.zoneNumber;
          ret.zoneLetter = usng.zoneLetter;
  
          return ret;
      }
  
      module.exports = function () {
          return usngToUtm;
      };
  }());
  

  provide("examples/.lib/usng/usngToUtm", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/usng/parseUsng as examples/.lib/usng/parseUsng
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      /*
       * Converts lower-case characters to upper case, removes spaces, and 
       * separates the string into logical parts.
       */
      function parseUsng(usngStr_input) {
          var j = 0,
              k,
              usngStr = [],
              usngStr_temp = [],
              parts = {};
  
          usngStr_temp = usngStr_input.toUpperCase();
  
          // put usgn string in 'standard' form with no space delimiters
          usngStr = usngStr_temp.replace(/%20/g, "");
          usngStr = usngStr_temp.replace(/ /g, "");
  
          if (usngStr.length < 7) {
              alert("This application requires minimum USNG precision of 10,000 meters");
              return 0;
          }
  
          // break usng string into its component pieces
          parts.zoneNumber = usngStr.match(/^\d{1,2}/)[0];
          j += parts.zoneNumber.length;
          parts.zoneNumber = parseInt(parts.zoneNumber, 10);
          parts.zoneLetter = usngStr.charAt(j); j+= 1;
          parts.sq1 = usngStr.charAt(j); j += 1;
          parts.sq2 = usngStr.charAt(j); j += 1;
  
          parts.precision = (usngStr.length-j) / 2;
          parts.east='';
          parts.north='';
          for (k = 0; k < parts.precision; k += 1) {
              parts.east += usngStr.charAt(j);
              j += 1;
          }
  
          if (usngStr[j] === " ") {
              j += 1;
          }
          for (k = 0; k < parts.precision; k += 1) {
              parts.north += usngStr.charAt(j);
              j += 1;
          }
  
          return parts;
      }
  
      module.exports = function () {
          return parseUsng;
      };
  }());
  

  provide("examples/.lib/usng/parseUsng", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/usng/isUsng as examples/.lib/usng/isUsng
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      /*
       * Checks a string to see if it is valid USNG;
       * If so, returns the string in all upper case, no delimeters
       * If not, returns false
       */
      function isUsng(inputStr) {
          var usngStr = [],
              strregexp;
  
         // convert all letters to upper case
         usngStr = inputStr.toUpperCase();
       
         // get rid of space delimeters
         usngStr = usngStr.replace(/%20/g, "");
         usngStr = usngStr.replace(/ /g, "");
  
         if (usngStr.length > 15) {
            return false;
         }
  
         strregexp = /^[0-9]{2}[CDEFGHJKLMNPQRSTUVWX]$/;
         if (usngStr.match(strregexp)) {
            throw "Input appears to be a UTM zone, but more precision is required to display an accurate result: " + usngStr;
         }
  
         strregexp = /^[0-9]{2}[CDEFGHJKLMNPQRSTUVWX][ABCDEFGHJKLMNPQRSTUVWXYZ][ABCDEFGHJKLMNPQRSTUV]([0-9][0-9]){0,5}/;
         if (!usngStr.match(strregexp)) {
            return false;
         }
  
         if (usngStr.length < 7) {
            throw "Format looks right, but precision should be to least 10,000 meters: " + usngStr;
         }
  
         // all tests passed...return the upper-case, non-delimited string
         return usngStr;
      }
  
      module.exports = function () {
          return isUsng;
      };
  }());
  

  provide("examples/.lib/usng/isUsng", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/utm as examples/.lib/utm
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var CONSTANTS =  require('examples/.lib/constants'),
          utmToLatLong =  require('examples/.lib/utm/utmToLatLong')(CONSTANTS),
          utmToUsng =  require('examples/.lib/utm/utmToUsng')(CONSTANTS);
  
      function getConverter (outputType) {
          var fn;
  
          switch (outputType.toLowerCase()) {
              case 'latlong':
                  fn = utmToLatLong;
                  break;
  
              case 'usng':
                  fn = utmToUsng;
                  break;
          }
  
          return fn;
      }
  
      module.exports.toLatLong = utmToLatLong;
      module.exports.toUsng = utmToUsng;
      module.exports.getConverter = getConverter;
  }());
  

  provide("examples/.lib/utm", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/latlong/decimalToDegMinSec as examples/.lib/latlong/decimalToDegMinSec
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      /*
       * Converts decimal degrees to degrees, minutes seconds.
       * 
       * This function can either return a formatted string or an object.
       * 
       * If string or nothing is specified, it will look like this: 41°25'01"N
       * 
       * If object is chosen, it will have two properties, latitude and longitude.
       * Each will have these properties:
       * - degrees: positive integer
       * - minutes: positive integer
       * - seconds: positive float
       * - direction: N, S, E, or W
       * 
       * @param lat- latitude (float or string representing a float)
       * @param lon- longitude (float or string representing a float)
       * @param type- string representing return type (object or string); optional
       * @param digits- max digits in seconds; can be 3rd parameter; default is 2
       * @return Depents on type parameter (map of formatted strings or values)
       */
      function decimalToDegMinSec (lat, lon, type, digits) {
          var latDeg,
              latMin,
              latSec,
              lonDeg,
              lonMin,
              lonSec,
              latDir,
              lonDir,
              ret,
              magic;
  
          if (typeof digits === 'undefined') {
              digits = type;
          }
  
          if (typeof digits === 'string') {
              digits = parseInt(digits, 10);
          } else if (typeof digits !== 'number') {
              digits = 2;
          }
  
          // magic number that helps us round off un-needed digits
          magic = Math.pow(10, digits);
  
          lat = (typeof lat === 'string') ? parseFloat(lat) : lat;
          lon = (typeof lon === 'string') ? parseFloat(lon) : lon;
  
          if (lat < -90 || lat > 90) {
              throw "Latitude out of range: " + lat;
          }
  
          if (lon < -180 || lon > 180) {
              throw "Longitude out of range: " + lon;
          }
  
          latDir = (lat >= 0) ? 'N' : 'S';
          lonDir = (lon >= 0) ? 'E' : 'W';
  
          // Change to absolute value
          lat = Math.abs(lat);
          lon = Math.abs(lon);
  
          // Convert to Degree Minutes Seconds Representation
          latDeg = Math.floor(lat);
          lat -= latDeg;
          latMin = Math.floor(lat * 60);
          lat -= latMin / 60;
          latSec = Math.round((lat * 3600) * magic) / magic;
  
          lonDeg = Math.floor(lon);
          lon -= lonDeg;
          lonMin = Math.floor(lon * 60);
          lon -= lonMin / 60;
          lonSec = Math.round((lon * 3600) * magic) / magic;
  
          if (type === 'object') {
              ret = {
                  latitude: {
                      degrees: latDeg,
                      minutes: latMin,
                      seconds: latSec,
                      direction: latDir
                  },
                  longitude: {
                      degrees: lonDeg,
                      minutes: lonMin,
                      seconds: lonSec,
                      direction: lonDir
                  }
              };
          } else {
              ret = {
                  latitude: latDeg + '°' + latMin + '\'' + latSec + '"' + latDir,
                  longitude: lonDeg + '°' + lonMin + '\'' + lonSec + '"' + lonDir
              };
          }
  
          return ret;
      }
  
      module.exports = function () {
          return decimalToDegMinSec;
      };
  }());
  

  provide("examples/.lib/latlong/decimalToDegMinSec", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/latlong/degMinSecToDecimal as examples/.lib/latlong/degMinSecToDecimal
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var helpers =  require('examples/.lib/latlong/helpers');
  
      /*
       * Converts degrees, minutes, seconds to decimal degrees.
       * 
       * If objects are passed in, they should define these properties:
       * - degrees: integer (or string representing an integer)
       * - minutes: integer (or string representing an integer)
       * - seconds: float (or string representing a float)
       * - direction: N, S, E, or W
       * 
       * If strings are passed in, they will be parsed according to specs.
       * 
       * @param latitude- formatted string or an object with properties:
       * @param longitude- formatted string or an object
       * @return  Object with both latitude and longitude
       */
      function degMinSecToDecimal(latitude, longitude) {
          var regDir = /[NSEW\-]/,
              lat,
              lon,
              tmp,
              ret = {};
  
          lat = helpers.dmsToDecimal(latitude);
          lon = helpers.dmsToDecimal(longitude);
  
          // Check if any error occurred
          if (lat < -90 || lat > 90) {
              throw "Latitude out of bounds: " + lat;
          }
          if (lon < -180 || lon > 180) {
              throw "Longitude out of bounds: " + lon;
          }
  
          tmp = latitude.match(regDir);
  
          if (tmp[0] === 'S' || tmp[0] === '-') {
              lat *= -1;
          }
          ret.latitude = lat;
  
          tmp = longitude.match(regDir);
  
          if (tmp[0] === 'W' || tmp[0] === '-') {
              lon *= -1;
          }
          ret.longitude = lon;
  
          return ret;
      }
  
      module.exports = function (constants) {
          helpers = helpers(constants);
  
          return degMinSecToDecimal;
      };
  }());
  

  provide("examples/.lib/latlong/degMinSecToDecimal", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/latlong/latlongToUtm as examples/.lib/latlong/latlongToUtm
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var CONSTANTS = {},
          helpers =  require('examples/.lib/latlong/helpers');
  
      /*
       * Converts latitude and longitude to UTM.
       *
       * Converts lat/long to UTM coords.  Equations from USGS Bulletin 1532 
       * (or USGS Professional Paper 1395 "Map Projections - A Working Manual", 
       * by John P. Snyder, U.S. Government Printing Office, 1987.)
       * 
       * Note- UTM northings are negative in the southern hemisphere.
       *
       * @param lat- Latitude in decimal; north is positive, south is negative
       * @param lon- Longitude in decimal; east is positive, west is negative
       * @param zone- optional, result zone
       * @return Object with three properties, easting, northing, zone
       */
      function latLongToUtm(lat, lon, zone) {
          var zoneNumber,
              latRad,
              lonRad,
              lonOrigin,
              lonOriginRad,
              utmEasting,
              utmNorthing,
              N,
              T,
              C,
              A,
              M,
              utmcoords = {};
  
          lat = parseFloat(lat);
          lon = parseFloat(lon);
  
          // Constrain reporting USNG coords to the latitude range [80S .. 84N]
          if (lat > 84.0 || lat < -80.0) {
              return "undefined";
          }
  
          // sanity check on input - remove for production
          // Make sure the longitude is between -180.00 .. 179.99..
          if (lon > 180 || lon < -180 || lat > 90 || lat < -90) {
              throw "Bad input. lat: " + lat + " lon: " + lon;
          }
  
          // convert lat/lon to radians
          latRad = lat * CONSTANTS.DEG_2_RAD;
          lonRad = lon * CONSTANTS.DEG_2_RAD;
  
          // User-supplied zone number will force coordinates to be computed in a particular zone
          zoneNumber = zone || helpers.getZoneNumber(lat, lon);
  
          // +3 puts origin in middle of zone
          lonOrigin = (zoneNumber - 1) * 6 - 180 + 3;
          lonOriginRad = lonOrigin * CONSTANTS.DEG_2_RAD;
  
          N = CONSTANTS.EQUATORIAL_RADIUS / Math.sqrt(1 - CONSTANTS.ECC_SQUARED * Math.pow(Math.sin(latRad), 2));
          T = Math.pow(Math.tan(latRad), 2);
          C = CONSTANTS.ECC_PRIME_SQUARED * Math.pow(Math.cos(latRad), 2);
          A = Math.cos(latRad) * (lonRad - lonOriginRad);
  
          // Note that the term Mo drops out of the "M" equation, because phi 
          // (latitude crossing the central meridian, lambda0, at the origin of the
          //  x,y coordinates), is equal to zero for UTM.
          M = CONSTANTS.EQUATORIAL_RADIUS * (
              (1 - CONSTANTS.ECC_SQUARED / 4 - 3 * (CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED) / 64 - 5 * (CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED) / 256) * latRad -
              (3 * CONSTANTS.ECC_SQUARED / 8 + 3 * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED / 32 + 45 * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED / 1024) * Math.sin(2 * latRad) +
              (15 * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED / 256 + 45 * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED / 1024) * Math.sin(4 * latRad) -
              (35 * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED / 3072) * Math.sin(6 * latRad));
  
          utmEasting = (CONSTANTS.k0 * N *
              (A + (1 - T + C) * (A * A * A) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * CONSTANTS.ECC_PRIME_SQUARED ) * (A * A * A * A * A) / 120) + CONSTANTS.EASTING_OFFSET);
  
          utmNorthing = (CONSTANTS.k0 * ( M + N * Math.tan(latRad) * (
                (A * A) / 2 + (5 - T + 9 * C + 4 * C * C ) * (A * A * A * A) / 2 +
                (61 - 58 * T + T * T + 600 * C - 330 * CONSTANTS.ECC_PRIME_SQUARED ) *
                (A * A * A * A * A * A) / 720)
            ) );
  
          if (utmNorthing < 0) {
              utmNorthing += 10000000;
          }
  
          utmcoords.easting = Math.round(utmEasting);
          utmcoords.northing = Math.round(utmNorthing);
          utmcoords.zoneNumber = zoneNumber;
          utmcoords.zoneLetter = helpers.utmLetterDesignator(lat);
          utmcoords.hemisphere = lat < 0 ? 'S' : 'N';
  
          return utmcoords;
      }
  
      module.exports = function (constants) {
          CONSTANTS = constants;
  
          helpers = helpers(constants);
  
          return latLongToUtm;
      };
  }());
  

  provide("examples/.lib/latlong/latlongToUtm", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/latlong/translate as examples/.lib/latlong/translate
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var CONSTANTS = {};
  
      function translate(lat, lon, d, brng) {
          var R = 6371,
              lat2,
              lon2,
              ret;
  
          lat *= CONSTANTS.DEG_2_RAD;
          lon *= CONSTANTS.DEG_2_RAD;
          
          brng *= CONSTANTS.DEG_2_RAD;
          
          lat2 = Math.asin(Math.sin(lat) * Math.cos(d/R) + 
                        Math.cos(lat) * Math.sin(d/R) * Math.cos(brng));
  
          lon2 = lon + Math.atan2(Math.sin(brng) * Math.sin(d/R) * Math.cos(lat), 
                        Math.cos(d/R) - Math.sin(lat) * Math.sin(lat2));
                        
          lon2 = (lon2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
          
          ret = {
              latitude: lat2 * CONSTANTS.RAD_2_DEG,
              longitude: lon2 * CONSTANTS.RAD_2_DEG
          };
  
          return ret;
      }
  
      module.exports = function (constants) {
          CONSTANTS = constants;
  
          return translate;
      };
  }());
  

  provide("examples/.lib/latlong/translate", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/mgrs/mgrsToUtm as examples/.lib/mgrs/mgrsToUtm
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var MGRS_Ellipsoid_Code = "WE",
          CLARKE_1866 = "CC", // Ellipsoid code for CLARKE_1866
          CLARKE_1880 = "CD", // Ellipsoid code for CLARKE_1880
          BESSEL_1841 = "BR", // Ellipsoid code for BESSEL_1841
          BESSEL_1841_NAMIBIA = "BN", // Ellipsoid code for BESSEL 1841 (NAMIBIA)
          Latitude_Band_Table = {
              'C': { min_northing: 1100000.0, north: -72.0, south: -80.5},
              'D': { min_northing: 2000000.0, north: -64.0, south: -72.0},
              'E': { min_northing: 2800000.0, north: -56.0, south: -64.0},
              'F': { min_northing: 3700000.0, north: -48.0, south: -56.0},
              'G': { min_northing: 4600000.0, north: -40.0, south: -48.0},
              'H': { min_northing: 5500000.0, north: -32.0, south: -40.0},
              'J': { min_northing: 6400000.0, north: -24.0, south: -32.0},
              'K': { min_northing: 7300000.0, north: -16.0, south: -24.0},
              'L': { min_northing: 8200000.0, north: -8.0, south: -16.0},
              'M': { min_northing: 9100000.0, north: 0.0, south: -8.0},
              'N': { min_northing: 0.0, north: 8.0, south: 0.0},
              'P': { min_northing: 800000.0, north: 16.0, south: 8.0},
              'Q': { min_northing: 1700000.0, north: 24.0, south: 16.0},
              'R': { min_northing: 2600000.0, north: 32.0, south: 24.0},
              'S': { min_northing: 3500000.0, north: 40.0, south: 32.0},
              'T': { min_northing: 4400000.0, north: 48.0, south: 40.0},
              'U': { min_northing: 5300000.0, north: 56.0, south: 48.0},
              'V': { min_northing: 6200000.0, north: 64.0, south: 56.0},
              'W': { min_northing: 7000000.0, north: 72.0, south: 64.0},
              'X': { min_northing: 7900000.0, north: 84.5, south: 72.0}
          };
  
      /*
       * The function breakMGRS breaks down an MGRS  
       * coordinate string into its component parts.
       *
       *   MGRS           : MGRS coordinate string          (input)
       *   Zone           : UTM Zone                        (output)
       *   Letters        : MGRS coordinate string letters  (output)
       *   Easting        : Easting value                   (output)
       *   Northing       : Northing value                  (output)
       *   Precision      : Precision level of MGRS string  (output)
       */
      function breakMGRS(MGRS) {
          /* Break_MGRS_String */
          var temp,
              tReturn = {},
              east,
              north,
              multiplier;
  
          tReturn.Zone = parseInt(MGRS.match(/(\d+)/g)[0], 10);
  
          if (tReturn.Zone < 1 || tReturn.Zone > 60) {
              throw "MGRS formatting wrong";
          }
  
          /* get letters */
          temp = MGRS.match(/[a-zA-Z]{3}/)[0];
          if (!temp) {
              throw "MGRS formatting error";
          }
          
          tReturn.Letters = temp;
          
          if (tReturn.Letters.indexOf('I') >= 0 || tReturn.Letters.indexOf('O') >= 0) {
              throw "MGRS formatting wrong";
          }
  
          temp = MGRS.match(/\d+$/)[0];
          if (temp.length <= 10 && temp.length % 2 === 0) {
              /* get easting & northing */
              tReturn.Precision = temp.length / 2;
              if (tReturn.Precision > 0) {
                  east = parseInt(temp.substring(0, temp.length / 2), 10);
                  north = parseInt(temp.substring(temp.length / 2), 10);
                  multiplier = Math.pow(10.0, 5 - tReturn.Precision);
                  tReturn.Easting = east * multiplier;
                  tReturn.Northing = north * multiplier;
              } else {
                  tReturn.Easting = 0;
                  tReturn.Northing = 0;
              }
          } else {
              throw "MGRS formatting wrong";
          }
  
          return tReturn;
      }
  
      /*
       * The function getGridValues sets the letter range used for 
       * the 2nd letter in the MGRS coordinate string, based on the set 
       * number of the utm zone. It also sets the false northing using a
       * value of A for the second letter of the grid square, based on 
       * the grid pattern and set number of the utm zone.
       *
       *    zone            : Zone number             (input)
       *    ltr2_low_value  : 2nd letter low number   (output)
       *    ltr2_high_value : 2nd letter high number  (output)
       *    false_northing  : False northing          (output)
       */
      function getGridValues (zone) {
          var set_number,    /* Set number (1-6) based on UTM zone number */
              aa_pattern,    /* Pattern based on ellipsoid code */
              ltr2_low_value,
              ltr2_high_value,
              false_northing;
  
          set_number = zone % 6 || 6;
  
          if (MGRS_Ellipsoid_Code === CLARKE_1866 || MGRS_Ellipsoid_Code === CLARKE_1880 || MGRS_Ellipsoid_Code === BESSEL_1841 || MGRS_Ellipsoid_Code === BESSEL_1841_NAMIBIA) {
              aa_pattern = false;
          } else {
              aa_pattern = true;
          }
  
          if ((set_number === 1) || (set_number === 4)) {
              ltr2_low_value = 'A';
              ltr2_high_value = 'H';
          } else if ((set_number === 2) || (set_number === 5)) {
              ltr2_low_value = 'J';
              ltr2_high_value = 'R';
          } else if ((set_number === 3) || (set_number === 6)) {
              ltr2_low_value = 'S';
              ltr2_high_value = 'Z';
          }
  
          /* False northing at A for second letter of grid square */
          if (aa_pattern) {
              if (set_number % 2 ===  0) {
                  false_northing = 1500000.0;
              } else {
                  false_northing = 0.0;
              }
          } else {
              if (set_number % 2 === 0) {
                  false_northing =  500000.0;
              } else {
                  false_northing = 1000000.00;
              }
          }
  
          return {
              ltr2_low_value: ltr2_low_value,
              ltr2_high_value: ltr2_high_value,
              false_northing: false_northing
          };
      }
  
      /*
       * The function getLatitudeBandMinNorthing receives a latitude band letter
       * and uses the Latitude_Band_Table to determine the minimum northing for that
       * latitude band letter.
       *
       *   letter        : Latitude band letter             (input)
       *   min_northing  : Minimum northing for that letter(output)
       */
      function getLatitudeBandMinNorthing(letter) {
         var min_northing;
  
         if (letter >= 'C' && letter <= 'H') {
             min_northing = Latitude_Band_Table[letter].min_northing;
         } else if (letter >= 'J' && letter <= 'N') {
             min_northing = Latitude_Band_Table[letter].min_northing;
         } else if (letter >= 'P' && letter <= 'X') {
             min_northing = Latitude_Band_Table[letter].min_northing;
         } else {
             throw "MGRS not formatted correctly";
         }
  
         return min_northing;
      }
  
      /*
       * Converts an MGRS coordinate string
       * to UTM projection (zone, hemisphere, easting and northing) coordinates 
       * according to the current ellipsoid parameters.  If any errors occur, they are
       * thrown and everything crashes. Cool, huh?
       *
       *    MGRS       : MGRS coordinate string           (input)
       *    Zone       : UTM zone                         (output)
       *    Hemisphere : North or South hemisphere        (output)
       *    Easting    : Easting (X) in meters            (output)
       *    Northing   : Northing (Y) in meters           (output)
       */
      function mgrsToUtm(MGRS) {
          var scaled_min_northing,
              min_northing,
              ltr2_low_value,
              ltr2_high_value,
              false_northing,
              grid_easting,        /* Easting for 100,000 meter grid square      */
              grid_northing,       /* Northing for 100,000 meter grid square     */
              letters = [],
              in_precision,
              tmp,
              Hemisphere,
              Zone,
              Easting,
              Northing;
  
          tmp = breakMGRS(MGRS);
  
          if (!tmp) {
              throw "MGRS not formatted correctly";
          }
  
          letters = tmp.Letters;
          Zone = tmp.Zone;
          Easting = tmp.Easting;
          Northing = tmp.Northing;
          in_precision = tmp.in_precision;
  
          if (!Zone) {
              throw "Zone not readable";
          }
  
          if ((letters.charAt(0) === 'X') && (Zone === 32 || Zone === 34 || Zone === 36)) {
              throw "Malformed MGRS";
          }
  
          if (letters.charAt(0) < 'N') {
              Hemisphere = 'S';
          } else {
              Hemisphere = 'N';
          }
  
          tmp = getGridValues(Zone);
  
          ltr2_low_value = tmp.ltr2_low_value;
          ltr2_high_value = tmp.ltr2_high_value;
          false_northing = tmp.false_northing;
  
          /* Check that the second letter of the MGRS string is within
           * the range of valid second letter values 
           * Also check that the third letter is valid */
          if (letters.charAt(1) < ltr2_low_value || letters.charAt(1) > ltr2_high_value || letters.charAt(2) > 'V') {
              throw "Malformed";
          }
  
          grid_northing = parseFloat(letters.charCodeAt(2) - 'A'.charCodeAt(0)) * 100000 + false_northing;
  
          grid_easting = parseFloat(letters.charCodeAt(1) - ltr2_low_value.charCodeAt(0) + 1) * 100000;
          if ((ltr2_low_value === 'J') && letters.charAt(1) > 'O') {
              grid_easting = grid_easting - 100000;
          }
  
          if (letters.charAt(2) > 'O') {
              grid_northing = grid_northing - 100000;
          }
  
          if (letters.charAt(2) > 'I') {
              grid_northing = grid_northing - 100000; 
          }
  
          if (grid_northing >= 2000000) {
              grid_northing = grid_northing - 2000000;
          }
  
          min_northing = getLatitudeBandMinNorthing(letters[0]);
          scaled_min_northing = min_northing;
          while (scaled_min_northing >= 2000000) {
              scaled_min_northing = scaled_min_northing - 2000000;
          }
  
          grid_northing = grid_northing - scaled_min_northing;
          if (grid_northing < 0) {
              grid_northing = grid_northing + 2000000;
          }
  
          grid_northing = min_northing + grid_northing;
  
          Easting = grid_easting + Easting;
          Northing = grid_northing + Northing;
  
          return {
              Zone: Zone,
              Hemisphere: Hemisphere,
              Easting: Easting,
              Northing: Northing
          };
      }
  
      module.exports = function () {
          return mgrsToUtm;
      };
  }());
  

  provide("examples/.lib/mgrs/mgrsToUtm", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/usng as examples/.lib/usng
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var CONSTANTS =  require('examples/.lib/constants'),
          usngToUtmRaw =  require('examples/.lib/usng/usngToUtm')(CONSTANTS),
          parseUsng =  require('examples/.lib/usng/parseUsng')(CONSTANTS),
          isUsng =  require('examples/.lib/usng/isUsng')(CONSTANTS),
          utm =  require('examples/.lib/utm');
  
      function usngToUtm (usngStr) {
          var usng = parseUsng(usngStr);
          return usngToUtmRaw(usng);
      }
  
      /*
       * Turns a USNG string into lat/long coordinates.
       * 
       * @param usngStr_input- USNG source
       * @return Object with two properties- latitude & longitude
       */
      function usngToLatLong(usngStr_input) {
          var usngp,
              coords,
              latlon;
  
          usngp = parseUsng(usngStr_input);
  
          // convert USNG coords to UTM; this routine counts digits and sets precision
          coords = usngToUtm(usngStr_input);
  
          // southern hemisphere case
          if (usngp.zoneLetter < 'N') {
              coords.northing -= CONSTANTS.NORTHING_OFFSET;
          }
  
          latlon = utm.toLatLong(coords.northing, coords.easting, usngp.zoneNumber);
  
          return latlon;
      }
  
      function getConverter (outputType) {
          var fn;
  
          switch (outputType.toLowerCase()) {
              case 'utm':
                  fn = usngToUtm;
                  break;
              case 'latlong':
                  fn = usngToLatLong;
                  break;
          }
  
          return fn;
      }
  
      module.exports.toUtm = usngToUtm;
      module.exports.toLatLong = usngToLatLong;
      module.exports.isUsng = isUsng;
      module.exports.getConverter = getConverter;
      module.exports.parseUsng = parseUsng;
  }());
  

  provide("examples/.lib/usng", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/latlong as examples/.lib/latlong
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var CONSTANTS =  require('examples/.lib/constants'),
          decimalToDegMinSec =  require('examples/.lib/latlong/decimalToDegMinSec')(CONSTANTS),
          degMinSecToDecimal =  require('examples/.lib/latlong/degMinSecToDecimal')(CONSTANTS),
          latLongToUtm =  require('examples/.lib/latlong/latlongToUtm')(CONSTANTS),
          translate =  require('examples/.lib/latlong/translate')(CONSTANTS),
          utm =  require('examples/.lib/utm');
  
      /*
       * Convenience function that basically just:
       *  * Converts lat/long to UTM
       *  * Converts UTM to USNG
       * 
       * @param lat- Latitude in decimal degrees
       * @param lon- longitude in decimal degrees
       * @param precision- How many decimal places (1-5) in USNG (default 5)
       * @param output- Output format. Accepted values are: 'string' and 'object'
       * @return String of the format- DDL LL DDDDD DDDDD (5-digit precision)
       */
      function latLongToUsng(lat, lon, precision, output) {
          var coords;
  
          if (typeof precision === 'string') {
              precision = parseInt(precision, 10);
          }
  
          precision = precision ? precision : 5;
  
          lat = parseFloat(lat);
          lon = parseFloat(lon);
  
          // convert lat/lon to UTM coordinates
          coords = latLongToUtm(lat, lon);
  
          return utm.toUsng(coords, precision, output);
      }
  
      /*
       * Creates a Military Grid Reference System string.
       * This is the same as a USNG string, but without spaces.
       * 
       * Space delimiters are optional but allowed in USNG, but are not allowed in MGRS.
       * 
       * The numbers are the same between the two coordinate systems.
       * 
       * @param lat- Latitude in decimal degrees
       * @param lon- longitude in decimal degrees
       * @param precision- How many decimal places (1-5) in USNG (default 5)
       * @param output- Output format. Accepted values are: 'string' and 'object'
       * @return String of the format- DDL LL DDDDD DDDDD (5-digit precision)
       */
      function latLongToMgrs(lat, lon, precision, output) {
          var mgrs,
              usng = latLongToUsng(lat, lon, precision, output);
  
          if (typeof usng === 'string') {
              // remove space delimiters to conform to mgrs spec
              mgrs = usng.replace(/ /g, "");
          } else {
              mgrs = usng;
          }
  
          return mgrs;
      }
  
      function getConverter (outputType) {
          var fn;
  
          switch (outputType.toLowerCase()) {
              case 'utm':
                  fn = latLongToUtm;
                  break;
  
              case 'usng':
                  fn = latLongToUsng;
                  break;
  
              case 'mgrs':
                  fn = latLongToMgrs;
                  break;
          }
  
          return fn;
      }
      
      module.exports.toDecimal = degMinSecToDecimal;
      module.exports.toDegMinSec = decimalToDegMinSec;
      module.exports.toUsng = latLongToUsng;
      module.exports.toUtm = latLongToUtm;
      module.exports.toMgrs = latLongToMgrs;
      module.exports.getConverter = getConverter;
  
      module.exports.translate = translate;
  }());
  

  provide("examples/.lib/latlong", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/mgrs as examples/.lib/mgrs
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var CONSTANTS =  require('examples/.lib/constants'),
          mgrsToUtm =  require('examples/.lib/mgrs/mgrsToUtm')(CONSTANTS),
          usng =  require('examples/.lib/usng');
  
      function getConverter(outputType) {
          var fn;
  
          switch (outputType.toLowerCase()) {
              case 'latlong':
                  fn = usng.toLatLong;
                  break;
              
              case 'utm':
                  fn = usng.toUtm;
                  break;
          }
  
          return fn;
      }
  
      module.exports.getConverter = getConverter;
      module.exports.toLatLong = usng.toLatLong;
      module.exports.toUtm = mgrsToUtm;
  }());
  

  provide("examples/.lib/mgrs", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.lib/convert as examples/.lib/convert
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var converters = {
              'latlong':  require('examples/.lib/latlong'),
              'usng':  require('examples/.lib/usng'),
              'utm':  require('examples/.lib/utm'),
              'mgrs':  require('examples/.lib/mgrs')
          };
  
      function getConverter(inputType, outType) {
          if (typeof inputType !== 'string') {
              throw new Error('Parameter not a string: ' + inputType);
          }
  
          if (typeof outType !== 'string') {
              throw new Error('Parameter not a string: ' + outType);
          }
  
          if (!converters[inputType]) {
              throw "Converter doesn't exist. Complain on GitHub.";
          }
  
          return converters[inputType].getConverter(outType);
      }
  
      module.exports = getConverter;
      module.exports.converters = converters;
  }());
  

  provide("examples/.lib/convert", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples/.coordinator as examples/.coordinator
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      module.exports =  require('examples/.lib/convert');
  }());
  

  provide("examples/.coordinator", module.exports);
  $.ender(module.exports);
}(global));

// ender:examples as examples
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
  (function () {
      "use strict";
  
      var coordinator =  require('examples/.coordinator'),
          latLong = coordinator.converters.latlong;
  
      $.domReady(function () {
          $('#latlngConvert').bind('click', function () {
              var fn = coordinator('latlong', 'mgrs'),
                  res;
  
              console.log(fn.toString());
              res = fn($('#srcLatitude').val(), $('#srcLongitude').val(), 5);
  
              $('#resMgrs').val(res);
          }, false);
  
          $('#mgrsConvert').bind('click', function () {
              var fn = coordinator('mgrs', 'latlong'),
                  res,
                  resFmt;
  
              res = fn($('#srcMgrs').val());
  
              resFmt = latLong.toDegMinSec(res.latitude, res.longitude);
  
              $('#resLatitude').val("" + res.latitude);
              $('#resLongitude').val("" + res.longitude);
  
              $('#resFmtLatitude').val(resFmt.latitude);
              $('#resFmtLongitude').val(resFmt.longitude);
          }, false);
      });
  }());
  

  provide("examples", module.exports);
  $.ender(module.exports);
}(global));