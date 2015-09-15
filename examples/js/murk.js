;(function(def, fn) {
  if (typeof module != 'undefined' && module.exports) {
    module.exports = fn;
  } else {
    window[def] = fn;
  }
})('murk', function murk(options) {
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
    start: Date.now(),
    totalCount: 0
  };

  var opts = {
    selectorPrefix: 'data-murk',
    dev: false,
    id: state.start,
    defaultSubscribers: [handleRepeat, elemBindingEvent, processFiltersEvent, trackCountEvent]
  };

  if (options) extend(opts, options);

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
        bindElem(state.elems[obj]);
      }
      return this;
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
  function collectElems() {
    var dom = (!state.dom.length ? collectDom() : state.dom);
    Array.prototype.forEach.call(dom, bindElem);
  }

  // pub function
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
          // handle any subscribers on this elem
          handleSubscribers(key);
          ++state.totalCount;
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
    var fn, fns = Array.prototype.slice.call(state.subscribers[key]);
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
  
  // processes nodes for repeats <3
  function processNodes(node) {
    var repeatKey, isBind, atts = attr(node);
    if (atts) {
      repeatKey = atts(opts.selectorPrefix + '-repeat-key');
      isBind = atts(opts.selectorPrefix + '-repeat-bind');
      if (repeatKey) {
        // we want access to `null`,`false` so check
        // for its property name
        if (this.hasOwnProperty(repeatKey)) {
          // you've got this! lets make magic and
          // pass in some dataz
          if (node.innerHTML != this[repeatKey]) {
            setupTextNode(node, this[repeatKey]);
          }
          // hey, if you want to bind repeats --
          // know that it's possible with this opt
          // but also know it isn't quite as performant
          if (isBind) {
            var $$key = this.$key + '.' + repeatKey;
            if (!atts(opts.selectorPrefix)) {
              atts(opts.selectorPrefix, $$key);
            }
            bindElem(node);
          }
        }
      } 
    }
  }

  // handle repeats is another default event on the binding chain,
  // so like all other events in murk, it has context to `this` (as elem)
  // as well as the current key being processed. it tries to be extremely
  // light by only doing reads, and saving writes until the end.
  function handleRepeat(key) {
    var repeatModel, attrs, repeatElKeys, frag, processRepeats;
    if (state.model[key] instanceof Array) {
      // hide our first elem, so we can use it later
      if (this.style.display != 'none') this.style.display = 'none';
      repeatModel = state.model[key];
      attrs = attr(this);
      
      // we keep reference of all of our repeats
      // inside of state.repeats, so we always
      // need to make sure this exists.
      if (!state.repeats.hasOwnProperty(key)) {
        state.repeats[key] = {};
      }
      // we going to make most of our dom interaction
      // through this guy -- love him.
      frag = document.createDocumentFragment();

      // we want to take advantage of reusing elements
      // so if our model gets smaller than our current
      // elemnt reference, we can just hide them for 
      // later use
      repeatElKeys = Object.keys(state.repeats[key]);
      if (repeatElKeys.length > repeatModel.length) {
        for(var o=repeatModel.length;o<repeatElKeys.length;++o) {
          if (state.repeats[key][repeatElKeys[o]].style.display != 'none') {
            state.repeats[key][repeatElKeys[o]].style.display = 'none';
          }
        }
      }

      // processes each repeat individually
      processRepeats = function(repeat, i) {
        var el, atts, $key = (key + '.$' + i), newEl = false;
        
        // we make a new key, out of our current key
        // and setup any new elems that we might need
        if (!state.repeats[key].hasOwnProperty($key)) {
          state.repeats[key][$key] = this.cloneNode(true);
          newEl = true;
        }

        // keep ref of our current elem
        el = state.repeats[key][$key];

        // we only want to bind things that
        // are fresh, and non object things
        // can be check simply like this
        if (el.innerHTML != repeatModel) {
          atts = attr(el);

          // new els get sanitized
          if (newEl) {
            atts(opts.selectorPrefix, 'rm');
            atts(opts.selectorPrefix + '-count', 'rm');
            atts(opts.selectorPrefix + '-bound', 'rm');
            atts(opts.selectorPrefix + '-repeat', $key);
          }
          if (typeof repeat == 'object') {
            // allows us to keep ref of new $key,
            // so our processNodes fn can setup
            // binding on the child nodes.
            repeat.$key = $key;
            Array.prototype.forEach.call(el.getElementsByTagName('*'), processNodes, repeat);
          } else {
            el.innerHTML = repeat;
          }
          // let their be light XD
          if (el.style.display == 'none') el.style.display = '';
          // only append new elems to our frag, 
          // everything else exists.
          if (newEl) frag.appendChild(el);
        }
      };
      Array.prototype.forEach.call(repeatModel, processRepeats, this);
      // only append frags when we have newEl's found -- etc.
      if (frag.hasChildNodes()) this.parentNode.appendChild(frag);
    }
  }

  // proccesses the filters added to any
  // given bound elem
  function processFiltersEvent(key) {
    var attrs, filters, filterMutate, processFilter; 
    attrs = attr(this);
    if (attrs) {
      filters = attrs(opts.selectorPrefix + '-filter');
      filterMutate = attrs(opts.selectorPrefix + '-filter-mutate');
      if (filters) {
        processFilter = function(filter) {
          if (state.filters.hasOwnProperty(filter) && 
            state.model.hasOwnProperty(key)) {
            var val = state.filters[filter].call(this, state.model[key]);
            if (typeof val != 'undefined' && filterMutate) {
              state.model[key] = val;
            }
            setupTextNode(this, val);
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
    if (key && fn) state.filters[key] = fn;
    return this;
  }

  // when we bind elements we want to do some
  // stuff to them to get some real databinding
  // however it's a lot of opinionated ideas so
  // keeping them as an event allows you to remove
  // this...
  function elemBindingEvent(key) {
    if (!(state.model[key] instanceof Array) && 
      typeof state.model[key] != 'object') {
      // encode and set a reference of our 
      // newly bound value
      if (state.model[key] != this.innerHTML) {
        setupTextNode(this, state.model[key]);
      }
    }
  }
  
  // we want to keep track of how many
  // times we're interacting with our 
  // elems
  function trackCountEvent() {
    var count, attrs = attr(this);
    count = attrs(opts.selectorPrefix + '-count');
    attrs(opts.selectorPrefix + '-count', (count ? parseInt(count,0)+1 : 1));
  }

  // handles dom manipulation
  function setupTextNode(el, val) {
    if (typeof val != 'undefined') {
      if (val === 'null' || val === null) val = '';
      var tn = document.createTextNode(val);
      if (el.hasChildNodes()) {
        el.childNodes[0].nodeValue = val;
      } else {
        el.appendChild(tn);
      }
    }
  }

  // just a wrapper for elem.[set/get]Attribute()
  function attr(elem) {
    if (typeof elem != 'undefined') {
      return function $attr(key, val) {
        if(typeof val == 'undefined') {
          return elem.getAttribute(key);
        } else if (val == 'rm') {
          return elem.removeAttribute(key);
        } else {
          return elem.setAttribute(key, val);
        }
      };
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