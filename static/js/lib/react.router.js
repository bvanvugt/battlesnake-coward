!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ReactMiniRouter=e()}}(function(){var define,module,exports;return function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module,exports){module.exports={RouterMixin:require("./lib/RouterMixin"),navigate:require("./lib/navigate")}},{"./lib/RouterMixin":2,"./lib/navigate":4}],2:[function(require,module,exports){var pathToRegexp=require("path-to-regexp"),urllite=require("urllite/lib/core"),detect=require("./detect");module.exports={getDefaultProps:function(){return{routes:{}}},getInitialState:function(){return{path:this.props.path,root:this.props.root||"",useHistory:this.props.history&&detect.hasPushState}},componentWillMount:function(){this.setState({_routes:processRoutes(this.state.root,this.routes,this)})},componentDidMount:function(){this.getDOMNode().addEventListener("click",this.handleClick,false);if(this.state.useHistory){window.addEventListener("popstate",this.onPopState,false)}else{if(window.location.hash.indexOf("#!")===-1){window.location.hash="#!/"}window.addEventListener("hashchange",this.onPopState,false)}},componentWillUnmount:function(){this.getDOMNode().removeEventListener("click",this.handleClick);if(this.state.useHistory){window.removeEventListener("popstate",this.onPopState)}else{window.removeEventListener("hashchange",this.onPopState)}},onPopState:function(){var url=urllite(window.location.href),hash=url.hash||"",path=this.state.useHistory?url.pathname:hash.slice(2);if(path.length===0)path="/";this.setState({path:path+url.search})},renderCurrentRoute:function(){var path=this.state.path,url;if(path){url=urllite(path)}else if(!path&&detect.canUseDOM){url=urllite(window.location.href);if(!this.state.useHistory)url=urllite(url.hash?url.hash.slice(2):"")}else{url=urllite("/")}url.query=parseSearch(url.search);var parsedPath=url.pathname;if(!parsedPath||parsedPath.length===0)parsedPath="/";var matchedRoute=this.matchRoute(parsedPath);if(matchedRoute){return matchedRoute.handler.apply(this,matchedRoute.params.concat(url.query))}else if(this.notFound){return this.notFound(parsedPath,url.query)}else{throw new Error("No route matched path: "+parsedPath)}},handleClick:function(evt){var self=this,url=getHref(evt);if(url&&self.matchRoute(url.pathname)){evt.preventDefault();setTimeout(function(){var pathWithSearch=url.pathname+(url.search||"");if(pathWithSearch.length===0)pathWithSearch="/";if(self.state.useHistory){window.history.pushState({},"",pathWithSearch)}else{window.location.hash="!"+pathWithSearch}self.setState({path:pathWithSearch})},0)}},matchRoute:function(path){if(!path)return false;var matchedRoute={};this.state._routes.some(function(route){var matches=route.pattern.exec(path);if(matches){matchedRoute.handler=route.handler;matchedRoute.params=matches.slice(1,route.params.length+1);return true}return false});return matchedRoute.handler?matchedRoute:false}};function getHref(evt){if(evt.defaultPrevented){return}if(evt.metaKey||evt.ctrlKey||evt.shiftKey){return}if(evt.button!==0){return}var elt=evt.target;while(elt&&elt.nodeName!=="A"){elt=elt.parentNode}if(!elt){return}if(elt.target&&elt.target!=="_self"){return}if(!!elt.attributes.download){return}var linkURL=urllite(elt.href);var windowURL=urllite(window.location.href);if(linkURL.protocol!==windowURL.protocol||linkURL.host!==windowURL.host){return}return linkURL}function processRoutes(root,routes,component){var patterns=[],path,pattern,keys,handler,handlerFn;for(path in routes){if(routes.hasOwnProperty(path)){keys=[];pattern=pathToRegexp(root+path,keys);handler=routes[path];handlerFn=component[handler];patterns.push({pattern:pattern,params:keys,handler:handlerFn})}}return patterns}function parseSearch(str){var parsed={};if(str.indexOf("?")===0)str=str.slice(1);var pairs=str.split("&");pairs.forEach(function(pair){var keyVal=pair.split("=");parsed[decodeURIComponent(keyVal[0])]=decodeURIComponent(keyVal[1])});return parsed}},{"./detect":3,"path-to-regexp":5,"urllite/lib/core":6}],3:[function(require,module,exports){var canUseDOM=!!(typeof window!=="undefined"&&window.document&&window.document.createElement);module.exports={canUseDOM:canUseDOM,hasPushState:canUseDOM&&window.history&&"pushState"in window.history,hasHashbang:function(){return canUseDOM&&window.location.hash.indexOf("#!")===0}}},{}],4:[function(require,module,exports){var detect=require("./detect");module.exports=function triggerUrl(url,silent){if(detect.hasHashbang()){window.location.hash="#!"+url}else if(detect.hasPushState){window.history.pushState({},"",url);if(!silent)window.dispatchEvent(new window.Event("popstate"))}else{console.error("Browser does not support pushState, and hash is missing a hashbang prefix!")}}},{"./detect":3}],5:[function(require,module,exports){module.exports=pathtoRegexp;var PATH_REGEXP=new RegExp(["(\\\\.)","([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?","([.+*?=^!:${}()[\\]|\\/])"].join("|"),"g");function escapeGroup(group){return group.replace(/([=!:$\/()])/g,"\\$1")}var attachKeys=function(re,keys){re.keys=keys;return re};function pathtoRegexp(path,keys,options){if(keys&&!Array.isArray(keys)){options=keys;keys=null}keys=keys||[];options=options||{};var strict=options.strict;var end=options.end!==false;var flags=options.sensitive?"":"i";var index=0;if(path instanceof RegExp){var groups=path.source.match(/\((?!\?)/g)||[];keys.push.apply(keys,groups.map(function(match,index){return{name:index,delimiter:null,optional:false,repeat:false}}));return attachKeys(path,keys)}if(Array.isArray(path)){path=path.map(function(value){return pathtoRegexp(value,keys,options).source});return attachKeys(new RegExp("(?:"+path.join("|")+")",flags),keys)}path=path.replace(PATH_REGEXP,function(match,escaped,prefix,key,capture,group,suffix,escape){if(escaped){return escaped}if(escape){return"\\"+escape}var repeat=suffix==="+"||suffix==="*";var optional=suffix==="?"||suffix==="*";keys.push({name:key||index++,delimiter:prefix||"/",optional:optional,repeat:repeat});prefix=prefix?"\\"+prefix:"";capture=escapeGroup(capture||group||"[^"+(prefix||"\\/")+"]+?");if(repeat){capture=capture+"(?:"+prefix+capture+")*"}if(optional){return"(?:"+prefix+"("+capture+"))?"}return prefix+"("+capture+")"});var endsWithSlash=path[path.length-1]==="/";if(!strict){path=(endsWithSlash?path.slice(0,-2):path)+"(?:\\/(?=$))?"}if(!end){path+=strict&&endsWithSlash?"":"(?=\\/|$)"}return attachKeys(new RegExp("^"+path+(end?"$":""),flags),keys)}},{}],6:[function(require,module,exports){(function(){var URL,URL_PATTERN,defaults,urllite,__hasProp={}.hasOwnProperty;URL_PATTERN=/^(?:(?:([^:\/?\#]+:)\/+|(\/\/))(?:([a-z0-9-\._~%]+)(?::([a-z0-9-\._~%]+))?@)?(([a-z0-9-\._~%!$&'()*+,;=]+)(?::([0-9]+))?)?)?([^?\#]*?)(\?[^\#]*)?(\#.*)?$/;urllite=function(raw,opts){return urllite.URL.parse(raw,opts)};urllite.URL=URL=function(){function URL(props){var k,v,_ref;for(k in defaults){if(!__hasProp.call(defaults,k))continue;v=defaults[k];this[k]=(_ref=props[k])!=null?_ref:v}this.host||(this.host=this.hostname&&this.port?""+this.hostname+":"+this.port:this.hostname?this.hostname:"");this.origin||(this.origin=this.protocol?""+this.protocol+"//"+this.host:"");this.isAbsolutePathRelative=!this.host&&this.pathname.charAt(0)==="/";this.isPathRelative=!this.host&&this.pathname.charAt(0)!=="/";this.isRelative=this.isSchemeRelative||this.isAbsolutePathRelative||this.isPathRelative;this.isAbsolute=!this.isRelative}URL.parse=function(raw){var m,pathname,protocol;m=raw.toString().match(URL_PATTERN);pathname=m[8]||"";protocol=m[1];return new urllite.URL({protocol:protocol,username:m[3],password:m[4],hostname:m[6],port:m[7],pathname:protocol&&pathname.charAt(0)!=="/"?"/"+pathname:pathname,search:m[9],hash:m[10],isSchemeRelative:m[2]!=null})};return URL}();defaults={protocol:"",username:"",password:"",host:"",hostname:"",port:"",pathname:"",search:"",hash:"",origin:"",isSchemeRelative:false};module.exports=urllite}).call(this)},{}]},{},[1])(1)});