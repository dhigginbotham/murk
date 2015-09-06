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

  var enc = encodeURIComponent;
  var dec = decodeURIComponent;

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
          if (dec(attrs(opts.selectorPrefix + '-val')) != state.model[key]) {
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
      state.subscribers[key] = [elemBindingEvent, processFiltersEvent, repeaterEvent, trackCountEvent];
    }
    var fns = Array.prototype.slice.call(state.subscribers[key]);
    while (fn = fns.shift()) fn.call(state.elems[key], key);
  }

  // attaches subsciber based on key :D
  function attachSubscriber(key, fn) {
    function subscribe(k) {
      if (!state.subscribers.hasOwnProperty(k)) {
        state.subscribers[k] = [elemBindingEvent, processFiltersEvent, repeaterEvent, trackCountEvent];
      }
      state.subscribers[k].push(fn);
    }
    if (key instanceof Array) {
      Array.prototype.forEach.call(key, subscribe);
    } else {
      subscribe(key);
    }
    return this;
  }

  // i dont know if this is how i want
  // to handle repeats, but for now yes
  function repeaterEvent(key) {
    if (state.model[key] instanceof Array) {
      var attrs = attr(this);
      if (attrs(opts.selectorPrefix + '-repeat')) {
        // we want to always reuse children 
        // if we can...
        if (this.hasChildNodes()) {
          var nodesLn = this.childNodes.length;
          var modelLn = state.model[key].length;
          // if we have more elems than we have 
          // model vars, this takes the end of our
          // nodes and only hides those.
          if (nodesLn > modelLn) {
            for (var i=modelLn;i<nodesLn;++i) {
              this.childNodes[i].removeAttribute(opts.selectorPrefix + '-repeated-index');
              this.childNodes[i].style.display = 'none';
            }
          }
          // this is how we're going to only 
          // reuse or create new nodes, this
          // should help keep the footprint
          // low. 
          Array.prototype.forEach.call(state.model[key], function(val, i) {
            if (i < nodesLn) {
              var lastVal = dec(this.childNodes[i].getAttribute(opts.selectorPrefix + '-repeated-val'));
              this.childNodes[i].setAttribute(opts.selectorPrefix + '-repeated', key);
              this.childNodes[i].setAttribute(opts.selectorPrefix + '-repeated-index', i);
              if (lastVal != val) {
                this.childNodes[i].setAttribute(opts.selectorPrefix + '-repeated-val', enc(val));
                this.childNodes[i].innerHTML = val;
              }
              this.childNodes[i].style.display = 'inherit';
            // we can't reuse anymore elems, 
            // so lets create new ones, yey
            } else {
              var node = document.createElement(this.nodeName);
              node.setAttribute(opts.selectorPrefix + '-repeated', key);
              node.setAttribute(opts.selectorPrefix + '-repeated-index', i);
              node.setAttribute(opts.selectorPrefix + '-repeated-val', enc(val));
              node.innerHTML = val;
              this.appendChild(node);
            }
          }, this);
        // we don't have any children to 
        // reuse, so we need to make some.
        // we'll only create the same elements 
        // you bound them to, i suggest 
        // using divs.
        } else {
          var doc = document.createDocumentFragment();
          Array.prototype.forEach.call(state.model[key], function(val, i) {
            var node = document.createElement(this.nodeName);
            node.setAttribute(opts.selectorPrefix + '-repeated', key);
            node.setAttribute(opts.selectorPrefix + '-repeated-index', i);
            node.setAttribute(opts.selectorPrefix + '-repeated-val', enc(val));
            node.innerHTML = val;
            doc.appendChild(node);
          }, this);
          this.appendChild(doc);
        }
      }
    }
  }

  // we want to keep track of how many
  // times we're interacting with our 
  // elems
  function trackCountEvent(key) {
    var count;
    var attrs = attr(this);
    if (opts.trackCount) {
      count = attrs(opts.selectorPrefix + '-count');
      attrs(opts.selectorPrefix + '-count', (count ? parseInt(count,0)+1 : 1));
    }
  }

  // proccesses the filters added to any
  // given bound elem
  function processFiltersEvent(key) {
    var attrs, filters, processFilter; 
    attrs = attr(this);
    if (attrs) {
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
      filters = attrs(opts.selectorPrefix + '-filter');
      if (filters) {
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
    // encode and set a reference of our 
    // newly bound value
    attrs(opts.selectorPrefix + '-val', enc(state.model[key]));
    // keep visual refence we're bound
    // to this elem
    attrs(opts.selectorPrefix + '-bound', true);
    // set innerText of value to elem
    if (!(state.model[key] instanceof Array)) {
      this.innerHTML = state.model[key];
    }
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