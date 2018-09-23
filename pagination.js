(function(root, factory) {
	var namespace = "JPagination";
	if (typeof module === 'object' && module && typeof module.exports === 'object') {
		module.exports = factory(false);
	} else if (typeof define === 'function' && define.amd ) {
		define( namespace, [], factory(false) );
	}

	root[namespace] = factory(root instanceof Window);
}(this, function(nGlobal) {

	// pagination plugin default option
	var _default = {};

	_default.settings = {

		// 装载分页容器
		containerId: 'pagination',

        warp: 'div.btn-group',

		// 分页标签名称
		tagName: 'button',

		// 分页默认样式，多个用","或空格分开
		btnDefaultClasses: 'btn btn-light border',

		// 分页激活样式
		btnActiveClasses: 'btn btn-success active',

		// 默认每页显示条数
		limit: 10,

		// 默认总条数
		total: 0,

        // 分页禁用样式
        disabledClasses: 'disabled',

	};

    _default.settings.major = {

        firstButtonOption: {
            text: '首页'
        },

        prveButtonOption: {
            text: '上一页'
        },

        nextButtonOption: {
            text: '下一页'
        },

        lastButtonOption: {
            text: '末页'
        }

    };

    _default.settings.redirect = {

        // 是否开启跳转功能
        show: false,

        warp: 'div.col-sm-1',

        // 跳转按钮样式
        classes: 'btn btn-success',

        // 跳转文本输入框样式
        inputClasses: 'form-control',

        // 是否使用回车键触发
        enterTrigger: false

    };

    _default.methods = {

        // 当单个按钮被创建完成后，会触发该事件的回调函数
        createButtonAfterCallback: undefined,

        // 当分页被切换时，会触发该事件的回调函数
        ajaxSend: undefined

    };
	
	
	var o = {},
	
		hasOwn = o.hasOwnProperty,
		
		arr = [],
		
		slice = arr.slice,

		concat = arr.concat,

        /**
         * classes 添加样式
         * @param $el DOM元素
         * @param clazz {String | Array} 样式列表
         * @returns {*|void} 无返回值
         */
        classes = function($el, clazz) {
            if ( typeof (clazz) === 'string' && jQuery.trim(clazz).length ) {
                clazz = clazz.split(/,|\s+/);
                return classes($el, clazz);
            }

            if ( Array.isArray(clazz) ) {
                if ($el.classList) {
                    for (var i = 0, len = clazz.length; i < len; i++) {
                        $el.classList.add(clazz[i]);
                    }
                } else {
                    if ($el.getAttribute('class')) {
                        clazz = concat($el.getAttribute('class').split(/,|\s+/), clazz);
                    }

                    $el.setAttribute('class', clazz.join(' '));
                }
            }
        };


    function PaginationEvent() {
        this.namespace = '__uniqueId__$${injectId}__';
        this._events = {}
    }

    /**
     * inject 注入事件到"_events"对象
     * @param injectId 注入ID
     * @param eventName 事件名称
     * @param handle 事件句柄
     */
    PaginationEvent.prototype.inject = function(injectId, eventName, handle) {
        this.namespace = this.namespace.replace(/\${.*?}/, injectId);
        if (!hasOwn.call(this._events, this.namespace)) {
            this._events[this.namespace] = {}
        }

        if ( typeof (handle) === 'function' ) {
            this._events[this.namespace][eventName] = handle;
        }
    };

    /**
     * execute 执行事件
     * @param injectId 注入ID
     * @param eventName 事件名称
     */
    PaginationEvent.prototype.execute = function(injectId, eventName) {
        this.namespace = this.namespace.replace(/\${.*?}/, injectId);
        if (hasOwn.call(this._events, this.namespace)) {
            var handle = this._events[this.namespace][eventName];
            if ( handle && typeof (handle) === 'function' ) {
                // 调用函数句柄时，传入{}目的是为了防止造成全局变量的污染
                handle.apply({}, slice.call(arguments, 2)[0]);
            }
        }
    };

    /**
     * destory 销毁事件
     * @param injectId
     */
    PaginationEvent.prototype.destory = function(injectId) {
        var namespcae = '__uniqueId__$'+injectId+'__';
        if(hasOwn.call(this._events, namespcae)) {
            delete this._events[namespcae];
        }
    };

    function PaginationControl() {

        // 分页控件配置项
        this.settings = undefined;

        // 分页插件上下文环境
        this.context = undefined;

    }

    /**
     * setSettings 设置配置项
     * @param settings {Object} 配置项
     */
    PaginationControl.prototype.setSettings = function(settings) {
        this.settings = settings;
    };

    /**
     * setContext 设置分页插件上下文环境
     * @param context {Pagination}
     */
    PaginationControl.prototype.setContext = function(context) {
        this.context = context;
    };

    /**
     * create 创建分页控件
     * @returns {DocumentFragment}
     */
    PaginationControl.prototype.create = function() {
        var fargs = document.createDocumentFragment();
        var warp = this.settings.warp, warp$el;
        if (jQuery.trim(warp).length) {
            warp = warp.split('.');
            warp$el = document.createElement(warp[0]);
            classes(warp$el, warp.slice(1));
        }

        if (!warp$el) warp$el = fargs;
        warp$el.appendChild(this.createFristButton());
        warp$el.appendChild(this.createPrveButton());
        warp$el.appendChild(this.createPaginationButton());
        warp$el.appendChild(this.createNextButton());
        warp$el.appendChild(this.createLastButton());
        if (warp$el != fargs) fargs.appendChild(warp$el);
        return fargs;
    };

    /**
     * createPaginationButton 创建分页按钮
     * @returns {DocumentFragment}
     */
    PaginationControl.prototype.createPaginationButton = function() {
        var fargs = document.createDocumentFragment();
        var pageSize = Math.max(Math.ceil(this.settings.total / this.settings.limit), 1);
        var startPoint = Math.max(0, this.context.currentPage - (5 + Math.max(0, (this.context.currentPage + 5) - pageSize)));
        var endPoint = Math.min(pageSize, Math.max(10, this.context.currentPage + 5));
        for (var i = startPoint; i < endPoint; i++) {
            var paginationButton = document.createElement(this.settings.tagName);
            paginationButton.innerText = (i + 1);
            paginationButton.setAttribute('data-flag', (i + 1));
            classes(paginationButton, (i + 1) == this.context.currentPage ? this.settings.btnActiveClasses
                : this.settings.btnDefaultClasses);
            classes(paginationButton, 'btn-pagination');
            this.context.transfer('createButtonAfterCallback', [paginationButton]);
            fargs.appendChild(paginationButton);
        }

        return fargs;
    };

    /**
     * @constructor {createFristButton} 创建首页按钮
     * @returns {HTMLElement}
     */
    PaginationControl.prototype.createFristButton = function() {
        var major = this.settings.major;
        var fristButton = document.createElement(this.settings.tagName);
        fristButton.innerHTML = major.firstButtonOption.text;
        classes(fristButton, this.settings.btnDefaultClasses);
        classes(fristButton, 'btn-frist');
        if (this.context.currentPage == 1) { // disabled button class
            classes(fristButton, this.settings.disabledClasses);
        }

        this.context.transfer('createButtonAfterCallback', [fristButton]);
        return fristButton;
    };

    /**
     * @constructor {createPrveButton} 创建上一页按钮
     * @returns {HTMLElement}
     */
    PaginationControl.prototype.createPrveButton = function() {
        var major = this.settings.major;
        var prveButton = document.createElement(this.settings.tagName);
        prveButton.innerHTML = major.prveButtonOption.text;
        classes(prveButton, this.settings.btnDefaultClasses);
        classes(prveButton, 'btn-prve');
        if (this.context.currentPage == 1) {
            classes(prveButton, this.settings.disabledClasses);
        }

        this.context.transfer('createButtonAfterCallback', [prveButton]);
        return prveButton;
    };

    /**
     * @constructor {createNextButton} 创建下一页按钮
     * @returns {HTMLElement}
     */
    PaginationControl.prototype.createNextButton = function() {
        var major = this.settings.major;
        var pageSize = Math.max(Math.ceil(this.settings.total / this.settings.limit), 1);
        var nextButton = document.createElement(this.settings.tagName);
        nextButton.innerHTML = major.nextButtonOption.text;
        classes(nextButton, this.settings.btnDefaultClasses);
        classes(nextButton, 'btn-next');
        if (this.context.currentPage >= pageSize) {
            classes(nextButton, this.settings.disabledClasses);
        }

        this.context.transfer('createButtonAfterCallback', [nextButton]);
        return nextButton;
    };

    /**
     * @constructor {createLastButton} 创建末页按钮
     * @returns {HTMLElement}
     */
    PaginationControl.prototype.createLastButton = function() {
        var major = this.settings.major;
        var pageSize = Math.max(Math.ceil(this.settings.total / this.settings.limit), 1);
        var lastButton = document.createElement(this.settings.tagName);
        lastButton.innerHTML = major.lastButtonOption.text;
        classes(lastButton, this.settings.btnDefaultClasses);
        classes(lastButton, 'btn-last');
        if (this.context.currentPage >= pageSize) {
            classes(lastButton, this.settings.disabledClasses);
        }

        return lastButton
    };

    /**
     * @constructor {createRedirectTo} 创建分页跳转控件
     * @returns {DocumentFragment}
     */
    PaginationControl.prototype.createRedirectTo = function() {
        var fargs = document.createDocumentFragment();
        var redircetOption = this.settings.redirect;
        var warp$input, warp$button;
        if (jQuery.trim(redircetOption.warp).length) {
            var warp = redircetOption.warp.split('.');
            warp$input = document.createElement(warp[0]);
            classes(warp$input, warp.slice(1));
        } else {
            warp$input = document.createElement('span');
            classes(warp$input, 'btn-redirect-group');
        }

        var redirectInput = document.createElement('input');
        classes(redirectInput, redircetOption.inputClasses);
        classes(redirectInput, 'pagination-input-redirect');
        redirectInput.type = 'text';

        warp$button = warp$input.cloneNode(false);
        var redirectButton = document.createElement(this.settings.tagName);
        classes(redirectButton, redircetOption.classes);
        classes(redirectButton, 'btn-redirect');
        redirectButton.innerText = '跳转';

        warp$input.appendChild(redirectInput);
        warp$button.appendChild(redirectButton);
        fargs.appendChild(warp$input);
        fargs.appendChild(warp$button);
        return fargs;
    };


    var

        paginationEventSymbol = Symbol('Pagination.Event'),

        paginationControlSymbol = Symbol('Pagination.Control'),

        $uid = 0,

        cachePagination = function() {

            var paginationControl = {};

            return {
                /**
                 * @constructor {pushCache} 添加缓存
                 * @param injectId 注入ID
                 * @param control 缓存UI控件
                 */
                pushCache: function(injectId, control) {
                    var namespace = '$_cacheInjectId' + injectId + '$';
                    paginationControl[namespace] = control;
                },

                /**
                 * @constructor {pullCache} 拉取缓存
                 * @param injectId 注入ID
                 * @returns {*}
                 */
                pullCache: function(injectId) {
                    var namespace = '$_cacheInjectId' + injectId + '$';
                    return paginationControl[namespace];
                },

                /**
                 * @constructor {removeCache} 删除缓存
                 * @param injectId 注入ID
                 * @returns {boolean}
                 */
                removeCache: function(injectId) {
                    var namespace = '$_cacheInjectId' + injectId + '$';
                    if (hasOwn.call(paginationControl, namespace)) {
                        delete paginationControl[namespace];
                        return true;
                    }

                    return false;
                }
            }
        },

        cacheTask = cachePagination();

    var initPaginationControl = function initPaginationControl($pg) {
        $pg[paginationControlSymbol].setContext($pg);
        $pg[paginationControlSymbol].setSettings($pg.settings);
        var container = document.createElement('section');
        classes(container, 'row');
        var pageUIControl = $pg[paginationControlSymbol].create();
        if ($pg.settings.redirect.show) {
            pageUIControl.appendChild($pg[paginationControlSymbol].createRedirectTo());
        }

        container.appendChild(pageUIControl);
        cacheTask.pushCache($pg.__uniqueId__, container);
        $pg.$el.innerHTML = null;
        $pg.$el.appendChild(cacheTask.pullCache($pg.__uniqueId__));
    };

    HTMLElement.prototype.selector = function(selectorType) {
        if (typeof (selectorType) !== 'string') {
            return;
        }
        // var ID = /^#[a-z0-9]+$/;
        // var CLASS
        var ID = /^(#[a-z0-9_\-]+$)/,
            ClASS = /^(\.[a-z0-9_\-]+$)/;

        if (ID.test(selectorType)) {
            return this.getElementById(selectorType.replace(/#/, ''));
        }

        if (ClASS.test(selectorType)) {
            if (this.querySelectorAll) {
                return this.querySelectorAll(selectorType);
            } else if (this.getElementsByClassName) {
                return this.getElementsByClassName(selectorType.replace(/#/, ''));
            }
        }
    };

    /**
     * @constructor {Pagination} 分页插件
     * @param option 配置项
     * @param context 执行上下文环境
     * @returns {*|Pagination}
     */
    function Pagination(option, context) {

        if (!(this instanceof Pagination)) {
            return new Pagination(option, this);
        }

        var resolveOption = jQuery.extend(true, {}, _default, option);
        this._initial(resolveOption, context);
    }

    Pagination.prototype._initial = function (option, __jQuery = false) {

        Object.defineProperties(this, {
            '__uniqueId__': {
                value: ++$uid,
                writable: false,
                configurable: false,
                enumerable: false
            },

            'IS_JQUERY': {
                value: __jQuery,
                writable: false,
                configurable: false,
                enumerable: false
            }
        });

        this.currentPage = 1;
        this.settings = option.settings;
        this.$el = this.IS_JQUERY ? __jQuery[0] : document.getElementById(option.settings.containerId);
        this.inject(option.methods);
        initPaginationControl(this);
        this.initPaginationEvent();
        if (this.IS_JQUERY) $(this.$el).on('destory', this.destory.bind(this));
    };

    /**
     * @constructor {inject} 注入事件
     * @param methods {Object} 对象
     */
    Pagination.prototype.inject = function(methods) {
        if (!this.IS_JQUERY && jQuery.isPlainObject(methods)) {
            for (var handleName in methods) {
                if (typeof (methods[handleName]) === 'function') {
                    this[paginationEventSymbol].inject(this.__uniqueId__, handleName, methods[handleName]);
                }
            }
        }
    };

    /**
     * @constructor {transfer} 调度事件
     * @param eventName 事件名称
     * @param options {Array} 参数列表
     */
    Pagination.prototype.transfer = function(eventName, options) {
        if (!this.IS_JQUERY && typeof (eventName) === 'string') {
            this[paginationEventSymbol].execute(this.__uniqueId__, eventName, options);
        } else if (this.IS_JQUERY && typeof (eventName) === 'string') {
            jQuery(this.$el).trigger(eventName, options)
        }
    };

    Object.defineProperties(Pagination.prototype, {

        [paginationEventSymbol]: {
            value: new PaginationEvent,
            writable: false
        },

        [paginationControlSymbol]: {
            value: new PaginationControl,
            writable: false
        }

    });

    jQuery.extend(true, Pagination.prototype, {
        initPaginationEvent: function() {
            var paginationControl = cacheTask.pullCache(this.__uniqueId__);
            var $that = this;

            if ($that.settings.redirect.show) {
                paginationControl.selector('.btn-redirect')[0].onclick = function() {
                    var pageSize = Math.max(Math.ceil($that.settings.total / $that.settings.limit), 1);
                    var redirectInput = paginationControl.selector('.pagination-input-redirect')[0];
                    var pageNo = redirectInput.value;
                    if (isNaN(pageNo) || jQuery.trim(pageNo) == '') return redirectInput.value = null;
                    redirectInput.value = pageNo = Math.max(1, Math.min(pageSize, pageNo));
                    if ($that.currentPage == pageNo) return;
                    $that.transfer('ajax', [{currentPage: pageNo, limit: $that.settings.limit, total: $that.settings.total},
                        function(limit, total) {
                            $that.currentPage = pageNo;
                            $that.resetPageSize(limit, total);
                        }]);
                };
            }

            paginationControl.selector('.btn-frist')[0].onclick = function() {
                if ($that.currentPage > 1) {
                    $that.transfer('ajax', [{currentPage: 1, limit: $that.settings.limit, total: $that.settings.total},
                    function(limit, total) {
                        $that.currentPage = 1;
                        $that.resetPageSize(limit, total);
                    }]);
                }
            };

            paginationControl.selector('.btn-prve')[0].onclick = function() {
                if ($that.currentPage > 1) {
                    $that.transfer('ajax', [{currentPage: $that.currentPage - 1, limit: $that.settings.limit, total: $that.settings.total},
                    function(limit, total) {
                        $that.currentPage--;
                        $that.resetPageSize(limit, total);
                    }]);
                }
            };

            paginationControl.selector('.btn-next')[0].onclick = function() {
                var pageSize = Math.max(Math.ceil($that.settings.total / $that.settings.limit), 1);
                if ($that.currentPage < pageSize) {
                    $that.transfer('ajax', [{currentPage: $that.currentPage + 1, limit: $that.settings.limit, total: $that.settings.total},
                    function(limit, total) {
                        $that.currentPage++;
                        $that.resetPageSize(limit, total);
                    }]);
                }
            };

            paginationControl.selector('.btn-last')[0].onclick = function() {
                var pageSize = Math.max(Math.ceil($that.settings.total / $that.settings.limit), 1);
                if ($that.currentPage < pageSize) {
                    $that.transfer('ajax', [{currentPage: pageSize, limit: $that.settings.limit, total: $that.settings.total},
                    function(limit, total) {
                        $that.currentPage = pageSize;
                        $that.resetPageSize(limit, total);
                    }]);
                }
            };

            if ($that.settings.redirect.show && $that.settings.redirect.enterTrigger) {
                paginationControl.selector('.pagination-input-redirect')[0].onkeypress = function(e) {
                    if (e.keyCode == 13) {
                        paginationControl.selector('.btn-redirect')[0].click();
                    }
                }
            }

            arr.forEach.call(paginationControl.selector('.btn-pagination'), function(item) {
                item.onclick = function() {
                    var flag = Number(this.getAttribute('data-flag'));
                    $that.transfer('ajax', [{currentPage: flag, limit: $that.settings.limit, total: $that.settings.total},
                    function(limit, total) {
                        $that.currentPage = flag;
                        $that.resetPageSize(limit, total);
                    }]);
                }
            });

        },

        resetPageSize: function(limit = 10, total = 0) {
            var paginationControl = cacheTask.pullCache(this.__uniqueId__);
            this.settings.limit = limit;
            this.settings.total = total;
            this[paginationControlSymbol].setContext(this);
            this[paginationControlSymbol].setSettings(this.settings);
            var newPaginationControl = this[paginationControlSymbol].create();
            var oldPaginationControl = paginationControl.selector('.btn-pagination')[0].parentNode;
            paginationControl.insertBefore(newPaginationControl, oldPaginationControl);
            oldPaginationControl.remove();
            this.initPaginationEvent();
        },

        /**
         * @constructor {destory} 销毁插件
         */
        destory: function() {
            var paginationControl = cacheTask.pullCache(this.__uniqueId__);
            paginationControl.selector('.btn-frist')[0].onclick = null;
            paginationControl.selector('.btn-prve')[0].onclick = null;
            paginationControl.selector('.btn-next')[0].onclick = null;
            paginationControl.selector('.btn-last')[0].onclick = null;
            arr.forEach.call(paginationControl.selector('.btn-pagination'), function(item) {
                item.onclick = null;
            });

            cacheTask.removeCache(this.__uniqueId__);
            paginationControl.remove();
            if (this.IS_JQUERY) {
                $(this.$el).off()
            } else {
                this[paginationEventSymbol].destory(this.__uniqueId__);
            }
        }
    });

    if (window.jQuery && !jQuery.fn.pagination) {
        jQuery.fn.pagination = Pagination;
    }

    return Pagination;
}));























