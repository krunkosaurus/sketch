/*!
 * Sketch JavaScript Library v0.5
 * http://sketch.io/
 * http://github.com/krunkosaurus/sketch.js
 *
 * Copyright 2011, Mauvis Ledford
 * Released under MIT Licenses (included seperately).
 */

(function(sketch){
    var ua;

    // User agent object.
    ua = navigator.userAgent;

    // Opera browser check.
    sketch.isOpera = isOpera = window['opera'] && opera.buildNumber;

    // Webkit browser check.
    sketch.isWebKit = isWebKit = /WebKit/.test(ua);

    // Internet Explorer browser Check.
    sketch.isIE = isIE = !isWebKit && !isOpera && (/MSIE/gi).test(ua) && (/Explorer/gi).test(navigator.appName);

    // Firefox browser check.
    sketch.isGecko = isGecko = !isWebKit && /Gecko/.test(ua);

    // iPhone / iPad / Android browser check.
    sketch.isMobile = ua.indexOf('Mobile') !== -1;

    // Shortcut document.getElementById reference.
    function $(s){
        return document.getElementById(s);
    }

    // Check if object is of a certain type.
    function is(object, type) {
	    object = typeof(object);

	    if (!type)return object != 'undefined';

	    return object == type;
    };

    // Iterate over an object or array.
    function each(object, callback, context) {
	    var n;

	    if (!object){
            return 0;
        }

	    context = !context ? object : context;

	    if (is(object.length)) {

		    // Indexed arrays, needed for Safari
		    for (n=0; n<object.length; n++) {
			    if (callback.call(context, object[n], n, object) === false){
				    return 0;
                }
		    }
	    } else {

		    // Hashtables
		    for (n in object) {
			    if (object.hasOwnProperty(n)) {
				    if (callback.call(context, object[n], n, object) === false){
					    return 0;
                    }
			    }
		    }
	    }

	    return 1;
    };

    // Extend object1 with properties of object2.
    function extend(obj1, obj2) {
	    each(obj2, function(v, k) {
		    obj1[k] = v;
	    });

	    return obj1;
    };

    // Main Canvas class.
    function Canvas(options){
        // Class-related settings.
        var thisInstance, screenshots,

        // Element-related settings.
        element, context;

        this.element = element = $(options.id);
        this.context = context = element.getContext('2d');
        this.screenshots = screenshots = [];
        this.lastCoords = [];

        this.thisInstance = thisInstance = this;
        element.className = 'sketch-canvas';

        // merge defaults
        this.options = options = extend({
            width: 320,
            height: 480,
            fullscreen: false,
            backgroundColor: 'white',
            lineJoin: 'round',
            lineCap: 'round'
        }, options || {});

        if (options.fullscreen){
            element.width = window.innerWidth;
            element.height = window.innerHeight;
            // TODO: setEvent listener on window
        }else{
            element.width = options.width;
            element.height = options.height;
        }

        // Set default on the canvas element.
        each(['fillStyle', 'lineJoin', 'lineCap'], function(v){
            context[v] = options[v];
        });

        this.setListener = function(event){
            var top = event.offsetX;
            var left = event.offsetY;
            var timerRef;
            var target = event.target;
            var trackPositionChange = function(e){
                event = e;
            }

            target.addEventListener('mousemove', trackPositionChange, false);

            context.beginPath();
            thisInstance._addPoint(event);

            timerRef = setInterval(function(){
                // listen for drawing
                thisInstance._addPoint(event);
            }, 50);

            target.addEventListener('touchend', function(){
                clearInterval(timerRef);
            }, false);

            target.addEventListener('mouseup', function(e){
                target.removeEventListener('mousemove', trackPositionChange, false);

                clearInterval(timerRef);
            }, false);
        }

        // set BG color
        this.clear();

        // Prevent scrolling on this element
        element.addEventListener('touchmove', function(event) {
            event.preventDefault();
        }, false);

    }

    // Make these native canvas 2d-context properties into chainable methods.
    each([
        'canvas',
        'fillStyle',
        'font',
        'globalAlpha',
        'globalCompositeOperation',
        'lineCap',
        'lineJoin',
        'lineWidth',
        'miterLimit',
        'shadowOffsetX',
        'shadowOffsetY',
        'shadowBlur',
        'shadowColor',
        'strokeStyle',
        'textAlign',
        'textBaseline'
    ], function(s, i){
        Canvas.prototype[s] = function(){
            this.thisInstance.context[s] = arguments[0];
            return this.thisInstance;
        };
    });

    // Make these native canvas 2d-context methods chainable.
    each([
        'arc',
        'arcTo',
        'beginPath',
        'bezierCurveTo',
        'clearRect',
        'clip',
        'closePath',
        'drawImage',
        'fill',
        'fillRect',
        'fillText',
        'lineTo',
        'moveTo',
        'quadraticCurveTo',
        'rect',
        'restore',
        'rotate',
        'save',
        'scale',
        'setTransform',
        'stroke',
        'strokeRect',
        'strokeText',
        'transform',
        'translate'
    ], function(s, i){
        Canvas.prototype[s] = function(){
            this.thisInstance.context[s].apply(this.thisInstance.context, arguments);
            return this.thisInstance;
        };
    });

    // Api for chaining new methods on Canvas class.
    Canvas.prototype.chain = function(name, func){
        var that = this;
        this[name] = function(){
            func.call(that);
            return that;
        }
    };

    // Add static methods to main sketch object.
    extend(sketch, {
        $ : $,
        is : is,
        each : each,
        extend : extend,
        Canvas : Canvas
    });

    extend(sketch.Canvas.prototype, {
        enableDrawing : function(){
            this.element.addEventListener(sketch.isMobile ? 'touchstart' : 'mousedown', this.setListener, false);
        },

        disableDrawing : function(){
            this.element.removeEventListener(sketch.isMobile ? 'touchstart' : 'mousedown', this.setListener, false);
        },

        // save current image
        saveScreenshot : function(){
            this.screenshots.push(this.element.toDataURL("image/png"));
            return this;
        },

        // load by img or img url
        loadImage : function(img, x, y, callback){
            var that, img, url, loaded;

            if (!x) x = 0;
            if (!y) y = 0;

            that = this;
            loaded = function(){
                that.context.drawImage(img, x, y);
                if (callback){
                    callback(that);
                }
            }
            if (sketch.is(img, 'string')){
                url = img;
                img = document.createElement('img');
                img.onload = loaded;
                img.src = url;
            }else{
                loaded();
            }
            return this;
        },

        // pop last saved changes
        popScreenshot : function(callback){
            if (!this.screenshots.length) return this;

            return this.loadImage(this.screenshots.pop(), 0, 0, callback);
        },

        // apply last changes without removing
        applyScreenshot : function(callback){
            if (!this.screenshots.length) return this;

            return this.load(this.screenshots[this.screenshots.length - 1], 0, 0, callback);
        },

        clear : function(bool){
            var c = this.context;
            var currentFillStyle = c.fillStyle;

            if (bool){
                this.element.width = this.element.width;
            } else {
                c.fillStyle = this.options.backgroundColor;
                c.fillRect(0, 0, this.element.width, this.element.height);
                c.fillStyle = currentFillStyle;
            }
            return this;
        },

        _addPoint : function(e){
            var touch;
            var top;
            var left;

            if ('touches' in e){
                touch = e.touches[0];
                top = touch.clientX;
                left = touch.clientY;
            }else{
                top = e.clientX;
                left = e.clientY;
            }

            if (top !== this.lastCoords[0] && left !== this.lastCoords[1]){
                this.context.lineTo(top, left);
                this.context.moveTo(top, left);
                this.context.closePath();
                this.context.stroke();
                this.lastCoords = [top, left];
            }
        },

        hide : function(){
            this.element.style.display = 'none';
            return this;
        },

        show : function(){
            this.element.style.display = 'block';
            return this;
        },

        fontSize : function(s){
            this.context.font = s + ' ' + this.context.font.split(' ')[1];
            return this;
        },

        // Non-chainabe methods
        measureText : function(s){
            return this.context.measureText(s);
        },

        returnImage : function(text, x, y){
            window.location.href = this.element.toDataURL("image/png");
        }
    });

    window.sketch = sketch;
})({});
