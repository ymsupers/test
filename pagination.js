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

		containerId: 'pagination',

		tagName: 'button',

		btnDefaultClasses: 'btn btn-light border',

		btnActiveClasses: 'btn btn-success active',

		showPages: 10,

		limit: 10,

		total: 0,

		disabledClasses: 'disabled',

		btnOption: {
			
			firstButton: '首页',
			
			prveButton: '上一页',
			
			nextButton: '下一页',
			
			lastButton: '末页'
		
		}

	}

	// pagination plugin jumps to default options
	_default.settings.redirect = {

		show: false,
		
		classes: 'btn btn-success',
		
		inputClasses: 'form-control text-center',
		
		enterTrigger: false
	
	}

	// event methods
	_default.methods = {
		
		createButtonAfterCallback: undefined,
		
		ajax: undefined
		
	}
	
	
	var o = {},
	
		hasOwn = o.hasOwnProperty,
		
		arr = [],
		
		slice = arr.slice,
		
		classes = function($el, clazz) {
			
			if ( typeof (clazz)  === 'string' ) {
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
						clazz = $el.getAttribute('class').split(/,|\s+/).concat(clazz);
					}
					
					$el.setAttribute('class', clazz.join(' '));
				}
			}
		};


	function PaginationEvent() {
		this._events = {}
	}
	
	
	// inject pagination event
	PaginationEvent.prototype.inject = function($pg, eventName, handle) {
		var namespace = '__uniqueId__' + '$' + $pg.__uniqueId__ + '__';
		if (!hasOwn.call(this._events, namespace)) {
			this._events[namespace] = {};
		}
		
		this._events[namespace][eventName] = handle;
	};
	
	// executor pagination event
	PaginationEvent.prototype.execute = function($pg, eventName) {
		var namespace = '__uniqueId__' + '$' + $pg.__uniqueId__ + '__';
		if (hasOwn.call(this._events, namespace)) {
			var handle = this._events[namespace][eventName];
			if (typeof (handle) === 'function') {
				handle.apply({}, slice.call(arguments, 2)[0]);
			}
		}
	};


	function PaginationControl() {
		
		this.configOption = undefined;
		
		this.context = undefined;
		
		this.limit = 10;
		
		this.total = 0;
	
	}
	
	PaginationControl.prototype.setContext = function(context) {
		this.context = context;
	}

	PaginationControl.prototype.setConfigOption = function(settings) {
		this.configOption = settings;
	}
	
	PaginationControl.prototype.setLimit = function(limit) {
		this.limit = limit;
	}
	
	PaginationControl.prototype.setTotal = function(total) {
		this.total = total;
	}
	
	PaginationControl.prototype.createButtonControl = function() {
		var fargs = document.createDocumentFragment();
		fargs.appendChild(this.createFristButton());
		fargs.appendChild(this.createPrveButton());
		fargs.appendChild(this.createButton());
		fargs.appendChild(this.createNextButton());
		fargs.appendChild(this.createLastButton());
		if (this.configOption.redirect.show) {
			fargs.appendChild(this.createRedirectTo());
		}
		
		return fargs;
	}
	
	PaginationControl.prototype.createButton = function() {
		var fargs = document.createDocumentFragment();
		var pageSize = Math.max(Math.ceil(this.total / this.limit), 1);
		var startPoint =  Math.max(0, this.context.currentPage - (5 + Math.max(0, (this.context.currentPage + 5) - pageSize)))
		var endPoint = Math.min(pageSize, Math.max(10, this.context.currentPage + 5));

		for (var i = startPoint; i < endPoint; i++) {
			var _button = document.createElement(this.configOption.tagName);
			_button.innerText = (i + 1);
			_button.setAttribute('data-flag', (i + 1));
			classes(_button, (i + 1) == this.context.currentPage ? this.configOption.btnActiveClasses 
				: this.configOption.btnDefaultClasses);
			classes(_button, 'btn-pagination');
			this.context.transfer('createButtonAfterCallback', [_button]);
			fargs.appendChild(_button);
		}
		
		return fargs;
	}
	
	PaginationControl.prototype.createFristButton = function() {
		var that = this;
		var firstButton = document.createElement(that.configOption.tagName);
		firstButton.innerHTML = that.configOption.btnOption.firstButton;
		classes(firstButton, that.configOption.btnDefaultClasses);
		classes(firstButton, 'btn-first');
		if (that.context.currentPage == 1) { // disabled button
			classes(firstButton, that.configOption.disabledClasses);
		}
		
		this.context.transfer('createButtonAfterCallback', [firstButton]);
		return firstButton;
	}
	
	PaginationControl.prototype.createPrveButton = function() {
		var that = this;
		var prveButton = document.createElement(that.configOption.tagName);
		prveButton.innerHTML = that.configOption.btnOption.prveButton;
		classes(prveButton, that.configOption.btnDefaultClasses);
		classes(prveButton, 'btn-prve');
		if (that.context.currentPage == 1) {
			classes(prveButton, that.configOption.disabledClasses);
		}
		
		that.context.transfer('createButtonAfterCallback', [prveButton]);
		return prveButton;
	}
	
	PaginationControl.prototype.createNextButton = function() {
		var that = this;
		var nextButton = document.createElement(that.configOption.tagName);
		var pageSize = Math.max(Math.ceil(that.total / that.limit), 1);
		nextButton.innerHTML = that.configOption.btnOption.nextButton;
		classes(nextButton, that.configOption.btnDefaultClasses);
		classes(nextButton, 'btn-next');
		if (that.context.currentPage == pageSize) {
			classes(nextButton, that.configOption.disabledClasses);
		}
		
		that.context.transfer('createButtonAfterCallback', [nextButton]);
		return nextButton;
	}
	
	PaginationControl.prototype.createLastButton = function() {
		var that = this;
		var lastButton = document.createElement(that.configOption.tagName);
		var pageSize = Math.max(Math.ceil(that.total / that.limit), 1);
		lastButton.innerHTML = that.configOption.btnOption.lastButton;
		classes(lastButton, that.configOption.btnDefaultClasses);
		classes(lastButton, 'btn-last');
		if (that.context.currentPage == pageSize) {
			classes(lastButton, that.configOption.disabledClasses);
		}
		
		that.context.transfer('createButtonAfterCallback', [lastButton]);
		return lastButton;
	}
	
	PaginationControl.prototype.createRedirectTo = function() {
		var oSpan = document.createElement('span');
		classes(oSpan, 'redirect-group');
		var oInput = document.createElement('input');
		oInput.type = 'text';
		classes(oInput, this.configOption.redirect.inputClasses);
		classes(oInput, 'input-redirect');
		var oButton = document.createElement(this.configOption.tagName);
		oButton.innerText = '跳转';
		classes(oButton, this.configOption.redirect.classes);
		classes(oButton, 'btn-redirect');
		oSpan.appendChild(oInput);
		oSpan.appendChild(oButton);
		return oSpan;
	}
	
	var 
		
		paginationEventSymbol = Symbol('Pagination.Event'),
		
		paginationUIControlSymbol = Symbol('Pagination.Control');
		
		$uid = 0;
		
	function cachePagination() {
		var paginationControl = {}
		
		return {
			
			pushCache: function(injectId, control) {
				var namespace = '$_chacheInjectId' + injectId + '$';
				paginationControl[namespace] = control;
			},
			
			pullCache: function(injectId) {
				var namespace = '$_chacheInjectId' + injectId + '$';
				return paginationControl[namespace];
			},
			
			removeCache: function(injectId) {
				var namespace = '$_chacheInjectId' + injectId + '$';
				if (paginationControl[namespace]) {
					delete paginationControl[namespace];
				}
			}
		}
		
	}
	
	// create cache
	var cacheTask = cachePagination();
	
	function Pagination(option, context) {
		
		if (!(this instanceof Pagination)) {
			return new Pagination(option, this);
		}

		var resolveOption = jQuery.extend(true, {}, _default, option);
		if (window.jQuery && context instanceof jQuery) {
			this.$el = context;
		} else {
			this.$el = document.getElementById(resolveOption.settings.containerId);
		}
		
		this._initial(resolveOption);
	}


	Pagination.prototype._initial = function(option) {

		Object.defineProperty(this, '__uniqueId__', {
			value: ++$uid,
			writeable: false
		});
		
		this.currentPage = 1;
		this.inject(option.methods);
		this.settings = option.settings;
		this[paginationUIControlSymbol].setConfigOption(option.settings);
		this.resetSize(option.settings.limit, option.settings.total);
	}

	// reize page size default: 10 , 0
	Pagination.prototype.resetSize = function(limit, total) {
		var that = this;
		that[paginationUIControlSymbol].setContext(that);
		that[paginationUIControlSymbol].setConfigOption(that.settings);
		that[paginationUIControlSymbol].setLimit(limit);
		that[paginationUIControlSymbol].setTotal(total);
		cacheTask.pushCache(that.__uniqueId__, that[paginationUIControlSymbol].createButtonControl());
		var pagination = cacheTask.pullCache(that.__uniqueId__);
		
		pagination.querySelector('.btn-first').addEventListener('click', function() {
			if (that.currentPage > 1) {
				that.transfer('ajax', [{currentPage: 1, limit: limit, total: total}, 
				function(limit, total) {
					that.currentPage = 1;
					that.resetSize(limit, total);
				}]);
			}
		});
		
		pagination.querySelector('.btn-prve').addEventListener('click', function() {
			if (that.currentPage > 1) {
				that.transfer('ajax', [{currentPage: that.currentPage - 1, limit: limit, total: total}, 
				function(limit, total) {
					that.currentPage--;
					that.resetSize(limit, total);
				}]);
			}
		});

		pagination.querySelector('.btn-next').addEventListener('click', function() {
			var pageSize = Math.max(Math.ceil(total / limit), 1);
			if ( that.currentPage <  pageSize) {
				that.transfer('ajax', [{currentPage: that.currentPage + 1, limit: limit, total: total},
				function(limit, total) {
					that.currentPage++;
					that.resetSize(limit, total);
				}]);
			}
		});
		
		pagination.querySelector('.btn-last').addEventListener('click', function() {
			var pageSize = Math.max(Math.ceil(total / limit), 1);
			if ( that.currentPage <  pageSize ) {
				that.transfer('ajax', [{currentPage: pageSize, limit: limit, total: total},
				function(limit, total) {
					that.currentPage = pageSize;
					that.resetSize(limit, total);
				}]);
			} 
		});
		
		arr.forEach.call(pagination.querySelectorAll('.btn-pagination'), function(item) {
			item.addEventListener('click', function() {
				var currentPage = this.getAttribute('data-flag') * 1;
				that.transfer('ajax', [{currentPage: currentPage, limit: limit, total: total},
				function(limit, total) {
					that.currentPage = currentPage;
					that.resetSize(limit, total);
				}]);
			});
		});
		
		if (that.settings.redirect.show) {
			pagination.querySelector('.btn-redirect').addEventListener('click', function() {
				var input = this.parentNode.querySelector('.input-redirect');
				var pageSize = Math.max(Math.ceil(total / limit), 1);
				var currentPage = Math.max(1, Math.min(pageSize, input.value * 1));
				if (isNaN(currentPage)) return;
				that.transfer('ajax', [{currentPage: currentPage, limit: limit, total: total},
				function(limit, total) {
					that.currentPage = currentPage;
					that.resetSize(limit, total);
				}]);
			});
			
			if (that.settings.redirect.enterTrigger) {
				pagination.querySelector('.input-redirect').addEventListener('keydown', function(e) {
					if (e.keyCode === 13) {
						var pageSize = Math.max(Math.ceil(total / limit), 1);
						var currentPage = Math.max(1, Math.min(pageSize, this.value * 1));
						if (isNaN(currentPage)) return;
						that.transfer('ajax', [{currentPage: currentPage, limit: limit, total: total},
						function(limit, total) {
							that.currentPage = currentPage;
							that.resetSize(limit, total);
						}]);
					}
				});
			}
		}
		
		if (that.$el instanceof jQuery) {
			that.$el.empty().append(pagination);
		} else {
			that.$el.innerHTML = null;
			that.$el.appendChild(pagination);
		}
	}

	// inject pagination methods
	Pagination.prototype.inject = function(methods) {
		if (jQuery.isPlainObject(methods)) {
			for (var handleName in methods) {
				if ( typeof (methods[handleName]) === 'function' ) {
					if ( this.$el && this.$el instanceof jQuery ) {
						this.$el.on(handleName, methods[handleName]);
					} else {
						this[paginationEventSymbol].inject(this, handleName, methods[handleName]);
					}
				}
			}
		}
	}

	// transfer pagination methods
	Pagination.prototype.transfer = function(eventName, options) {
		if (!(this.$el instanceof jQuery)) {
			if (typeof (eventName) === 'string' ) {
				this[paginationEventSymbol].execute(this, eventName, options);
			}
		} else {
			this.$el.trigger(eventName, options);
		}
	}

	Object.defineProperty(Pagination.prototype, paginationEventSymbol, {
		value: new PaginationEvent,
		writeable: false
	});
	
	Object.defineProperty(Pagination.prototype, paginationUIControlSymbol, {
		value: new PaginationControl,
		writeable: false
	}); 
	
	if (nGlobal && window.jQuery) {
		$.extend(true, jQuery.fn, {
			'pagination': Pagination
		});
	}
	
	if (!nGlobal) {
		window.JPagination = Pagination;
	}
	
	return Pagination;
}));