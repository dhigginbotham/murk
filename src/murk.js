var murk = (function(murk) {
  if (typeof module != 'undefined' && module.exports) {
    return module.exports = murk;
  } else {
    return murk;
  }
})(function murk(options) {
  if (!(this instanceof murk)) return new murk(options);
  // state reference, mostly for 
  // dev/internal use and context
  var state = {
    model: {},
    dom: [],
    elems: {},
    subscribers: {},
    filters: {},
    keys: [],
    start: Date.now()
  };

  var opts = {
    selectorPrefix: 'data-murk',
    trackCount: true,
    dev: false,
    id: state.start
  };

  if (options) extend.call(opts, options);

  var self = this;

  // only way to interact with our 
  // model, this way we can use this
  // loosely as an event emitter
  function setModel(obj, str, merge) {
    // allow str to be optional, slid
    // merge over, set str to undefined
    // so everything else works as intended
    if (typeof str != 'string' && typeof merge == 'undefined') {
      merge = str;
      str = merge;
    }
    // we'll always set merge to true,
    // this way you're not overwriting
    // the model unless you intend to
    merge = (typeof merge == 'undefined' ? true : false);
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
        extend.call(state.model, obj);
      } else {
        state.model = obj;
      }
    }
    collectElems();
    return self;
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
      Array.prototype.map.call(dom, bindElem);
    }
  }

  function recollectElems(ctx) {
    ctx = (typeof ctx == 'undefined' ? document : ctx);
    var dom = collectDom(ctx);
    Array.prototype.map.call(dom, bindElem);
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
          if (decodeURIComponent(attrs(opts.selectorPrefix + '-val')) != state.model[key]) {
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
    return false;
  }

  // handles our subscribers, proves
  // context to the state object as `this`
  function handleSubscribers(key) {
    if (!state.subscribers.hasOwnProperty(key)) {
      state.subscribers[key] = [elemBindingEvent, trackCountEvent, processFilters];
    }
    var copy = Array.prototype.slice.call(state.subscribers[key]);
    // recurse through subscriber calls
    function processSubscribers(fn, done) {
      fn.call(state.elems[key], key, function(err, success) {
        if (copy.length) {
          if (err) return done(err, copy);
          return processSubscribers(copy.shift(), done);
        }
        return done(null, true);
      });
    }
    processSubscribers(copy.shift(), function(err, success) {
      if (err) console.log('error handling subscriber of ' + key);
      if (opts.dev && success) console.log('finished handling subscribers');
    });
  }

  // attaches subsciber based on key :D
  function attachSubscriber(key, fn) {
    function subscribe(k) {
      if (!state.subscribers.hasOwnProperty(k)) {
        state.subscribers[k] = [elemBindingEvent, trackCountEvent, processFilters];
      }
      state.subscribers[k].push(fn);
    }
    if (key instanceof Array) {
      Array.prototype.map.call(key, subscribe);
    } else {
      subscribe(key);
    }
    return self;
  }

  function trackCountEvent(key, fn) {
    if (opts.dev) {
      console.log('trackCountEvent');
      console.log(key);
    }
    var count;
    var attrs = attr(this);
    if (opts.trackCount) {
      // we want to keep track of how many
      // times we're interacting with our 
      // elems
      count = attrs(opts.selectorPrefix + '-count');
      attrs(opts.selectorPrefix + '-count', (count ? parseInt(count,0)+1 : 1));
    }
    if (fn) return fn(null, true);
  }

  function processFilters(key, fn) {
    if (opts.dev) {
      console.log('processFilters');
      console.log(key);
    }
    var attrs = attr(this);
    var filters = attrs(opts.selectorPrefix + '-filter');
    if (filters) {
      if (filters.indexOf(',') != -1) filters = filters.split(',');
      if (!(filters instanceof Array)) filters = [filters];
      Array.prototype.map.call(filters, function(filter) {
        if (state.filters[filter] && state.model[key]) {
          var val = state.filters[filter](state.model[key]);
          if (typeof val != 'undefined' && val != state.model[key]) {
            setModel(key, val);
          }
        }
      });
    }
    if (fn) return fn(null, true);
  }

  function registerFilter(key, fn) {
    if (key && fn) {
      state.filters[key] = fn;
    }
    return self;
  };

  // when we bind elements we want to do some
  // stuff to them to get some real databinding
  // however it's a lot of opinionated ideas so
  // keeping them as an event allows you to remove
  // this...
  function elemBindingEvent(key, fn) {
    if (opts.dev) {
      console.log('elemBindingEvent');
      console.log(key);
    }
    var attrs = attr(this);
    // encode and set a reference of our 
    // newly bound value
    attrs(opts.selectorPrefix + '-val', encodeURIComponent(state.model[key]));
    // keep visual refence we're bound
    // to this elem
    attrs(opts.selectorPrefix + '-bound', true);
    // set innerText of value to elem
    this.innerHTML = state.model[key];
    if (fn) return fn(null, true);
  }
  
  // just a wrapper for elem.[set/get]Attribute()
  function attr(elem) {
    if (typeof elem != 'undefined') {
      return function(key, val) {
        if(typeof val == 'undefined') {
          return this.getAttribute(key);
        } else {
          return this.setAttribute(key, val);
        }
      }.bind(elem);
    } else {
      return null;
    }
  }

  // simple extend fn
  function extend(obj) {
    if (typeof this == 'object') {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          this[key] = obj[key];
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