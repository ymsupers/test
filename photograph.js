(function(global) {

	var 

		o = {},

		toCheckType = o.toString,

		hasOwn = o.hasOwnProperty,

		arr = [],

		slice = arr.slice,

		map = arr.map,

		forEach = arr.forEach,

		/**
		 * [isFunction 检查对象是否为函数对象]
		 * @param  {[Object]}  obj [被检查对象]
		 * @return {Boolean}     [true|false]
		 */
		isFunction = function(obj) {
			return '[object function]' === toCheckType.call(obj).toLocaleLowerCase();
		},

		/**
		 * [isPlainObject 检查对象是否为普通对象]
		 * @param  {[Object]}  obj [被检查对象]
		 * @return {Boolean}     [true|false]
		 */
		isPlainObject = function(obj) {
			return '[object object]' === toCheckType.call(obj).toLocaleLowerCase();
		},

		/**
		 * [protoRedirected 修改原型链指向]
		 * @param  {[type]} source [对象源]
		 * @param  {[type]} target [指向目标]
		 * @return {[void]}        [无返回值]
		 */
		protoRedirected = function(source, target) {
			if(Object.setPrototypeOf) {
				if (isFunction(target)) {
					Object.setPrototypeOf(source, new target());
				} else if(isPlainObject(target)) {
					Object.setPrototypeOf(source, target);
				}
			} else {
				if (isFunction(target)) {
					source.__proto__ = new target();
				} else if(isPlainObject(target)) {
					source.__proto__ = target;
				}
			}
		},

		noop = function() {};


	var 

		event_hooks = {},

		defineDefaultOption = {

			// 后端服务器地址
			serverURL: '',

			// 图片上传数量限制
			fileMaxNumber: 1,

			// 图片上传大小限制
			fileMaxSize: 1024 * 1024,

			// 图片上传质量，（对原图进行压缩处理）注：此参数只针对 resolveCanvasToBase64URL 有效
			quality: 0.8,

			// 是否允许一次性上传多张
			multiple: false,

			// 支持文件格式，已“,”号隔开
			formatter: 'JPG, JPEG, GIF, PNG'
		};

	function PhotograpEvent() {}

	(function(PhotograpEvent) {

		PhotograpEvent.prototype = {
			constructor: PhotograpEvent,

			/**
			 * [on 注册事件]
			 * @param  {[String]} eventName  [事件名称]
			 * @param  {[Function]} methodHandle [函数句柄]
			 * @return {[void]}            [返回值]
			 */
			on: function(eventName, methodHandle) {
				var uniqueIdName = '__uniqueId_' + this.$uniqueId + '__';
				if(!hasOwn.call(event_hooks, uniqueIdName)) {
					event_hooks[uniqueIdName] = {};
				}

				if (['start', 'progress', 'done', 'error'].indexOf(eventName) != -1 && isFunction(methodHandle)) {
					event_hooks[uniqueIdName][eventName] = methodHandle;
				}
			},

			/**
			 * [execute 执行事件句柄]
			 * @param  {[String]} eventName [事件名称]
			 * @return {[void]}           [无返回值]
			 */
			execute: function(eventName) {
				var uniqueIdName = '__uniqueId_' + this.$uniqueId + '__';
				if (hasOwn.call(event_hooks, uniqueIdName)) {
					var handle = event_hooks[uniqueIdName][eventName];
					if (isFunction(handle)) {
						handle.apply(this, slice.call(arguments, 1));
					}
				}
			}
		}

	}(PhotograpEvent));

	function PhotographReader() {
		this.fileList = [];
	}

	(function(PhotographReader) {

		PhotographReader.prototype = new PhotograpEvent();
		PhotographReader.constructor = PhotographReader;
		$.extend(true, PhotographReader.prototype, {
			/**
			 * [toBase64DataURL 文件转Base64 byte]
			 * @return {[void]} [无返回值]
			 */
			toBase64DataURL: function() {
				var that = this;
				if((that.file instanceof File) && FileReader) {
					var fileReader = new FileReader();
					fileReader.readAsDataURL(that.file);
					// 文件读取进度
					fileReader.onprogress = function() {
						that.execute('progress', arguments);
					}

					// 文件读取完成
					fileReader.onload = function(e) {
						if (e.loaded === that.file.size && e.target.readyState === 2) {
							that.fileList.push(e.target.result);
							that.execute('done', that.$el, e.target.result);
						}
					}
				}
			},

			/**
			 * [resolveCanvasToBase64URL 使用H5Canvas来获取Base64文件流]
			 * @return {[type]} [description]
			 */
			resolveCanvasToBase64URL: function() {}
		});
	}(PhotographReader))


	var id = 0;

	/**
	 * [Photograph description]
	 * @param {[HTMLInputElement]} element [description]
	 * @param {Object} option  [description]
	 */
	function Photograph(element, option = {}) {
		
		if(!(element instanceof HTMLInputElement)) return;

		if(!(this instanceof Photograph)) {
			return new Photograph(element, option);
		}

		this.initialize(element, option);
	}


	(function(Photograph) {

		Photograph.prototype = {
			constructor: Photograph,
			/**
			 * [initialize Photograph插件初始化]
			 * @param  {[HTMLInputElement]} element [description]
			 * @param  {[Object]} option  [description]
			 * @return {[type]}         [description]
			 */
			initialize: function initialize(element, option) {
				var noption = {}, that = this;
				that.$el = element;
				$.extend(true, noption, defineDefaultOption, option);
				// 为了$uniqueId安全性，这里不予许外部修改
				Object.defineProperty(this, '$uniqueId', {
					value: ++id,
					writeable: false
				});

				that.$el[noption.multiple ? 'setAttribute' : 'removeAttribute']('multiple');
				that.listenerPhotographUploader(noption);
				// 改变当前原型链指向
				protoRedirected(this, PhotographReader);
			},

			/**
			 * [listenerPhotographUploader 监听文件上传]
			 * @return {[type]} [description]
			 */
			listenerPhotographUploader: function(option) {
				var that = this;
				if (document.addEventListener) {
					that.$el.addEventListener('change', uploader);
				} else if (document.attachEvent) {
					that.$el.attachEvent('onchange', uploader);
				}

				function uploader(e) {
					var files = e.target.files;
					if (files.length + that.fileList.length > option.fileMaxNumber) {
						that.execute('error', '文件长度超出限制');
						return;
					}

					for (var i = 0, len = files.length; i < len; i++) {
						var file = files[i];
						if(file.size > option.fileMaxSize) {
							that.execute('error', '第['+(i + 1)+']个文件超出大小限制');
							continue;
						}

						that.file = file;
						that.execute('start', that);
					}
				}
				
			}
		}

		Photograph.init = function(element, option = {}) {
			return Photograph(element, option);
		}

	}(Photograph));


	global.JPhotograph = Photograph;
}(window));


























