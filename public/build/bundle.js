
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
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
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    // eslint-lint-disable-next-line @typescript-eslint/naming-convention
    class HTTPError extends Error {
        constructor(response, request, options) {
            const code = (response.status || response.status === 0) ? response.status : '';
            const title = response.statusText || '';
            const status = `${code} ${title}`.trim();
            const reason = status ? `status code ${status}` : 'an unknown error';
            super(`Request failed with ${reason}`);
            this.name = 'HTTPError';
            this.response = response;
            this.request = request;
            this.options = options;
        }
    }

    class TimeoutError extends Error {
        constructor(request) {
            super('Request timed out');
            this.name = 'TimeoutError';
            this.request = request;
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    const isObject = (value) => value !== null && typeof value === 'object';

    const validateAndMerge = (...sources) => {
        for (const source of sources) {
            if ((!isObject(source) || Array.isArray(source)) && typeof source !== 'undefined') {
                throw new TypeError('The `options` argument must be an object');
            }
        }
        return deepMerge({}, ...sources);
    };
    const mergeHeaders = (source1 = {}, source2 = {}) => {
        const result = new globalThis.Headers(source1);
        const isHeadersInstance = source2 instanceof globalThis.Headers;
        const source = new globalThis.Headers(source2);
        for (const [key, value] of source.entries()) {
            if ((isHeadersInstance && value === 'undefined') || value === undefined) {
                result.delete(key);
            }
            else {
                result.set(key, value);
            }
        }
        return result;
    };
    // TODO: Make this strongly-typed (no `any`).
    const deepMerge = (...sources) => {
        let returnValue = {};
        let headers = {};
        for (const source of sources) {
            if (Array.isArray(source)) {
                if (!Array.isArray(returnValue)) {
                    returnValue = [];
                }
                returnValue = [...returnValue, ...source];
            }
            else if (isObject(source)) {
                for (let [key, value] of Object.entries(source)) {
                    if (isObject(value) && key in returnValue) {
                        value = deepMerge(returnValue[key], value);
                    }
                    returnValue = { ...returnValue, [key]: value };
                }
                if (isObject(source.headers)) {
                    headers = mergeHeaders(headers, source.headers);
                    returnValue.headers = headers;
                }
            }
        }
        return returnValue;
    };

    const supportsAbortController = typeof globalThis.AbortController === 'function';
    const supportsStreams = typeof globalThis.ReadableStream === 'function';
    const supportsFormData = typeof globalThis.FormData === 'function';
    const requestMethods = ['get', 'post', 'put', 'patch', 'head', 'delete'];
    const responseTypes = {
        json: 'application/json',
        text: 'text/*',
        formData: 'multipart/form-data',
        arrayBuffer: '*/*',
        blob: '*/*',
    };
    // The maximum value of a 32bit int (see issue #117)
    const maxSafeTimeout = 2147483647;
    const stop = Symbol('stop');

    const normalizeRequestMethod = (input) => requestMethods.includes(input) ? input.toUpperCase() : input;
    const retryMethods = ['get', 'put', 'head', 'delete', 'options', 'trace'];
    const retryStatusCodes = [408, 413, 429, 500, 502, 503, 504];
    const retryAfterStatusCodes = [413, 429, 503];
    const defaultRetryOptions = {
        limit: 2,
        methods: retryMethods,
        statusCodes: retryStatusCodes,
        afterStatusCodes: retryAfterStatusCodes,
        maxRetryAfter: Number.POSITIVE_INFINITY,
    };
    const normalizeRetryOptions = (retry = {}) => {
        if (typeof retry === 'number') {
            return {
                ...defaultRetryOptions,
                limit: retry,
            };
        }
        if (retry.methods && !Array.isArray(retry.methods)) {
            throw new Error('retry.methods must be an array');
        }
        if (retry.statusCodes && !Array.isArray(retry.statusCodes)) {
            throw new Error('retry.statusCodes must be an array');
        }
        return {
            ...defaultRetryOptions,
            ...retry,
            afterStatusCodes: retryAfterStatusCodes,
        };
    };

    // `Promise.race()` workaround (#91)
    const timeout = async (request, abortController, options) => new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            if (abortController) {
                abortController.abort();
            }
            reject(new TimeoutError(request));
        }, options.timeout);
        void options
            .fetch(request)
            .then(resolve)
            .catch(reject)
            .then(() => {
            clearTimeout(timeoutId);
        });
    });
    const delay = async (ms) => new Promise(resolve => {
        setTimeout(resolve, ms);
    });

    class Ky {
        // eslint-disable-next-line complexity
        constructor(input, options = {}) {
            var _a, _b, _c;
            this._retryCount = 0;
            this._input = input;
            this._options = {
                // TODO: credentials can be removed when the spec change is implemented in all browsers. Context: https://www.chromestatus.com/feature/4539473312350208
                credentials: this._input.credentials || 'same-origin',
                ...options,
                headers: mergeHeaders(this._input.headers, options.headers),
                hooks: deepMerge({
                    beforeRequest: [],
                    beforeRetry: [],
                    beforeError: [],
                    afterResponse: [],
                }, options.hooks),
                method: normalizeRequestMethod((_a = options.method) !== null && _a !== void 0 ? _a : this._input.method),
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                prefixUrl: String(options.prefixUrl || ''),
                retry: normalizeRetryOptions(options.retry),
                throwHttpErrors: options.throwHttpErrors !== false,
                timeout: typeof options.timeout === 'undefined' ? 10000 : options.timeout,
                fetch: (_b = options.fetch) !== null && _b !== void 0 ? _b : globalThis.fetch.bind(globalThis),
            };
            if (typeof this._input !== 'string' && !(this._input instanceof URL || this._input instanceof globalThis.Request)) {
                throw new TypeError('`input` must be a string, URL, or Request');
            }
            if (this._options.prefixUrl && typeof this._input === 'string') {
                if (this._input.startsWith('/')) {
                    throw new Error('`input` must not begin with a slash when using `prefixUrl`');
                }
                if (!this._options.prefixUrl.endsWith('/')) {
                    this._options.prefixUrl += '/';
                }
                this._input = this._options.prefixUrl + this._input;
            }
            if (supportsAbortController) {
                this.abortController = new globalThis.AbortController();
                if (this._options.signal) {
                    this._options.signal.addEventListener('abort', () => {
                        this.abortController.abort();
                    });
                }
                this._options.signal = this.abortController.signal;
            }
            this.request = new globalThis.Request(this._input, this._options);
            if (this._options.searchParams) {
                // eslint-disable-next-line unicorn/prevent-abbreviations
                const textSearchParams = typeof this._options.searchParams === 'string'
                    ? this._options.searchParams.replace(/^\?/, '')
                    : new URLSearchParams(this._options.searchParams).toString();
                // eslint-disable-next-line unicorn/prevent-abbreviations
                const searchParams = '?' + textSearchParams;
                const url = this.request.url.replace(/(?:\?.*?)?(?=#|$)/, searchParams);
                // To provide correct form boundary, Content-Type header should be deleted each time when new Request instantiated from another one
                if (((supportsFormData && this._options.body instanceof globalThis.FormData)
                    || this._options.body instanceof URLSearchParams) && !(this._options.headers && this._options.headers['content-type'])) {
                    this.request.headers.delete('content-type');
                }
                this.request = new globalThis.Request(new globalThis.Request(url, this.request), this._options);
            }
            if (this._options.json !== undefined) {
                this._options.body = JSON.stringify(this._options.json);
                this.request.headers.set('content-type', (_c = this._options.headers.get('content-type')) !== null && _c !== void 0 ? _c : 'application/json');
                this.request = new globalThis.Request(this.request, { body: this._options.body });
            }
        }
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        static create(input, options) {
            const ky = new Ky(input, options);
            const fn = async () => {
                if (ky._options.timeout > maxSafeTimeout) {
                    throw new RangeError(`The \`timeout\` option cannot be greater than ${maxSafeTimeout}`);
                }
                // Delay the fetch so that body method shortcuts can set the Accept header
                await Promise.resolve();
                let response = await ky._fetch();
                for (const hook of ky._options.hooks.afterResponse) {
                    // eslint-disable-next-line no-await-in-loop
                    const modifiedResponse = await hook(ky.request, ky._options, ky._decorateResponse(response.clone()));
                    if (modifiedResponse instanceof globalThis.Response) {
                        response = modifiedResponse;
                    }
                }
                ky._decorateResponse(response);
                if (!response.ok && ky._options.throwHttpErrors) {
                    let error = new HTTPError(response, ky.request, ky._options);
                    for (const hook of ky._options.hooks.beforeError) {
                        // eslint-disable-next-line no-await-in-loop
                        error = await hook(error);
                    }
                    throw error;
                }
                // If `onDownloadProgress` is passed, it uses the stream API internally
                /* istanbul ignore next */
                if (ky._options.onDownloadProgress) {
                    if (typeof ky._options.onDownloadProgress !== 'function') {
                        throw new TypeError('The `onDownloadProgress` option must be a function');
                    }
                    if (!supportsStreams) {
                        throw new Error('Streams are not supported in your environment. `ReadableStream` is missing.');
                    }
                    return ky._stream(response.clone(), ky._options.onDownloadProgress);
                }
                return response;
            };
            const isRetriableMethod = ky._options.retry.methods.includes(ky.request.method.toLowerCase());
            const result = (isRetriableMethod ? ky._retry(fn) : fn());
            for (const [type, mimeType] of Object.entries(responseTypes)) {
                result[type] = async () => {
                    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                    ky.request.headers.set('accept', ky.request.headers.get('accept') || mimeType);
                    const awaitedResult = await result;
                    const response = awaitedResult.clone();
                    if (type === 'json') {
                        if (response.status === 204) {
                            return '';
                        }
                        if (options.parseJson) {
                            return options.parseJson(await response.text());
                        }
                    }
                    return response[type]();
                };
            }
            return result;
        }
        _calculateRetryDelay(error) {
            this._retryCount++;
            if (this._retryCount < this._options.retry.limit && !(error instanceof TimeoutError)) {
                if (error instanceof HTTPError) {
                    if (!this._options.retry.statusCodes.includes(error.response.status)) {
                        return 0;
                    }
                    const retryAfter = error.response.headers.get('Retry-After');
                    if (retryAfter && this._options.retry.afterStatusCodes.includes(error.response.status)) {
                        let after = Number(retryAfter);
                        if (Number.isNaN(after)) {
                            after = Date.parse(retryAfter) - Date.now();
                        }
                        else {
                            after *= 1000;
                        }
                        if (typeof this._options.retry.maxRetryAfter !== 'undefined' && after > this._options.retry.maxRetryAfter) {
                            return 0;
                        }
                        return after;
                    }
                    if (error.response.status === 413) {
                        return 0;
                    }
                }
                const BACKOFF_FACTOR = 0.3;
                return BACKOFF_FACTOR * (2 ** (this._retryCount - 1)) * 1000;
            }
            return 0;
        }
        _decorateResponse(response) {
            if (this._options.parseJson) {
                response.json = async () => this._options.parseJson(await response.text());
            }
            return response;
        }
        async _retry(fn) {
            try {
                return await fn();
                // eslint-disable-next-line @typescript-eslint/no-implicit-any-catch
            }
            catch (error) {
                const ms = Math.min(this._calculateRetryDelay(error), maxSafeTimeout);
                if (ms !== 0 && this._retryCount > 0) {
                    await delay(ms);
                    for (const hook of this._options.hooks.beforeRetry) {
                        // eslint-disable-next-line no-await-in-loop
                        const hookResult = await hook({
                            request: this.request,
                            options: this._options,
                            error: error,
                            retryCount: this._retryCount,
                        });
                        // If `stop` is returned from the hook, the retry process is stopped
                        if (hookResult === stop) {
                            return;
                        }
                    }
                    return this._retry(fn);
                }
                throw error;
            }
        }
        async _fetch() {
            for (const hook of this._options.hooks.beforeRequest) {
                // eslint-disable-next-line no-await-in-loop
                const result = await hook(this.request, this._options);
                if (result instanceof Request) {
                    this.request = result;
                    break;
                }
                if (result instanceof Response) {
                    return result;
                }
            }
            if (this._options.timeout === false) {
                return this._options.fetch(this.request.clone());
            }
            return timeout(this.request.clone(), this.abortController, this._options);
        }
        /* istanbul ignore next */
        _stream(response, onDownloadProgress) {
            const totalBytes = Number(response.headers.get('content-length')) || 0;
            let transferredBytes = 0;
            return new globalThis.Response(new globalThis.ReadableStream({
                async start(controller) {
                    const reader = response.body.getReader();
                    if (onDownloadProgress) {
                        onDownloadProgress({ percent: 0, transferredBytes: 0, totalBytes }, new Uint8Array());
                    }
                    async function read() {
                        const { done, value } = await reader.read();
                        if (done) {
                            controller.close();
                            return;
                        }
                        if (onDownloadProgress) {
                            transferredBytes += value.byteLength;
                            const percent = totalBytes === 0 ? 0 : transferredBytes / totalBytes;
                            onDownloadProgress({ percent, transferredBytes, totalBytes }, value);
                        }
                        controller.enqueue(value);
                        await read();
                    }
                    await read();
                },
            }));
        }
    }

    /*! MIT License © Sindre Sorhus */
    const createInstance = (defaults) => {
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        const ky = (input, options) => Ky.create(input, validateAndMerge(defaults, options));
        for (const method of requestMethods) {
            // eslint-disable-next-line @typescript-eslint/promise-function-async
            ky[method] = (input, options) => Ky.create(input, validateAndMerge(defaults, options, { method }));
        }
        ky.create = (newDefaults) => createInstance(validateAndMerge(newDefaults));
        ky.extend = (newDefaults) => createInstance(validateAndMerge(defaults, newDefaults));
        ky.stop = stop;
        return ky;
    };
    const ky = createInstance();
    var ky$1 = ky;

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const defaultConfig = {
        API_URL: 'https:/',
        API_KEY: '',
        STEP: 1
    };
    const CONFIG = writable(JSON.parse(localStorage.getItem('appconfig')) || defaultConfig);
    CONFIG.subscribe((val) => {
        localStorage.setItem('appconfig', JSON.stringify(val));
    });

    /* src/Bolus.svelte generated by Svelte v3.47.0 */

    const { console: console_1$1 } = globals;
    const file$4 = "src/Bolus.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (34:4) {#if step === 0.5}
    function create_if_block_1$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "-½";
    			attr_dev(button, "class", "svelte-h2hzgm");
    			add_location(button, file$4, 34, 6, 737);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(34:4) {#if step === 0.5}",
    		ctx
    	});

    	return block;
    }

    // (42:4) {#if step === 0.5}
    function create_if_block$3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "+½";
    			attr_dev(button, "class", "svelte-h2hzgm");
    			add_location(button, file$4, 42, 6, 914);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(42:4) {#if step === 0.5}",
    		ctx
    	});

    	return block;
    }

    // (56:4) {#each [0.5, 1, 1.5, 2, 3] as value}
    function create_each_block_1(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[10](/*value*/ ctx[18]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*value*/ ctx[18]);
    			attr_dev(button, "class", "svelte-h2hzgm");
    			add_location(button, file$4, 56, 6, 1167);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_4, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(56:4) {#each [0.5, 1, 1.5, 2, 3] as value}",
    		ctx
    	});

    	return block;
    }

    // (70:6) {#each eventTypes as eventOption}
    function create_each_block$2(ctx) {
    	let option;
    	let t_value = /*eventOption*/ ctx[15] + "";
    	let t;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*eventOption*/ ctx[15] === /*eventType*/ ctx[1];
    			option.__value = /*eventOption*/ ctx[15];
    			option.value = option.__value;
    			add_location(option, file$4, 70, 8, 1432);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*eventType*/ 2 && option_selected_value !== (option_selected_value = /*eventOption*/ ctx[15] === /*eventType*/ ctx[1])) {
    				prop_dev(option, "selected", option_selected_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(70:6) {#each eventTypes as eventOption}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let div0;
    	let button0;
    	let t1;
    	let t2;
    	let input0;
    	let t3;
    	let t4;
    	let button1;
    	let t6;
    	let div1;
    	let t7;
    	let div2;
    	let select;
    	let t8;
    	let input1;
    	let mounted;
    	let dispose;
    	let if_block0 = /*step*/ ctx[3] === 0.5 && create_if_block_1$1(ctx);
    	let if_block1 = /*step*/ ctx[3] === 0.5 && create_if_block$3(ctx);
    	let each_value_1 = [0.5, 1, 1.5, 2, 3];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < 5; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*eventTypes*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "-1";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			input0 = element("input");
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "+1";
    			t6 = space();
    			div1 = element("div");

    			for (let i = 0; i < 5; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t7 = space();
    			div2 = element("div");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			input1 = element("input");
    			attr_dev(button0, "class", "svelte-h2hzgm");
    			add_location(button0, file$4, 27, 4, 625);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "step", /*step*/ ctx[3]);
    			attr_dev(input0, "class", "svelte-h2hzgm");
    			add_location(input0, file$4, 40, 4, 837);
    			attr_dev(button1, "class", "svelte-h2hzgm");
    			add_location(button1, file$4, 48, 4, 1014);
    			attr_dev(div0, "id", "input");
    			attr_dev(div0, "class", "svelte-h2hzgm");
    			add_location(div0, file$4, 26, 2, 604);
    			attr_dev(div1, "id", "singles");
    			attr_dev(div1, "class", "svelte-h2hzgm");
    			add_location(div1, file$4, 54, 2, 1101);
    			add_location(select, file$4, 64, 4, 1292);
    			attr_dev(div2, "class", "svelte-h2hzgm");
    			add_location(div2, file$4, 63, 2, 1282);
    			attr_dev(input1, "type", "submit");
    			input1.value = "Submit";
    			add_location(input1, file$4, 76, 2, 1579);
    			attr_dev(main, "class", "svelte-h2hzgm");
    			add_location(main, file$4, 25, 0, 595);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t2);
    			append_dev(div0, input0);
    			set_input_value(input0, /*IUs*/ ctx[0]);
    			append_dev(div0, t3);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div0, t4);
    			append_dev(div0, button1);
    			append_dev(main, t6);
    			append_dev(main, div1);

    			for (let i = 0; i < 5; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(main, t7);
    			append_dev(main, div2);
    			append_dev(div2, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			append_dev(main, t8);
    			append_dev(main, input1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen_dev(button1, "click", /*click_handler_3*/ ctx[9], false, false, false),
    					listen_dev(select, "change", /*change_handler*/ ctx[11], false, false, false),
    					listen_dev(input1, "click", /*sendRequest*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*step*/ ctx[3] === 0.5) if_block0.p(ctx, dirty);

    			if (dirty & /*IUs*/ 1 && to_number(input0.value) !== /*IUs*/ ctx[0]) {
    				set_input_value(input0, /*IUs*/ ctx[0]);
    			}

    			if (/*step*/ ctx[3] === 0.5) if_block1.p(ctx, dirty);

    			if (dirty & /*IUs*/ 1) {
    				each_value_1 = [0.5, 1, 1.5, 2, 3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < 5; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, null);
    					}
    				}

    				for (; i < 5; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    			}

    			if (dirty & /*eventTypes, eventType*/ 6) {
    				each_value = /*eventTypes*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $CONFIG;
    	validate_store(CONFIG, 'CONFIG');
    	component_subscribe($$self, CONFIG, $$value => $$invalidate(12, $CONFIG = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Bolus', slots, []);
    	const { API_URL } = $CONFIG;
    	const eventTypes = ["Meal bolus", "Correction bolus", "Other"];
    	let IUs = 1;
    	let insulin = "Novorapid";
    	let step = 0.5;
    	let eventType = eventTypes[0];

    	async function sendRequest() {
    		const jsonBody = {
    			insulin: IUs,
    			units: "IU",
    			eventType,
    			entered_by: "boluser"
    		};

    		const response = await ky$1.post("api/v1/treatments.json", { json: jsonBody, prefixUrl: API_URL }).json();
    		console.log(response);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Bolus> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, IUs -= 1);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, IUs -= 0.5);
    	};

    	function input0_input_handler() {
    		IUs = to_number(this.value);
    		$$invalidate(0, IUs);
    	}

    	const click_handler_2 = () => {
    		$$invalidate(0, IUs += 0.5);
    	};

    	const click_handler_3 = () => {
    		$$invalidate(0, IUs += 1);
    	};

    	const click_handler_4 = value => {
    		$$invalidate(0, IUs = value);
    	};

    	const change_handler = e => {
    		$$invalidate(1, eventType = e.currentTarget.value);
    	};

    	$$self.$capture_state = () => ({
    		ky: ky$1,
    		CONFIG,
    		API_URL,
    		eventTypes,
    		IUs,
    		insulin,
    		step,
    		eventType,
    		sendRequest,
    		$CONFIG
    	});

    	$$self.$inject_state = $$props => {
    		if ('IUs' in $$props) $$invalidate(0, IUs = $$props.IUs);
    		if ('insulin' in $$props) insulin = $$props.insulin;
    		if ('step' in $$props) $$invalidate(3, step = $$props.step);
    		if ('eventType' in $$props) $$invalidate(1, eventType = $$props.eventType);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		IUs,
    		eventType,
    		eventTypes,
    		step,
    		sendRequest,
    		click_handler,
    		click_handler_1,
    		input0_input_handler,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		change_handler
    	];
    }

    class Bolus extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bolus",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Config.svelte generated by Svelte v3.47.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$3 = "src/Config.svelte";

    // (44:2) {#if verifySuccess !== undefined && !verifySuccess}
    function create_if_block$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = ":(";
    			add_location(p, file$3, 44, 4, 1242);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(44:2) {#if verifySuccess !== undefined && !verifySuccess}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let input0;
    	let t0;
    	let input1;
    	let t1;
    	let button;
    	let t3;
    	let mounted;
    	let dispose;
    	let if_block = /*verifySuccess*/ ctx[2] !== undefined && !/*verifySuccess*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = "Verify";
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(input0, "placeholder", "API URL");
    			add_location(input0, file$3, 28, 2, 837);
    			attr_dev(input1, "placeholder", "API secret");
    			add_location(input1, file$3, 35, 2, 986);
    			add_location(button, file$3, 42, 2, 1138);
    			add_location(main, file$3, 27, 0, 828);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, input0);
    			set_input_value(input0, /*API_URL*/ ctx[0]);
    			append_dev(main, t0);
    			append_dev(main, input1);
    			set_input_value(input1, /*API_KEY*/ ctx[1]);
    			append_dev(main, t1);
    			append_dev(main, button);
    			append_dev(main, t3);
    			if (if_block) if_block.m(main, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input0, "change", /*change_handler*/ ctx[6], false, false, false),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[7], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    					listen_dev(button, "click", /*getAuthKey*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*API_URL*/ 1 && input0.value !== /*API_URL*/ ctx[0]) {
    				set_input_value(input0, /*API_URL*/ ctx[0]);
    			}

    			if (dirty & /*API_KEY*/ 2 && input1.value !== /*API_KEY*/ ctx[1]) {
    				set_input_value(input1, /*API_KEY*/ ctx[1]);
    			}

    			if (/*verifySuccess*/ ctx[2] !== undefined && !/*verifySuccess*/ ctx[2]) {
    				if (if_block) ; else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $CONFIG;
    	validate_store(CONFIG, 'CONFIG');
    	component_subscribe($$self, CONFIG, $$value => $$invalidate(10, $CONFIG = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Config', slots, []);
    	let { API_URL, API_KEY } = $CONFIG;
    	let verifySuccess = undefined;

    	async function getAuthKey() {
    		var _a;
    		const req = new Request([API_URL, "/api/v1/verifyAuth"].join(""), { method: "GET" });
    		const response = await fetch(req);
    		console.log(response);

    		if (response.ok) {
    			const json = await response.json();

    			if (!((_a = json === null || json === void 0 ? void 0 : json.message) === null || _a === void 0
    			? void 0
    			: _a.canWrite)) {
    				$$invalidate(2, verifySuccess = false);
    			}

    			console.log(json);
    		}
    	}

    	let timeout = 0;

    	function updateValue(key, value) {
    		clearTimeout(timeout);

    		timeout = setTimeout(
    			() => {
    				CONFIG.set(Object.assign(Object.assign({}, $CONFIG), { [key]: value }));
    			},
    			600
    		);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Config> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		API_URL = this.value;
    		$$invalidate(0, API_URL);
    	}

    	const change_handler = e => {
    		updateValue("API_URL", e.currentTarget.value);
    	};

    	const change_handler_1 = e => {
    		updateValue("API_KEY", e.currentTarget.value);
    	};

    	function input1_input_handler() {
    		API_KEY = this.value;
    		$$invalidate(1, API_KEY);
    	}

    	$$self.$capture_state = () => ({
    		CONFIG,
    		API_URL,
    		API_KEY,
    		verifySuccess,
    		getAuthKey,
    		timeout,
    		updateValue,
    		$CONFIG
    	});

    	$$self.$inject_state = $$props => {
    		if ('API_URL' in $$props) $$invalidate(0, API_URL = $$props.API_URL);
    		if ('API_KEY' in $$props) $$invalidate(1, API_KEY = $$props.API_KEY);
    		if ('verifySuccess' in $$props) $$invalidate(2, verifySuccess = $$props.verifySuccess);
    		if ('timeout' in $$props) timeout = $$props.timeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		API_URL,
    		API_KEY,
    		verifySuccess,
    		getAuthKey,
    		updateValue,
    		input0_input_handler,
    		change_handler,
    		change_handler_1,
    		input1_input_handler
    	];
    }

    class Config extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Config",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const durationUnitRegex = /[a-zA-Z]/;
    const range = (size, startAt = 0) => [...Array(size).keys()].map(i => i + startAt);
    // export const characterRange = (startChar, endChar) =>
    //   String.fromCharCode(
    //     ...range(
    //       endChar.charCodeAt(0) - startChar.charCodeAt(0),
    //       startChar.charCodeAt(0)
    //     )
    //   );
    // export const zip = (arr, ...arrs) =>
    //   arr.map((val, i) => arrs.reduce((list, curr) => [...list, curr[i]], [val]));

    /* node_modules/svelte-loading-spinners/dist/Jumper.svelte generated by Svelte v3.47.0 */
    const file$2 = "node_modules/svelte-loading-spinners/dist/Jumper.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (44:2) {#each range(3, 1) as version}
    function create_each_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-1cy66mt");
    			set_style(div, "animation-delay", /*durationNum*/ ctx[5] / 3 * (/*version*/ ctx[6] - 1) + /*durationUnit*/ ctx[4]);
    			add_location(div, file$2, 44, 4, 991);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(44:2) {#each range(3, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let each_value = range(3, 1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-1cy66mt");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			add_location(div, file$2, 40, 0, 852);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*durationNum, range, durationUnit*/ 48) {
    				each_value = range(3, 1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div, "--duration", /*duration*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Jumper', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1s" } = $$props;
    	let { size = "60" } = $$props;
    	let durationUnit = duration.match(durationUnitRegex)[0];
    	let durationNum = duration.replace(durationUnitRegex, "");
    	const writable_props = ['color', 'unit', 'duration', 'size'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Jumper> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		durationUnitRegex,
    		color,
    		unit,
    		duration,
    		size,
    		durationUnit,
    		durationNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('durationUnit' in $$props) $$invalidate(4, durationUnit = $$props.durationUnit);
    		if ('durationNum' in $$props) $$invalidate(5, durationNum = $$props.durationNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, durationUnit, durationNum];
    }

    class Jumper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { color: 0, unit: 1, duration: 2, size: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jumper",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get color() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/History.svelte generated by Svelte v3.47.0 */
    const file$1 = "src/History.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (31:2) {#if !data && isLoading}
    function create_if_block_1(ctx) {
    	let jumper;
    	let current;
    	jumper = new Jumper({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(jumper.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(jumper, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(jumper.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(jumper.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(jumper, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(31:2) {#if !data && isLoading}",
    		ctx
    	});

    	return block;
    }

    // (34:2) {#if data}
    function create_if_block$1(ctx) {
    	let div;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let tbody;
    	let t6;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value = /*data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Date";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Type";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Dose";
    			t5 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			button = element("button");
    			button.textContent = "🔄";
    			attr_dev(th0, "class", "svelte-4yc8md");
    			add_location(th0, file$1, 38, 10, 929);
    			attr_dev(th1, "class", "svelte-4yc8md");
    			add_location(th1, file$1, 39, 10, 955);
    			attr_dev(th2, "class", "svelte-4yc8md");
    			add_location(th2, file$1, 40, 10, 981);
    			add_location(tr, file$1, 37, 8, 914);
    			add_location(thead, file$1, 36, 6, 898);
    			add_location(tbody, file$1, 43, 6, 1032);
    			attr_dev(table, "class", "svelte-4yc8md");
    			toggle_class(table, "loading", /*isLoading*/ ctx[1]);
    			add_location(table, file$1, 35, 4, 856);
    			attr_dev(button, "alt", "Reload data");
    			add_location(button, file$1, 53, 6, 1310);
    			set_style(div, "display", "inline-flex");
    			add_location(div, file$1, 34, 2, 817);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(table, t5);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			append_dev(div, t6);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*getTreatments*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, Date*/ 1) {
    				each_value = /*data*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*isLoading*/ 2) {
    				toggle_class(table, "loading", /*isLoading*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(34:2) {#if data}",
    		ctx
    	});

    	return block;
    }

    // (45:8) {#each data as treatment}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = new Date(/*treatment*/ ctx[5].created_at).toLocaleString() + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*treatment*/ ctx[5].eventType + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*treatment*/ ctx[5].insulin + "";
    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			add_location(td0, file$1, 46, 12, 1101);
    			add_location(td1, file$1, 47, 12, 1172);
    			add_location(td2, file$1, 48, 12, 1215);
    			add_location(tr, file$1, 45, 10, 1084);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = new Date(/*treatment*/ ctx[5].created_at).toLocaleString() + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*treatment*/ ctx[5].eventType + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*data*/ 1 && t4_value !== (t4_value = /*treatment*/ ctx[5].insulin + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(45:8) {#each data as treatment}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = !/*data*/ ctx[0] && /*isLoading*/ ctx[1] && create_if_block_1(ctx);
    	let if_block1 = /*data*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			add_location(main, file$1, 29, 0, 738);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*data*/ ctx[0] && /*isLoading*/ ctx[1]) {
    				if (if_block0) {
    					if (dirty & /*data, isLoading*/ 3) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*data*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
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
    	let $CONFIG;
    	validate_store(CONFIG, 'CONFIG');
    	component_subscribe($$self, CONFIG, $$value => $$invalidate(3, $CONFIG = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('History', slots, []);
    	const { API_URL } = $CONFIG;

    	onMount(() => {
    		getTreatments().then(() => {
    			const interval = setInterval(getTreatments, 5000);
    			return () => clearInterval(interval);
    		});
    	});

    	async function getTreatments() {
    		$$invalidate(1, isLoading = true);
    		const searchParams = new URLSearchParams({ count: '3', 'find[insulin][$gte]': '0' });
    		$$invalidate(0, data = await ky$1.get("api/v1/treatments", { prefixUrl: API_URL, searchParams }).json());

    		setTimeout(
    			() => {
    				$$invalidate(1, isLoading = false);
    			},
    			1000
    		);
    	}

    	let data;
    	let isLoading = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<History> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Jumper,
    		ky: ky$1,
    		CONFIG,
    		API_URL,
    		getTreatments,
    		data,
    		isLoading,
    		$CONFIG
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('isLoading' in $$props) $$invalidate(1, isLoading = $$props.isLoading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, isLoading, getTreatments];
    }

    class History extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "History",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.47.0 */
    const file = "src/App.svelte";

    // (8:2) {#if isConfiguring}
    function create_if_block(ctx) {
    	let config;
    	let current;
    	config = new Config({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(config.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(config, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(config.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(config.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(config, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(8:2) {#if isConfiguring}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let t0;
    	let button;
    	let t2;
    	let history;
    	let t3;
    	let bolus;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*isConfiguring*/ ctx[0] && create_if_block(ctx);
    	history = new History({ $$inline: true });
    	bolus = new Bolus({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			t0 = space();
    			button = element("button");
    			button.textContent = "Config";
    			t2 = space();
    			create_component(history.$$.fragment);
    			t3 = space();
    			create_component(bolus.$$.fragment);
    			attr_dev(button, "id", "configButton");
    			add_location(button, file, 10, 2, 231);
    			attr_dev(main, "class", "svelte-1poqqzx");
    			add_location(main, file, 6, 0, 177);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t0);
    			append_dev(main, button);
    			append_dev(main, t2);
    			mount_component(history, main, null);
    			append_dev(main, t3);
    			mount_component(bolus, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isConfiguring*/ ctx[0]) {
    				if (if_block) {
    					if (dirty & /*isConfiguring*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(history.$$.fragment, local);
    			transition_in(bolus.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(history.$$.fragment, local);
    			transition_out(bolus.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			destroy_component(history);
    			destroy_component(bolus);
    			mounted = false;
    			dispose();
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { isConfiguring = false } = $$props;
    	const writable_props = ['isConfiguring'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, isConfiguring = !isConfiguring);
    	};

    	$$self.$$set = $$props => {
    		if ('isConfiguring' in $$props) $$invalidate(0, isConfiguring = $$props.isConfiguring);
    	};

    	$$self.$capture_state = () => ({ Bolus, Config, History, isConfiguring });

    	$$self.$inject_state = $$props => {
    		if ('isConfiguring' in $$props) $$invalidate(0, isConfiguring = $$props.isConfiguring);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isConfiguring, click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { isConfiguring: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get isConfiguring() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isConfiguring(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

})();
