
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* clsSMFill\defaultXML.svelte generated by Svelte v3.38.2 */

    function getDefaultXMl(type) {
    	let xmls = {
    		"editor_item_1.xml": "<smxml type=\"9\" name=\"FillInTheBlank\"><text matchtype=\"1\"><![CDATA[Education, then, beyond all other devices of %{human}% origin, is the great equalizer of the %{conditions}% of man.]]></text></smxml>"
    	};

    	return xmls[type];
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*
     Copyright 2011-2013 Abdulla Abdurakhmanov
     Original sources are available at https://code.google.com/p/x2js/

     Licensed under the Apache License, Version 2.0 (the "License");
     you may not use this file except in compliance with the License.
     You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

     Unless required by applicable law or agreed to in writing, software
     distributed under the License is distributed on an "AS IS" BASIS,
     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     See the License for the specific language governing permissions and
     limitations under the License.
     */

    var xml2json = createCommonjsModule(function (module, exports) {
    (function (root, factory) {
        {
            module.exports = factory();
        }
    }(commonjsGlobal, function () {
       return function (config) {
               
           var VERSION = "1.2.0";
           
           config = config || {};
           initConfigDefaults();
           
           function initConfigDefaults() {
               if(config.escapeMode === undefined) {
                   config.escapeMode = true;
               }
               
               config.attributePrefix = config.attributePrefix || "_";
               config.arrayAccessForm = config.arrayAccessForm || "none";
               config.emptyNodeForm = config.emptyNodeForm || "text";		
               
               if(config.enableToStringFunc === undefined) {
                   config.enableToStringFunc = true; 
               }
               config.arrayAccessFormPaths = config.arrayAccessFormPaths || []; 
               if(config.skipEmptyTextNodesForObj === undefined) {
                   config.skipEmptyTextNodesForObj = true;
               }
               if(config.stripWhitespaces === undefined) {
                   config.stripWhitespaces = true;
               }
               config.datetimeAccessFormPaths = config.datetimeAccessFormPaths || [];
       
               if(config.useDoubleQuotes === undefined) {
                   config.useDoubleQuotes = false;
               }
               
               config.xmlElementsFilter = config.xmlElementsFilter || [];
               config.jsonPropertiesFilter = config.jsonPropertiesFilter || [];
               
               if(config.keepCData === undefined) {
                   config.keepCData = false;
               }
           }
       
           var DOMNodeTypes = {
               ELEMENT_NODE 	   : 1,
               TEXT_NODE    	   : 3,
               CDATA_SECTION_NODE : 4,
               COMMENT_NODE	   : 8,
               DOCUMENT_NODE 	   : 9
           };
           
           function getNodeLocalName( node ) {
               var nodeLocalName = node.localName;			
               if(nodeLocalName == null) // Yeah, this is IE!! 
                   nodeLocalName = node.baseName;
               if(nodeLocalName == null || nodeLocalName=="") // =="" is IE too
                   nodeLocalName = node.nodeName;
               return nodeLocalName;
           }
           
           function getNodePrefix(node) {
               return node.prefix;
           }
               
           function escapeXmlChars(str) {
               if(typeof(str) == "string")
                   return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
               else
                   return str;
           }
           
           function checkInStdFiltersArrayForm(stdFiltersArrayForm, obj, name, path) {
               var idx = 0;
               for(; idx < stdFiltersArrayForm.length; idx++) {
                   var filterPath = stdFiltersArrayForm[idx];
                   if( typeof filterPath === "string" ) {
                       if(filterPath == path)
                           break;
                   }
                   else
                   if( filterPath instanceof RegExp) {
                       if(filterPath.test(path))
                           break;
                   }				
                   else
                   if( typeof filterPath === "function") {
                       if(filterPath(obj, name, path))
                           break;
                   }
               }
               return idx!=stdFiltersArrayForm.length;
           }
           
           function toArrayAccessForm(obj, childName, path) {
               switch(config.arrayAccessForm) {
                   case "property":
                       if(!(obj[childName] instanceof Array))
                           obj[childName+"_asArray"] = [obj[childName]];
                       else
                           obj[childName+"_asArray"] = obj[childName];
                       break;
                   /*case "none":
                       break;*/
               }
               
               if(!(obj[childName] instanceof Array) && config.arrayAccessFormPaths.length > 0) {
                   if(checkInStdFiltersArrayForm(config.arrayAccessFormPaths, obj, childName, path)) {
                       obj[childName] = [obj[childName]];
                   }			
               }
           }
           
           function fromXmlDateTime(prop) {
               // Implementation based up on http://stackoverflow.com/questions/8178598/xml-datetime-to-javascript-date-object
               // Improved to support full spec and optional parts
               var bits = prop.split(/[-T:+Z]/g);
               
               var d = new Date(bits[0], bits[1]-1, bits[2]);			
               var secondBits = bits[5].split("\.");
               d.setHours(bits[3], bits[4], secondBits[0]);
               if(secondBits.length>1)
                   d.setMilliseconds(secondBits[1]);
       
               // Get supplied time zone offset in minutes
               if(bits[6] && bits[7]) {
                   var offsetMinutes = bits[6] * 60 + Number(bits[7]);
                   var sign = /\d\d-\d\d:\d\d$/.test(prop)? '-' : '+';
       
                   // Apply the sign
                   offsetMinutes = 0 + (sign == '-'? -1 * offsetMinutes : offsetMinutes);
       
                   // Apply offset and local timezone
                   d.setMinutes(d.getMinutes() - offsetMinutes - d.getTimezoneOffset());
               }
               else
                   if(prop.indexOf("Z", prop.length - 1) !== -1) {
                       d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()));					
                   }
       
               // d is now a local time equivalent to the supplied time
               return d;
           }
           
           function checkFromXmlDateTimePaths(value, childName, fullPath) {
               if(config.datetimeAccessFormPaths.length > 0) {
                   var path = fullPath.split("\.#")[0];
                   if(checkInStdFiltersArrayForm(config.datetimeAccessFormPaths, value, childName, path)) {
                       return fromXmlDateTime(value);
                   }
                   else
                       return value;			
               }
               else
                   return value;
           }
           
           function checkXmlElementsFilter(obj, childType, childName, childPath) {
               if( childType == DOMNodeTypes.ELEMENT_NODE && config.xmlElementsFilter.length > 0) {
                   return checkInStdFiltersArrayForm(config.xmlElementsFilter, obj, childName, childPath);	
               }
               else
                   return true;
           }	
       
           function parseDOMChildren( node, path ) {
               if(node.nodeType == DOMNodeTypes.DOCUMENT_NODE) {
                   var result = new Object;
                   var nodeChildren = node.childNodes;
                   // Alternative for firstElementChild which is not supported in some environments
                   for(var cidx=0; cidx <nodeChildren.length; cidx++) {
                       var child = nodeChildren.item(cidx);
                       if(child.nodeType == DOMNodeTypes.ELEMENT_NODE) {
                           var childName = getNodeLocalName(child);
                           result[childName] = parseDOMChildren(child, childName);
                       }
                   }
                   return result;
               }
               else
               if(node.nodeType == DOMNodeTypes.ELEMENT_NODE) {
                   var result = new Object;
                   result.__cnt=0;
                   
                   var nodeChildren = node.childNodes;
                   
                   // Children nodes
                   for(var cidx=0; cidx <nodeChildren.length; cidx++) {
                       var child = nodeChildren.item(cidx); // nodeChildren[cidx];
                       var childName = getNodeLocalName(child);
                       
                       if(child.nodeType!= DOMNodeTypes.COMMENT_NODE) {
                           var childPath = path+"."+childName;
                           if (checkXmlElementsFilter(result,child.nodeType,childName,childPath)) {
                               result.__cnt++;
                               if(result[childName] == null) {
                                   result[childName] = parseDOMChildren(child, childPath);
                                   toArrayAccessForm(result, childName, childPath);					
                               }
                               else {
                                   if(result[childName] != null) {
                                       if( !(result[childName] instanceof Array)) {
                                           result[childName] = [result[childName]];
                                           toArrayAccessForm(result, childName, childPath);
                                       }
                                   }
                                   (result[childName])[result[childName].length] = parseDOMChildren(child, childPath);
                               }
                           }
                       }								
                   }
                   
                   // Attributes
                   for(var aidx=0; aidx <node.attributes.length; aidx++) {
                       var attr = node.attributes.item(aidx); // [aidx];
                       result.__cnt++;
                       result[config.attributePrefix+attr.name]=attr.value;
                   }
                   
                   // Node namespace prefix
                   var nodePrefix = getNodePrefix(node);
                   if(nodePrefix!=null && nodePrefix!="") {
                       result.__cnt++;
                       result.__prefix=nodePrefix;
                   }
                   
                   if(result["#text"]!=null) {				
                       result.__text = result["#text"];
                       if(result.__text instanceof Array) {
                           result.__text = result.__text.join("\n");
                       }
                       //if(config.escapeMode)
                       //	result.__text = unescapeXmlChars(result.__text);
                       if(config.stripWhitespaces)
                           result.__text = result.__text.trim();
                       delete result["#text"];
                       if(config.arrayAccessForm=="property")
                           delete result["#text_asArray"];
                       result.__text = checkFromXmlDateTimePaths(result.__text, childName, path+"."+childName);
                   }
                   if(result["#cdata-section"]!=null) {
                       result.__cdata = result["#cdata-section"];
                       delete result["#cdata-section"];
                       if(config.arrayAccessForm=="property")
                           delete result["#cdata-section_asArray"];
                   }
                   
                   if( result.__cnt == 0 && config.emptyNodeForm=="text" ) {
                       result = '';
                   }
                   else
                   if( result.__cnt == 1 && result.__text!=null  ) {
                       result = result.__text;
                   }
                   else
                   if( result.__cnt == 1 && result.__cdata!=null && !config.keepCData  ) {
                       result = result.__cdata;
                   }			
                   else			
                   if ( result.__cnt > 1 && result.__text!=null && config.skipEmptyTextNodesForObj) {
                       if( (config.stripWhitespaces && result.__text=="") || (result.__text.trim()=="")) {
                           delete result.__text;
                       }
                   }
                   delete result.__cnt;			
                   
                   if( config.enableToStringFunc && (result.__text!=null || result.__cdata!=null )) {
                       result.toString = function() {
                           return (this.__text!=null? this.__text:'')+( this.__cdata!=null ? this.__cdata:'');
                       };
                   }
                   
                   return result;
               }
               else
               if(node.nodeType == DOMNodeTypes.TEXT_NODE || node.nodeType == DOMNodeTypes.CDATA_SECTION_NODE) {
                   return node.nodeValue;
               }	
           }
           
           function startTag(jsonObj, element, attrList, closed) {
               var resultStr = "<"+ ( (jsonObj!=null && jsonObj.__prefix!=null)? (jsonObj.__prefix+":"):"") + element;
               if(attrList!=null) {
                   for(var aidx = 0; aidx < attrList.length; aidx++) {
                       var attrName = attrList[aidx];
                       var attrVal = jsonObj[attrName];
                       if(config.escapeMode)
                           attrVal=escapeXmlChars(attrVal);
                       resultStr+=" "+attrName.substr(config.attributePrefix.length)+"=";
                       if(config.useDoubleQuotes)
                           resultStr+='"'+attrVal+'"';
                       else
                           resultStr+="'"+attrVal+"'";
                   }
               }
               if(!closed)
                   resultStr+=">";
               else
                   resultStr+="/>";
               return resultStr;
           }
           
           function endTag(jsonObj,elementName) {
               return "</"+ (jsonObj.__prefix!=null? (jsonObj.__prefix+":"):"")+elementName+">";
           }
           
           function endsWith(str, suffix) {
               return str.indexOf(suffix, str.length - suffix.length) !== -1;
           }
           
           function jsonXmlSpecialElem ( jsonObj, jsonObjField ) {
               if((config.arrayAccessForm=="property" && endsWith(jsonObjField.toString(),("_asArray"))) 
                       || jsonObjField.toString().indexOf(config.attributePrefix)==0 
                       || jsonObjField.toString().indexOf("__")==0
                       || (jsonObj[jsonObjField] instanceof Function) )
                   return true;
               else
                   return false;
           }
           
           function jsonXmlElemCount ( jsonObj ) {
               var elementsCnt = 0;
               if(jsonObj instanceof Object ) {
                   for( var it in jsonObj  ) {
                       if(jsonXmlSpecialElem ( jsonObj, it) )
                           continue;			
                       elementsCnt++;
                   }
               }
               return elementsCnt;
           }
           
           function checkJsonObjPropertiesFilter(jsonObj, propertyName, jsonObjPath) {
               return config.jsonPropertiesFilter.length == 0
                   || jsonObjPath==""
                   || checkInStdFiltersArrayForm(config.jsonPropertiesFilter, jsonObj, propertyName, jsonObjPath);	
           }
           
           function parseJSONAttributes ( jsonObj ) {
               var attrList = [];
               if(jsonObj instanceof Object ) {
                   for( var ait in jsonObj  ) {
                       if(ait.toString().indexOf("__")== -1 && ait.toString().indexOf(config.attributePrefix)==0) {
                           attrList.push(ait);
                       }
                   }
               }
               return attrList;
           }
           
           function parseJSONTextAttrs ( jsonTxtObj ) {
               var result ="";
               
               if(jsonTxtObj.__cdata!=null) {										
                   result+="<![CDATA["+jsonTxtObj.__cdata+"]]>";					
               }
               
               if(jsonTxtObj.__text!=null) {			
                   if(config.escapeMode)
                       result+=escapeXmlChars(jsonTxtObj.__text);
                   else
                       result+=jsonTxtObj.__text;
               }
               return result;
           }
           
           function parseJSONTextObject ( jsonTxtObj ) {
               var result ="";
       
               if( jsonTxtObj instanceof Object ) {
                   result+=parseJSONTextAttrs ( jsonTxtObj );
               }
               else
                   if(jsonTxtObj!=null) {
                       if(config.escapeMode)
                           result+=escapeXmlChars(jsonTxtObj);
                       else
                           result+=jsonTxtObj;
                   }
               
               return result;
           }
           
           function getJsonPropertyPath(jsonObjPath, jsonPropName) {
               if (jsonObjPath==="") {
                   return jsonPropName;
               }
               else
                   return jsonObjPath+"."+jsonPropName;
           }
           
           function parseJSONArray ( jsonArrRoot, jsonArrObj, attrList, jsonObjPath ) {
               var result = ""; 
               if(jsonArrRoot.length == 0) {
                   result+=startTag(jsonArrRoot, jsonArrObj, attrList, true);
               }
               else {
                   for(var arIdx = 0; arIdx < jsonArrRoot.length; arIdx++) {
                       result+=startTag(jsonArrRoot[arIdx], jsonArrObj, parseJSONAttributes(jsonArrRoot[arIdx]), false);
                       result+=parseJSONObject(jsonArrRoot[arIdx], getJsonPropertyPath(jsonObjPath,jsonArrObj));
                       result+=endTag(jsonArrRoot[arIdx],jsonArrObj);
                   }
               }
               return result;
           }
           
           function parseJSONObject ( jsonObj, jsonObjPath ) {
               var result = "";	
       
               var elementsCnt = jsonXmlElemCount ( jsonObj );
               
               if(elementsCnt > 0) {
                   for( var it in jsonObj ) {
                       
                       if(jsonXmlSpecialElem ( jsonObj, it) || (jsonObjPath!="" && !checkJsonObjPropertiesFilter(jsonObj, it, getJsonPropertyPath(jsonObjPath,it))) )
                           continue;			
                       
                       var subObj = jsonObj[it];						
                       
                       var attrList = parseJSONAttributes( subObj );
                       
                       if(subObj == null || subObj == undefined) {
                           result+=startTag(subObj, it, attrList, true);
                       }
                       else
                       if(subObj instanceof Object) {
                           
                           if(subObj instanceof Array) {					
                               result+=parseJSONArray( subObj, it, attrList, jsonObjPath );					
                           }
                           else if(subObj instanceof Date) {
                               result+=startTag(subObj, it, attrList, false);
                               result+=subObj.toISOString();
                               result+=endTag(subObj,it);
                           }
                           else {
                               var subObjElementsCnt = jsonXmlElemCount ( subObj );
                               if(subObjElementsCnt > 0 || subObj.__text!=null || subObj.__cdata!=null) {
                                   result+=startTag(subObj, it, attrList, false);
                                   result+=parseJSONObject(subObj, getJsonPropertyPath(jsonObjPath,it));
                                   result+=endTag(subObj,it);
                               }
                               else {
                                   result+=startTag(subObj, it, attrList, true);
                               }
                           }
                       }
                       else {
                           result+=startTag(subObj, it, attrList, false);
                           result+=parseJSONTextObject(subObj);
                           result+=endTag(subObj,it);
                       }
                   }
               }
               result+=parseJSONTextObject(jsonObj);
               
               return result;
           }
           
           this.parseXmlString = function(xmlDocStr) {
               var isIEParser = window.ActiveXObject || "ActiveXObject" in window;
               if (xmlDocStr === undefined) {
                   return null;
               }
               var xmlDoc;
               if (window.DOMParser) {
                   var parser=new window.DOMParser();			
                   var parsererrorNS = null;
                   // IE9+ now is here
                   if(!isIEParser) {
                       try {
                           parsererrorNS = parser.parseFromString("INVALID", "text/xml").getElementsByTagName("parsererror")[0].namespaceURI;
                       }
                       catch(err) {					
                           parsererrorNS = null;
                       }
                   }
                   try {
                       xmlDoc = parser.parseFromString( xmlDocStr, "text/xml" );
                       if( parsererrorNS!= null && xmlDoc.getElementsByTagNameNS(parsererrorNS, "parsererror").length > 0) {
                           //throw new Error('Error parsing XML: '+xmlDocStr);
                           xmlDoc = null;
                       }
                   }
                   catch(err) {
                       xmlDoc = null;
                   }
               }
               else {
                   // IE :(
                   if(xmlDocStr.indexOf("<?")==0) {
                       xmlDocStr = xmlDocStr.substr( xmlDocStr.indexOf("?>") + 2 );
                   }
                   xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
                   xmlDoc.async="false";
                   xmlDoc.loadXML(xmlDocStr);
               }
               return xmlDoc;
           };
           
           this.asArray = function(prop) {
               if (prop === undefined || prop == null)
                   return [];
               else
               if(prop instanceof Array)
                   return prop;
               else
                   return [prop];
           };
           
           this.toXmlDateTime = function(dt) {
               if(dt instanceof Date)
                   return dt.toISOString();
               else
               if(typeof(dt) === 'number' )
                   return new Date(dt).toISOString();
               else	
                   return null;
           };
           
           this.asDateTime = function(prop) {
               if(typeof(prop) == "string") {
                   return fromXmlDateTime(prop);
               }
               else
                   return prop;
           };
       
           this.xml2json = function (xmlDoc) {
               return parseDOMChildren ( xmlDoc );
           };
           
           this.xml_str2json = function (xmlDocStr) {
               var xmlDoc = this.parseXmlString(xmlDocStr);
               if(xmlDoc!=null)
                   return this.xml2json(xmlDoc);
               else
                   return null;
           };
       
           this.json2xml_str = function (jsonObj) {
               return parseJSONObject ( jsonObj, "" );
           };
       
           this.json2xml = function (jsonObj) {
               var xmlDocStr = this.json2xml_str (jsonObj);
               return this.parseXmlString(xmlDocStr);
           };
           
           this.getVersion = function () {
               return VERSION;
           };	
       }
    }));
    });

    /* clsSMFill\HelperAI.svelte generated by Svelte v3.38.2 */

    function XMLToJSON(myXml) {
    	//var myXml = xml;
    	myXml = myXml.replace(/<\!--\[CDATA\[/g, "<![CDATA[").replace(/\]\]-->/g, "]]>");

    	let x2js = new xml2json({ useDoubleQuotes: true });
    	let newXml = JSON.stringify(x2js.xml_str2json(myXml));
    	newXml = newXml.replace("SMXML", "smxml");
    	newXml = JSON.parse(newXml);
    	return newXml;
    }

    function JSONToXML(a) {
    	let b = new xml2json({ useDoubleQuotes: !0 });
    	let c = b.json2xml_str(a);
    	return c = c.replace("<![CDATA[", "<!--[CDATA[").replace("]]>", "]]-->");
    }

    /* clsSMFill\FillnTheBlanks.svelte generated by Svelte v3.38.2 */

    const { console: console_1$2 } = globals;
    const file$2 = "clsSMFill\\FillnTheBlanks.svelte";

    function create_fragment$2(ctx) {
    	let nav;
    	let t0;
    	let div5;
    	let div0;
    	let t1;
    	let div4;
    	let html_tag;
    	let t2;
    	let div3;
    	let div1;
    	let i0;
    	let span0;
    	let t4;
    	let hr;
    	let t5;
    	let div2;
    	let i1;
    	let span1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			t0 = space();
    			div5 = element("div");
    			div0 = element("div");
    			t1 = space();
    			div4 = element("div");
    			t2 = space();
    			div3 = element("div");
    			div1 = element("div");
    			i0 = element("i");
    			span0 = element("span");
    			span0.textContent = "Add Responce";
    			t4 = space();
    			hr = element("hr");
    			t5 = space();
    			div2 = element("div");
    			i1 = element("i");
    			span1 = element("span");
    			span1.textContent = "Exit";
    			attr_dev(nav, "id", "navbar");
    			add_location(nav, file$2, 177, 0, 5744);
    			attr_dev(div0, "id", "FillnTheBlanks_Header");
    			attr_dev(div0, "class", "svelte-1j3azsf");
    			add_location(div0, file$2, 180, 4, 5805);
    			html_tag = new HtmlTag(t2);
    			attr_dev(i0, "class", "bx bxs-plus-square svelte-1j3azsf");
    			add_location(i0, file$2, 187, 16, 6155);
    			attr_dev(span0, "class", "svelte-1j3azsf");
    			add_location(span0, file$2, 187, 50, 6189);
    			attr_dev(div1, "class", "items svelte-1j3azsf");
    			attr_dev(div1, "id", "addResponce");
    			add_location(div1, file$2, 186, 12, 6101);
    			attr_dev(hr, "class", "svelte-1j3azsf");
    			add_location(hr, file$2, 189, 12, 6248);
    			attr_dev(i1, "class", "bx bxs-exit svelte-1j3azsf");
    			add_location(i1, file$2, 191, 16, 6339);
    			attr_dev(span1, "class", "svelte-1j3azsf");
    			add_location(span1, file$2, 191, 44, 6367);
    			attr_dev(div2, "class", "items svelte-1j3azsf");
    			attr_dev(div2, "id", "exitTab");
    			add_location(div2, file$2, 190, 12, 6266);
    			attr_dev(div3, "id", "context-menu");
    			attr_dev(div3, "contenteditable", "false");
    			attr_dev(div3, "class", "svelte-1j3azsf");
    			add_location(div3, file$2, 185, 8, 6040);
    			attr_dev(div4, "id", "FillnTheBlanks_Body");
    			attr_dev(div4, "role", "textbox");
    			attr_dev(div4, "contenteditable", "false");
    			attr_dev(div4, "spellcheck", "false");
    			attr_dev(div4, "class", "myDiv svelte-1j3azsf");
    			add_location(div4, file$2, 182, 4, 5855);
    			attr_dev(div5, "id", "FillnTheBlanks");
    			attr_dev(div5, "class", "svelte-1j3azsf");
    			add_location(div5, file$2, 179, 0, 5773);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			html_tag.m(/*newString*/ ctx[0], div4);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, i0);
    			append_dev(div1, span0);
    			append_dev(div3, t4);
    			append_dev(div3, hr);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, i1);
    			append_dev(div2, span1);

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", exitContext, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function exitContext() {
    	document.getElementById("context-menu").style.display = "none";
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FillnTheBlanks", slots, []);
    	let myData = getDefaultXMl("editor_item_1.xml");
    	document.getElementById("special_module_xml").value = myData;
    	let obj = XMLToJSON(myData);
    	console.log("obj", obj);
    	let matching = obj.smxml.text.__cdata;

    	//console.log("myData",myData);
    	//console.log("question",matching);
    	let array = [];

    	//console.log(array);
    	//console.log(array[0]);
    	//console.log(matching.match(/[%{](.*?)[%]/g));//%{ string }%
    	//replace the matching string with span tag
    	let newString = matching.replace(/[%{](.*?)[%]/g, `<span class="textarea" 
    style="display: inline-block; padding: 5px 10px 5px 10px;
    border-radius: 5px; margin: 5px; border-left: 5px solid #d9e7fd;
    background-color: #f1f1f1; width: 100px;">Textbox</span>`);

    	//console.log(newString);
    	//  onMount we add a class to span tag and addEventListner
    	onMount(() => {
    		let mylist = document.querySelectorAll(".textarea");

    		//console.log(mylist);
    		for (let i = 0; i < mylist.length; i++) {
    			mylist[i].addEventListener("click", () => {
    				addRecord(array[i]);
    			});
    		}
    	}); //console.log("myList",mylist[0].innerHTML);

    	//context-menu 
    	window.addEventListener("contextmenu", function (event) {
    		event.preventDefault();
    		console.log(event);
    		let contextElement = document.getElementById("context-menu");
    		contextElement.style.top = event.clientY + "px";
    		console.log(event.offsetY);
    		contextElement.style.left = event.clientX + "px";
    		console.log(event.offsetX);
    		contextElement.style.display = "block";
    		contextElement.style.transform = "scale(1)";
    		contextElement.style.transition = "transform 200ms ease-in-out";
    	});

    	//if we click on particular span tag
    	//is value is updated then is will call updateXml function
    	//%{human}%
    	function addRecord(myitem) {
    		console.log("myItem", myitem);
    		let item = myitem.replace(/[^a-zA-Z]/g, "");
    		console.log(item);

    		// let cursorPos = document.getElementById(FillnTheBlanks_Body).caret().start();
    		// console.log("mycursor position",cursorPos);
    		document.getElementById("context-menu").style.display = "none";

    		swal({
    			title: "Add Responce",
    			text: "Write correct answer here!",
    			content: {
    				element: "input",
    				attributes: { value: item }
    			},
    			buttons: ["Cancel", "Done"],
    			className: "sweetAlert"
    		}).then(value => {
    			console.log("VAlue", value);

    			// if(value) {
    			//     updateXML(value);
    			// }
    			if (value.trim() != "") {
    				if (value.match(/[a-zA-Z]/)) {
    					updateXML(value);
    				} else {
    					alert("Invalid string");
    				}
    			} else {
    				alert("Invalid string");
    			}
    		});

    		//this function will update the XML
    		function updateXML(value) {
    			if (value.trim() != "") {
    				let string = matching.replace(myitem, `%{${value}}%`);
    				obj.smxml.text.__cdata = string;
    				$$invalidate(1, matching = string);

    				//console.log(matching);
    				let obj1 = JSONToXML(obj);

    				//console.log("myboject",obj1);
    				myData = obj1;

    				document.getElementById("special_module_xml").value = myData;
    			} else {
    				alert("Invalid Input");
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<FillnTheBlanks> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		getDefaultXMl,
    		XMLToJSON,
    		JSONToXML,
    		myData,
    		obj,
    		matching,
    		array,
    		newString,
    		exitContext,
    		addRecord
    	});

    	$$self.$inject_state = $$props => {
    		if ("myData" in $$props) myData = $$props.myData;
    		if ("obj" in $$props) obj = $$props.obj;
    		if ("matching" in $$props) $$invalidate(1, matching = $$props.matching);
    		if ("array" in $$props) array = $$props.array;
    		if ("newString" in $$props) $$invalidate(0, newString = $$props.newString);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*matching*/ 2) {
    			array = matching.match(/[%{](.*?)[%]/g); //%{string}%
    		}
    	};

    	return [newString, matching];
    }

    class FillnTheBlanks extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FillnTheBlanks",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* clsSMFill\FillnTheBlanksPreview.svelte generated by Svelte v3.38.2 */

    const { console: console_1$1 } = globals;
    const file$1 = "clsSMFill\\FillnTheBlanksPreview.svelte";

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Correct Answer";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Review Answer";
    			t3 = space();
    			div1 = element("div");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "svelte-1qgci2q");
    			add_location(button0, file$1, 83, 8, 2576);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "svelte-1qgci2q");
    			add_location(button1, file$1, 84, 8, 2656);
    			attr_dev(div0, "id", "FillnTheBlanksPreview_Header");
    			attr_dev(div0, "class", "svelte-1qgci2q");
    			add_location(div0, file$1, 82, 4, 2527);
    			attr_dev(div1, "id", "FillnTheBlanksPreview_Body");
    			attr_dev(div1, "class", "svelte-1qgci2q");
    			add_location(div1, file$1, 86, 4, 2741);
    			attr_dev(div2, "id", "FillnTheBlanksPreview");
    			attr_dev(div2, "class", "svelte-1qgci2q");
    			add_location(div2, file$1, 81, 0, 2489);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			append_dev(div0, button1);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			div1.innerHTML = /*newString*/ ctx[0];

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*correctAnswer*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*checkAnswer*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FillnTheBlanksPreview", slots, []);
    	let myData = document.getElementById("special_module_xml").value;
    	let obj = XMLToJSON(myData);
    	let string = obj.smxml.text.__cdata;
    	let array = string.match(/[%{](.*?)[%]/g);
    	console.log("preview section", array);

    	let newString = string.replace(/[%{](.*?)[%]/g, `<input type="text"
    placeholder="Textbox" class="textarea" style="border-radius: 5px; margin: 5px;
    border-left: 5px solid #d9e7fd; background-color: #f1f1f1; width: 150px; 
    height: 30px;" autocomplete="off"/>`);

    	let listItem = [];

    	onMount(() => {
    		listItem = document.querySelectorAll(".textarea");

    		for (let i = 0; i < listItem.length; i++) {
    			listItem[i].setAttribute("id", `input${i}`);
    		}
    	});

    	let flag = false;

    	function checkAnswer() {
    		for (let i = 0; i < listItem.length; i++) {
    			if (flag) {
    				listItem[i].value = "";
    			} else {
    				if (array[i] !== `%{${listItem[i].value}}%`) {
    					listItem[i].style.border = "2px solid red";
    				} else {
    					listItem[i].style.border = "2px solid green";
    				}
    			}
    		}
    	}

    	function correctAnswer() {
    		flag = true;

    		for (let i = 0; i < listItem.length; i++) {
    			listItem[i].value = array[i].replace(/[^a-zA-Z]/g, "");
    			listItem[i].style.border = "none";
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<FillnTheBlanksPreview> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		XMLToJSON,
    		myData,
    		obj,
    		string,
    		array,
    		newString,
    		listItem,
    		flag,
    		checkAnswer,
    		correctAnswer
    	});

    	$$self.$inject_state = $$props => {
    		if ("myData" in $$props) myData = $$props.myData;
    		if ("obj" in $$props) obj = $$props.obj;
    		if ("string" in $$props) string = $$props.string;
    		if ("array" in $$props) array = $$props.array;
    		if ("newString" in $$props) $$invalidate(0, newString = $$props.newString);
    		if ("listItem" in $$props) listItem = $$props.listItem;
    		if ("flag" in $$props) flag = $$props.flag;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [newString, checkAnswer, correctAnswer];
    }

    class FillnTheBlanksPreview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FillnTheBlanksPreview",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var sweetalert_min = createCommonjsModule(function (module, exports) {
    !function(t,e){module.exports=e();}(commonjsGlobal,function(){return function(t){function e(o){if(n[o])return n[o].exports;var r=n[o]={i:o,l:!1,exports:{}};return t[o].call(r.exports,r,r.exports,e),r.l=!0,r.exports}var n={};return e.m=t,e.c=n,e.d=function(t,n,o){e.o(t,n)||Object.defineProperty(t,n,{configurable:!1,enumerable:!0,get:o});},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},e.p="",e(e.s=8)}([function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o="swal-button";e.CLASS_NAMES={MODAL:"swal-modal",OVERLAY:"swal-overlay",SHOW_MODAL:"swal-overlay--show-modal",MODAL_TITLE:"swal-title",MODAL_TEXT:"swal-text",ICON:"swal-icon",ICON_CUSTOM:"swal-icon--custom",CONTENT:"swal-content",FOOTER:"swal-footer",BUTTON_CONTAINER:"swal-button-container",BUTTON:o,CONFIRM_BUTTON:o+"--confirm",CANCEL_BUTTON:o+"--cancel",DANGER_BUTTON:o+"--danger",BUTTON_LOADING:o+"--loading",BUTTON_LOADER:o+"__loader"},e.default=e.CLASS_NAMES;},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0}),e.getNode=function(t){var e="."+t;return document.querySelector(e)},e.stringToNode=function(t){var e=document.createElement("div");return e.innerHTML=t.trim(),e.firstChild},e.insertAfter=function(t,e){var n=e.nextSibling;e.parentNode.insertBefore(t,n);},e.removeNode=function(t){t.parentElement.removeChild(t);},e.throwErr=function(t){throw t=t.replace(/ +(?= )/g,""),"SweetAlert: "+(t=t.trim())},e.isPlainObject=function(t){if("[object Object]"!==Object.prototype.toString.call(t))return !1;var e=Object.getPrototypeOf(t);return null===e||e===Object.prototype},e.ordinalSuffixOf=function(t){var e=t%10,n=t%100;return 1===e&&11!==n?t+"st":2===e&&12!==n?t+"nd":3===e&&13!==n?t+"rd":t+"th"};},function(t,e,n){function o(t){for(var n in t)e.hasOwnProperty(n)||(e[n]=t[n]);}Object.defineProperty(e,"__esModule",{value:!0}),o(n(25));var r=n(26);e.overlayMarkup=r.default,o(n(27)),o(n(28)),o(n(29));var i=n(0),a=i.default.MODAL_TITLE,s=i.default.MODAL_TEXT,c=i.default.ICON,l=i.default.FOOTER;e.iconMarkup='\n  <div class="'+c+'"></div>',e.titleMarkup='\n  <div class="'+a+'"></div>\n',e.textMarkup='\n  <div class="'+s+'"></div>',e.footerMarkup='\n  <div class="'+l+'"></div>\n';},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(1);e.CONFIRM_KEY="confirm",e.CANCEL_KEY="cancel";var r={visible:!0,text:null,value:null,className:"",closeModal:!0},i=Object.assign({},r,{visible:!1,text:"Cancel",value:null}),a=Object.assign({},r,{text:"OK",value:!0});e.defaultButtonList={cancel:i,confirm:a};var s=function(t){switch(t){case e.CONFIRM_KEY:return a;case e.CANCEL_KEY:return i;default:var n=t.charAt(0).toUpperCase()+t.slice(1);return Object.assign({},r,{text:n,value:t})}},c=function(t,e){var n=s(t);return !0===e?Object.assign({},n,{visible:!0}):"string"==typeof e?Object.assign({},n,{visible:!0,text:e}):o.isPlainObject(e)?Object.assign({visible:!0},n,e):Object.assign({},n,{visible:!1})},l=function(t){for(var e={},n=0,o=Object.keys(t);n<o.length;n++){var r=o[n],a=t[r],s=c(r,a);e[r]=s;}return e.cancel||(e.cancel=i),e},u=function(t){var n={};switch(t.length){case 1:n[e.CANCEL_KEY]=Object.assign({},i,{visible:!1});break;case 2:n[e.CANCEL_KEY]=c(e.CANCEL_KEY,t[0]),n[e.CONFIRM_KEY]=c(e.CONFIRM_KEY,t[1]);break;default:o.throwErr("Invalid number of 'buttons' in array ("+t.length+").\n      If you want more than 2 buttons, you need to use an object!");}return n};e.getButtonListOpts=function(t){var n=e.defaultButtonList;return "string"==typeof t?n[e.CONFIRM_KEY]=c(e.CONFIRM_KEY,t):Array.isArray(t)?n=u(t):o.isPlainObject(t)?n=l(t):!0===t?n=u([!0,!0]):!1===t?n=u([!1,!1]):void 0===t&&(n=e.defaultButtonList),n};},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(1),r=n(2),i=n(0),a=i.default.MODAL,s=i.default.OVERLAY,c=n(30),l=n(31),u=n(32),f=n(33);e.injectElIntoModal=function(t){var e=o.getNode(a),n=o.stringToNode(t);return e.appendChild(n),n};var d=function(t){t.className=a,t.textContent="";},p=function(t,e){d(t);var n=e.className;n&&t.classList.add(n);};e.initModalContent=function(t){var e=o.getNode(a);p(e,t),c.default(t.icon),l.initTitle(t.title),l.initText(t.text),f.default(t.content),u.default(t.buttons,t.dangerMode);};var m=function(){var t=o.getNode(s),e=o.stringToNode(r.modalMarkup);t.appendChild(e);};e.default=m;},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(3),r={isOpen:!1,promise:null,actions:{},timer:null},i=Object.assign({},r);e.resetState=function(){i=Object.assign({},r);},e.setActionValue=function(t){if("string"==typeof t)return a(o.CONFIRM_KEY,t);for(var e in t)a(e,t[e]);};var a=function(t,e){i.actions[t]||(i.actions[t]={}),Object.assign(i.actions[t],{value:e});};e.setActionOptionsFor=function(t,e){var n=(void 0===e?{}:e).closeModal,o=void 0===n||n;Object.assign(i.actions[t],{closeModal:o});},e.default=i;},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(1),r=n(3),i=n(0),a=i.default.OVERLAY,s=i.default.SHOW_MODAL,c=i.default.BUTTON,l=i.default.BUTTON_LOADING,u=n(5);e.openModal=function(){o.getNode(a).classList.add(s),u.default.isOpen=!0;};var f=function(){o.getNode(a).classList.remove(s),u.default.isOpen=!1;};e.onAction=function(t){void 0===t&&(t=r.CANCEL_KEY);var e=u.default.actions[t],n=e.value;if(!1===e.closeModal){var i=c+"--"+t;o.getNode(i).classList.add(l);}else f();u.default.promise.resolve(n);},e.getState=function(){var t=Object.assign({},u.default);return delete t.promise,delete t.timer,t},e.stopLoading=function(){for(var t=document.querySelectorAll("."+c),e=0;e<t.length;e++){t[e].classList.remove(l);}};},function(t,e){var n;n=function(){return this}();try{n=n||Function("return this")()||(0,eval)("this");}catch(t){"object"==typeof window&&(n=window);}t.exports=n;},function(t,e,n){(function(e){t.exports=e.sweetAlert=n(9);}).call(e,n(7));},function(t,e,n){(function(e){t.exports=e.swal=n(10);}).call(e,n(7));},function(t,e,n){"undefined"!=typeof window&&n(11),n(16);var o=n(23).default;t.exports=o;},function(t,e,n){var o=n(12);"string"==typeof o&&(o=[[t.i,o,""]]);var r={insertAt:"top"};r.transform=void 0;n(14)(o,r);o.locals&&(t.exports=o.locals);},function(t,e,n){e=t.exports=n(13)(void 0),e.push([t.i,'.swal-icon--error{border-color:#f27474;-webkit-animation:animateErrorIcon .5s;animation:animateErrorIcon .5s}.swal-icon--error__x-mark{position:relative;display:block;-webkit-animation:animateXMark .5s;animation:animateXMark .5s}.swal-icon--error__line{position:absolute;height:5px;width:47px;background-color:#f27474;display:block;top:37px;border-radius:2px}.swal-icon--error__line--left{-webkit-transform:rotate(45deg);transform:rotate(45deg);left:17px}.swal-icon--error__line--right{-webkit-transform:rotate(-45deg);transform:rotate(-45deg);right:16px}@-webkit-keyframes animateErrorIcon{0%{-webkit-transform:rotateX(100deg);transform:rotateX(100deg);opacity:0}to{-webkit-transform:rotateX(0deg);transform:rotateX(0deg);opacity:1}}@keyframes animateErrorIcon{0%{-webkit-transform:rotateX(100deg);transform:rotateX(100deg);opacity:0}to{-webkit-transform:rotateX(0deg);transform:rotateX(0deg);opacity:1}}@-webkit-keyframes animateXMark{0%{-webkit-transform:scale(.4);transform:scale(.4);margin-top:26px;opacity:0}50%{-webkit-transform:scale(.4);transform:scale(.4);margin-top:26px;opacity:0}80%{-webkit-transform:scale(1.15);transform:scale(1.15);margin-top:-6px}to{-webkit-transform:scale(1);transform:scale(1);margin-top:0;opacity:1}}@keyframes animateXMark{0%{-webkit-transform:scale(.4);transform:scale(.4);margin-top:26px;opacity:0}50%{-webkit-transform:scale(.4);transform:scale(.4);margin-top:26px;opacity:0}80%{-webkit-transform:scale(1.15);transform:scale(1.15);margin-top:-6px}to{-webkit-transform:scale(1);transform:scale(1);margin-top:0;opacity:1}}.swal-icon--warning{border-color:#f8bb86;-webkit-animation:pulseWarning .75s infinite alternate;animation:pulseWarning .75s infinite alternate}.swal-icon--warning__body{width:5px;height:47px;top:10px;border-radius:2px;margin-left:-2px}.swal-icon--warning__body,.swal-icon--warning__dot{position:absolute;left:50%;background-color:#f8bb86}.swal-icon--warning__dot{width:7px;height:7px;border-radius:50%;margin-left:-4px;bottom:-11px}@-webkit-keyframes pulseWarning{0%{border-color:#f8d486}to{border-color:#f8bb86}}@keyframes pulseWarning{0%{border-color:#f8d486}to{border-color:#f8bb86}}.swal-icon--success{border-color:#a5dc86}.swal-icon--success:after,.swal-icon--success:before{content:"";border-radius:50%;position:absolute;width:60px;height:120px;background:#fff;-webkit-transform:rotate(45deg);transform:rotate(45deg)}.swal-icon--success:before{border-radius:120px 0 0 120px;top:-7px;left:-33px;-webkit-transform:rotate(-45deg);transform:rotate(-45deg);-webkit-transform-origin:60px 60px;transform-origin:60px 60px}.swal-icon--success:after{border-radius:0 120px 120px 0;top:-11px;left:30px;-webkit-transform:rotate(-45deg);transform:rotate(-45deg);-webkit-transform-origin:0 60px;transform-origin:0 60px;-webkit-animation:rotatePlaceholder 4.25s ease-in;animation:rotatePlaceholder 4.25s ease-in}.swal-icon--success__ring{width:80px;height:80px;border:4px solid hsla(98,55%,69%,.2);border-radius:50%;box-sizing:content-box;position:absolute;left:-4px;top:-4px;z-index:2}.swal-icon--success__hide-corners{width:5px;height:90px;background-color:#fff;padding:1px;position:absolute;left:28px;top:8px;z-index:1;-webkit-transform:rotate(-45deg);transform:rotate(-45deg)}.swal-icon--success__line{height:5px;background-color:#a5dc86;display:block;border-radius:2px;position:absolute;z-index:2}.swal-icon--success__line--tip{width:25px;left:14px;top:46px;-webkit-transform:rotate(45deg);transform:rotate(45deg);-webkit-animation:animateSuccessTip .75s;animation:animateSuccessTip .75s}.swal-icon--success__line--long{width:47px;right:8px;top:38px;-webkit-transform:rotate(-45deg);transform:rotate(-45deg);-webkit-animation:animateSuccessLong .75s;animation:animateSuccessLong .75s}@-webkit-keyframes rotatePlaceholder{0%{-webkit-transform:rotate(-45deg);transform:rotate(-45deg)}5%{-webkit-transform:rotate(-45deg);transform:rotate(-45deg)}12%{-webkit-transform:rotate(-405deg);transform:rotate(-405deg)}to{-webkit-transform:rotate(-405deg);transform:rotate(-405deg)}}@keyframes rotatePlaceholder{0%{-webkit-transform:rotate(-45deg);transform:rotate(-45deg)}5%{-webkit-transform:rotate(-45deg);transform:rotate(-45deg)}12%{-webkit-transform:rotate(-405deg);transform:rotate(-405deg)}to{-webkit-transform:rotate(-405deg);transform:rotate(-405deg)}}@-webkit-keyframes animateSuccessTip{0%{width:0;left:1px;top:19px}54%{width:0;left:1px;top:19px}70%{width:50px;left:-8px;top:37px}84%{width:17px;left:21px;top:48px}to{width:25px;left:14px;top:45px}}@keyframes animateSuccessTip{0%{width:0;left:1px;top:19px}54%{width:0;left:1px;top:19px}70%{width:50px;left:-8px;top:37px}84%{width:17px;left:21px;top:48px}to{width:25px;left:14px;top:45px}}@-webkit-keyframes animateSuccessLong{0%{width:0;right:46px;top:54px}65%{width:0;right:46px;top:54px}84%{width:55px;right:0;top:35px}to{width:47px;right:8px;top:38px}}@keyframes animateSuccessLong{0%{width:0;right:46px;top:54px}65%{width:0;right:46px;top:54px}84%{width:55px;right:0;top:35px}to{width:47px;right:8px;top:38px}}.swal-icon--info{border-color:#c9dae1}.swal-icon--info:before{width:5px;height:29px;bottom:17px;border-radius:2px;margin-left:-2px}.swal-icon--info:after,.swal-icon--info:before{content:"";position:absolute;left:50%;background-color:#c9dae1}.swal-icon--info:after{width:7px;height:7px;border-radius:50%;margin-left:-3px;top:19px}.swal-icon{width:80px;height:80px;border-width:4px;border-style:solid;border-radius:50%;padding:0;position:relative;box-sizing:content-box;margin:20px auto}.swal-icon:first-child{margin-top:32px}.swal-icon--custom{width:auto;height:auto;max-width:100%;border:none;border-radius:0}.swal-icon img{max-width:100%;max-height:100%}.swal-title{color:rgba(0,0,0,.65);font-weight:600;text-transform:none;position:relative;display:block;padding:13px 16px;font-size:27px;line-height:normal;text-align:center;margin-bottom:0}.swal-title:first-child{margin-top:26px}.swal-title:not(:first-child){padding-bottom:0}.swal-title:not(:last-child){margin-bottom:13px}.swal-text{font-size:16px;position:relative;float:none;line-height:normal;vertical-align:top;text-align:left;display:inline-block;margin:0;padding:0 10px;font-weight:400;color:rgba(0,0,0,.64);max-width:calc(100% - 20px);overflow-wrap:break-word;box-sizing:border-box}.swal-text:first-child{margin-top:45px}.swal-text:last-child{margin-bottom:45px}.swal-footer{text-align:right;padding-top:13px;margin-top:13px;padding:13px 16px;border-radius:inherit;border-top-left-radius:0;border-top-right-radius:0}.swal-button-container{margin:5px;display:inline-block;position:relative}.swal-button{background-color:#7cd1f9;color:#fff;border:none;box-shadow:none;border-radius:5px;font-weight:600;font-size:14px;padding:10px 24px;margin:0;cursor:pointer}.swal-button:not([disabled]):hover{background-color:#78cbf2}.swal-button:active{background-color:#70bce0}.swal-button:focus{outline:none;box-shadow:0 0 0 1px #fff,0 0 0 3px rgba(43,114,165,.29)}.swal-button[disabled]{opacity:.5;cursor:default}.swal-button::-moz-focus-inner{border:0}.swal-button--cancel{color:#555;background-color:#efefef}.swal-button--cancel:not([disabled]):hover{background-color:#e8e8e8}.swal-button--cancel:active{background-color:#d7d7d7}.swal-button--cancel:focus{box-shadow:0 0 0 1px #fff,0 0 0 3px rgba(116,136,150,.29)}.swal-button--danger{background-color:#e64942}.swal-button--danger:not([disabled]):hover{background-color:#df4740}.swal-button--danger:active{background-color:#cf423b}.swal-button--danger:focus{box-shadow:0 0 0 1px #fff,0 0 0 3px rgba(165,43,43,.29)}.swal-content{padding:0 20px;margin-top:20px;font-size:medium}.swal-content:last-child{margin-bottom:20px}.swal-content__input,.swal-content__textarea{-webkit-appearance:none;background-color:#fff;border:none;font-size:14px;display:block;box-sizing:border-box;width:100%;border:1px solid rgba(0,0,0,.14);padding:10px 13px;border-radius:2px;transition:border-color .2s}.swal-content__input:focus,.swal-content__textarea:focus{outline:none;border-color:#6db8ff}.swal-content__textarea{resize:vertical}.swal-button--loading{color:transparent}.swal-button--loading~.swal-button__loader{opacity:1}.swal-button__loader{position:absolute;height:auto;width:43px;z-index:2;left:50%;top:50%;-webkit-transform:translateX(-50%) translateY(-50%);transform:translateX(-50%) translateY(-50%);text-align:center;pointer-events:none;opacity:0}.swal-button__loader div{display:inline-block;float:none;vertical-align:baseline;width:9px;height:9px;padding:0;border:none;margin:2px;opacity:.4;border-radius:7px;background-color:hsla(0,0%,100%,.9);transition:background .2s;-webkit-animation:swal-loading-anim 1s infinite;animation:swal-loading-anim 1s infinite}.swal-button__loader div:nth-child(3n+2){-webkit-animation-delay:.15s;animation-delay:.15s}.swal-button__loader div:nth-child(3n+3){-webkit-animation-delay:.3s;animation-delay:.3s}@-webkit-keyframes swal-loading-anim{0%{opacity:.4}20%{opacity:.4}50%{opacity:1}to{opacity:.4}}@keyframes swal-loading-anim{0%{opacity:.4}20%{opacity:.4}50%{opacity:1}to{opacity:.4}}.swal-overlay{position:fixed;top:0;bottom:0;left:0;right:0;text-align:center;font-size:0;overflow-y:auto;background-color:rgba(0,0,0,.4);z-index:10000;pointer-events:none;opacity:0;transition:opacity .3s}.swal-overlay:before{content:" ";display:inline-block;vertical-align:middle;height:100%}.swal-overlay--show-modal{opacity:1;pointer-events:auto}.swal-overlay--show-modal .swal-modal{opacity:1;pointer-events:auto;box-sizing:border-box;-webkit-animation:showSweetAlert .3s;animation:showSweetAlert .3s;will-change:transform}.swal-modal{width:478px;opacity:0;pointer-events:none;background-color:#fff;text-align:center;border-radius:5px;position:static;margin:20px auto;display:inline-block;vertical-align:middle;-webkit-transform:scale(1);transform:scale(1);-webkit-transform-origin:50% 50%;transform-origin:50% 50%;z-index:10001;transition:opacity .2s,-webkit-transform .3s;transition:transform .3s,opacity .2s;transition:transform .3s,opacity .2s,-webkit-transform .3s}@media (max-width:500px){.swal-modal{width:calc(100% - 20px)}}@-webkit-keyframes showSweetAlert{0%{-webkit-transform:scale(1);transform:scale(1)}1%{-webkit-transform:scale(.5);transform:scale(.5)}45%{-webkit-transform:scale(1.05);transform:scale(1.05)}80%{-webkit-transform:scale(.95);transform:scale(.95)}to{-webkit-transform:scale(1);transform:scale(1)}}@keyframes showSweetAlert{0%{-webkit-transform:scale(1);transform:scale(1)}1%{-webkit-transform:scale(.5);transform:scale(.5)}45%{-webkit-transform:scale(1.05);transform:scale(1.05)}80%{-webkit-transform:scale(.95);transform:scale(.95)}to{-webkit-transform:scale(1);transform:scale(1)}}',""]);},function(t,e){function n(t,e){var n=t[1]||"",r=t[3];if(!r)return n;if(e&&"function"==typeof btoa){var i=o(r);return [n].concat(r.sources.map(function(t){return "/*# sourceURL="+r.sourceRoot+t+" */"})).concat([i]).join("\n")}return [n].join("\n")}function o(t){return "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(t))))+" */"}t.exports=function(t){var e=[];return e.toString=function(){return this.map(function(e){var o=n(e,t);return e[2]?"@media "+e[2]+"{"+o+"}":o}).join("")},e.i=function(t,n){"string"==typeof t&&(t=[[null,t,""]]);for(var o={},r=0;r<this.length;r++){var i=this[r][0];"number"==typeof i&&(o[i]=!0);}for(r=0;r<t.length;r++){var a=t[r];"number"==typeof a[0]&&o[a[0]]||(n&&!a[2]?a[2]=n:n&&(a[2]="("+a[2]+") and ("+n+")"),e.push(a));}},e};},function(t,e,n){function o(t,e){for(var n=0;n<t.length;n++){var o=t[n],r=m[o.id];if(r){r.refs++;for(var i=0;i<r.parts.length;i++)r.parts[i](o.parts[i]);for(;i<o.parts.length;i++)r.parts.push(u(o.parts[i],e));}else {for(var a=[],i=0;i<o.parts.length;i++)a.push(u(o.parts[i],e));m[o.id]={id:o.id,refs:1,parts:a};}}}function r(t,e){for(var n=[],o={},r=0;r<t.length;r++){var i=t[r],a=e.base?i[0]+e.base:i[0],s=i[1],c=i[2],l=i[3],u={css:s,media:c,sourceMap:l};o[a]?o[a].parts.push(u):n.push(o[a]={id:a,parts:[u]});}return n}function i(t,e){var n=v(t.insertInto);if(!n)throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");var o=w[w.length-1];if("top"===t.insertAt)o?o.nextSibling?n.insertBefore(e,o.nextSibling):n.appendChild(e):n.insertBefore(e,n.firstChild),w.push(e);else {if("bottom"!==t.insertAt)throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");n.appendChild(e);}}function a(t){if(null===t.parentNode)return !1;t.parentNode.removeChild(t);var e=w.indexOf(t);e>=0&&w.splice(e,1);}function s(t){var e=document.createElement("style");return t.attrs.type="text/css",l(e,t.attrs),i(t,e),e}function c(t){var e=document.createElement("link");return t.attrs.type="text/css",t.attrs.rel="stylesheet",l(e,t.attrs),i(t,e),e}function l(t,e){Object.keys(e).forEach(function(n){t.setAttribute(n,e[n]);});}function u(t,e){var n,o,r,i;if(e.transform&&t.css){if(!(i=e.transform(t.css)))return function(){};t.css=i;}if(e.singleton){var l=h++;n=g||(g=s(e)),o=f.bind(null,n,l,!1),r=f.bind(null,n,l,!0);}else t.sourceMap&&"function"==typeof URL&&"function"==typeof URL.createObjectURL&&"function"==typeof URL.revokeObjectURL&&"function"==typeof Blob&&"function"==typeof btoa?(n=c(e),o=p.bind(null,n,e),r=function(){a(n),n.href&&URL.revokeObjectURL(n.href);}):(n=s(e),o=d.bind(null,n),r=function(){a(n);});return o(t),function(e){if(e){if(e.css===t.css&&e.media===t.media&&e.sourceMap===t.sourceMap)return;o(t=e);}else r();}}function f(t,e,n,o){var r=n?"":o.css;if(t.styleSheet)t.styleSheet.cssText=x(e,r);else {var i=document.createTextNode(r),a=t.childNodes;a[e]&&t.removeChild(a[e]),a.length?t.insertBefore(i,a[e]):t.appendChild(i);}}function d(t,e){var n=e.css,o=e.media;if(o&&t.setAttribute("media",o),t.styleSheet)t.styleSheet.cssText=n;else {for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(n));}}function p(t,e,n){var o=n.css,r=n.sourceMap,i=void 0===e.convertToAbsoluteUrls&&r;(e.convertToAbsoluteUrls||i)&&(o=y(o)),r&&(o+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(r))))+" */");var a=new Blob([o],{type:"text/css"}),s=t.href;t.href=URL.createObjectURL(a),s&&URL.revokeObjectURL(s);}var m={},b=function(t){var e;return function(){return void 0===e&&(e=t.apply(this,arguments)),e}}(function(){return window&&document&&document.all&&!window.atob}),v=function(t){var e={};return function(n){return void 0===e[n]&&(e[n]=t.call(this,n)),e[n]}}(function(t){return document.querySelector(t)}),g=null,h=0,w=[],y=n(15);t.exports=function(t,e){if("undefined"!=typeof DEBUG&&DEBUG&&"object"!=typeof document)throw new Error("The style-loader cannot be used in a non-browser environment");e=e||{},e.attrs="object"==typeof e.attrs?e.attrs:{},e.singleton||(e.singleton=b()),e.insertInto||(e.insertInto="head"),e.insertAt||(e.insertAt="bottom");var n=r(t,e);return o(n,e),function(t){for(var i=[],a=0;a<n.length;a++){var s=n[a],c=m[s.id];c.refs--,i.push(c);}if(t){o(r(t,e),e);}for(var a=0;a<i.length;a++){var c=i[a];if(0===c.refs){for(var l=0;l<c.parts.length;l++)c.parts[l]();delete m[c.id];}}}};var x=function(){var t=[];return function(e,n){return t[e]=n,t.filter(Boolean).join("\n")}}();},function(t,e){t.exports=function(t){var e="undefined"!=typeof window&&window.location;if(!e)throw new Error("fixUrls requires window.location");if(!t||"string"!=typeof t)return t;var n=e.protocol+"//"+e.host,o=n+e.pathname.replace(/\/[^\/]*$/,"/");return t.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,function(t,e){var r=e.trim().replace(/^"(.*)"$/,function(t,e){return e}).replace(/^'(.*)'$/,function(t,e){return e});if(/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(r))return t;var i;return i=0===r.indexOf("//")?r:0===r.indexOf("/")?n+r:o+r.replace(/^\.\//,""),"url("+JSON.stringify(i)+")"})};},function(t,e,n){var o=n(17);"undefined"==typeof window||window.Promise||(window.Promise=o),n(21),String.prototype.includes||(String.prototype.includes=function(t,e){return "number"!=typeof e&&(e=0),!(e+t.length>this.length)&&-1!==this.indexOf(t,e)}),Array.prototype.includes||Object.defineProperty(Array.prototype,"includes",{value:function(t,e){if(null==this)throw new TypeError('"this" is null or not defined');var n=Object(this),o=n.length>>>0;if(0===o)return !1;for(var r=0|e,i=Math.max(r>=0?r:o-Math.abs(r),0);i<o;){if(function(t,e){return t===e||"number"==typeof t&&"number"==typeof e&&isNaN(t)&&isNaN(e)}(n[i],t))return !0;i++;}return !1}}),"undefined"!=typeof window&&function(t){t.forEach(function(t){t.hasOwnProperty("remove")||Object.defineProperty(t,"remove",{configurable:!0,enumerable:!0,writable:!0,value:function(){this.parentNode.removeChild(this);}});});}([Element.prototype,CharacterData.prototype,DocumentType.prototype]);},function(t,e,n){(function(e){!function(n){function o(){}function r(t,e){return function(){t.apply(e,arguments);}}function i(t){if("object"!=typeof this)throw new TypeError("Promises must be constructed via new");if("function"!=typeof t)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this._deferreds=[],f(t,this);}function a(t,e){for(;3===t._state;)t=t._value;if(0===t._state)return void t._deferreds.push(e);t._handled=!0,i._immediateFn(function(){var n=1===t._state?e.onFulfilled:e.onRejected;if(null===n)return void(1===t._state?s:c)(e.promise,t._value);var o;try{o=n(t._value);}catch(t){return void c(e.promise,t)}s(e.promise,o);});}function s(t,e){try{if(e===t)throw new TypeError("A promise cannot be resolved with itself.");if(e&&("object"==typeof e||"function"==typeof e)){var n=e.then;if(e instanceof i)return t._state=3,t._value=e,void l(t);if("function"==typeof n)return void f(r(n,e),t)}t._state=1,t._value=e,l(t);}catch(e){c(t,e);}}function c(t,e){t._state=2,t._value=e,l(t);}function l(t){2===t._state&&0===t._deferreds.length&&i._immediateFn(function(){t._handled||i._unhandledRejectionFn(t._value);});for(var e=0,n=t._deferreds.length;e<n;e++)a(t,t._deferreds[e]);t._deferreds=null;}function u(t,e,n){this.onFulfilled="function"==typeof t?t:null,this.onRejected="function"==typeof e?e:null,this.promise=n;}function f(t,e){var n=!1;try{t(function(t){n||(n=!0,s(e,t));},function(t){n||(n=!0,c(e,t));});}catch(t){if(n)return;n=!0,c(e,t);}}var d=setTimeout;i.prototype.catch=function(t){return this.then(null,t)},i.prototype.then=function(t,e){var n=new this.constructor(o);return a(this,new u(t,e,n)),n},i.all=function(t){var e=Array.prototype.slice.call(t);return new i(function(t,n){function o(i,a){try{if(a&&("object"==typeof a||"function"==typeof a)){var s=a.then;if("function"==typeof s)return void s.call(a,function(t){o(i,t);},n)}e[i]=a,0==--r&&t(e);}catch(t){n(t);}}if(0===e.length)return t([]);for(var r=e.length,i=0;i<e.length;i++)o(i,e[i]);})},i.resolve=function(t){return t&&"object"==typeof t&&t.constructor===i?t:new i(function(e){e(t);})},i.reject=function(t){return new i(function(e,n){n(t);})},i.race=function(t){return new i(function(e,n){for(var o=0,r=t.length;o<r;o++)t[o].then(e,n);})},i._immediateFn="function"==typeof e&&function(t){e(t);}||function(t){d(t,0);},i._unhandledRejectionFn=function(t){"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",t);},i._setImmediateFn=function(t){i._immediateFn=t;},i._setUnhandledRejectionFn=function(t){i._unhandledRejectionFn=t;},void 0!==t&&t.exports?t.exports=i:n.Promise||(n.Promise=i);}(this);}).call(e,n(18).setImmediate);},function(t,e,n){function o(t,e){this._id=t,this._clearFn=e;}var r=Function.prototype.apply;e.setTimeout=function(){return new o(r.call(setTimeout,window,arguments),clearTimeout)},e.setInterval=function(){return new o(r.call(setInterval,window,arguments),clearInterval)},e.clearTimeout=e.clearInterval=function(t){t&&t.close();},o.prototype.unref=o.prototype.ref=function(){},o.prototype.close=function(){this._clearFn.call(window,this._id);},e.enroll=function(t,e){clearTimeout(t._idleTimeoutId),t._idleTimeout=e;},e.unenroll=function(t){clearTimeout(t._idleTimeoutId),t._idleTimeout=-1;},e._unrefActive=e.active=function(t){clearTimeout(t._idleTimeoutId);var e=t._idleTimeout;e>=0&&(t._idleTimeoutId=setTimeout(function(){t._onTimeout&&t._onTimeout();},e));},n(19),e.setImmediate=setImmediate,e.clearImmediate=clearImmediate;},function(t,e,n){(function(t,e){!function(t,n){function o(t){"function"!=typeof t&&(t=new Function(""+t));for(var e=new Array(arguments.length-1),n=0;n<e.length;n++)e[n]=arguments[n+1];var o={callback:t,args:e};return l[c]=o,s(c),c++}function r(t){delete l[t];}function i(t){var e=t.callback,o=t.args;switch(o.length){case 0:e();break;case 1:e(o[0]);break;case 2:e(o[0],o[1]);break;case 3:e(o[0],o[1],o[2]);break;default:e.apply(n,o);}}function a(t){if(u)setTimeout(a,0,t);else {var e=l[t];if(e){u=!0;try{i(e);}finally{r(t),u=!1;}}}}if(!t.setImmediate){var s,c=1,l={},u=!1,f=t.document,d=Object.getPrototypeOf&&Object.getPrototypeOf(t);d=d&&d.setTimeout?d:t,"[object process]"==={}.toString.call(t.process)?function(){s=function(t){e.nextTick(function(){a(t);});};}():function(){if(t.postMessage&&!t.importScripts){var e=!0,n=t.onmessage;return t.onmessage=function(){e=!1;},t.postMessage("","*"),t.onmessage=n,e}}()?function(){var e="setImmediate$"+Math.random()+"$",n=function(n){n.source===t&&"string"==typeof n.data&&0===n.data.indexOf(e)&&a(+n.data.slice(e.length));};t.addEventListener?t.addEventListener("message",n,!1):t.attachEvent("onmessage",n),s=function(n){t.postMessage(e+n,"*");};}():t.MessageChannel?function(){var t=new MessageChannel;t.port1.onmessage=function(t){a(t.data);},s=function(e){t.port2.postMessage(e);};}():f&&"onreadystatechange"in f.createElement("script")?function(){var t=f.documentElement;s=function(e){var n=f.createElement("script");n.onreadystatechange=function(){a(e),n.onreadystatechange=null,t.removeChild(n),n=null;},t.appendChild(n);};}():function(){s=function(t){setTimeout(a,0,t);};}(),d.setImmediate=o,d.clearImmediate=r;}}("undefined"==typeof self?void 0===t?this:t:self);}).call(e,n(7),n(20));},function(t,e){function n(){throw new Error("setTimeout has not been defined")}function o(){throw new Error("clearTimeout has not been defined")}function r(t){if(u===setTimeout)return setTimeout(t,0);if((u===n||!u)&&setTimeout)return u=setTimeout,setTimeout(t,0);try{return u(t,0)}catch(e){try{return u.call(null,t,0)}catch(e){return u.call(this,t,0)}}}function i(t){if(f===clearTimeout)return clearTimeout(t);if((f===o||!f)&&clearTimeout)return f=clearTimeout,clearTimeout(t);try{return f(t)}catch(e){try{return f.call(null,t)}catch(e){return f.call(this,t)}}}function a(){b&&p&&(b=!1,p.length?m=p.concat(m):v=-1,m.length&&s());}function s(){if(!b){var t=r(a);b=!0;for(var e=m.length;e;){for(p=m,m=[];++v<e;)p&&p[v].run();v=-1,e=m.length;}p=null,b=!1,i(t);}}function c(t,e){this.fun=t,this.array=e;}function l(){}var u,f,d=t.exports={};!function(){try{u="function"==typeof setTimeout?setTimeout:n;}catch(t){u=n;}try{f="function"==typeof clearTimeout?clearTimeout:o;}catch(t){f=o;}}();var p,m=[],b=!1,v=-1;d.nextTick=function(t){var e=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)e[n-1]=arguments[n];m.push(new c(t,e)),1!==m.length||b||r(s);},c.prototype.run=function(){this.fun.apply(null,this.array);},d.title="browser",d.browser=!0,d.env={},d.argv=[],d.version="",d.versions={},d.on=l,d.addListener=l,d.once=l,d.off=l,d.removeListener=l,d.removeAllListeners=l,d.emit=l,d.prependListener=l,d.prependOnceListener=l,d.listeners=function(t){return []},d.binding=function(t){throw new Error("process.binding is not supported")},d.cwd=function(){return "/"},d.chdir=function(t){throw new Error("process.chdir is not supported")},d.umask=function(){return 0};},function(t,e,n){n(22).polyfill();},function(t,e,n){function o(t,e){if(void 0===t||null===t)throw new TypeError("Cannot convert first argument to object");for(var n=Object(t),o=1;o<arguments.length;o++){var r=arguments[o];if(void 0!==r&&null!==r)for(var i=Object.keys(Object(r)),a=0,s=i.length;a<s;a++){var c=i[a],l=Object.getOwnPropertyDescriptor(r,c);void 0!==l&&l.enumerable&&(n[c]=r[c]);}}return n}function r(){Object.assign||Object.defineProperty(Object,"assign",{enumerable:!1,configurable:!0,writable:!0,value:o});}t.exports={assign:o,polyfill:r};},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(24),r=n(6),i=n(5),a=n(36),s=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];if("undefined"!=typeof window){var n=a.getOpts.apply(void 0,t);return new Promise(function(t,e){i.default.promise={resolve:t,reject:e},o.default(n),setTimeout(function(){r.openModal();});})}};s.close=r.onAction,s.getState=r.getState,s.setActionValue=i.setActionValue,s.stopLoading=r.stopLoading,s.setDefaults=a.setDefaults,e.default=s;},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(1),r=n(0),i=r.default.MODAL,a=n(4),s=n(34),c=n(35),l=n(1);e.init=function(t){o.getNode(i)||(document.body||l.throwErr("You can only use SweetAlert AFTER the DOM has loaded!"),s.default(),a.default()),a.initModalContent(t),c.default(t);},e.default=e.init;},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(0),r=o.default.MODAL;e.modalMarkup='\n  <div class="'+r+'" role="dialog" aria-modal="true"></div>',e.default=e.modalMarkup;},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(0),r=o.default.OVERLAY,i='<div \n    class="'+r+'"\n    tabIndex="-1">\n  </div>';e.default=i;},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(0),r=o.default.ICON;e.errorIconMarkup=function(){var t=r+"--error",e=t+"__line";return '\n    <div class="'+t+'__x-mark">\n      <span class="'+e+" "+e+'--left"></span>\n      <span class="'+e+" "+e+'--right"></span>\n    </div>\n  '},e.warningIconMarkup=function(){var t=r+"--warning";return '\n    <span class="'+t+'__body">\n      <span class="'+t+'__dot"></span>\n    </span>\n  '},e.successIconMarkup=function(){var t=r+"--success";return '\n    <span class="'+t+"__line "+t+'__line--long"></span>\n    <span class="'+t+"__line "+t+'__line--tip"></span>\n\n    <div class="'+t+'__ring"></div>\n    <div class="'+t+'__hide-corners"></div>\n  '};},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(0),r=o.default.CONTENT;e.contentMarkup='\n  <div class="'+r+'">\n\n  </div>\n';},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(0),r=o.default.BUTTON_CONTAINER,i=o.default.BUTTON,a=o.default.BUTTON_LOADER;e.buttonMarkup='\n  <div class="'+r+'">\n\n    <button\n      class="'+i+'"\n    ></button>\n\n    <div class="'+a+'">\n      <div></div>\n      <div></div>\n      <div></div>\n    </div>\n\n  </div>\n';},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(4),r=n(2),i=n(0),a=i.default.ICON,s=i.default.ICON_CUSTOM,c=["error","warning","success","info"],l={error:r.errorIconMarkup(),warning:r.warningIconMarkup(),success:r.successIconMarkup()},u=function(t,e){var n=a+"--"+t;e.classList.add(n);var o=l[t];o&&(e.innerHTML=o);},f=function(t,e){e.classList.add(s);var n=document.createElement("img");n.src=t,e.appendChild(n);},d=function(t){if(t){var e=o.injectElIntoModal(r.iconMarkup);c.includes(t)?u(t,e):f(t,e);}};e.default=d;},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(2),r=n(4),i=function(t){navigator.userAgent.includes("AppleWebKit")&&(t.style.display="none",t.offsetHeight,t.style.display="");};e.initTitle=function(t){if(t){var e=r.injectElIntoModal(o.titleMarkup);e.textContent=t,i(e);}},e.initText=function(t){if(t){var e=document.createDocumentFragment();t.split("\n").forEach(function(t,n,o){e.appendChild(document.createTextNode(t)),n<o.length-1&&e.appendChild(document.createElement("br"));});var n=r.injectElIntoModal(o.textMarkup);n.appendChild(e),i(n);}};},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(1),r=n(4),i=n(0),a=i.default.BUTTON,s=i.default.DANGER_BUTTON,c=n(3),l=n(2),u=n(6),f=n(5),d=function(t,e,n){var r=e.text,i=e.value,d=e.className,p=e.closeModal,m=o.stringToNode(l.buttonMarkup),b=m.querySelector("."+a),v=a+"--"+t;if(b.classList.add(v),d){(Array.isArray(d)?d:d.split(" ")).filter(function(t){return t.length>0}).forEach(function(t){b.classList.add(t);});}n&&t===c.CONFIRM_KEY&&b.classList.add(s),b.textContent=r;var g={};return g[t]=i,f.setActionValue(g),f.setActionOptionsFor(t,{closeModal:p}),b.addEventListener("click",function(){return u.onAction(t)}),m},p=function(t,e){var n=r.injectElIntoModal(l.footerMarkup);for(var o in t){var i=t[o],a=d(o,i,e);i.visible&&n.appendChild(a);}0===n.children.length&&n.remove();};e.default=p;},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(3),r=n(4),i=n(2),a=n(5),s=n(6),c=n(0),l=c.default.CONTENT,u=function(t){t.addEventListener("input",function(t){var e=t.target,n=e.value;a.setActionValue(n);}),t.addEventListener("keyup",function(t){if("Enter"===t.key)return s.onAction(o.CONFIRM_KEY)}),setTimeout(function(){t.focus(),a.setActionValue("");},0);},f=function(t,e,n){var o=document.createElement(e),r=l+"__"+e;o.classList.add(r);for(var i in n){var a=n[i];o[i]=a;}"input"===e&&u(o),t.appendChild(o);},d=function(t){if(t){var e=r.injectElIntoModal(i.contentMarkup),n=t.element,o=t.attributes;"string"==typeof n?f(e,n,o):e.appendChild(n);}};e.default=d;},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(1),r=n(2),i=function(){var t=o.stringToNode(r.overlayMarkup);document.body.appendChild(t);};e.default=i;},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(5),r=n(6),i=n(1),a=n(3),s=n(0),c=s.default.MODAL,l=s.default.BUTTON,u=s.default.OVERLAY,f=function(t){t.preventDefault(),v();},d=function(t){t.preventDefault(),g();},p=function(t){if(o.default.isOpen)switch(t.key){case"Escape":return r.onAction(a.CANCEL_KEY)}},m=function(t){if(o.default.isOpen)switch(t.key){case"Tab":return f(t)}},b=function(t){if(o.default.isOpen)return "Tab"===t.key&&t.shiftKey?d(t):void 0},v=function(){var t=i.getNode(l);t&&(t.tabIndex=0,t.focus());},g=function(){var t=i.getNode(c),e=t.querySelectorAll("."+l),n=e.length-1,o=e[n];o&&o.focus();},h=function(t){t[t.length-1].addEventListener("keydown",m);},w=function(t){t[0].addEventListener("keydown",b);},y=function(){var t=i.getNode(c),e=t.querySelectorAll("."+l);e.length&&(h(e),w(e));},x=function(t){if(i.getNode(u)===t.target)return r.onAction(a.CANCEL_KEY)},_=function(t){var e=i.getNode(u);e.removeEventListener("click",x),t&&e.addEventListener("click",x);},k=function(t){o.default.timer&&clearTimeout(o.default.timer),t&&(o.default.timer=window.setTimeout(function(){return r.onAction(a.CANCEL_KEY)},t));},O=function(t){t.closeOnEsc?document.addEventListener("keyup",p):document.removeEventListener("keyup",p),t.dangerMode?v():g(),y(),_(t.closeOnClickOutside),k(t.timer);};e.default=O;},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(1),r=n(3),i=n(37),a=n(38),s={title:null,text:null,icon:null,buttons:r.defaultButtonList,content:null,className:null,closeOnClickOutside:!0,closeOnEsc:!0,dangerMode:!1,timer:null},c=Object.assign({},s);e.setDefaults=function(t){c=Object.assign({},s,t);};var l=function(t){var e=t&&t.button,n=t&&t.buttons;return void 0!==e&&void 0!==n&&o.throwErr("Cannot set both 'button' and 'buttons' options!"),void 0!==e?{confirm:e}:n},u=function(t){return o.ordinalSuffixOf(t+1)},f=function(t,e){o.throwErr(u(e)+" argument ('"+t+"') is invalid");},d=function(t,e){var n=t+1,r=e[n];o.isPlainObject(r)||void 0===r||o.throwErr("Expected "+u(n)+" argument ('"+r+"') to be a plain object");},p=function(t,e){var n=t+1,r=e[n];void 0!==r&&o.throwErr("Unexpected "+u(n)+" argument ("+r+")");},m=function(t,e,n,r){var i=typeof e,a="string"===i,s=e instanceof Element;if(a){if(0===n)return {text:e};if(1===n)return {text:e,title:r[0]};if(2===n)return d(n,r),{icon:e};f(e,n);}else {if(s&&0===n)return d(n,r),{content:e};if(o.isPlainObject(e))return p(n,r),e;f(e,n);}};e.getOpts=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];var n={};t.forEach(function(e,o){var r=m(0,e,o,t);Object.assign(n,r);});var o=l(n);n.buttons=r.getButtonListOpts(o),delete n.button,n.content=i.getContentOpts(n.content);var u=Object.assign({},s,c,n);return Object.keys(u).forEach(function(t){a.DEPRECATED_OPTS[t]&&a.logDeprecation(t);}),u};},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var o=n(1),r={element:"input",attributes:{placeholder:""}};e.getContentOpts=function(t){var e={};return o.isPlainObject(t)?Object.assign(e,t):t instanceof Element?{element:t}:"input"===t?r:null};},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0}),e.logDeprecation=function(t){var n=e.DEPRECATED_OPTS[t],o=n.onlyRename,r=n.replacement,i=n.subOption,a=n.link,s=o?"renamed":"deprecated",c='SweetAlert warning: "'+t+'" option has been '+s+".";if(r){c+=" Please use"+(i?' "'+i+'" in ':" ")+'"'+r+'" instead.';}var l="https://sweetalert.js.org";c+=a?" More details: "+l+a:" More details: "+l+"/guides/#upgrading-from-1x",console.warn(c);},e.DEPRECATED_OPTS={type:{replacement:"icon",link:"/docs/#icon"},imageUrl:{replacement:"icon",link:"/docs/#icon"},customClass:{replacement:"className",onlyRename:!0,link:"/docs/#classname"},imageSize:{},showCancelButton:{replacement:"buttons",link:"/docs/#buttons"},showConfirmButton:{replacement:"button",link:"/docs/#button"},confirmButtonText:{replacement:"button",link:"/docs/#button"},confirmButtonColor:{},cancelButtonText:{replacement:"buttons",link:"/docs/#buttons"},closeOnConfirm:{replacement:"button",subOption:"closeModal",link:"/docs/#button"},closeOnCancel:{replacement:"buttons",subOption:"closeModal",link:"/docs/#buttons"},showLoaderOnConfirm:{replacement:"buttons"},animation:{},inputType:{replacement:"content",link:"/docs/#content"},inputValue:{replacement:"content",link:"/docs/#content"},inputPlaceholder:{replacement:"content",link:"/docs/#content"},html:{replacement:"content",link:"/docs/#content"},allowEscapeKey:{replacement:"closeOnEsc",onlyRename:!0,link:"/docs/#closeonesc"},allowClickOutside:{replacement:"closeOnClickOutside",onlyRename:!0,link:"/docs/#closeonclickoutside"}};}])});
    });

    var swal$1 = /*@__PURE__*/getDefaultExportFromCjs(sweetalert_min);

    /* src\Editor.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;

    const file = "src\\Editor.svelte";

    // (149:0) {:else}
    function create_else_block(ctx) {
    	let fillntheblankspreview;
    	let current;
    	fillntheblankspreview = new FillnTheBlanksPreview({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(fillntheblankspreview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fillntheblankspreview, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fillntheblankspreview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fillntheblankspreview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fillntheblankspreview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(149:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (147:0) {#if toggleEditor}
    function create_if_block(ctx) {
    	let fillntheblank;
    	let current;
    	fillntheblank = new FillnTheBlanks({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(fillntheblank.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fillntheblank, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fillntheblank.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fillntheblank.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fillntheblank, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(147:0) {#if toggleEditor}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let nav;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let div1;
    	let button2;
    	let i;
    	let t4;
    	let div0;
    	let a;
    	let t6;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*toggleEditor*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			button0 = element("button");
    			button0.textContent = "Authoring";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Preview";
    			t3 = space();
    			div1 = element("div");
    			button2 = element("button");
    			i = element("i");
    			t4 = space();
    			div0 = element("div");
    			a = element("a");
    			a.textContent = "XML";
    			t6 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			attr_dev(button0, "tabindex", "0");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "svelte-13cflqk");
    			add_location(button0, file, 136, 4, 3454);
    			attr_dev(button1, "tabindex", "0");
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "svelte-13cflqk");
    			add_location(button1, file, 137, 4, 3538);
    			attr_dev(i, "class", "bx bxs-chevron-down-circle svelte-13cflqk");
    			add_location(i, file, 139, 96, 3737);
    			attr_dev(button2, "tabindex", "0");
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "dropBtn svelte-13cflqk");
    			attr_dev(button2, "id", "dropBtn");
    			add_location(button2, file, 139, 8, 3649);
    			attr_dev(a, "href", "#xml");
    			attr_dev(a, "tabindex", "-1");
    			attr_dev(a, "class", "svelte-13cflqk");
    			add_location(a, file, 141, 12, 3859);
    			attr_dev(div0, "id", "myDropdown");
    			attr_dev(div0, "class", "sb10 svelte-13cflqk");
    			attr_dev(div0, "tabindex", "0");
    			add_location(div0, file, 140, 8, 3798);
    			attr_dev(div1, "class", "dropdown");
    			add_location(div1, file, 138, 4, 3617);
    			attr_dev(nav, "id", "navbar");
    			attr_dev(nav, "class", "svelte-13cflqk");
    			add_location(nav, file, 135, 0, 3431);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, button0);
    			append_dev(nav, t1);
    			append_dev(nav, button1);
    			append_dev(nav, t3);
    			append_dev(nav, div1);
    			append_dev(div1, button2);
    			append_dev(button2, i);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, a);
    			insert_dev(target, t6, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*showAuthoring*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*showReview*/ ctx[2], false, false, false),
    					listen_dev(button2, "click", showDropdown, false, false, false),
    					listen_dev(a, "click", /*showXML*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t6);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function showDropdown() {
    	const dropdown = document.getElementById("myDropdown");
    	let myDisplay = dropdown.style.display;

    	if (myDisplay == "block") {
    		dropdown.style.display = "none";
    	} else {
    		dropdown.style.display = "block";
    	}
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Editor", slots, []);
    	let toggleEditor = true;

    	// let myData = getDefaultXMl("editor_item_1.xml");
    	// let obj = XMLToJSON(myData);
    	// let matching = obj.smxml.text.__cdata;
    	//functions
    	function showAuthoring() {
    		$$invalidate(0, toggleEditor = true);
    	}

    	function showReview() {
    		$$invalidate(0, toggleEditor = false);
    	}

    	//sweetalert
    	function showXML() {
    		let special_module_xml = document.getElementById("special_module_xml").value;

    		swal$1({
    			title: "XML",
    			text: special_module_xml,
    			tabindex: -1,
    			buttons: ["Cancel", "Done"]
    		}).then(val => {
    			console.log(val);
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		FillnTheBlank: FillnTheBlanks,
    		FillnTheBlanksPreview,
    		swal: swal$1,
    		XMLToJSON,
    		toggleEditor,
    		showAuthoring,
    		showReview,
    		showDropdown,
    		showXML
    	});

    	$$self.$inject_state = $$props => {
    		if ("toggleEditor" in $$props) $$invalidate(0, toggleEditor = $$props.toggleEditor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [toggleEditor, showAuthoring, showReview, showXML];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const editor = new Editor({
    	target: document.body,
    	props: {
    	}
    });

    return editor;

}());
//# sourceMappingURL=bundle.js.map
