'use strict';

/**
 * @overview <i>ccm</i>-based web component for user authentication with an account from the Computer Science Department at Bonn-Rhein-Sieg University of Applied Sciences.
 * @author André Kless <andre.kless@web.de> 2025
 * @license The MIT License (MIT)
 */

(() => {
  const component = {
    name: 'fb02user',
    ccm: '././libs/ccm/ccm.js',
    config: {
      "css": ["ccm.load", "././libs/fb02user/resources/styles.css"],
      "html": {
        "logged_in": {
          "id": "logged_in",
          "inner": [
            {
              "id": "user",
              "inner": [
                {"tag": "img", "src": "%picture%", "alt": "User", "height": "24px"},
                "%user%"
              ]
            },
            {
              "tag": "button",
              "id": "button",
              "inner": "Logout",
              "onclick": "%click%"
            }
          ]
        },
        "logged_out": {
          "id": "logged_out",
          "inner": {
            "tag": "button",
            "id": "button",
            "inner": "Login",
            "onclick": "%click%"
          }
        },
      },
//    "logged_in": true,
//    "map": user => user.user === 'john' ? 'Teacher' : 'Student',
//    "norender": true,
//    "onchange": event => console.log( 'User has logged ' + ( event ? 'in' : 'out' ) + '.' ),
      "picture": "././libs/fb02user/resources/icon.svg",
//    "pseudo": true,
//    "restart": true,
    },
    Instance: function () {

      let data, context = this;

      this.init = async () => {

        // set context to the highest user instance with same realm and adjust onchange callback
        let instance = this;
        while (instance = instance.parent)
          if (this.ccm.helper.isInstance(instance.user) && instance.user.getRealm() === this.getRealm())
            context = instance.user;
        if (context === this) {
          context = null;
          this.onchange = this.onchange ? [this.onchange] : [];
        } else if (this.onchange)
          context.onchange.push(this.onchange);
      };

      this.ready = async () => {
        this.element.innerHTML = '';                                                 // clear own website area
        if (this.logged_in || sessionStorage.getItem('ccm-' + this.component.name))  // immediate login?
          await this.login(true);                                                    // => login user
      };

      this.start = async () => {

        // higher user instance with same realm exists? => redirect method call
        if (context) return context.start();

        // correct state is already rendered or no login/logout button wanted? => abort
        if (this.isLoggedIn() && this.element.querySelector('#logged_in')
            || !this.isLoggedIn() && this.element.querySelector('#logged_out')
            || this.norender) return;

        // render logged in or logged out view
        if (this.isLoggedIn()) {
          this.element.innerHTML = '';
          this.element.appendChild(this.ccm.helper.html(this.html.logged_in, {
            click: this.logout,
            user: this.getUsername(),
            picture: this.getValue().picture
          }));
        } else {
          this.element.innerHTML = '';
          this.element.appendChild(this.ccm.helper.html(this.html.logged_out, {
            click: this.login
          }));
        }
      };

      /**
       * logs in user
       * @param {boolean|function} not - prevent all or a specific onchange callback from being triggered
       * @returns {Promise<Object>}
       */
      this.login = async not => {

        // higher user instance with same realm exists? => redirect method call
        if (context) return context.login(not || this.onchange);

        // user already logged in? => abort
        if (this.isLoggedIn()) return this.getValue();

        // choose authentication mode and proceed login
        let result = sessionStorage.getItem('ccm-' + this.component.name);
        if (result)
          result = JSON.parse(result);
        else
          do {
            result = await this.ccm.load({
              url: `https://kaul.inf.h-brs.de/login/login${this.pseudo ? '_pseudonym' : ''}.php`,
              method: 'JSONP',
              params: {realm: this.getRealm()}
            });
            if (this.ccm.helper.isObject(result)) {
              result.key = result.user;
              result.token = result.user + '#' + result.token;
            }
          } while (!(this.ccm.helper.isObject(result) && result.user && this.ccm.helper.regex('key').test(result.user) && typeof result.token === 'string') && !alert('Authentication failed'));

        // remember user data
        data = this.ccm.helper.clone(result);
        data.realm = this.getRealm();
        if (!data.picture && this.picture) data.picture = this.picture;

        sessionStorage.setItem('ccm-' + this.component.name, JSON.stringify(data));

        // (re)render own content
        await this.start();

        // perform 'onchange' callbacks
        not !== true && this.onchange.forEach(async onchange => onchange !== not && await onchange(this.isLoggedIn()));

        return this.getValue();
      };

      /**
       * logs out user
       * @param {boolean|function} not - prevent all or a specific onchange callback from being triggered
       * @returns {Promise}
       */
      this.logout = async not => {

        // higher user instance with same realm exists? => redirect method call
        if (context) return context.logout(this.onchange);

        // user already logged out? => abort
        if (!this.isLoggedIn()) return;

        // choose authentication mode and proceed logout
        await this.ccm.load({
          url: 'https://kaul.inf.h-brs.de/login/logout.php',
          method: 'JSONP',
          params: {realm: this.getRealm()}
        }).catch(() => {
        });

        // clear user data
        data = undefined;
        sessionStorage.removeItem('ccm-' + this.component.name);

        // restart after logout?
        if (this.restart && this.parent) {
          await this.parent.start();        // restart parent
        }
        // (re)render own content
        else await this.start();

        // perform 'onchange' callbacks
        not !== true && this.onchange.forEach(onchange => onchange !== not && onchange(this.isLoggedIn()));
      };

      /**
       * checks if user is logged in
       * @returns {boolean}
       */
      this.isLoggedIn = () => {

        // higher user instance with same realm exists? => redirect method call
        if (context) return context.isLoggedIn();

        return !!data;
      };

      /**
       * returns current result data
       * @returns {Object} user data
       */
      this.getValue = () => {

        // higher user instance with same realm exists? => redirect method call
        if (context && context.getValue) return context.getValue();

        return this.ccm.helper.clone(data);
      };

      /**
       * returns displayed username
       * @returns {string}
       */
      this.getUsername = () => {
        const user = this.getValue();
        return this.map && this.map(user) || user.name || user.user || user.key;
      };

      /**
       * returns authentication mode
       * @returns {string}
       */
      this.getRealm = () => `hbrsinf${this.pseudo ? 'pseudo' : 'kaul'}`;
    }
  };
  let b = "ccm." + component.name + (component.version ? "-" + component.version.join(".") : "") + ".js";
  if (window.ccm && null === window.ccm.files[b]) return window.ccm.files[b] = component;
  (b = window.ccm && window.ccm.components[component.name]) && b.ccm && (component.ccm = b.ccm);
  "string" === typeof component.ccm && (component.ccm = {url: component.ccm});
  let c = (component.ccm.url.match(/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/) || [""])[0];
  if (window.ccm && window.ccm[c]) window.ccm[c].component(component); else {
    var a = document.createElement("script");
    document.head.appendChild(a);
    component.ccm.integrity && a.setAttribute("integrity", component.ccm.integrity);
    component.ccm.crossorigin && a.setAttribute("crossorigin", component.ccm.crossorigin);
    a.onload = function () {
      (c = "latest" ? window.ccm : window.ccm[c]).component(component);
      document.head.removeChild(a)
    };
    a.src = component.ccm.url
  }
})();