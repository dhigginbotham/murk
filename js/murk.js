var murk = (function(fn) {
  if (typeof module != 'undefined' && module.exports) {
    module.exports = fn;
  } else {
    return fn;
  }
})(function(options) {
  if (!(this instanceof murk)) return new murk(options);
  // state reference, mostly for 
  // dev/internal use and context
  var state = {
    model: {},
    dom: [],
    elems: {},
    repeats: {},
    subscribers: {},
    filters: {},
    keys: [],
    start: Date.now()
  };

  var opts = {
    selectorPrefix: 'data-murk',
    dev: false,
    id: state.start,
    defaultSubscribers: [elemBindingEvent, processFiltersEvent, trackCountEvent, handleRepeat]
  };

  if (options) extend(opts, options);

  var enc = encodeURIComponent;
  var dec = decodeURIComponent;

  // only way to interact with our 
  // model, this way we can use this
  // loosely as an event emitter
  function setModel(obj, str, merge) {
    // allow str to be optional, slid
    // merge over, set str to undefined
    // so everything else works as intended
    if (typeof str == 'boolean' && typeof merge == 'undefined') {
      merge = str;
      str = merge;
    }
    // we'll always set merge to true,
    // this way you're not overwriting
    // the model unless you intend to
    merge = (typeof merge != 'undefined' ? merge : true);
    if (typeof str != 'undefined' && typeof obj == 'string') {
      state.model[obj] = str;
      // if we've set this elem before we'll
      // pass that reference if possible to
      // improve performance
      if (state.elems.hasOwnProperty(obj)) {
        return collectElems(state.elems[obj]);
      }
    } else {
      if (merge) {
        extend(state.model, obj);
      } else {
        state.model = obj;
      }
    }
    collectElems();
    return this;
  }

  // gets the model, yeye
  function getModel(key) {
    if (typeof key != 'undefined') {
      if (state.model.hasOwnProperty(key)) {
        return state.model[key];
      }
      return null;
    }
    return state.model;
  }

  // collects elems, allows you to
  // pass context so you can stay
  // super snappy, needs improvements.
  function collectElems(ctx) {
    var dom;
    if (typeof ctx != 'undefined') {
      bindElem(ctx);
    } else {
      dom = (!state.dom.length ? collectDom() : state.dom);
      Array.prototype.forEach.call(dom, bindElem);
    }
  }

  function recollectElems(ctx) {
    ctx = (typeof ctx == 'undefined' ? document : ctx);
    var dom = collectDom(ctx);
    Array.prototype.forEach.call(dom, bindElem);
  }

  // collects dom from context provided,
  // falls back to document
  function collectDom(ctx) {
    ctx = (typeof ctx == 'undefined' ? document : ctx);
    return ctx.getElementsByTagName('*');
  }

  // binds elem from model, simple things
  function bindElem(elem) {
    var attrs, key;
    attrs = attr(elem);
    key = attrs(opts.selectorPrefix);
    if (key) {
      // if we dont have an id set already
      // we set one here so that we dont step
      // on any other models
      if (!attrs(opts.selectorPrefix + '-id')) {
        attrs(opts.selectorPrefix + '-id', opts.id);
      }
      if (attrs(opts.selectorPrefix + '-id') == opts.id) {
        if (!state.elems.hasOwnProperty(key)) {
          state.elems[key] = elem;
          // check if keys already being bound,
          // if not keep track of them
          if (!~state.keys.indexOf(key)) {
            state.keys.push(key);
            state.dom.push(elem);
          }
          // lets allow databinding of embedded values..
          if (elem.innerHTML && !state.model.hasOwnProperty(key)) {
            state.model[key] = elem.innerHTML;
          }
        }
        if (state.model.hasOwnProperty(key)) {
          // we only want to modify elems that 
          // have changed their values
          if (dec(attrs(opts.selectorPrefix + '-val')) != state.model[key] ||
            typeof state.model[key] == 'object') {
            // keep track of our elems to use
            // later as reference
            // handle any subscribers on this elem
            handleSubscribers(key);
          }
        } else {
          attrs(opts.selectorPrefix + '-bound', false);
        }
      }
    }
  }

  // handles our subscribers, proves
  // context to the state object as `this`
  function handleSubscribers(key) {
    if (!state.subscribers.hasOwnProperty(key)) {
      state.subscribers[key] = Array.prototype.slice.call(opts.defaultSubscribers);
    }
    var fns = Array.prototype.slice.call(state.subscribers[key]);
    while (fn = fns.shift()) fn.call(state.elems[key], key);
  }

  // attaches subsciber based on key :D
  function attachSubscriber(key, fn) {
    function subscribe(k) {
      if (!state.subscribers.hasOwnProperty(k)) {
        state.subscribers[k] = Array.prototype.slice.call(opts.defaultSubscribers);
      }
      state.subscribers[k].push(fn);
    }
    if (!(key instanceof Array)) key = [key];
    Array.prototype.forEach.call(key, subscribe);
    return this;
  }

  // this is better ;D
  function handleRepeat(key) {
    if (state.model[key] instanceof Array) {
      var repeatModel = state.model[key];
      var attrs = attr(this);
      var isRepeated = attrs(opts.selectorPrefix + '-repeat');
      if (isRepeated) {
        if (!state.repeats.hasOwnProperty(key)) {
          state.repeats[key] = {};
          if (!state.repeats.hasOwnProperty('elems')) {
            state.repeats[key].elems = {};
          }
        }
        var repeatKeys = Object.keys(state.repeats[key].elems);
        var frag = document.createDocumentFragment();
        if (repeatKeys.length > repeatModel.length) {
          for(var o=repeatModel.length;o<repeatKeys.length;++o) {
            state.repeats[key].elems[repeatKeys[o]].style.display = 'none';
          }
        }
        Array.prototype.forEach.call(repeatModel, function(obj, i) {
          var domRef, newKey = (key + '.$' + i);
          if (!state.repeats[key].elems.hasOwnProperty(newKey)) {
            state.repeats[key].elems[newKey] = this.cloneNode(true);
          }
          domRef = state.repeats[key].elems[newKey];
          var domAttrs = attr(domRef);
          if (domAttrs) {
            domAttrs(opts.selectorPrefix, 'rm');
            domAttrs(opts.selectorPrefix + '-parent', key);
            if (typeof obj == 'object') {
              var nodes = domRef.getElementsByTagName('*');
              Array.prototype.forEach.call(nodes, function(node) {
                var nodeAttrs = attr(node);
                if (nodeAttrs) {
                  var repeatKey = nodeAttrs(opts.selectorPrefix + '-repeat');
                  if (!nodeAttrs(opts.selectorPrefix + '-key')) {
                    nodeAttrs(opts.selectorPrefix + '-key', newKey);
                  }
                  if (repeatKey) {
                    node.parentNode.style.display = 'inherit';
                    if (obj.hasOwnProperty(repeatKey)) {
                      node.innerHTML = obj[repeatKey];
                    }
                  }
                }
              }, this);
            } else {
              domRef.innerHTML = obj;
            }
            frag.appendChild(domRef);
          }
        }, this);
        if (state.elems.hasOwnProperty(key)) this.parentNode.appendChild(frag);
      }
    }
    return true;
  }

  // we want to keep track of how many
  // times we're interacting with our 
  // elems
  function trackCountEvent() {
    var count;
    var attrs = attr(this);
    count = attrs(opts.selectorPrefix + '-count');
    attrs(opts.selectorPrefix + '-count', (count ? parseInt(count,0)+1 : 1));
  }

  // proccesses the filters added to any
  // given bound elem
  function processFiltersEvent(key) {
    var attrs, filters, processFilter; 
    attrs = attr(this);
    if (attrs) {
      filters = attrs(opts.selectorPrefix + '-filter');
      if (filters) {
        processFilter = function(filter) {
          var filteredVal, val;
          if (state.filters.hasOwnProperty(filter) && 
            state.model.hasOwnProperty(key)) {
            filteredVal = (attrs(opts.selectorPrefix + '-filtered-val') ? 
              dec(attrs(opts.selectorPrefix + '-filtered-val')) : 
              null);
            val = state.filters[filter].call(this, state.model[key]);
            if (typeof val != 'undefined' && 
              filteredVal != val) {
              attrs(opts.selectorPrefix + '-filtered-val', enc(val));
              this.innerHTML = val;
            }
          }
        };
        if (filters.indexOf(',') != -1) filters = filters.split(',');
        if (!(filters instanceof Array)) filters = [filters];
        Array.prototype.forEach.call(filters, processFilter, this);
      }
    }
  }

  // public fn to setup new filters,
  // they are globally shared, and will
  // overwrite any previously defined
  // filters.
  function registerFilter(key, fn) {
    if (key && fn) {
      state.filters[key] = fn;
    }
    return this;
  }

  // when we bind elements we want to do some
  // stuff to them to get some real databinding
  // however it's a lot of opinionated ideas so
  // keeping them as an event allows you to remove
  // this...
  function elemBindingEvent(key) {
    var attrs = attr(this);
    // keep visual refence we're bound
    // to this elem
    attrs(opts.selectorPrefix + '-bound', true);
    // set innerText of value to elem
    if (!(state.model[key] instanceof Array) && 
      typeof state.model[key] != 'object') {
      // encode and set a reference of our 
      // newly bound value
      attrs(opts.selectorPrefix + '-val', enc(state.model[key]));
      this.innerHTML = state.model[key];
    }
  }
  
  // just a wrapper for elem.[set/get]Attribute()
  function attr(elem) {
    if (typeof elem != 'undefined') {
      return function(key, val) {
        if(typeof val == 'undefined') {
          return this.getAttribute(key);
        } else if (val == 'rm') {
          return this.removeAttribute(key);
        } else {
          return this.setAttribute(key, val);
        }
      }.bind(elem);
    } else {
      return null;
    }
  }

  // simple extend fn
  function extend(parent, child) {
    if (typeof parent == 'object') {
      for (var key in child) {
        if (child.hasOwnProperty(key)) {
          parent[key] = child[key];
        }
      }
    }
  }

  // public api
  this.collectDom = recollectElems;
  this.emit = handleSubscribers;
  this.get = getModel;
  this.set = setModel;
  this.on = attachSubscriber;
  this.registerFilter = registerFilter;
  if (opts.dev) this.state = state;

  return this;

});