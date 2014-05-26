var w2ui  = w2ui  || {};
var w2obj = w2obj || {}; // expose object to be able to overwrite default functions

/************************************************
*   Library: Web 2.0 UI for jQuery
*   - Following objects are defines
*   	- w2ui 				- object that will contain all widgets
*		- w2obj				- object with widget prototypes
*		- w2utils 			- basic utilities
*		- $().w2render		- common render
*		- $().w2destroy		- common destroy
*		- $().w2marker		- marker plugin
*		- $().w2tag			- tag plugin
*		- $().w2overlay		- overlay plugin
*		- $().w2menu		- menu plugin
*		- w2utils.event		- generic event object
*		- w2utils.keyboard	- object for keyboard navigation
*   - Dependencies: jQuery
*
* == NICE TO HAVE ==
*	- date has problems in FF new Date('yyyy-mm-dd') breaks
*	- bug: w2utils.formatDate('2011-31-01', 'yyyy-dd-mm'); - wrong foratter
*	- overlay should be displayed where more space (on top or on bottom)
* 	- write and article how to replace certain framework functions
*	- format date and time is buggy
*	- onComplete should pass widget as context (this)
*
************************************************/

var w2utils = (function () {
	var tmp = {}; // for some temp variables
	var obj = {
		settings : {
			"locale"		: "en-us",
			"date_format"	: "m/d/yyyy",
			"date_display"	: "Mon d, yyyy",
			"time_format"	: "hh:mi pm",
			"currency"		: "^[\$\€\£\¥]?[-]?[0-9]*[\.]?[0-9]+$",
			"currencySymbol": "$",
			"float"			: "^[-]?[0-9]*[\.]?[0-9]+$",
			"shortmonths"	: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			"fullmonths"	: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			"shortdays"		: ["M", "T", "W", "T", "F", "S", "S"],
			"fulldays" 		: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			"RESTfull"		: false,
			"phrases"		: {} // empty object for english phrases
		},
		isInt			: isInt,
		isFloat			: isFloat,
		isMoney			: isMoney,
		isHex			: isHex,
		isAlphaNumeric	: isAlphaNumeric,
		isEmail			: isEmail,
		isDate			: isDate,
		isTime			: isTime,
		age 			: age,
		date 			: date,
		size 			: size,
		formatNumber	: formatNumber,
		formatDate		: formatDate,
		formatTime  	: formatTime,
		formatDateTime  : formatDateTime,
		stripTags		: stripTags,
		encodeTags		: encodeTags,
		escapeId		: escapeId,
		base64encode	: base64encode,
		base64decode	: base64decode,
		transition		: transition,
		lock			: lock,
		unlock			: unlock,
		lang 			: lang,
		locale	 		: locale,
		getSize			: getSize,
		scrollBarSize	: scrollBarSize
	}
	return obj;
	
	function isInt (val) {
		var re =  /^[-]?[0-9]+$/;
		return re.test(val);		
	}
		
	function isFloat (val) {
		var re =  new RegExp(w2utils.settings["float"]);
		return re.test(val);		
	}

	function isMoney (val) {
		var re =  new RegExp(w2utils.settings.currency);
		return re.test(val);		
	}
		
	function isHex (val) {
		var re =  /^[a-fA-F0-9]+$/;
		return re.test(val);		
	}
	
	function isAlphaNumeric (val) {
		var re =  /^[a-zA-Z0-9_-]+$/;
		return re.test(val);		
	}
	
	function isEmail (val) {
		var email = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
		return email.test(val); 
	}

	function isDate (val, format, retDate) {
		if (!val) return false;
		if (!format) format = w2utils.settings.date_format;
		// format date
		var tmp  = val.replace(/-/g, '/').replace(/\./g, '/').toLowerCase().split('/');
		var tmp2 = format.replace(/-/g, '/').replace(/\./g, '/').toLowerCase();
		var dt   = 'Invalid Date';
		var month, day, year;
		if (tmp2 == 'mm/dd/yyyy') { month = tmp[0]; day = tmp[1]; year = tmp[2]; }
		if (tmp2 == 'm/d/yyyy')   { month = tmp[0]; day = tmp[1]; year = tmp[2]; }
		if (tmp2 == 'dd/mm/yyyy') { month = tmp[1]; day = tmp[0]; year = tmp[2]; }
		if (tmp2 == 'd/m/yyyy')   { month = tmp[1]; day = tmp[0]; year = tmp[2]; }
		if (tmp2 == 'yyyy/dd/mm') { month = tmp[2]; day = tmp[1]; year = tmp[0]; } 
		if (tmp2 == 'yyyy/d/m')   { month = tmp[2]; day = tmp[1]; year = tmp[0]; } 
		if (tmp2 == 'yyyy/mm/dd') { month = tmp[1]; day = tmp[2]; year = tmp[0]; } 
		if (tmp2 == 'yyyy/m/d')   { month = tmp[1]; day = tmp[2]; year = tmp[0]; } 
		dt = new Date(month + '/' + day + '/' + year);
		// do checks
		if (typeof month == 'undefined') return false;
		if (dt == 'Invalid Date') return false;
		if ((dt.getMonth()+1 != month) || (dt.getDate() != day) || (dt.getFullYear() != year)) return false;
		if (retDate === true) return dt; else return true;
	}

	function isTime (val) {
		// Both formats 10:20pm and 22:20
		if (String(val) == 'undefined') return false;
		var max;
		// -- process american foramt
		val = val.toUpperCase();
		if (val.indexOf('PM') >= 0 || val.indexOf('AM') >= 0) max = 12; else max = 23;
		val = $.trim(val.replace('AM', ''));
		val = $.trim(val.replace('PM', ''));
		// ---
		var tmp = val.split(':');
		if (tmp.length != 2) { return false; }
		if (tmp[0] == '' || parseInt(tmp[0]) < 0 || parseInt(tmp[0]) > max || !this.isInt(tmp[0])) { return false; }
		if (tmp[1] == '' || parseInt(tmp[1]) < 0 || parseInt(tmp[1]) > 59 || !this.isInt(tmp[1])) { return false; }
		return true;
	}

	function age (timeStr) {
		if (timeStr == '' || typeof timeStr == 'undefined' || timeStr == null) return '';
		if (w2utils.isInt(timeStr)) timeStr = Number(timeStr); // for unix timestamps
		
		var d1 = new Date(timeStr);
		if (w2utils.isInt(timeStr)) d1 = new Date(Number(timeStr)); // for unix timestamps
		var tmp = String(timeStr).split('-');
		if (tmp.length == 3) d1 = new Date(tmp[0], Number(tmp[1])-1, tmp[2]); // yyyy-mm-dd
		var tmp = String(timeStr).split('/');
		if (tmp.length == 3) d1 = new Date(tmp[2], Number(tmp[0])-1, tmp[1]); // mm/dd/yyyy
		if (d1 == 'Invalid Time') return '';

		var d2  = new Date();
		var sec = (d2.getTime() - d1.getTime()) / 1000;
		var amount = '';
		var type   = '';
		
		if (sec < 60) {
			amount = Math.floor(sec);
			type   = 'sec';
			if (sec < 0) { amount = 0; type = 'sec' }
		} else if (sec < 60*60) {
			amount = Math.floor(sec/60);
			type   = 'min';
		} else if (sec < 24*60*60) {
			amount = Math.floor(sec/60/60);
			type   = 'hour';
		} else if (sec < 30*24*60*60) {
			amount = Math.floor(sec/24/60/60);
			type   = 'day';
		} else if (sec < 12*30*24*60*60) {
			amount = Math.floor(sec/30/24/60/60*10)/10;
			type   = 'month';
		} else if (sec >= 12*30*24*60*60) {
			amount = Math.floor(sec/12/30/24/60/60*10)/10;
			type   = 'year';
		}		
		return amount + ' ' + type + (amount > 1 ? 's' : '');
	}	
		
	function date (dateStr) {
		var months = w2utils.settings.shortmonths;
		if (dateStr == '' || typeof dateStr == 'undefined' || dateStr == null) return '';
		if (w2utils.isInt(dateStr)) dateStr = Number(dateStr); // for unix timestamps
		
		var d1 = new Date(dateStr);
		if (w2utils.isInt(dateStr)) d1 = new Date(Number(dateStr)); // for unix timestamps
		var tmp = String(dateStr).split('-');
		if (tmp.length == 3) d1 = new Date(tmp[0], Number(tmp[1])-1, tmp[2]); // yyyy-mm-dd
		var tmp = String(dateStr).split('/');
		if (tmp.length == 3) d1 = new Date(tmp[2], Number(tmp[0])-1, tmp[1]); // mm/dd/yyyy
		if (d1 == 'Invalid Date') return '';

		var d2   = new Date(); // today
		var d3   = new Date(); 
		d3.setTime(d3.getTime() - 86400000); // yesterday
		
		var dd1  = months[d1.getMonth()] + ' ' + d1.getDate() + ', ' + d1.getFullYear();
		var dd2  = months[d2.getMonth()] + ' ' + d2.getDate() + ', ' + d2.getFullYear();
		var dd3  = months[d3.getMonth()] + ' ' + d3.getDate() + ', ' + d3.getFullYear();
		
		var time = (d1.getHours() - (d1.getHours() > 12 ? 12 :0)) + ':' + (d1.getMinutes() < 10 ? '0' : '') + d1.getMinutes() + ' ' + (d1.getHours() >= 12 ? 'pm' : 'am');
		var time2= (d1.getHours() - (d1.getHours() > 12 ? 12 :0)) + ':' + (d1.getMinutes() < 10 ? '0' : '') + d1.getMinutes() + ':' + (d1.getSeconds() < 10 ? '0' : '') + d1.getSeconds() + ' ' + (d1.getHours() >= 12 ? 'pm' : 'am');
		var dsp = dd1;
		if (dd1 == dd2) dsp = time;
		if (dd1 == dd3) dsp = w2utils.lang('Yesterday');

		return '<span title="'+ dd1 +' ' + time2 +'">'+ dsp +'</span>';
	}

	function size (sizeStr) {
		if (!w2utils.isFloat(sizeStr) || sizeStr == '') return '';
		sizeStr = parseFloat(sizeStr);
		if (sizeStr == 0) return 0;
		var sizes = ['Bt', 'KB', 'MB', 'GB', 'TB'];
		var i = parseInt( Math.floor( Math.log(sizeStr) / Math.log(1024) ) );
		return (Math.floor(sizeStr / Math.pow(1024, i) * 10) / 10).toFixed(i == 0 ? 0 : 1) + ' ' + sizes[i];
	}

	function formatNumber (val) {
		var ret = '';
		// check if this is a number
		if (w2utils.isFloat(val) || w2utils.isInt(val) || w2utils.isMoney(val)) {
			ret = String(val).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
		}
		return ret;
	}
	
	function formatDate (dateStr, format) { // IMPORTANT dateStr HAS TO BE valid JavaScript Date String
		var months = w2utils.settings.shortmonths;
		var fullMonths = w2utils.settings.fullmonths;
		if (typeof format == 'undefined') format = this.settings.date_format;
		if (typeof dateStr == 'undefined' || dateStr == '' || dateStr == null) return '';

		var dt = new Date(dateStr);
		if (w2utils.isInt(dateStr)) dt = new Date(Number(dateStr)); // for unix timestamps
		var tmp = String(dateStr).split('-');
		if (tmp.length == 3) dt = new Date(tmp[0], Number(tmp[1])-1, tmp[2]); // yyyy-mm-dd
		var tmp = String(dateStr).split('/');
		if (tmp.length == 3) dt = new Date(tmp[2], Number(tmp[0])-1, tmp[1]); // mm/dd/yyyy
		if (dt == 'Invalid Date') return '';

		var year 	= dt.getFullYear();
		var month 	= dt.getMonth();
		var date 	= dt.getDate();
		return format.toLowerCase()
			.replace('month', w2utils.settings.fullmonths[month])
			.replace('mon', w2utils.settings.shortmonths[month])
			.replace(/yyyy/g, year)
			.replace(/yyy/g, year)
			.replace(/yy/g, String(year).substr(2))
			.replace(/(^|[^a-z$])y/g, '$1'+year) 			// only y's that are not preceeded by a letter
			.replace(/mm/g, (month + 1 < 10 ? '0' : '') + (month + 1))
			.replace(/dd/g, (date < 10 ? '0' : '') + date)
			.replace(/(^|[^a-z$])m/g, '$1'+ (month + 1)) 	// only y's that are not preceeded by a letter
			.replace(/(^|[^a-z$])d/g, '$1' + date); 		// only y's that are not preceeded by a letter
	}


	function formatTime (dateStr, format) { // IMPORTANT dateStr HAS TO BE valid JavaScript Date String
		var months = w2utils.settings.shortmonths;
		var fullMonths = w2utils.settings.fullmonths;
		if (typeof format == 'undefined') format = this.settings.time_format;
		if (typeof dateStr == 'undefined' || dateStr == '' || dateStr == null) return '';

		var dt = new Date(dateStr);
		if (w2utils.isInt(dateStr)) dt = new Date(Number(dateStr)); // for unix timestamps
		if (dt == 'Invalid Date') return '';

		var type = 'am';
		var hour = dt.getHours();
		var h24  = dt.getHours();
		var min  = dt.getMinutes();
		var sec  = dt.getSeconds();
		if (min < 10) min = '0' + min;
		if (sec < 10) sec = '0' + sec;
		if (format.indexOf('am') != -1 || format.indexOf('pm') != -1) {
			if (hour >= 12) type = 'pm'; 
			if (hour > 12)  hour = hour - 12;
		}
		return format.toLowerCase()
			.replace('am', type)
			.replace('pm', type)
			.replace('hh', hour)
			.replace('h24', h24)
			.replace('mm', min)
			.replace('mi', min)
			.replace('ss', sec)
			.replace(/(^|[^a-z$])h/g, '$1' + hour) 	// only y's that are not preceeded by a letter
			.replace(/(^|[^a-z$])m/g, '$1' + min) 	// only y's that are not preceeded by a letter
			.replace(/(^|[^a-z$])s/g, '$1' + sec); 	// only y's that are not preceeded by a letter
	}

	function formatDateTime(dateStr, format) {
		var fmt;
		if (typeof format != 'string') {
			var fmt = [this.settings.date_format, this.settings.time_format];
		} else {
			var fmt = format.split('|');
		}
		return this.formatDate(dateStr, fmt[0]) + ' ' + this.formatTime(dateStr, fmt[1]);
	}

	function stripTags (html) {
		if (html == null) return html;
		switch (typeof html) {
			case 'number':
				break;
			case 'string':
				html = $.trim(String(html).replace(/(<([^>]+)>)/ig, ""));
				break;
			case 'object':
				for (var a in html) html[a] = this.stripTags(html[a]);
				break;
		}
		return html;
	}

	function encodeTags (html) {
		if (html == null) return html;
		switch (typeof html) {
			case 'number':
				break;
			case 'string':
				html = String(html).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
				break;
			case 'object':
				for (var a in html) html[a] = this.encodeTags(html[a]);
				break;
		}
		return html;
	}

	function escapeId (id) {
		if (typeof id == 'undefined' || id == '' || id == null) return '';
		return String(id).replace(/([;&,\.\+\*\~'`:"\!\^#$%@\[\]\(\)=<>\|\/? {}\\])/g, '\\$1');
	}

	function base64encode (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
		var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		input = utf8_encode(input);

		while (i < input.length) {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
			output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
		}

		function utf8_encode (string) {
			var string = String(string).replace(/\r\n/g,"\n");
			var utftext = "";

			for (var n = 0; n < string.length; n++) {
				var c = string.charCodeAt(n);
				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}
			}
			return utftext;
		}

		return output;
	}

	function base64decode (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		while (i < input.length) {
			enc1 = keyStr.indexOf(input.charAt(i++));
			enc2 = keyStr.indexOf(input.charAt(i++));
			enc3 = keyStr.indexOf(input.charAt(i++));
			enc4 = keyStr.indexOf(input.charAt(i++));
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
			output = output + String.fromCharCode(chr1);
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
		}
		output = utf8_decode(output);

		function utf8_decode (utftext) {
			var string = "";
			var i = 0;
			var c = 0, c1 = 0, c2 = 0;

			while ( i < utftext.length ) {
				c = utftext.charCodeAt(i);
				if (c < 128) {
					string += String.fromCharCode(c);
					i++;
				}
				else if((c > 191) && (c < 224)) {
					c2 = utftext.charCodeAt(i+1);
					string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
					i += 2;
				}
				else {
					c2 = utftext.charCodeAt(i+1);
					c3 = utftext.charCodeAt(i+2);
					string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
					i += 3;
				}
			}

			return string;
		}

		return output;
	}
	
	function transition (div_old, div_new, type, callBack) {
		var width  = $(div_old).width();
		var height = $(div_old).height();
		var time   = 0.5;
				
		if (!div_old || !div_new) {
			console.log('ERROR: Cannot do transition when one of the divs is null');
			return;
		}
		 
		div_old.parentNode.style.cssText += cross('perspective', '700px') +'; overflow: hidden;';
		div_old.style.cssText += '; position: absolute; z-index: 1019; '+ cross('backface-visibility', 'hidden');
		div_new.style.cssText += '; position: absolute; z-index: 1020; '+ cross('backface-visibility', 'hidden');
		
		switch (type) {
			case 'slide-left':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d('+ width + 'px, 0, 0)', 'translate('+ width +'px, 0)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +';'+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
					div_old.style.cssText += cross('transition', time+'s') +';'+ cross('transform', 'translate3d(-'+ width +'px, 0, 0)', 'translate(-'+ width +'px, 0)');
				}, 1);
				break;

			case 'slide-right':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(-'+ width +'px, 0, 0)', 'translate(-'+ width +'px, 0)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'translate3d(0px, 0, 0)', 'translate(0px, 0)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'translate3d('+ width +'px, 0, 0)', 'translate('+ width +'px, 0)');
				}, 1);
				break;

			case 'slide-down':
				// init divs
				div_old.style.cssText += 'overflow: hidden; z-index: 1; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				div_new.style.cssText += 'overflow: hidden; z-index: 0; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'translate3d(0, '+ height +'px, 0)', 'translate(0, '+ height +'px)');
				}, 1);
				break;

			case 'slide-up':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, '+ height +'px, 0)', 'translate(0, '+ height +'px)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				}, 1);
				break;

			case 'flip-left':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('-transform', 'rotateY(0deg)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateY(-180deg)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateY(0deg)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateY(180deg)');
				}, 1);
				break;

			case 'flip-right':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateY(0deg)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateY(180deg)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateY(0deg)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateY(-180deg)');
				}, 1);
				break;

			case 'flip-down':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateX(0deg)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateX(180deg)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateX(0deg)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateX(-180deg)');
				}, 1);
				break;

			case 'flip-up':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateX(0deg)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateX(-180deg)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateX(0deg)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateX(180deg)');
				}, 1);
				break;

			case 'pop-in':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)') + '; '+ cross('transform', 'scale(.8)') + '; opacity: 0;';
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'scale(1)') +'; opacity: 1;';
					div_old.style.cssText += cross('transition', time+'s') +';';
				}, 1);
				break;

			case 'pop-out':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)') +'; '+ cross('transform', 'scale(1)') +'; opacity: 1;';
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)') +'; opacity: 0;';
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; opacity: 1;';
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'scale(1.7)') +'; opacity: 0;';
				}, 1);
				break;

			default:
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)') +'; opacity: 0;';
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time +'s') +'; opacity: 1;';
					div_old.style.cssText += cross('transition', time +'s');
				}, 1);
				break;
		}
		
		setTimeout(function () {
			if (type == 'slide-down') {
				$(div_old).css('z-index', '1019');
				$(div_new).css('z-index', '1020');
			}
			if (div_new) {
				$(div_new).css({ 
					'opacity': '1', 
					'-webkit-transition': '', 
					'-moz-transition': '', 
					'-ms-transition': '', 
					'-o-transition': '', 
					'-webkit-transform': '', 
					'-moz-transform': '', 
					'-ms-transform': '', 
					'-o-transform': '', 
					'-webkit-backface-visibility': '', 
					'-moz-backface-visibility': '', 
					'-ms-backface-visibility': '', 
					'-o-backface-visibility': '' 
				});
			}
			if (div_old) {
				$(div_old).css({ 
					'opacity': '1', 
					'-webkit-transition': '', 
					'-moz-transition': '', 
					'-ms-transition': '', 
					'-o-transition': '', 
					'-webkit-transform': '', 
					'-moz-transform': '', 
					'-ms-transform': '', 
					'-o-transform': '', 
					'-webkit-backface-visibility': '', 
					'-moz-backface-visibility': '', 
					'-ms-backface-visibility': '', 
					'-o-backface-visibility': '' 
				});
				if (div_old.parentNode) $(div_old.parentNode).css({
					'-webkit-perspective': '',
					'-moz-perspective': '',
					'-ms-perspective': '',
					'-o-perspective': ''
				});
			}
			if (typeof callBack == 'function') callBack();
		}, time * 1000);
		
		function cross(property, value, none_webkit_value) {
			var isWebkit=!!window.webkitURL; // jQuery no longer supports $.browser - RR
			if (!isWebkit && typeof none_webkit_value != 'undefined') value = none_webkit_value;
			return ';'+ property +': '+ value +'; -webkit-'+ property +': '+ value +'; -moz-'+ property +': '+ value +'; '+
				   '-ms-'+ property +': '+ value +'; -o-'+ property +': '+ value +';';
		}
	}
	
	function lock (box, msg, showSpinner) {
		if (!msg && msg != 0) msg = '';
		w2utils.unlock(box);
		$(box).find('>:first-child').before(
			'<div class="w2ui-lock"></div>'+
			'<div class="w2ui-lock-msg"></div>'
		);
		setTimeout(function () {
			var lock = $(box).find('.w2ui-lock');
			var mess = $(box).find('.w2ui-lock-msg');
			lock.data('old_opacity', lock.css('opacity')).css('opacity', '0').show();
			mess.data('old_opacity', mess.css('opacity')).css('opacity', '0').show();
			setTimeout(function () {
				var lock = $(box).find('.w2ui-lock');
				var mess = $(box).find('.w2ui-lock-msg');
				var left = ($(box).width()  - w2utils.getSize(mess, 'width')) / 2;
				var top  = ($(box).height() * 0.9 - w2utils.getSize(mess, 'height')) / 2;
				lock.css({
					opacity : lock.data('old_opacity'),
					left 	: '0px',
					top 	: '0px',
					width 	: '100%',
					height 	: '100%'
				});
				if (!msg) mess.css({ 'background-color': 'transparent', 'border': '0px' }); 
				if (showSpinner === true) msg = '<div class="w2ui-spinner" '+ (!msg ? 'style="width: 30px; height: 30px"' : '') +'></div>' + msg;
				mess.html(msg).css({
					opacity : mess.data('old_opacity'),
					left	: left + 'px',
					top		: top + 'px'
				});
			}, 10);
		}, 10);
		// hide all tags (do not hide overlays as the form can be in overlay)
		$().w2tag();
	}

	function unlock (box) { 
		$(box).find('.w2ui-lock').remove();
		$(box).find('.w2ui-lock-msg').remove();
	}

	function getSize (el, type) {
		var bwidth = {
			left: 	parseInt($(el).css('border-left-width')) || 0,
			right:  parseInt($(el).css('border-right-width')) || 0,
			top:  	parseInt($(el).css('border-top-width')) || 0,
			bottom: parseInt($(el).css('border-bottom-width')) || 0
		}
		var mwidth = {
			left: 	parseInt($(el).css('margin-left')) || 0,
			right:  parseInt($(el).css('margin-right')) || 0,
			top:  	parseInt($(el).css('margin-top')) || 0,
			bottom: parseInt($(el).css('margin-bottom')) || 0
		}
		var pwidth = {
			left: 	parseInt($(el).css('padding-left')) || 0,
			right:  parseInt($(el).css('padding-right')) || 0,
			top:  	parseInt($(el).css('padding-top')) || 0,
			bottom: parseInt($(el).css('padding-bottom')) || 0
		}
		switch (type) {
			case 'top': 	return bwidth.top + mwidth.top + pwidth.top; 
			case 'bottom': 	return bwidth.bottom + mwidth.bottom + pwidth.bottom; 
			case 'left': 	return bwidth.left + mwidth.left + pwidth.left; 
			case 'right': 	return bwidth.right + mwidth.right + pwidth.right; 
			case 'width': 	return bwidth.left + bwidth.right + mwidth.left + mwidth.right + pwidth.left + pwidth.right + parseInt($(el).width()); 
			case 'height': 	return bwidth.top + bwidth.bottom + mwidth.top + mwidth.bottom + pwidth.top + pwidth.bottom + parseInt($(el).height());
			case '+width': 	return bwidth.left + bwidth.right + mwidth.left + mwidth.right + pwidth.left + pwidth.right; 
			case '+height': return bwidth.top + bwidth.bottom + mwidth.top + mwidth.bottom + pwidth.top + pwidth.bottom;
		}
		return 0;
	}

	function lang (phrase) {
		var translation = this.settings.phrases[phrase];
		if (typeof translation == 'undefined') return phrase; else return translation;
	}

	function locale (locale) {
		if (!locale) locale = 'en-us';
		if (locale.length == 5) locale = 'locale/'+ locale +'.json';
		// load from the file
		$.ajax({
			url		: locale,
			type	: "GET",
			dataType: "JSON",
			async	: false,
			cache 	: false,
			success : function (data, status, xhr) {
				w2utils.settings = $.extend(true, w2utils.settings, data);
			},
			error	: function (xhr, status, msg) {
				console.log('ERROR: Cannot load locale '+ locale);
			}
		});
	}

	function scrollBarSize () {
		if (tmp.scrollBarSize) return tmp.scrollBarSize; 
		var html = '<div id="_scrollbar_width" style="position: absolute; top: -300px; width: 100px; height: 100px; overflow-y: scroll;">'+
				   '	<div style="height: 120px">1</div>'+
				   '</div>';
		$('body').append(html);
		tmp.scrollBarSize = 100 - $('#_scrollbar_width > div').width();
		$('#_scrollbar_width').remove();
		if (String(navigator.userAgent).indexOf('MSIE') >= 0) tmp.scrollBarSize  = tmp.scrollBarSize / 2; // need this for IE9+
		return tmp.scrollBarSize;
	}

})();

/***********************************************************
*  Generic Event Object
*  --- This object is reused across all other 
*  --- widgets in w2ui.
*
*********************************************************/

w2utils.event = {

	on: function (eventData, handler) {
		if (!$.isPlainObject(eventData)) eventData = { type: eventData };
		eventData = $.extend({ type: null, execute: 'before', target: null, onComplete: null }, eventData);
		
		if (typeof eventData.type == 'undefined') { console.log('ERROR: You must specify event type when calling .on() method of '+ this.name); return; }
		if (typeof handler == 'undefined') { console.log('ERROR: You must specify event handler function when calling .on() method of '+ this.name); return; }
		this.handlers.push({ event: eventData, handler: handler });
	},
	
	off: function (eventData, handler) {
		if (!$.isPlainObject(eventData)) eventData = { type: eventData };
		eventData = $.extend({}, { type: null, execute: 'before', target: null, onComplete: null }, eventData);
	
		if (typeof eventData.type == 'undefined') { console.log('ERROR: You must specify event type when calling .off() method of '+ this.name); return; }
		if (typeof handler == 'undefined') { handler = null;  }
		// remove handlers
		var newHandlers = [];
		for (var h in this.handlers) {
			var t = this.handlers[h];
			if ( (t.event.type == eventData.type || eventData.type == '*')
				&& (t.event.target == eventData.target || eventData.target == null) 
				&& (t.handler == handler || handler == null)) {
				// match
			} else {
				newHandlers.push(t);
			}
		}		
		this.handlers = newHandlers;
	},
		
	trigger: function (eventData) {
		var eventData = $.extend({ type: null, phase: 'before', target: null, isStopped: false, isCancelled: false }, eventData, {
				preventDefault 	: function () { this.isCancelled = true; },
				stopPropagation : function () { this.isStopped   = true; },
			});
		if (typeof eventData.target == 'undefined') eventData.target = null;		
		// process events in REVERSE order 
		for (var h = this.handlers.length-1; h >= 0; h--) {
			var item = this.handlers[h];
			if ( (item.event.type == eventData.type || item.event.type == '*') 
					&& (item.event.target == eventData.target || item.event.target == null)
					&& (item.event.execute == eventData.phase || item.event.execute == '*' || item.event.phase == '*') ) {
				eventData = $.extend({}, item.event, eventData);
				// check handler arguments
				var args = [];
				var tmp  = RegExp(/\((.*?)\)/).exec(item.handler);
				if (tmp) args = tmp[1].split(/\s*,\s*/);
				if (args.length == 2) {
					item.handler.call(this, eventData.target, eventData); // old way for back compatibility
				} else {
					item.handler.call(this, eventData); // new way
				}
				if (eventData.isStopped === true || eventData.stop === true) return eventData; // back compatibility eventData.stop === true
			}
		}		
		// main object events
		var funName = 'on' + eventData.type.substr(0,1).toUpperCase() + eventData.type.substr(1);
		if (eventData.phase == 'before' && typeof this[funName] == 'function') {
			var fun = this[funName];
			// check handler arguments
			var args = [];
			var tmp  = RegExp(/\((.*?)\)/).exec(fun);
			if (tmp) args = tmp[1].split(/\s*,\s*/);
			if (args.length == 2) {
				fun.call(this, eventData.target, eventData); // old way for back compatibility
			} else {
				fun.call(this, eventData); // new way
			}
			if (eventData.isStopped === true || eventData.stop === true) return eventData; // back compatibility eventData.stop === true
		}
		// item object events
		if (typeof eventData.object != 'undefined' && eventData.object != null && eventData.phase == 'before'
				&& typeof eventData.object[funName] == 'function') {
			var fun = eventData.object[funName];
			// check handler arguments
			var args = [];
			var tmp  = RegExp(/\((.*?)\)/).exec(fun);
			if (tmp) args = tmp[1].split(/\s*,\s*/);
			if (args.length == 2) {
				fun.call(this, eventData.target, eventData); // old way for back compatibility
			} else {
				fun.call(this, eventData); // new way
			}
			if (eventData.isStopped === true || eventData.stop === true) return eventData; 
		}
		// execute onComplete
		if (eventData.phase == 'after' && eventData.onComplete != null)	eventData.onComplete.call(this, eventData);
	
		return eventData;
	}
};

/***********************************************************
*  Common Keyboard Handler. Supported in
*  - grid
*  - sidebar
*  - popup
*
*********************************************************/

w2utils.keyboard = (function (obj) {
	// private scope
	var w2ui_name = null;

	obj.active	 	= active;
	obj.clear 		= clear;
	obj.register	= register;

	init();
	return obj;

	function init() {
		$(document).on('keydown', keydown);
		$(document).on('mousedown', mousedown);
	}

	function keydown (event) {
		var tag = event.target.tagName;
		if ($.inArray(tag, ['INPUT', 'SELECT', 'TEXTAREA']) != -1) return;
		if ($(event.target).prop('contenteditable') == 'true') return;
		if (!w2ui_name) return;
		// pass to appropriate widget
		if (w2ui[w2ui_name] && typeof w2ui[w2ui_name].keydown == 'function') {
			w2ui[w2ui_name].keydown.call(w2ui[w2ui_name], event);
		}
	}

	function mousedown (event) {
		var tag = event.target.tagName;
		var obj = $(event.target).parents('.w2ui-reset');
		if (obj.length > 0) {
			w2ui_name = obj.attr('name');
		}
	}

	function active (new_w2ui_name) {
		if (typeof new_w2ui_name == 'undefined') return w2ui_name;
		w2ui_name = new_w2ui_name;
	}

	function clear () {
		w2ui_name = null;
	}

	function register () {
	}

})({});

/***********************************************************
*  Commonly used plugins
*  --- used primarily in grid and form
*
*********************************************************/

(function () {

	$.fn.w2render = function (name) {
		if ($(this).length > 0) {
			if (typeof name == 'string' && w2ui[name]) w2ui[name].render($(this)[0]);
			if (typeof name == 'object') name.render($(this)[0]);
		}
	}

	$.fn.w2destroy = function (name) {
		if (!name && this.length > 0) name = this.attr('name');
		if (typeof name == 'string' && w2ui[name]) w2ui[name].destroy();
		if (typeof name == 'object') name.destroy();
	}

	$.fn.w2marker = function (str) {
		if (str == '' || typeof str == 'undefined') { // remove marker
			return $(this).each(function (index, el) {			
				el.innerHTML = el.innerHTML.replace(/\<span class=\"w2ui\-marker\"\>(.*)\<\/span\>/ig, '$1'); // unmark		
			});
		} else { // add marker
			return $(this).each(function (index, el) {
				if (typeof str == 'string') str = [str];
				el.innerHTML = el.innerHTML.replace(/\<span class=\"w2ui\-marker\"\>(.*)\<\/span\>/ig, '$1'); // unmark		
				for (var s in str) {
					var tmp = str[s];
					if (typeof tmp != 'string') tmp = String(tmp);
					// escape regex special chars
					tmp = tmp.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&").replace(/&/g, '&amp;').replace(/</g, '&gt;').replace(/>/g, '&lt;');
					var regex = new RegExp(tmp + '(?!([^<]+)?>)', "gi"); // only outside tags
					el.innerHTML = el.innerHTML.replace(regex, function (matched) { // mark new
						return '<span class="w2ui-marker">' + matched + '</span>';
					});
				}
			});
		}
	}

	// -- w2tag - appears on the right side from element, there can be multiple on screen at a time

	$.fn.w2tag = function (text, options) {
		if (!$.isPlainObject(options)) options = {};
		if (!$.isPlainObject(options.css)) options.css = {};
		if (typeof options['class'] == 'undefined') options['class'] = '';
		// remove all tags
		if ($(this).length == 0) {
			$('.w2ui-tag').each(function (index, elem) {
				var opt = $(elem).data('options');
				if (typeof opt == 'undefined') opt = {};
				$($(elem).data('taged-el')).removeClass( opt['class'] );
				clearInterval($(elem).data('timer'));
				$(elem).remove();
			});
			return;
		}
		return $(this).each(function (index, el) {
			// show or hide tag
			var tagOrigID = el.id;
			var tagID = w2utils.escapeId(el.id);
			if (text == '' || text == null || typeof text == 'undefined') {
				$('#w2ui-tag-'+tagID).css('opacity', 0);
				setTimeout(function () {
					// remmove element
					clearInterval($('#w2ui-tag-'+tagID).data('timer'));
					$('#w2ui-tag-'+tagID).remove();
				}, 300);
			} else {
				// remove elements
				clearInterval($('#w2ui-tag-'+tagID).data('timer'));
				$('#w2ui-tag-'+tagID).remove();
				// insert
				$('body').append('<div id="w2ui-tag-'+ tagOrigID +'" class="w2ui-tag '+ ($(el).parents('.w2ui-popup').length > 0 ? 'w2ui-tag-popup' : '') +'" '+
								 '	style=""></div>');	

				var timer = setInterval(function () { 
					// monitor if destroyed
					if ($(el).length == 0 || ($(el).offset().left == 0 && $(el).offset().top == 0)) {
						clearInterval($('#w2ui-tag-'+tagID).data('timer'));
						tmp_hide(); 
						return;
					}
					// monitor if moved
					if ($('#w2ui-tag-'+tagID).data('position') != ($(el).offset().left + el.offsetWidth) + 'x' + $(el).offset().top) {
						$('#w2ui-tag-'+tagID).css({
							'-webkit-transition': '.2s',
							'-moz-transition': '.2s',
							'-ms-transition': '.2s',
							'-o-transition': '.2s',
							left: ($(el).offset().left + el.offsetWidth) + 'px',
							top: $(el).offset().top + 'px'
						}).data('position', ($(el).offset().left + el.offsetWidth) + 'x' + $(el).offset().top);
					}
				}, 100);
				setTimeout(function () {
					if (!$(el).offset()) return;
					$('#w2ui-tag-'+tagID).css({
						opacity: '1',
						left: ($(el).offset().left + el.offsetWidth) + 'px',
						top: $(el).offset().top + 'px'
					}).html('<div style="margin-top: -2px 0px 0px -2px; white-space: nowrap;"> <div class="w2ui-tag-body">'+ text +'</div> </div>')
					.data('text', text)
					.data('taged-el', el)
					.data('options', options)
					.data('position', ($(el).offset().left + el.offsetWidth) + 'x' + $(el).offset().top)
					.data('timer', timer);
					$(el).off('keypress', tmp_hide).on('keypress', tmp_hide).off('change', tmp_hide).on('change', tmp_hide)
						.css(options.css).addClass(options['class']);
					if (typeof options.onShow == 'function') options.onShow();
				}, 1);
				var originalCSS = '';
				if ($(el).length > 0) originalCSS = $(el)[0].style.cssText;
				// bind event to hide it
				function tmp_hide() { 
					if ($('#w2ui-tag-'+tagID).length <= 0) return;
					clearInterval($('#w2ui-tag-'+tagID).data('timer'));
					$('#w2ui-tag-'+tagID).remove(); 
					$(el).off('keypress', tmp_hide).removeClass(options['class']); 
					if ($(el).length > 0) $(el)[0].style.cssText = originalCSS;
					if (typeof options.onHide == 'function') options.onHide();
				}
			}
		});
	}
	
	// w2overlay - appears under the element, there can be only one at a time

	$.fn.w2overlay = function (html, options) {
		if (!$.isPlainObject(options)) 		options = {};
		if (!$.isPlainObject(options.css)) 	options.css = {};
		if (this.length == 0 || html == '' || typeof html == 'undefined') { hide(); return $(this);	}
		if ($('#w2ui-overlay').length > 0) $(document).click();
		$('body').append('<div id="w2ui-overlay" class="w2ui-reset w2ui-overlay '+ 
							($(this).parents('.w2ui-popup').length > 0 ? 'w2ui-overlay-popup' : '') +'">'+
						'	<div></div>'+
						'</div>');

		// init
		var obj = this;
		var div = $('#w2ui-overlay div');
		div.css(options.css).html(html);
		if (typeof options['class'] != 'undefined') div.addClass(options['class']);
		if (typeof options.top == 'undefined') options.top = 0;
		if (typeof options.left == 'undefined') options.left = 0;
		if (typeof options.width == 'undefined') options.width = 100;
		if (typeof options.height == 'undefined') options.height = 0;

		// pickup bg color of first div
		var bc  = div.css('background-color'); 
		var div = $('#w2ui-overlay');
		if (typeof bc != 'undefined' &&	bc != 'rgba(0, 0, 0, 0)' && bc != 'transparent') div.css('background-color', bc);

		div.css({
				display 	 : 'none',
				left 		 : ($(obj).offset().left + options.left) + 'px',
				top 		 : ($(obj).offset().top + w2utils.getSize($(obj), 'height') + 3 + options.top) + 'px',
				'min-width'  : (options.width ? options.width : 'auto'),
				'min-height' : (options.height ? options.height : 'auto')
			})
			.fadeIn('fast')
			.data('position', ($(obj).offset().left) + 'x' + ($(obj).offset().top + obj.offsetHeight))
			.on('click', function (event) { 
				if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
			});

		// click anywhere else hides the drop down
		function hide () {
			var result;
			if (typeof options.onHide == 'function') result = options.onHide();
			if (result === false) return;
			$('#w2ui-overlay').remove();
			$(document).off('click', hide);
		}

		// need time to display
		setTimeout(fixSize, 0);
		return $(this);

		function fixSize () {
			$(document).on('click', hide);
			// if goes over the screen, limit height and width
			if ( $('#w2ui-overlay > div').length > 0) {
				var h = $('#w2ui-overlay > div').height();
				var w = $('#w2ui-overlay> div').width();
				// $(window).height() - has a problem in FF20
				var max = window.innerHeight - $('#w2ui-overlay > div').offset().top - 7;
				if (h > max) $('#w2ui-overlay> div').height(max).width(w + w2utils.scrollBarSize()).css({ 'overflow-y': 'auto' });
				// check width
				w = $('#w2ui-overlay> div').width();
				max = window.innerWidth - $('#w2ui-overlay > div').offset().left - 7;
				if (w > max) $('#w2ui-overlay> div').width(max).css({ 'overflow-x': 'auto' });
				// onShow event
				if (typeof options.onShow == 'function') options.onShow();
			}
		}
	}

	$.fn.w2menu = function (menu, options) {
		if (typeof options.select == 'undefined' && typeof options.onSelect == 'function') options.select = options.onSelect;
		if (typeof options.select != 'function') {
			console.log('ERROR: options.select is required to be a function, not '+ typeof options.select + ' in $().w2menu(menu, options)');
			return $(this);
		}
		if (!$.isArray(menu)) {
			console.log('ERROR: first parameter should be an array of objects or strings in $().w2menu(menu, options)');
			return $(this);
		}
		// since only one overlay can exist at a time
		$.fn.w2menuHandler = function (event, index) {
			options.select(menu[index], event, index); 
		}
		return $(this).w2overlay(getMenuHTML(), options);

		function getMenuHTML () { 
			var menu_html = '<table cellspacing="0" cellpadding="0" class="w2ui-drop-menu">';
			for (var f = 0; f < menu.length; f++) { 
				var mitem = menu[f];
				if (typeof mitem == 'string') {
					var tmp = mitem.split('|');
					// 1 - id, 2 - text, 3 - image, 4 - icon
					mitem = { id: tmp[0], text: tmp[0], img: null, icon: null };
					if (tmp[1]) mitem.text = tmp[1];
					if (tmp[2]) mitem.img  = tmp[2];
					if (tmp[3]) mitem.icon = tmp[3];
				} else {
					if (typeof mitem.text != 'undefined' && typeof mitem.id == 'undefined') mitem.id = mitem.text;
					if (typeof mitem.text == 'undefined' && typeof mitem.id != 'undefined') mitem.text = mitem.id;
					if (typeof mitem.caption != 'undefined') mitem.text = mitem.caption;
					if (typeof mitem.img == 'undefined') mitem.img = null;
					if (typeof mitem.icon == 'undefined') mitem.icon = null;
				}
				var img = '<td>&nbsp;</td>';
				if (mitem.img)  img = '<td><div class="w2ui-tb-image w2ui-icon '+ mitem.img +'"></div></td>';
				if (mitem.icon) img = '<td align="center"><div class="w2ui-tb-image"><span class="'+ mitem.icon +'"></span></div></td>';
				menu_html += 
					'<tr onmouseover="$(this).addClass(\'w2ui-selected\');" onmouseout="$(this).removeClass(\'w2ui-selected\');" '+
					'		onclick="$(document).click(); $.fn.w2menuHandler(event, \''+ f +'\');">'+
						img +
					'	<td>'+ mitem.text +'</td>'+
					'</tr>';
			}
			menu_html += "</table>";
			return menu_html;
		}	
	}	
})();


/************************************************************************
*   Library: Web 2.0 UI for jQuery (using prototypical inheritance)
*   - Following objects defined
* 		- w2toolbar 	- toolbar widget
*		- $().w2toolbar	- jQuery wrapper
*   - Dependencies: jQuery, w2utils
*
* == NICE TO HAVE ==
*   - on overflow display << >>
*  
************************************************************************/

(function () {
	var w2toolbar = function (options) {
		this.box		= null,		// DOM Element that holds the element
		this.name 		= null,		// unique name for w2ui
		this.items 		= [],
		this.right 		= '',		// HTML text on the right of toolbar
		this.onClick 	= null,
		this.onRender 	= null, 
		this.onRefresh	= null,
		this.onResize   = null,
		this.onDestroy  = null
	
		$.extend(true, this, w2obj.toolbar, options);
	}
	
	// ====================================================
	// -- Registers as a jQuery plugin
	
	$.fn.w2toolbar = function(method) {
		if (typeof method === 'object' || !method ) {
			// check required parameters
			if (!method || typeof method.name == 'undefined') {
				console.log('ERROR: The parameter "name" is required but not supplied in $().w2toolbar().');
				return;
			}
			if (typeof w2ui[method.name] != 'undefined') {
				console.log('ERROR: The parameter "name" is not unique. There are other objects already created with the same name (obj: '+ method.name +').');
				return;			
			}
			if (!w2utils.isAlphaNumeric(method.name)) {
				console.log('ERROR: The parameter "name" has to be alpha-numeric (a-z, 0-9, dash and underscore). ');
				return;			
			}
			var items = method.items;
			// extend items
			var object = new w2toolbar(method);
			$.extend(object, { items: [], handlers: [] });
			
			for (var i in items) { object.items[i] = $.extend({}, w2toolbar.prototype.item, items[i]); }		
			if ($(this).length != 0) {
				object.render($(this)[0]);
			}
			// register new object
			w2ui[object.name] = object;
			return object;
			
		} else if (w2ui[$(this).attr('name')]) {
			var obj = w2ui[$(this).attr('name')];
			obj[method].apply(obj, Array.prototype.slice.call(arguments, 1));
			return this;
		} else {
			console.log('ERROR: Method ' +  method + ' does not exist on jQuery.w2toolbar' );
		}    
	};
	
	// ====================================================
	// -- Implementation of core functionality
	
	w2toolbar.prototype = {
		item: {
			id		: null,		// commnad to be sent to all event handlers
			type	: 'button',	// button, check, radio, drop, menu, break, html, spacer
			text	: '',
			html	: '', 
			img		: null,	
			icon 	: null,
			hidden	: false,
			disabled: false,
			checked	: false, 	// used for radio buttons
			arrow	: true,		// arrow down for drop/menu types
			hint	: '',
			group	: null, 	// used for radio buttons
			items	: null, 	// for type menu it is an array of items in the menu
			onClick	: null
		},
	
		add: function (items) {
			this.insert(null, items);
		},
		
		insert: function (id, items) {
			if (!$.isArray(items)) items = [items];
			for (var o in items) {
				// checks
				if (typeof items[o].type == 'undefined') {
					console.log('ERROR: The parameter "type" is required but not supplied in w2toolbar.add() method.');
					return;
				}
				if ($.inArray(String(items[o].type), ['button', 'check', 'radio', 'drop', 'menu', 'break', 'html', 'spacer']) == -1) {
					console.log('ERROR: The parameter "type" should be one of the following [button, check, radio, drop, menu, break, html, spacer] '+
							'in w2toolbar.add() method.');
					return;
				}
				if (typeof items[o].id == 'undefined') {
					console.log('ERROR: The parameter "id" is required but not supplied in w2toolbar.add() method.');
					return;
				}
				var unique = true;
				for (var i = 0; i < this.items.length; i++) { if (this.items[i].id == items[o].id) { unique = false; return; } }
				if (!unique) {
					console.log('ERROR: The parameter "id" is not unique within the current toolbar.');
					return;
				}
				if (!w2utils.isAlphaNumeric(items[o].id)) {
					console.log('ERROR: The parameter "id" must be alpha-numeric + "-_".');
					return;
				}
				// add item
				var it = $.extend({}, w2toolbar.prototype.item, items[o]);
				if (id == null || typeof id == 'undefined') {
					this.items.push(it);
				} else {
					var middle = this.get(id, true);
					this.items = this.items.slice(0, middle).concat([it], this.items.slice(middle));
				}
				this.refresh(it.id);
			}
		},
		
		remove: function (id) {
			var removed = 0;
			for (var a = 0; a < arguments.length; a++) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				removed++;
				// remove from screen
				$(this.box).find('#tb_'+ this.name +'_item_'+ w2utils.escapeId(it.id)).remove();
				// remove from array
				var ind = this.get(it.id, true);
				if (ind) this.items.splice(ind, 1);
			}
			return removed;
		},
		
		set: function (id, item) {
			var index = this.get(id, true);
			if (index == null) return false;
			$.extend(this.items[index], item);
			this.refresh(id);
			return true;	
		},
		
		get: function (id, returnIndex) {
			if (arguments.length == 0) {
				var all = [];
				for (var i = 0; i < this.items.length; i++) if (this.items[i].id != null) all.push(this.items[i].id);
				return all;
			}
			for (var i = 0; i < this.items.length; i++) {
				if (this.items[i].id == id) { 
					if (returnIndex === true) return i; else return this.items[i]; 
				}
			}
			return null;
		},

		show: function (id) {
			var items = 0;
			for (var a = 0; a < arguments.length; a++) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				items++;
				it.hidden = false;
				this.refresh(it.id);
			}
			return items;
		},
		
		hide: function (id) {
			var items = 0;
			for (var a = 0; a < arguments.length; a++) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				items++;
				it.hidden = true;
				this.refresh(it.id);
			}
			return items;
		},
		
		enable: function (id) {
			var items = 0;
			for (var a = 0; a < arguments.length; a++) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				items++;
				it.disabled = false;
				this.refresh(it.id);
			}
			return items;
		},
		
		disable: function (id) {
			var items = 0;
			for (var a = 0; a < arguments.length; a++) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				items++;
				it.disabled = true;
				this.refresh(it.id);
			}
			return items;
		},
		
		check: function (id) {
			var items = 0;
			for (var a = 0; a < arguments.length; a++) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				items++;
				it.checked = true;
				this.refresh(it.id);
			}
			return items;
		},
		
		uncheck: function (id) {
			var items = 0;
			for (var a = 0; a < arguments.length; a++) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				items++;
				it.checked = false;
				this.refresh(it.id);
			}
			return items;
		},
		
		render: function (box) {
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'render', target: this.name, box: box });	
			if (eventData.isCancelled === true) return false;
	 
			if (typeof box != 'undefined' && box != null) { 
				if ($(this.box).find('> table #tb_'+ this.name + '_right').length > 0) {
					$(this.box)
						.removeAttr('name')
						.removeClass('w2ui-reset w2ui-toolbar')
						.html('');
				}
				this.box = box;
			}
			if (!this.box) return;
			// render all buttons
			var html = '<table cellspacing="0" cellpadding="0" width="100%">'+
					   '<tr>';
			for (var i = 0; i < this.items.length; i++) {
				var it = this.items[i];
				if (typeof it.id == 'undefined' || it.id == null) it.id = "item_" + i;
				if (it == null)  continue;
				if (it.type == 'spacer') {
					html += '<td width="100%" id="tb_'+ this.name +'_item_'+ it.id +'" align="right"></td>';
				} else {
					html += '<td id="tb_'+ this.name + '_item_'+ it.id +'" style="'+ (it.hidden ? 'display: none' : '') +'" '+
							'	class="'+ (it.disabled ? 'disabled' : '') +'" valign="middle">'+ this.getItemHTML(it) + 
							'</td>';
				}
			}
			html += '<td width="100%" id="tb_'+ this.name +'_right" align="right">'+ this.right +'</td>';
			html += '</tr>'+
					'</table>';
			$(this.box)
				.attr('name', this.name)
				.addClass('w2ui-reset w2ui-toolbar')
				.html(html);
			if ($(this.box).length > 0) $(this.box)[0].style.cssText += this.style;
			// event after
			this.trigger($.extend(eventData, { phase: 'after' }));	
		},
		
		refresh: function (id) {
			var time = (new Date()).getTime();
			if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection 
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'refresh', target: (typeof id != 'undefined' ? id : this.name), item: this.get(id) });	
			if (eventData.isCancelled === true) return false;
			
			if (typeof id == 'undefined') {
				// refresh all
				for (var i = 0; i < this.items.length; i++) {
					var it = this.items[i];
					if (typeof it.id == 'undefined' || it.id == null) it.id = "item_" + i;
					this.refresh(it.id);
				}
			}
			// create or refresh only one item
			var it = this.get(id);
			if (it == null) return;
			
			var el = $(this.box).find('#tb_'+ this.name +'_item_'+ w2utils.escapeId(it.id));
			var html  = this.getItemHTML(it);
			if (el.length == 0) {
				// does not exist - create it
				if (it.type == 'spacer') {
					html = '<td width="100%" id="tb_'+ this.name +'_item_'+ it.id +'" align="right"></td>';
				} else {
					html =  '<td id="tb_'+ this.name + '_item_'+ it.id +'" style="'+ (it.hidden ? 'display: none' : '') +'" '+
						'	class="'+ (it.disabled ? 'disabled' : '') +'" valign="middle">'+ html + 
						'</td>';
				}
				if (this.get(id, true) == this.items.length-1) {
					$(this.box).find('#tb_'+ this.name +'_right').before(html);
				} else {
					$(this.box).find('#tb_'+ this.name +'_item_'+ w2utils.escapeId(this.items[parseInt(this.get(id, true))+1].id)).before(html);
				}
			} else {
				// refresh
				el.html(html);
				if (it.hidden) { el.css('display', 'none'); } else { el.css('display', ''); }
				if (it.disabled) { el.addClass('disabled'); } else { el.removeClass('disabled'); }
			}
			// event after
			this.trigger($.extend(eventData, { phase: 'after' }));	
			return (new Date()).getTime() - time;
		},
		
		resize: function () {
			var time = (new Date()).getTime();
			if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection 
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'resize', target: this.name });	
			if (eventData.isCancelled === true) return false;

			// empty function

			// event after
			this.trigger($.extend(eventData, { phase: 'after' }));
			return (new Date()).getTime() - time;
		},
	
		destroy: function () { 
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'destroy', target: this.name });	
			if (eventData.isCancelled === true) return false;
			// clean up
			if ($(this.box).find('> table #tb_'+ this.name + '_right').length > 0) {
				$(this.box)
					.removeAttr('name')
					.removeClass('w2ui-reset w2ui-toolbar')
					.html('');
			}
			$(this.box).html('');
			delete w2ui[this.name];
			// event after
			this.trigger($.extend(eventData, { phase: 'after' }));	
		},
		
		// ========================================
		// --- Internal Functions
		
		getItemHTML: function (item) {
			var html = '';
			
			if (typeof item.caption != 'undefined') item.text = item.caption;
			if (typeof item.hint == 'undefined') item.hint = '';
			if (typeof item.text == 'undefined') item.text = '';
	
			switch (item.type) {
				case 'menu':
				case 'button':	
				case 'check':
				case 'radio':
				case 'drop':
					var img = '<td>&nbsp;</td>';
					if (item.img)  img = '<td><div class="w2ui-tb-image w2ui-icon '+ item.img +'"></div></td>';
					if (item.icon) img = '<td><div class="w2ui-tb-image"><span class="'+ item.icon +'"></span></div></td>';
					html +=  '<table cellpadding="0" cellspacing="0" title="'+ item.hint +'" class="w2ui-button '+ (item.checked ? 'checked' : '') +'" '+
							 '       onclick     = "var el=w2ui[\''+ this.name + '\']; if (el) el.click(\''+ item.id +'\', event);" '+
							 '       onmouseover = "' + (!item.disabled ? "$(this).addClass('over');" : "") + '"'+
							 '       onmouseout  = "' + (!item.disabled ? "$(this).removeClass('over');" : "") + '"'+
							 '       onmousedown = "' + (!item.disabled ? "$(this).addClass('down');" : "") + '"'+
							 '       onmouseup   = "' + (!item.disabled ? "$(this).removeClass('down');" : "") + '"'+
							 '>'+
							 '<tr><td>'+
							 '  <table cellpadding="1" cellspacing="0">'+
							 '  <tr>' +
							 		img +
									(item.text != '' ? '<td class="w2ui-tb-caption" nowrap>'+ item.text +'</td>' : '') +
									(((item.type == 'drop' || item.type == 'menu') && item.arrow !== false) ? 
										'<td class="w2ui-tb-down" nowrap>&nbsp;&nbsp;&nbsp;</td>' : '') +
							 '  </tr></table>'+
							 '</td></tr></table>';
					break;
								
				case 'break':
					html +=  '<table cellpadding="0" cellspacing="0"><tr>'+
							 '    <td><div class="w2ui-break">&nbsp;</div></td>'+
							 '</tr></table>';
					break;
	
				case 'html':
					html +=  '<table cellpadding="0" cellspacing="0"><tr>'+
							 '    <td nowrap>' + item.html + '</td>'+
							 '</tr></table>';
					break;
			}
			
			var newHTML = '';
			if (typeof item.onRender == 'function') newHTML = item.onRender.call(this, item.id, html);
			if (typeof this.onRender == 'function') newHTML = this.onRender(item.id, html);
			if (newHTML != '' && typeof newHTML != 'undefined') html = newHTML;
			return html;					
		},

		menuClick: function (id, menu_index, event) {
			if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection 
			var obj = this;
			var it  = this.get(id);
			if (it && !it.disabled) {
				// event before
				var eventData = this.trigger({ phase: 'before', type: 'click', target: (typeof id != 'undefined' ? id : this.name), item: this.get(id),
					  subItem: (typeof menu_index != 'undefined' && this.get(id) ? this.get(id).items[menu_index] : null), originalEvent: event });	
				if (eventData.isCancelled === true) return false;

				// normal processing

				// event after
				this.trigger($.extend(eventData, { phase: 'after' }));	
			}
		},
				
		click: function (id, event) {
			if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection 
			var obj = this;
			var it  = this.get(id);
			if (it && !it.disabled) {
				// event before
				var eventData = this.trigger({ phase: 'before', type: 'click', target: (typeof id != 'undefined' ? id : this.name), 
					item: this.get(id), originalEvent: event });	
				if (eventData.isCancelled === true) return false;
			
				$('#tb_'+ this.name +'_item_'+ w2utils.escapeId(it.id) +' table.w2ui-button').removeClass('down');
								
				if (it.type == 'radio') {
					for (var i = 0; i < this.items.length; i++) {
						var itt = this.items[i];
						if (itt == null || itt.id == it.id || itt.type != 'radio') continue;
						if (itt.group == it.group && itt.checked) {
							itt.checked = false;
							this.refresh(itt.id);
						}
					}
					it.checked = true;
					$('#tb_'+ this.name +'_item_'+ w2utils.escapeId(it.id) +' table.w2ui-button').addClass('checked');					
				}

				if (it.type == 'drop' || it.type == 'menu') {
					if (it.checked) {
						// if it was already checked, second click will hide it
						it.checked = false;
					} else {
						// show overlay
						setTimeout(function () {
							var el = $('#tb_'+ obj.name +'_item_'+ w2utils.escapeId(it.id));
							if (!$.isPlainObject(it.overlay)) it.overlay = {};
							if (it.type == 'drop') {
								el.w2overlay(it.html, $.extend({ left: (el.width() - 50) / 2, top: 3 }, it.overlay));
							} 
							if (it.type == 'menu') {
								el.w2menu(it.items, $.extend({ left: (el.width() - 50) / 2, top: 3 }, it.overlay, {
									select: function (item, event, index) { obj.menuClick(it.id, index, event); }
								}));
							}
							// window.click to hide it
							$(document).on('click', hideDrop);
							function hideDrop() {
								it.checked = false;
								if (it.checked) {
									$('#tb_'+ obj.name +'_item_'+ w2utils.escapeId(it.id) +' table.w2ui-button').addClass('checked');
								} else {
									$('#tb_'+ obj.name +'_item_'+ w2utils.escapeId(it.id) +' table.w2ui-button').removeClass('checked');					
								}
								obj.refresh(it.id);
								$(document).off('click', hideDrop);
							}
						}, 1);
					}
				}

				if (it.type == 'check' || it.type == 'drop' || it.type == 'menu') {
					it.checked = !it.checked;
					if (it.checked) {
						$('#tb_'+ this.name +'_item_'+ w2utils.escapeId(it.id) +' table.w2ui-button').addClass('checked');
					} else {
						$('#tb_'+ this.name +'_item_'+ w2utils.escapeId(it.id) +' table.w2ui-button').removeClass('checked');					
					}
				}
				// event after
				this.trigger($.extend(eventData, { phase: 'after' }));	
			}
		}		
	}
	
	$.extend(w2toolbar.prototype, w2utils.event);
	w2obj.toolbar = w2toolbar;
})();



/************************************************************************
*   Library: Web 2.0 UI for jQuery (using prototypical inheritance)
*   - Following objects defined
* 		- w2layout		- layout widget
*		- $().w2layout	- jQuery wrapper
*   - Dependencies: jQuery, w2utils, w2toolbar, w2tabs
*
* == NICE TO HAVE ==
*	- onResize for the panel
*	- problem with layout.html (see in 1.3)
*	- add panel title
* 
************************************************************************/

(function () {
	var w2layout = function (options) {
		this.box		= null		// DOM Element that holds the element
		this.name		= null;		// unique name for w2ui
		this.panels		= [];
		this.tmp 		= {};

		this.padding	= 1;		// panel padding
		this.resizer	= 4;		// resizer width or height
		this.style		= '';

		this.onShow		= null;
		this.onHide		= null;
		this.onResizing = null;
		this.onRender	= null;
		this.onRefresh	= null;
		this.onResize	= null;
		this.onDestroy	= null
		
		$.extend(true, this, w2obj.layout, options);
	};
	
	// ====================================================
	// -- Registers as a jQuery plugin
	
	$.fn.w2layout = function(method) {
		if (typeof method === 'object' || !method ) {
			// check required parameters
			if (!method || typeof method.name == 'undefined') {
				console.log('ERROR: The parameter "name" is required but not supplied in $().w2layout().');
				return;
			}
			if (typeof w2ui[method.name] != 'undefined') {
				console.log('ERROR: The parameter "name" is not unique. There are other objects already created with the same name (obj: '+ method.name +').');
				return;			
			}
			if (!w2utils.isAlphaNumeric(method.name)) {
				console.log('ERROR: The parameter "name" has to be alpha-numeric (a-z, 0-9, dash and underscore). ');
				return;			
			}
			var panels = method.panels;
			var object = new w2layout(method);
			$.extend(object, { handlers: [], panels: [] });
			// add defined panels panels
			for (var p in panels) { 
				object.panels[p] = $.extend(true, {}, w2layout.prototype.panel, panels[p]); 
				if ($.isPlainObject(object.panels[p].tabs) || $.isArray(object.panels[p].tabs)) initTabs(object, panels[p].type);
				if ($.isPlainObject(object.panels[p].toolbar) || $.isArray(object.panels[p].toolbar)) initToolbar(object, panels[p].type);
			}
			// add all other panels
			for (var p in { 'top':'', 'left':'', 'main':'', 'preview':'', 'right':'', 'bottom':'' }) { 
				if (object.get(p) != null) continue;
				object.panels[p] = $.extend(true, {}, w2layout.prototype.panel, { type: p, hidden: true, size: 50 }); 
			}

			if ($(this).length > 0) {
				object.render($(this)[0]);
			}
			w2ui[object.name] = object;
			return object;		

		} else if (w2ui[$(this).attr('name')]) {
			var obj = w2ui[$(this).attr('name')];
			obj[method].apply(obj, Array.prototype.slice.call(arguments, 1));
			return this;
		} else {
			console.log('ERROR: Method ' +  method + ' does not exist on jQuery.w2layout' );
		}

		function initTabs(object, panel, tabs) {
			var pan = object.get(panel);
			if (pan != null && typeof tabs == 'undefined') tabs = pan.tabs;
			if (pan == null || tabs == null) return false;
			// instanciate tabs
			if ($.isArray(tabs)) tabs = { tabs: tabs };
			$().w2destroy(object.name + '_' + panel + '_tabs'); // destroy if existed
			pan.tabs = $().w2tabs($.extend({}, tabs, { owner: object, name: object.name + '_' + panel + '_tabs' }));
			pan.show.tabs = true;
			return true;
		}
		
		function initToolbar(object, panel, toolbar) {
			var pan = object.get(panel);
			if (pan != null && typeof toolbar == 'undefined') toolbar = pan.toolbar;
			if (pan == null || toolbar == null) return false;
			// instanciate toolbar
			if ($.isArray(toolbar)) toolbar = { items: toolbar };
			$().w2destroy(object.name + '_' + panel + '_toolbar'); // destroy if existed
			pan.toolbar = $().w2toolbar($.extend({}, toolbar, { owner: object, name: object.name + '_' + panel + '_toolbar' }));
			pan.show.toolbar = true;
			return true;
		}
	};
	
	// ====================================================
	// -- Implementation of core functionality
	
	w2layout.prototype = {
		// default setting for a panel
		panel: {
			type 		: null,		// left, right, top, bottom
			size 		: 100, 		// width or height depending on panel name
			minSize 	: 20,
			hidden 		: false,
			resizable 	: false,
			overflow 	: 'auto',
			style 		: '',
			content 	: '',			// can be String or Object with .render(box) method
			tabs		: null,
			toolbar		: null,
			width		: null, 		// read only
			height 		: null, 		// read only
			show : {
				toolbar : false,
				tabs	: false
			},
			onRefresh	: null,
			onShow 		: null,
			onHide 		: null
		},

		// alias for content
		html: function (panel, data, transition) {
			return this.content(panel, data, transition);
		},
			
		content: function (panel, data, transition) {
			var obj = this;
			var p = this.get(panel);
			if (panel == 'css') {
				$('#layout_'+ obj.name +'_panel_css').html('<style>'+ data +'</style>');
				return true;
			}
			if (p == null) return false;
			if ($('#layout_'+ this.name + '_panel2_'+ p.type).length > 0) return false;
			$('#layout_'+ this.name + '_panel_'+ p.type).scrollTop(0);
			if (data == null || typeof data == 'undefined') {
				return p.content;
			} else {
				if (data instanceof jQuery) {
					console.log('ERROR: You can not pass jQuery object to w2layout.content() method');
					return false;
				}
				// remove foreign classes and styles
				var tmp = $('#'+ 'layout_'+ this.name + '_panel_'+ panel + ' > .w2ui-panel-content');
				var panelTop = $(tmp).position().top;
				tmp.attr('class', 'w2ui-panel-content');
				if (tmp.length > 0 && typeof p.style != 'undefined') tmp[0].style.cssText = p.style;
				if (p.content == '') {
					p.content = data;
					if (!p.hidden) this.refresh(panel);
				} else {
					p.content = data;
					if (!p.hidden) {
						if (transition != null && transition != '' && typeof transition != 'undefined') {
							// apply transition
							var nm   = 'layout_'+ this.name + '_panel_'+ p.type;
							var div1 = $('#'+ nm + ' > .w2ui-panel-content');
							div1.after('<div class="w2ui-panel-content new-panel" style="'+ div1[0].style.cssText +'"></div>');
							var div2 = $('#'+ nm + ' > .w2ui-panel-content.new-panel');
							div1.css('top', panelTop);
							div2.css('top', panelTop);
							if (typeof data == 'object') {
								data.box = div2[0]; // do not do .render(box);
								data.render();
							} else {
								div2.html(data);
							}
							w2utils.transition(div1[0], div2[0], transition, function () {
								div1.remove();
								div2.removeClass('new-panel');
								div2.css('overflow', p.overflow);
								// IE Hack
								if (window.navigator.userAgent.indexOf('MSIE')) setTimeout(function () { obj.resize(); }, 100);
							});
						} else {
							if (!p.hidden) this.refresh(panel);
						}
					}
				}
			}
			// IE Hack
			if (window.navigator.userAgent.indexOf('MSIE')) setTimeout(function () { obj.resize(); }, 100);
			return true;
		},
		
		load: function (panel, url, transition, onLoad) {
			var obj = this;
			if (panel == 'css') {
				$.get(url, function (data, status, xhr) {					
					obj.content(panel, xhr.responseText);
					if (onLoad) onLoad();
				});
				return true;
			}
			if (this.get(panel) != null) {
				$.get(url, function (data, status, xhr) {
					obj.content(panel, xhr.responseText, transition);
					if (onLoad) onLoad();
					// IE Hack
					if (window.navigator.userAgent.indexOf('MSIE')) setTimeout(function () { obj.resize(); }, 100);
				});
				return true;
			}
			return false;
		},

		sizeTo: function (panel, size) {
			var obj = this;
			var pan = obj.get(panel);
			if (pan == null) return false;
			// resize
			$(obj.box).find(' > div .w2ui-panel').css({
				'-webkit-transition': '.35s',
				'-moz-transition'	: '.35s',
				'-ms-transition'	: '.35s',
				'-o-transition'		: '.35s'
			});
			setTimeout(function () { 
				obj.set(panel, { size: size }); 
			}, 1);
			// clean
			setTimeout(function () { 
				$(obj.box).find(' > div .w2ui-panel').css({
					'-webkit-transition': '0s',
					'-moz-transition'	: '0s',
					'-ms-transition'	: '0s',
					'-o-transition'		: '0s'
				}); 
				obj.resize();
			}, 500);
			return true;
		},

		show: function (panel, immediate) {
			var obj = this;
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'show', target: panel, object: this.get(panel), immediate: immediate });	
			if (eventData.isCancelled === true) return false;
	
			var p = obj.get(panel);
			if (p == null) return false;
			p.hidden = false;
			if (immediate === true) {
				$('#layout_'+ obj.name +'_panel_'+panel).css({ 'opacity': '1' });	
				if (p.resizabled) $('#layout_'+ obj.name +'_resizer_'+panel).show();
				obj.trigger($.extend(eventData, { phase: 'after' }));	
				obj.resize();
			} else {			
				if (p.resizabled) $('#layout_'+ obj.name +'_resizer_'+panel).show();
				// resize
				$('#layout_'+ obj.name +'_panel_'+panel).css({ 'opacity': '0' });	
				$(obj.box).find(' > div .w2ui-panel').css({
					'-webkit-transition': '.2s',
					'-moz-transition'	: '.2s',
					'-ms-transition'	: '.2s',
					'-o-transition'		: '.2s'
				});
				setTimeout(function () { obj.resize(); }, 1);
				// show
				setTimeout(function() {
					$('#layout_'+ obj.name +'_panel_'+ panel).css({ 'opacity': '1' });	
				}, 250);
				// clean
				setTimeout(function () { 
					$(obj.box).find(' > div .w2ui-panel').css({
						'-webkit-transition': '0s',
						'-moz-transition'	: '0s',
						'-ms-transition'	: '0s',
						'-o-transition'		: '0s'
					}); 
					obj.trigger($.extend(eventData, { phase: 'after' }));	
					obj.resize();
				}, 500);
			}
			return true;
		},
		
		hide: function (panel, immediate) {
			var obj = this;
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'hide', target: panel, object: this.get(panel), immediate: immediate });	
			if (eventData.isCancelled === true) return false;
	
			var p = obj.get(panel);
			if (p == null) return false;
			p.hidden = true;		
			if (immediate === true) {
				$('#layout_'+ obj.name +'_panel_'+panel).css({ 'opacity': '0'	});
				$('#layout_'+ obj.name +'_resizer_'+panel).hide();
				obj.trigger($.extend(eventData, { phase: 'after' }));	
				obj.resize();
			} else {
				$('#layout_'+ obj.name +'_resizer_'+panel).hide();
				// hide
				$(obj.box).find(' > div .w2ui-panel').css({
					'-webkit-transition': '.2s',
					'-moz-transition'	: '.2s',
					'-ms-transition'	: '.2s',
					'-o-transition'		: '.2s'
				});
				$('#layout_'+ obj.name +'_panel_'+panel).css({ 'opacity': '0'	});
				setTimeout(function () { obj.resize(); }, 1);
				// clean
				setTimeout(function () { 
					$(obj.box).find(' > div .w2ui-panel').css({
						'-webkit-transition': '0s',
						'-moz-transition'	: '0s',
						'-ms-transition'	: '0s',
						'-o-transition'		: '0s'
					}); 
					obj.trigger($.extend(eventData, { phase: 'after' }));	
					obj.resize();
				}, 500);
			}
			return true;
		},
		
		toggle: function (panel, immediate) {
			var p = this.get(panel);
			if (p == null) return false;
			if (p.hidden) return this.show(panel, immediate); else return this.hide(panel, immediate);
		},
		
		set: function (panel, options) {
			var obj = this.get(panel, true);
			if (obj == null) return false;
			$.extend(this.panels[obj], options);
			this.refresh(panel);
			this.resize(); // resize is needed when panel size is changed
			return true;		
		},
	
		get: function (panel, returnIndex) {
			var obj = null;
			for (var p in this.panels) {
				if (this.panels[p].type == panel) { 
					if (returnIndex === true) return p; else return this.panels[p];
				}
			}
			return null;
		},

		el: function (panel) {
			var el = $('#layout_'+ this.name +'_panel_'+ panel +' .w2ui-panel-content');
			if (el.length != 1) return null;
			return el[0];
		},

		hideToolbar: function (panel) {
			var pan = this.get(panel);
			if (!pan) return;
			pan.show.toolbar = false;
			$('#layout_'+ this.name +'_panel_'+ panel +' > .w2ui-panel-toolbar').hide();
			this.resize();
		},

		showToolbar: function (panel) {
			var pan = this.get(panel);
			if (!pan) return;
			pan.show.toolbar = true;
			$('#layout_'+ this.name +'_panel_'+ panel +' > .w2ui-panel-toolbar').show();
			this.resize();
		},

		toggleToolbar: function (panel) {
			var pan = this.get(panel);
			if (!pan) return;
			if (pan.show.toolbar) this.hideToolbar(panel); else this.showToolbar(panel);
		},

		hideTabs: function (panel) {
			var pan = this.get(panel);
			if (!pan) return;
			pan.show.tabs = false;
			$('#layout_'+ this.name +'_panel_'+ panel +' > .w2ui-panel-tabs').hide();
			this.resize();
		},

		showTabs: function (panel) {
			var pan = this.get(panel);
			if (!pan) return;
			pan.show.tabs = true;
			$('#layout_'+ this.name +'_panel_'+ panel +' > .w2ui-panel-tabs').show();
			this.resize();
		},

		toggleTabs: function (panel) {
			var pan = this.get(panel);
			if (!pan) return;
			if (pan.show.tabs) this.hideTabs(panel); else this.showTabs(panel);
		},

		render: function (box) {
			var obj = this;
			if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection 
			var time = (new Date()).getTime();
			// event before
			var eventData = obj.trigger({ phase: 'before', type: 'render', target: obj.name, box: box });	
			if (eventData.isCancelled === true) return false;
	
			if (typeof box != 'undefined' && box != null) { 
				if ($(obj.box).find('#layout_'+ obj.name +'_panel_main').length > 0) {
					$(obj.box)
						.removeAttr('name')
						.removeClass('w2ui-layout')
						.html('');
				}
				obj.box = box;
			}
			if (!obj.box) return false;
			$(obj.box)
				.attr('name', obj.name)
				.addClass('w2ui-layout')
				.html('<div></div>');
			if ($(obj.box).length > 0) $(obj.box)[0].style.cssText += obj.style;
			// create all panels
			var tmp = ['top', 'left', 'main', 'preview', 'right', 'bottom'];
			for (var t in tmp) {
				var pan  = obj.get(tmp[t]);
				var html =  '<div id="layout_'+ obj.name + '_panel_'+ tmp[t] +'" class="w2ui-panel">'+
							'	<div class="w2ui-panel-tabs"></div>'+
							'	<div class="w2ui-panel-toolbar"></div>'+
							'	<div class="w2ui-panel-content"></div>'+
							'</div>'+
							'<div id="layout_'+ obj.name + '_resizer_'+ tmp[t] +'" class="w2ui-resizer"></div>';
				$(obj.box).find(' > div').append(html);
				// tabs are rendered in refresh()
			}
			$(obj.box).find(' > div')
				.append('<div id="layout_'+ obj.name + '_panel_css" style="position: absolute; top: 10000px;"></div');
			obj.refresh(); // if refresh is not called here, the layout will not be available right after initialization
			// process event
			obj.trigger($.extend(eventData, { phase: 'after' }));	
			// reinit events
			setTimeout(function () { // needed this timeout to allow browser to render first if there are tabs or toolbar
				obj.resize();
				initEvents();
			}, 0);
			return (new Date()).getTime() - time;

			function initEvents() {
				obj.tmp.events = {
					resize : function (event) { 
						w2ui[obj.name].resize()	
					},
					resizeStart : resizeStart,
					mousemove 	: resizeMove,
					mouseup 	: resizeStop
				};
				$(window).on('resize', obj.tmp.events.resize);
				$(document).on('mousemove', obj.tmp.events.mousemove);
				$(document).on('mouseup', obj.tmp.events.mouseup);
			}

			function resizeStart(type, evnt) {
				if (!obj.box) return;
				if (!evnt) evnt = window.event;
				if (!window.addEventListener) { window.document.attachEvent('onselectstart', function() { return false; } ); }
				obj.tmp.resize = {
					type	: type,
					x 		: evnt.screenX,
					y 		: evnt.screenY,
					div_x 	: 0,
					div_y 	: 0,
					value	: 0
				};
				if (type == 'left' || type == 'right') {
					obj.tmp.resize.value = parseInt($('#layout_'+ obj.name + '_resizer_'+ type)[0].style.left);
				}
				if (type == 'top' || type == 'preview' || type == 'bottom') {
					obj.tmp.resize.value = parseInt($('#layout_'+ obj.name + '_resizer_'+ type)[0].style.top);
				}
			}

			function resizeStop(evnt) {
				if (!obj.box) return;
				if (!evnt) evnt = window.event;
				if (!window.addEventListener) { window.document.attachEvent('onselectstart', function() { return false; } ); }
				if (typeof obj.tmp.resize == 'undefined') return;
				// set new size
				if (obj.tmp.div_x != 0 || obj.tmp.resize.div_y != 0) { // only recalculate if changed
					var ptop 	= obj.get('top');
					var pbottom	= obj.get('bottom');
					var panel 	= obj.get(obj.tmp.resize.type);
					var height 	= parseInt($(obj.box).height());
					var width 	= parseInt($(obj.box).width());
					var str 	= String(panel.size);
					switch (obj.tmp.resize.type) {
						case 'top':
							var ns = parseInt(panel.sizeCalculated) + obj.tmp.resize.div_y;
							var nd = 0;
							break;
						case 'bottom':
							var ns = parseInt(panel.sizeCalculated) - obj.tmp.resize.div_y;
							var nd = 0;
							break;
						case 'preview':
							var ns = parseInt(panel.sizeCalculated) - obj.tmp.resize.div_y;
							var nd = (ptop && !ptop.hidden ? ptop.sizeCalculated : 0) 
								   + (pbottom && !pbottom.hidden ? pbottom.sizeCalculated : 0);
							break;
						case 'left':
							var ns = parseInt(panel.sizeCalculated) + obj.tmp.resize.div_x;
							var nd = 0;
							break;
						case 'right': 
							var ns = parseInt(panel.sizeCalculated) - obj.tmp.resize.div_x;
							var nd = 0;
							break;
					}	
					// set size
					if (str.substr(str.length-1) == '%') {
						panel.size = Math.floor(ns * 100 / 
							(panel.type == 'left' || panel.type == 'right' ? width : height - nd) * 100) / 100 + '%';
					} else {
						panel.size = ns;
					}
					obj.resize();
				}
				$('#layout_'+ obj.name + '_resizer_'+ obj.tmp.resize.type).removeClass('active');
				delete obj.tmp.resize;
			}

			function resizeMove(evnt) {
				if (!obj.box) return;
				if (!evnt) evnt = window.event;
				if (typeof obj.tmp.resize == 'undefined') return;
				var panel = obj.get(obj.tmp.resize.type);
				// event before
				var eventData = obj.trigger({ phase: 'before', type: 'resizing', target: obj.tmp.resize.type, object: panel, originalEvent: evnt });	
				if (eventData.isCancelled === true) return false;

				var p = $('#layout_'+ obj.name + '_resizer_'+ obj.tmp.resize.type);
				if (!p.hasClass('active')) p.addClass('active');
				obj.tmp.resize.div_x = (evnt.screenX - obj.tmp.resize.x); 
				obj.tmp.resize.div_y = (evnt.screenY - obj.tmp.resize.y); 
				// left panel -> drag
				if (obj.tmp.resizing == 'left' &&  (obj.get('left').minSize - obj.tmp.resize.div_x > obj.get('left').width)) {
					obj.tmp.resize.div_x = obj.get('left').minSize - obj.get('left').width;
				}
				if (obj.tmp.resize.type == 'left' && (obj.get('main').minSize + obj.tmp.resize.div_x > obj.get('main').width)) {
					obj.tmp.resize.div_x = obj.get('main').width - obj.get('main').minSize;
				}
				// right panel -> drag 
				if (obj.tmp.resize.type == 'right' &&  (obj.get('right').minSize + obj.tmp.resize.div_x > obj.get('right').width)) {
					obj.tmp.resize.div_x = obj.get('right').width - obj.get('right').minSize;
				}
				if (obj.tmp.resize.type == 'right' && (obj.get('main').minSize - obj.tmp.resize.div_x > obj.get('main').width)) {
					obj.tmp.resize.div_x =  obj.get('main').minSize - obj.get('main').width;
				}
				// top panel -> drag
				if (obj.tmp.resize.type == 'top' &&  (obj.get('top').minSize - obj.tmp.resize.div_y > obj.get('top').height)) {
					obj.tmp.resize.div_y = obj.get('top').minSize - obj.get('top').height;
				}
				if (obj.tmp.resize.type == 'top' && (obj.get('main').minSize + obj.tmp.resize.div_y > obj.get('main').height)) {
					obj.tmp.resize.div_y = obj.get('main').height - obj.get('main').minSize;
				}
				// bottom panel -> drag 
				if (obj.tmp.resize.type == 'bottom' &&  (obj.get('bottom').minSize + obj.tmp.resize.div_y > obj.get('bottom').height)) {
					obj.tmp.resize.div_y = obj.get('bottom').height - obj.get('bottom').minSize;
				}
				if (obj.tmp.resize.type == 'bottom' && (obj.get('main').minSize - obj.tmp.resize.div_y > obj.get('main').height)) {
					obj.tmp.resize.div_y =  obj.get('main').minSize - obj.get('main').height;
				}
				// preview panel -> drag 
				if (obj.tmp.resize.type == 'preview' &&  (obj.get('preview').minSize + obj.tmp.resize.div_y > obj.get('preview').height)) {
					obj.tmp.resize.div_y = obj.get('preview').height - obj.get('preview').minSize;
				}
				if (obj.tmp.resize.type == 'preview' && (obj.get('main').minSize - obj.tmp.resize.div_y > obj.get('main').height)) {
					obj.tmp.resize.div_y =  obj.get('main').minSize - obj.get('main').height;
				}
				switch(obj.tmp.resize.type) {
					case 'top':
					case 'preview':
					case 'bottom':
						obj.tmp.resize.div_x = 0;
						if (p.length > 0) p[0].style.top = (obj.tmp.resize.value + obj.tmp.resize.div_y) + 'px';
						break;
					case 'left':
					case 'right':
						obj.tmp.resize.div_y = 0;
						if (p.length > 0) p[0].style.left = (obj.tmp.resize.value + obj.tmp.resize.div_x) + 'px';
						break;
				}
				// event after
				obj.trigger($.extend(eventData, { phase: 'after' }));	
			}
		},
		
		refresh: function (panel) {
			var obj = this;
			if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection 
			if (typeof panel == 'undefined') panel = null;
			var time = (new Date()).getTime();
			// event before
			var eventData = obj.trigger({ phase: 'before', type: 'refresh', target: (typeof panel != 'undefined' ? panel : obj.name), object: obj.get(panel) });	
			if (eventData.isCancelled === true) return;
	
			// obj.unlock(panel);
			if (panel != null && typeof panel != 'undefined') {
				var p = obj.get(panel);
				if (p == null) return;
				// apply properties to the panel
				var el = $('#layout_'+ obj.name +'_panel_'+ panel).css({ display: p.hidden ? 'none' : 'block' });
				el = el.find('.w2ui-panel-content');
				if (el.length > 0) el.css('overflow', p.overflow)[0].style.cssText += ';' + p.style;
				if (p.resizable === true) {
					$('#layout_'+ this.name +'_resizer_'+ panel).show(); 
				} else {
					$('#layout_'+ this.name +'_resizer_'+ panel).hide(); 					
				}
				// insert content
				if (typeof p.content == 'object' && p.content.render) {
					p.content.box = $('#layout_'+ obj.name + '_panel_'+ p.type +' > .w2ui-panel-content')[0];
					p.content.render(); // do not do .render(box);
				} else {
					$('#layout_'+ obj.name + '_panel_'+ p.type +' > .w2ui-panel-content').html(p.content);
				}
				// if there are tabs and/or toolbar - render it
				var tmp = $(obj.box).find('#layout_'+ obj.name + '_panel_'+ p.type +' .w2ui-panel-tabs');
				if (p.show.tabs) { 
					if (tmp.find('[name='+ p.tabs.name +']').length == 0 && p.tabs != null) tmp.w2render(p.tabs); else p.tabs.refresh(); 
				} else {
					tmp.html('').removeClass('w2ui-tabs').hide();
				}
				var tmp = $(obj.box).find('#layout_'+ obj.name + '_panel_'+ p.type +' .w2ui-panel-toolbar');
				if (p.show.toolbar) { 
					if (tmp.find('[name='+ p.toolbar.name +']').length == 0 && p.toolbar != null) tmp.w2render(p.toolbar); else p.toolbar.refresh(); 
				} else {
					tmp.html('').removeClass('w2ui-toolbar').hide();
				}
			} else {
				if ($('#layout_' +obj.name +'_panel_main').length <= 0) {
					obj.render();
					return;
				}
				obj.resize();
				// refresh all of them
				for (var p in this.panels) { obj.refresh(this.panels[p].type); }
			}
			obj.trigger($.extend(eventData, { phase: 'after' }));	
			return (new Date()).getTime() - time;
		},
		
		resize: function () {
			if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection 
			if (!this.box) return false;
			var time = (new Date()).getTime();
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'resize', target: this.name, panel: this.tmp.resizing });	
			if (eventData.isCancelled === true) return false;
			if (this.padding < 0) this.padding = 0;
	
			// layout itself
			var width  = parseInt($(this.box).width());
			var height = parseInt($(this.box).height());
			$(this.box).find(' > div').css({
				width	: width + 'px',
				height	: height + 'px'
			});
			var obj = this;
			// panels
			var pmain   = this.get('main');
			var pprev   = this.get('preview');
			var pleft   = this.get('left');
			var pright  = this.get('right');
			var ptop    = this.get('top');
			var pbottom = this.get('bottom');
			var smain	= true; // main always on
			var sprev   = (pprev != null && pprev.hidden != true ? true : false);
			var sleft   = (pleft != null && pleft.hidden != true ? true : false);
			var sright  = (pright != null && pright.hidden != true ? true : false);
			var stop    = (ptop != null && ptop.hidden != true ? true : false);
			var sbottom = (pbottom != null && pbottom.hidden != true ? true : false);
			// calculate %
			for (var p in { 'top':'', 'left':'', 'right':'', 'bottom':'', 'preview':'' }) { 
				var tmp = this.get(p);
				var str = String(tmp.size);
				if (tmp && str.substr(str.length-1) == '%') {
					var tmph = height;
					if (tmp.type == 'preview') {
						tmph = tmph 
							- (ptop && !ptop.hidden ? ptop.sizeCalculated : 0) 
							- (pbottom && !pbottom.hidden ? pbottom.sizeCalculated : 0);
					}
					tmp.sizeCalculated = parseInt((tmp.type == 'left' || tmp.type == 'right' ? width : tmph) * parseFloat(tmp.size) / 100);
				} else {
					tmp.sizeCalculated = parseInt(tmp.size);
				}
				if (tmp.sizeCalculated < parseInt(tmp.minSize)) tmp.sizeCalculated = parseInt(tmp.minSize);
			}
			// top if any		
			if (ptop != null && ptop.hidden != true) {
				var l = 0;
				var t = 0;
				var w = width;
				var h = ptop.sizeCalculated;
				$('#layout_'+ this.name +'_panel_top').css({
					'display': 'block',
					'left': l + 'px',
					'top': t + 'px',
					'width': w + 'px',
					'height': h + 'px'
				}).show();
				ptop.width  = w;
				ptop.height = h;
				// resizer
				if (ptop.resizable) {
					t = ptop.sizeCalculated - (this.padding == 0 ? this.resizer : 0);
					h = (this.resizer > this.padding ? this.resizer : this.padding);
					$('#layout_'+ this.name +'_resizer_top').show().css({
						'display': 'block',
						'left': l + 'px',
						'top': t + 'px',
						'width': w + 'px',
						'height': h + 'px',
						'cursor': 'ns-resize'
					}).bind('mousedown', function (event) {
						w2ui[obj.name].tmp.events.resizeStart('top', event);
						return false;
					});
				}
			} else {
				$('#layout_'+ this.name +'_panel_top').hide();
			}
			// left if any
			if (pleft != null && pleft.hidden != true) {
				var l = 0;
				var t = 0 + (stop ? ptop.sizeCalculated + this.padding : 0);
				var w = pleft.sizeCalculated;
				var h = height - (stop ? ptop.sizeCalculated + this.padding : 0) - 
									  (sbottom ? pbottom.sizeCalculated + this.padding : 0);
				var e = $('#layout_'+ this.name +'_panel_left');
				if (window.navigator.userAgent.indexOf('MSIE') > 0 && e.length > 0 && e[0].clientHeight < e[0].scrollHeight) w += 17; // IE hack
				$('#layout_'+ this.name +'_panel_left').css({
					'display': 'block',
					'left': l + 'px',
					'top': t + 'px',
					'width': w + 'px',
					'height': h + 'px'
				}).show();
				pleft.width  = w;
				pleft.height = h;
				// resizer
				if (pleft.resizable) {
					l = pleft.sizeCalculated - (this.padding == 0 ? this.resizer : 0);
					w = (this.resizer > this.padding ? this.resizer : this.padding);
					$('#layout_'+ this.name +'_resizer_left').show().css({
						'display': 'block',
						'left': l + 'px',
						'top': t + 'px',
						'width': w + 'px',
						'height': h + 'px',
						'cursor': 'ew-resize'
					}).bind('mousedown', function (event) {
						w2ui[obj.name].tmp.events.resizeStart('left', event);
						return false;
					});
				}
			} else {
				$('#layout_'+ this.name +'_panel_left').hide();
				$('#layout_'+ this.name +'_resizer_left').hide();
			}
			// right if any
			if (pright != null && pright.hidden != true) {
				var l = width - pright.sizeCalculated;
				var t = 0 + (stop ? ptop.sizeCalculated + this.padding : 0);
				var w = pright.sizeCalculated;
				var h = height - (stop ? ptop.sizeCalculated + this.padding : 0) - 
									  (sbottom ? pbottom.sizeCalculated + this.padding : 0);
				$('#layout_'+ this.name +'_panel_right').css({
					'display': 'block',
					'left': l + 'px',
					'top': t + 'px',
					'width': w + 'px',
					'height': h + 'px'
				}).show();
				pright.width  = w;
				pright.height = h;
				// resizer
				if (pright.resizable) {
					l = l - this.padding;
					w = (this.resizer > this.padding ? this.resizer : this.padding);
					$('#layout_'+ this.name +'_resizer_right').show().css({
						'display': 'block',
						'left': l + 'px',
						'top': t + 'px',
						'width': w + 'px',
						'height': h + 'px',
						'cursor': 'ew-resize'
					}).bind('mousedown', function (event) {
						w2ui[obj.name].tmp.events.resizeStart('right', event);
						return false;
					});
				}			
			} else {
				$('#layout_'+ this.name +'_panel_right').hide();
			}
			// bottom if any
			if (pbottom != null && pbottom.hidden != true) {
				var l = 0;
				var t = height - pbottom.sizeCalculated;
				var w = width;
				var h = pbottom.sizeCalculated;
				$('#layout_'+ this.name +'_panel_bottom').css({
					'display': 'block',
					'left': l + 'px',
					'top': t + 'px',
					'width': w + 'px',
					'height': h + 'px'
				}).show();
				pbottom.width  = w;
				pbottom.height = h;
				// resizer
				if (pbottom.resizable) {
					t = t - (this.padding == 0 ? 0 : this.padding);
					h = (this.resizer > this.padding ? this.resizer : this.padding);
					$('#layout_'+ this.name +'_resizer_bottom').show().css({
						'display': 'block',
						'left': l + 'px',
						'top': t + 'px',
						'width': w + 'px',
						'height': h + 'px',
						'cursor': 'ns-resize'
					}).bind('mousedown', function (event) {
						w2ui[obj.name].tmp.events.resizeStart('bottom', event);
						return false;
					});
				}
			} else {
				$('#layout_'+ this.name +'_panel_bottom').hide();
			}
			// main - always there
			var l = 0 + (sleft ? pleft.sizeCalculated + this.padding : 0);
			var t = 0 + (stop ? ptop.sizeCalculated + this.padding : 0);
			var w = width  - (sleft ? pleft.sizeCalculated + this.padding : 0) - 
								  (sright ? pright.sizeCalculated + this.padding: 0);
			var h = height - (stop ? ptop.sizeCalculated + this.padding : 0) - 
								  (sbottom ? pbottom.sizeCalculated + this.padding : 0) -
								  (sprev ? pprev.sizeCalculated + this.padding : 0);
			var e = $('#layout_'+ this.name +'_panel_main');
			if (window.navigator.userAgent.indexOf('MSIE') > 0 && e.length > 0 && e[0].clientHeight < e[0].scrollHeight) w += 17; // IE hack
			$('#layout_'+ this.name +'_panel_main').css({
				'display': 'block',
				'left': l + 'px',
				'top': t + 'px',
				'width': w + 'px',
				'height': h + 'px'
			});
			pmain.width  = w;
			pmain.height = h;
			
			// preview if any
			if (pprev != null && pprev.hidden != true) {
				var l = 0 + (sleft ? pleft.sizeCalculated + this.padding : 0);
				var t = height - (sbottom ? pbottom.sizeCalculated + this.padding : 0) - pprev.sizeCalculated;
				var w = width  - (sleft ? pleft.sizeCalculated + this.padding : 0) - 
									  (sright ? pright.sizeCalculated + this.padding : 0);
				var h = pprev.sizeCalculated;
				var e = $('#layout_'+ this.name +'_panel_preview');
				if (window.navigator.userAgent.indexOf('MSIE') > 0 && e.length > 0 && e[0].clientHeight < e[0].scrollHeight) w += 17; // IE hack
				$('#layout_'+ this.name +'_panel_preview').css({
					'display': 'block',
					'left': l + 'px',
					'top': t + 'px',
					'width': w + 'px',
					'height': h + 'px'
				}).show();
				pprev.width  = w;
				pprev.height = h;
				// resizer
				if (pprev.resizable) {
					t = t - (this.padding == 0 ? 0 : this.padding);
					h = (this.resizer > this.padding ? this.resizer : this.padding);
					$('#layout_'+ this.name +'_resizer_preview').show().css({
						'display': 'block',
						'left': l + 'px',
						'top': t + 'px',
						'width': w + 'px',
						'height': h + 'px',
						'cursor': 'ns-resize'
					}).bind('mousedown', function (event) {
						w2ui[obj.name].tmp.events.resizeStart('preview', event);
						return false;
					});
				}
			} else {
				$('#layout_'+ this.name +'_panel_preview').hide();
			}

			// display tabs and toolbar if needed
			for (var p in { 'top':'', 'left':'', 'main':'', 'preview':'', 'right':'', 'bottom':'' }) { 
				var pan = this.get(p);
				var tmp = '#layout_'+ this.name +'_panel_'+ p +' > .w2ui-panel-';
				var height = 0;
				if (pan.show.tabs) {
					if (pan.tabs != null && w2ui[this.name +'_'+ p +'_tabs']) w2ui[this.name +'_'+ p +'_tabs'].resize();
					height += w2utils.getSize($(tmp + 'tabs').css({ display: 'block' }), 'height');
				}
				if (pan.show.toolbar) {
					if (pan.toolbar != null && w2ui[this.name +'_'+ p +'_toolbar']) w2ui[this.name +'_'+ p +'_toolbar'].resize();
					height += w2utils.getSize($(tmp + 'toolbar').css({ top: height + 'px', display: 'block' }), 'height');
				}
				$(tmp + 'content').css({ display: 'block' }).css({ top: height + 'px' });
			}
			// send resize to all objects
			var obj = this;
			clearTimeout(this._resize_timer);
			this._resize_timer = setTimeout(function () {
				for (var e in w2ui) {
					if (typeof w2ui[e].resize == 'function') {
						// sent to all none-layouts
						if (w2ui[e].panels == 'undefined') w2ui[e].resize();
						// only send to nested layouts
						var parent = $(w2ui[e].box).parents('.w2ui-layout');
						if (parent.length > 0 && parent.attr('name') == obj.name) w2ui[e].resize();
					}
				}
			}, 100);		
			this.trigger($.extend(eventData, { phase: 'after' }));
			return (new Date()).getTime() - time;
		},
		
		destroy: function () { 
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'destroy', target: this.name });	
			if (eventData.isCancelled === true) return false;
			if (typeof w2ui[this.name] == 'undefined') return false;
			// clean up
			if ($(this.box).find('#layout_'+ this.name +'_panel_main').length > 0) {
				$(this.box)
					.removeAttr('name')
					.removeClass('w2ui-layout')
					.html('');
			}
			delete w2ui[this.name];
			// event after
			this.trigger($.extend(eventData, { phase: 'after' }));
			
			if (this.tmp.events && this.tmp.events.resize) 	$(window).off('resize', this.tmp.events.resize);
			if (this.tmp.events && this.tmp.events.mousemove) $(document).off('mousemove', this.tmp.events.mousemove);
			if (this.tmp.events && this.tmp.events.mouseup) 	$(document).off('mouseup', this.tmp.events.mouseup);
			
			return true;
		},

		lock: function (panel, msg, showSpinner) {
			if ($.inArray(String(panel), ['left', 'right', 'top', 'bottom', 'preview', 'main']) == -1) {
				console.log('ERROR: First parameter needs to be the a valid panel name.');
				return;
			}
			var nm = '#layout_'+ this.name + '_panel_' + panel;
			w2utils.lock(nm, msg, showSpinner);
		},

		unlock: function (panel) { 
			if ($.inArray(String(panel), ['left', 'right', 'top', 'bottom', 'preview', 'main']) == -1) {
				console.log('ERROR: First parameter needs to be the a valid panel name.');
				return;
			}
			var nm = '#layout_'+ this.name + '_panel_' + panel;
			w2utils.unlock(nm);
		}
	}
	
	$.extend(w2layout.prototype, w2utils.event);
	w2obj.layout = w2layout;
})();
