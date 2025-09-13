

//fgnass.github.com/spin.js#v1.2.6
!function (e, t, n) { function o(e, n) { var r = t.createElement(e || "div"), i; for (i in n) r[i] = n[i]; return r } function u(e) { for (var t = 1, n = arguments.length; t < n; t++) e.appendChild(arguments[t]); return e } function f(e, t, n, r) { var o = ["opacity", t, ~~(e * 100), n, r].join("-"), u = .01 + n / r * 100, f = Math.max(1 - (1 - e) / t * (100 - u), e), l = s.substring(0, s.indexOf("Animation")).toLowerCase(), c = l && "-" + l + "-" || ""; return i[o] || (a.insertRule("@" + c + "keyframes " + o + "{" + "0%{opacity:" + f + "}" + u + "%{opacity:" + e + "}" + (u + .01) + "%{opacity:1}" + (u + t) % 100 + "%{opacity:" + e + "}" + "100%{opacity:" + f + "}" + "}", a.cssRules.length), i[o] = 1), o } function l(e, t) { var i = e.style, s, o; if (i[t] !== n) return t; t = t.charAt(0).toUpperCase() + t.slice(1); for (o = 0; o < r.length; o++) { s = r[o] + t; if (i[s] !== n) return s } } function c(e, t) { for (var n in t) e.style[l(e, n) || n] = t[n]; return e } function h(e) { for (var t = 1; t < arguments.length; t++) { var r = arguments[t]; for (var i in r) e[i] === n && (e[i] = r[i]) } return e } function p(e) { var t = { x: e.offsetLeft, y: e.offsetTop }; while (e = e.offsetParent) t.x += e.offsetLeft, t.y += e.offsetTop; return t } var r = ["webkit", "Moz", "ms", "O"], i = {}, s, a = function () { var e = o("style", { type: "text/css" }); return u(t.getElementsByTagName("head")[0], e), e.sheet || e.styleSheet }(), d = { lines: 12, length: 7, width: 5, radius: 10, rotate: 0, corners: 1, color: "#000", speed: 1, trail: 100, opacity: .25, fps: 20, zIndex: 2e9, className: "spinner", top: "auto", left: "auto" }, v = function m(e) { if (!this.spin) return new m(e); this.opts = h(e || {}, m.defaults, d) }; v.defaults = {}, h(v.prototype, { spin: function (e) { this.stop(); var t = this, n = t.opts, r = t.el = c(o(0, { className: n.className }), { position: "relative", width: 0, zIndex: n.zIndex }), i = n.radius + n.length + n.width, u, a; e && (e.insertBefore(r, e.firstChild || null), a = p(e), u = p(r), c(r, { left: (n.left == "auto" ? a.x - u.x + (e.offsetWidth >> 1) : parseInt(n.left, 10) + i) + "px", top: (n.top == "auto" ? a.y - u.y + (e.offsetHeight >> 1) : parseInt(n.top, 10) + i) + "px" })), r.setAttribute("aria-role", "progressbar"), t.lines(r, t.opts); if (!s) { var f = 0, l = n.fps, h = l / n.speed, d = (1 - n.opacity) / (h * n.trail / 100), v = h / n.lines; (function m() { f++; for (var e = n.lines; e; e--) { var i = Math.max(1 - (f + e * v) % h * d, n.opacity); t.opacity(r, n.lines - e, i, n) } t.timeout = t.el && setTimeout(m, ~~(1e3 / l)) })() } return t }, stop: function () { var e = this.el; return e && (clearTimeout(this.timeout), e.parentNode && e.parentNode.removeChild(e), this.el = n), this }, lines: function (e, t) { function i(e, r) { return c(o(), { position: "absolute", width: t.length + t.width + "px", height: t.width + "px", background: e, boxShadow: r, transformOrigin: "left", transform: "rotate(" + ~~(360 / t.lines * n + t.rotate) + "deg) translate(" + t.radius + "px" + ",0)", borderRadius: (t.corners * t.width >> 1) + "px" }) } var n = 0, r; for (; n < t.lines; n++) r = c(o(), { position: "absolute", top: 1 + ~(t.width / 2) + "px", transform: t.hwaccel ? "translate3d(0,0,0)" : "", opacity: t.opacity, animation: s && f(t.opacity, t.trail, n, t.lines) + " " + 1 / t.speed + "s linear infinite" }), t.shadow && u(r, c(i("#000", "0 0 4px #000"), { top: "2px" })), u(e, u(r, i(t.color, "0 0 1px rgba(0,0,0,.1)"))); return e }, opacity: function (e, t, n) { t < e.childNodes.length && (e.childNodes[t].style.opacity = n) } }), function () { function e(e, t) { return o("<" + e + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', t) } var t = c(o("group"), { behavior: "url(#default#VML)" }); !l(t, "transform") && t.adj ? (a.addRule(".spin-vml", "behavior:url(#default#VML)"), v.prototype.lines = function (t, n) { function s() { return c(e("group", { coordsize: i + " " + i, coordorigin: -r + " " + -r }), { width: i, height: i }) } function l(t, i, o) { u(a, u(c(s(), { rotation: 360 / n.lines * t + "deg", left: ~~i }), u(c(e("roundrect", { arcsize: n.corners }), { width: r, height: n.width, left: n.radius, top: -n.width >> 1, filter: o }), e("fill", { color: n.color, opacity: n.opacity }), e("stroke", { opacity: 0 })))) } var r = n.length + n.width, i = 2 * r, o = -(n.width + n.length) * 2 + "px", a = c(s(), { position: "absolute", top: o, left: o }), f; if (n.shadow) for (f = 1; f <= n.lines; f++) l(f, -2, "progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)"); for (f = 1; f <= n.lines; f++) l(f); return u(t, a) }, v.prototype.opacity = function (e, t, n, r) { var i = e.firstChild; r = r.shadow && r.lines || 0, i && t + r < i.childNodes.length && (i = i.childNodes[t + r], i = i && i.firstChild, i = i && i.firstChild, i && (i.opacity = n)) }) : s = l(t, "animation") }(), typeof define == "function" && define.amd ? define(function () { return v }) : e.Spinner = v }(window, document);

var modal_opts = {
    lines: 13, // The number of lines to draw
    length: 8, // The length of each line
    width: 4, // The line thickness
    radius: 9, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#000', // #rgb or #rrggbb or array of colors
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: '20px', // Top position relative to parent
    left: 'auto' // Left position relative to parent
};

window.spinner = new Spinner(modal_opts);

/*
 * ! iFrame Resizer (iframeSizer.min.js ) - v2.5.1 - 2014-06-06 Desc: Force
 * cross domain iframes to size to content. Requires:
 * iframeResizer.contentWindow.min.js to be loaded into the target frame.
 * Copyright: (c) 2014 David J. Bradshaw - dave@bradshaw.net License: MIT
 */

!function () { "use strict"; function a(a, b, c) { "addEventListener" in window ? a.addEventListener(b, c, !1) : "attachEvent" in window && a.attachEvent("on" + b, c) } function b() { var a, b = ["moz", "webkit", "o", "ms"]; for (a = 0; a < b.length && !w; a += 1) w = window[b[a] + "RequestAnimationFrame"]; w || c(" RequestAnimationFrame not supported") } function c(a) { y.log && "object" == typeof console && console.log(s + "[Host page" + u + "]" + a) } function d(a) { function b() { function a() { h(w), f(), y.resizedCallback(w) } i(a, w, "resetPage") } function d(a) { var b = a.id; c(" Removing iFrame: " + b), a.parentNode.removeChild(a), y.closedCallback(b), c(" --") } function e() { var a = v.substr(t).split(":"); return { iframe: document.getElementById(a[0]), id: a[0], height: a[1], width: a[2], type: a[3] } } function j(a) { var b = Number(y["max" + a]), d = Number(y["min" + a]), e = a.toLowerCase(), f = Number(w[e]); if (d > b) throw new Error("Value for min" + a + " can not be greater than max" + a); c(" Checking " + e + " is in range " + d + "-" + b), d > f && (f = d, c(" Set " + e + " to min value")), f > b && (f = b, c(" Set " + e + " to max value")), w[e] = "" + f } function k() { var b = a.origin, d = w.iframe.src.split("/").slice(0, 3).join("/"); if (y.checkOrigin && (c(" Checking connection is from: " + d), "" + b != "null" && b !== d)) throw new Error("Unexpected message received from: " + b + " for " + w.iframe.id + ". Message was: " + a.data + ". This error can be disabled by adding the checkOrigin: false option."); return !0 } function l() { return s === ("" + v).substr(0, t) } function m() { var a = w.type in { "true": 1, "false": 1 }; return a && c(" Ignoring init message from meta parent page"), a } function n() { var a = v.substr(v.indexOf(":") + r + 6); c(" MessageCallback passed: {iframe: " + w.iframe.id + ", message: " + a + "}"), y.messageCallback({ iframe: w.iframe, message: a }), c(" --") } function o() { if (null === w.iframe) throw new Error("iFrame (" + w.id + ") does not exist on " + u); return !0 } function q() { switch (w.type) { case "close": d(w.iframe), y.resizedCallback(w); break; case "message": n(); break; case "reset": g(w); break; case "init": b(), y.initCallback(w.iframe); break; default: b() } } var v = a.data, w = {}; l() && (c(" Received: " + v), w = e(), j("Height"), j("Width"), !m() && o() && k() && (q(), p = !1)) } function e() { null === v && (v = { x: void 0 !== window.pageXOffset ? window.pageXOffset : document.documentElement.scrollLeft, y: void 0 !== window.pageYOffset ? window.pageYOffset : document.documentElement.scrollTop }, c(" Get position: " + v.x + "," + v.y)) } function f() { null !== v && (window.scrollTo(v.x, v.y), c(" Set position: " + v.x + "," + v.y), v = null) } function g(a) { function b() { h(a), j("reset", "reset", a.iframe) } c(" Size reset requested by " + ("init" === a.type ? "host page" : "iFrame")), e(), i(b, a, "init") } function h(a) { function b(b) { a.iframe.style[b] = a[b] + "px", c(" IFrame (" + a.iframe.id + ") " + b + " set to " + a[b] + "px") } y.sizeHeight && b("height"), y.sizeWidth && b("width") } function i(a, b, d) { d !== b.type && w ? (c(" Requesting animation frame"), w(a)) : a() } function j(a, b, d) { c("[" + a + "] Sending msg to iframe (" + b + ")"), d.contentWindow.postMessage(s + b, "*") } function k() { function b() { function a(a) { 1 / 0 !== y[a] && 0 !== y[a] && (k.style[a] = y[a] + "px", c(" Set " + a + " = " + y[a] + "px")) } a("maxHeight"), a("minHeight"), a("maxWidth"), a("minWidth") } function d(a) { return "" === a && (k.id = a = "iFrameResizer" + o++, c(" Added missing iframe ID: " + a)), a } function e() { c(" IFrame scrolling " + (y.scrolling ? "enabled" : "disabled") + " for " + l), k.style.overflow = !1 === y.scrolling ? "hidden" : "auto", k.scrolling = !1 === y.scrolling ? "no" : "yes" } function f() { ("number" == typeof y.bodyMargin || "0" === y.bodyMargin) && (y.bodyMarginV1 = y.bodyMargin, y.bodyMargin = "" + y.bodyMargin + "px") } function h() { return l + ":" + y.bodyMarginV1 + ":" + y.sizeWidth + ":" + y.log + ":" + y.interval + ":" + y.enablePublicMethods + ":" + y.autoResize + ":" + y.bodyMargin + ":" + y.heightCalculationMethod + ":" + y.bodyBackground + ":" + y.bodyPadding + ":" + y.tolerance } function i(b) { a(k, "load", function () { var a = p; j("iFrame.onload", b, k), !a && y.heightCalculationMethod in x && g({ iframe: k, height: 0, width: 0, type: "init" }) }), j("init", b, k) } var k = this, l = d(k.id); e(), b(), f(), i(h()) } function l(a) { if ("object" != typeof a) throw new TypeError("Options is not an object.") } function m() { function a(a) { if ("IFRAME" !== a.tagName) throw new TypeError("Expected <IFRAME> tag, found <" + a.tagName + ">."); k.call(a) } function b(a) { a = a || {}, l(a); for (var b in z) z.hasOwnProperty(b) && (y[b] = a.hasOwnProperty(b) ? a[b] : z[b]) } return function (c, d) { b(c), Array.prototype.forEach.call(document.querySelectorAll(d || "iframe"), a) } } function n(a) { a.fn.iFrameResize = function (b) { return l(b), y = a.extend({}, z, b), this.filter("iframe").each(k).end() } } var o = 0, p = !0, q = "message", r = q.length, s = "[iFrameSizer]", t = s.length, u = "", v = null, w = window.requestAnimationFrame, x = { max: 1, scroll: 1, bodyScroll: 1, documentElementScroll: 1 }, y = {}, z = { autoResize: !0, bodyBackground: null, bodyMargin: null, bodyMarginV1: 8, bodyPadding: null, checkOrigin: !0, enablePublicMethods: !1, heightCalculationMethod: "offset", interval: 32, log: !1, maxHeight: 1 / 0, maxWidth: 1 / 0, minHeight: 0, minWidth: 0, scrolling: !1, sizeHeight: !0, sizeWidth: !1, tolerance: 0, closedCallback: function () { }, initCallback: function () { }, messageCallback: function () { }, resizedCallback: function () { } }; b(), a(window, "message", d), "jQuery" in window && n(jQuery), "function" == typeof define && define.amd ? define(function () { return m() }) : window.iFrameResize = m() }();

function urlParam(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

var url = urlParam("url"), appName;

window.getMyCookie = function (cname) {
    return cookieHelper.getMyCookie(cname);
};

window.setMyCookie = function(cname, cvalue, exdays) {
    cookieHelper.setMyCookie(cname, cvalue, exdays);
};

window.getMyPosition = function(str, m, i) {
   return str.split(m, i).join(m).length;
};

window.getMyAppName = function (){
      var appName = url.substring(url.indexOf("//")+2);
      appName = appName.substring(0,getMyPosition(appName, "/",2));
      return appName;
};


window.getIframeSetting = function(){
	var setting = {
		checkOrigin : false,		
		log : false,
		minHeight: 700,
		heightCalculationMethod: "bodyScroll"
	};
	var val = urlParam('hdrChkOrg');
	if(val != null && val != ''){
		setting.checkOrigin = val;
	}
	val = urlParam('hdrLog');
	if(val != null && val != ''){
		setting.log = val;
	}
	val = urlParam('minHt');
	if(val != null && val != ''){
		setting.minHeight = val;
	}
	val = urlParam("htMethod");
	if(val != null && val != ''){
		setting.heightCalculationMethod = val;
	}	
	return setting;
};

$(document).ready(function () {
	
	var contentFrameElem = $("#contentFrame");
	if(contentFrameElem != null){   
		appName = getMyAppName();
		  
		var myCookieVal = getMyCookie(appName+"WWLWebTemplate");
        myCookieVal = "Y"; // To fix issue: Doesn't load the iFrame till there is a cookie name, xxxWWLWeb

	    var currentUrl = contentFrameElem.attr("src");		
		var frameURL  = getFrameURL();		

	    if (myCookieVal == "" || currentUrl == "about:blank" 
				|| ( currentUrl != null && currentUrl != undefined && currentUrl.indexOf("/dummy.html") != -1) ){
			setMyCookie(appName+"WWLWebTemplate", "Y" , 0);
			$("#contentFrame").attr("src", frameURL);
		}	
		
		var iFrameSetting = getIframeSetting();
        $('#contentFrame').iFrameResize({
            checkOrigin: iFrameSetting.checkOrigin,
            minHeight: iFrameSetting.minHeight,
            log: iFrameSetting.log,
            heightCalculationMethod: iFrameSetting.heightCalculationMethod
        });
	}
});

window.getFrameURL = function() {	
	var frameURL = url;
	var winName = populateWindowName();
	var cookieCurrURL = getMyCookie(appName+winName+"WWLWebTemplateCurrURL");
	var cookieFrameId = getMyCookie(appName+winName+"WWLWebTemplateFrameID");
	var frameId  =  urlParam('frameId');
	if(cookieFrameId == undefined || cookieFrameId =='' || cookieFrameId != frameId ){
		frameURL = url;
		setMyCookie(appName+winName+"WWLWebTemplateFrameID", frameId , 0);
	}else if(cookieCurrURL != ''){
		frameURL = cookieCurrURL;
	}	
	return frameURL;
};


window.populateWindowName = function() {
	var winName = window.name;
	if(winName==''){
		var today  = new Date();
		var currTimeStr  = today.getTime()+"_"+Math.random();
		window.name  = currTimeStr;
		winName =  currTimeStr;
	}
	return winName;
};

window.changePage = function(url) {
	var appName = getMyAppName();
	var winName = populateWindowName();	
	setMyCookie(appName+winName+"WWLWebTemplateCurrURL", decodeURIComponent(url.replace(/\+/g, " ")) , 0);
    // window.app_router.navigate("currentPage/" + url, { trigger: false, replace: true });
};

window.updateTitle = function (title) {
    document.title = title;
};

window.showSpinner = function (timeout) {
    $("#loading-div-background").show();

    window.spinner.spin($("#loading-div-background")[0]);

    if (timeout == undefined) {
        timeout = 15;
    }

    var num = new Number(timeout);

    setTimeout(function () {
        hideSpinner();
    }, num * 1000);

};

window.hideSpinner = function () {
    $("#loading-div-background").hide();
    window.spinner.stop();
};
window.logout = function(){
	loginStatus.logout();
};

window.logoutParent = function(){
	loginStatus.logoutParent();
};

window.updateUserName = function (firstName, sgToken) {
    loginStatus.updateUserName(firstName, sgToken);
};

window.sendLocation = function () {
    var requestLocation = $('.js-requestLocation').attr('data-countryCode');
	requestLocation = requestLocation ? requestLocation : 'GBL';
    if (requestLocation) {
        sendMessageToChildwindow(requestLocation, 'userLocationReceived');
    }
}

function sendMessageToChildwindow(message, command) {
    window.document.getElementById('contentFrame').contentWindow.postMessage(JSON.stringify({ cmd: command, msg: message }), "*");
}

window.onIFrameLoaded = function () {
    window.hideSpinner();
}

window.setCookieConcent = function(consent){
	cookieHelper._setMyCookieExpiry("CookieConsent", true , 365);
	$('.cookie-consent-wrapper').hide();
	return;
}

window.sendCookieConcentChild = function(consent, command){
	window.document.getElementById('contentFrame').contentWindow.postMessage(JSON.stringify({ cmd: command, msg: consent }), "*");
}

window.sendConsentCookie = function(){
	var cookie_Consent=null;
	if(window.getMyCookie("CookieConsent") != undefined) {
		cookie_Consent=window.getMyCookie("CookieConsent");	
	}
	window.document.getElementById('contentFrame').contentWindow.postMessage(JSON.stringify({ cmd: 'CookieConsent', msg: cookie_Consent }), "*");
}


window.onload = function () {
    // Get a reference to the div on the page that will display the
    // message text.
    // var messageEle = document.getElementById('message');

    // A function to process messages received by the window.
    function receiveMessage(e) {
        // Check to make sure that this message came from the correct domain.

        // Update the div element to display the message.
        //messageEle.innerHTML = "Message Received: " + e.data;

        try {
            var message = JSON.parse(e.data);
        }
        catch (exception) {
            return;
        }

        if (message.cmd == undefined) return;
		
        switch (message.cmd) {			
            case "changePage":
                window.changePage(message.url);
                break;
            case "updateTitle":
                window.updateTitle(message.title);
                break;
            case "showSpinner":
                window.showSpinner(message.timeout);
                break;
            case "hideSpinner":
                window.hideSpinner();
                break;
			case "closeWindow":
                window.close();
                break;
            case "message":
                window.opener.parent.sendMessageToChildwindow(message, "callErrorDiv");
                break;
			case "updateUserName":
				window.updateUserName(message.firstName, message.sgToken);
                break;
			case "logoutParent" :
				window.logoutParent();
                break;
			case "CookieConsent" :
				window.sendConsentCookie();
				break;
            default:
                break;
        }

    }

    // Setup an event listener that calls receiveMessage() when the window
    // receives a new MessageEvent.
    window.addEventListener('message', receiveMessage);
	
	//logic to set favicon image dynamically for schedules and my portal app	
	function updateFavicon(){
		var flag = false;
		var baseURL="";
		var currentURL = window.getMyAppName();
		var currentURLTemp = currentURL.replace("beta.2wglobal",".2wglobal").replace("dev.2wglobal",".2wglobal");
		var urls = [
			'schedule.2wglobal.com',
			'myportal.2wglobal.com'
		];
		
		urls.forEach(function(url) {
			if(currentURLTemp.indexOf(url) != -1){
				flag = true;
				baseURL = window.location.protocol+'//'+currentURL;
			}			
		});
		
		if(flag){
			var link = document.createElement('link');
				link.rel = 'apple-touch-icon';
				link.href =baseURL+'/apple-touch-icon.png';
			var link1= document.createElement('link');
				link1.rel = 'apple-touch-icon-precomposed';
				link1.href=baseURL+'/apple-touch-icon.png';
			var link2= document.createElement('link');
				link2.rel = 'apple-touch-icon';
				link2.href=baseURL+'/apple-touch-icon-57x57-precomposed.png';
			var link3= document.createElement('link');
				link3.rel = 'apple-touch-icon';
				link3.href=baseURL+'/apple-touch-icon-72x72-precomposed.png';
				link3.sizes='72x72';
			var link4= document.createElement('link');
				link4.rel = 'apple-touch-icon';		
				link4.href=baseURL+'/apple-touch-icon-114x114-precomposed.png';
				link4.sizes='114x114';	

			document.getElementsByTagName('head')[0].appendChild(link);
			document.getElementsByTagName('head')[0].appendChild(link1);
			document.getElementsByTagName('head')[0].appendChild(link2);
			document.getElementsByTagName('head')[0].appendChild(link3);
			document.getElementsByTagName('head')[0].appendChild(link4);
		}
	}

	updateFavicon();

	window.sendLocation();
	
	window.sendCookieConcentChild('Allow','setCookieConcentChild');
}
