/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduinoPinManagerWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationArduinoPinManagerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 800,
      height: 600
    }, app, scheme]);
  }

  ApplicationArduinoPinManagerWindow.prototype = Object.create(Window.prototype);
  ApplicationArduinoPinManagerWindow.constructor = Window.prototype;

  ApplicationArduinoPinManagerWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'ArduinoPinManagerWindow', root);
    this.initUI(scheme);

    return root;
  };


  ApplicationArduinoPinManagerWindow.prototype.initUI = function(scheme){
    var self = this;
    scheme.find(this, "BoardTemplate").set("src", "/packages/target/ArduinoPinManager/Tian.jpg");
    //var AnalogContainer = scheme.find(this, "AnalogPins"),
    var AnalogContainer = scheme.find(this, "AnalogContainer"),
        DigitalContainer = scheme.find(this, "DigitalContainer");

    var regexp = new RegExp("/^[AD][1-9][0-9]{0,2}") ;
    var regexp2 = /^[AD][0-9][0-9]{0,2}/ ;
    var m, d, v ;

    var pinsDir = new VFS.File ("/sys/class/gpio");


    callAPI("exec", {command : "lingpio export"}, function(err, res){

      if(err)
        alert("Error in lingpio launch : " + err);
      else


    VFS.scandir("root:///sys/class/gpio", function(err, res) {
      //console.log ("Items: " + JSON.stringify(res));
      res.forEach(function (item, index, array) {
        var fn = item.filename;
        if ((m = fn.match(regexp2)) !== null || (m = fn.match("SCK")) !== null) {
          VFS.read("root:///sys/class/gpio/" + fn + "/direction", function(err, res){
            if(err)
              alert("Direction reading error : " + err)
            else {
              VFS.abToText (res, "text/plain" , function(e,r){
                if(e)
                  alert("Error in direction file reading : " + e);
                else {
                  d = r;
                  VFS.read("root:///sys/class/gpio/" + fn + "/value", function (err, res) {
                    if (err)
                      alert("Value reading error : " + err)
                    else {
                      VFS.abToText(res, "text/plain", function (e, r) {
                        if (e)
                          alert("Error in value file reading : " + e);
                        else {
                          v = r;
                          //console.log(index + ") " + fn + " : " + d + " | " + v);

                          if(fn[0] == "A") {
                            var container = scheme.create(self, "gui-vbox", {id: fn + "Container"}, AnalogContainer);
                            var label = scheme.create(self, "gui-label", {id: fn + "Label"}, container);
                            var sw = scheme.create(self, "gui-switch", {id: fn + "Switch"}, label);
                            scheme.create(self, "gui-button", {id: fn + "Button"}, sw);
                          }
                          if (fn[0] == "D" || fn == "SCK") {
                            var container = scheme.create(self, "gui-vbox", {id: fn + "Container"}, DigitalContainer);
                            var label = scheme.create(self, "gui-label", {id: fn + "Label"}, container);
                            var sw = scheme.create(self, "gui-switch", {id: fn + "Switch"}, label);
                            scheme.create(self, "gui-button", {id: fn + "Button"}, sw);
                          }

                          scheme.find(self, fn+"Switch").set("value", (v%2 == 1));
                          scheme.find(self, fn+"Button").set("value", d );
                          scheme.find(self, fn+"Label").set("value", fn );

                          scheme.find(self, fn+"Switch").on("click", function(ev){
                            alert("Change pin mode")
                          });
                          scheme.find(self, fn+"Button").on("click", function(ev){
                            alert("Change pin state");
                          });
                        }
                      });
                    }
                  })
                }
              })
            }
          })
        }
      });
    });

    });

    function callAPI(fn, args, cb) {
      cb = cb || function(){};
      self._toggleLoading(true);
      API.call(fn, args, function (response) {
        self._toggleLoading(false);
        return cb(response.error, response.result);
      }, function (err) {
        err = 'Error while communicating with device: ' + (err || 'Unkown error (no response)');
        wm.notification({title: 'Arduino Settings', message: err, icon: 'status/error.png'});
      }, {
        timeout: 20000,
        ontimeout: function () {
          self._toggleLoading(false);
          return cb('Request timed out');
        }
      });
    }

  }





  ApplicationArduinoPinManagerWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduinoPinManager(args, metadata) {
    Application.apply(this, ['ApplicationArduinoPinManager', args, metadata]);
  }

  ApplicationArduinoPinManager.prototype = Object.create(Application.prototype);
  ApplicationArduinoPinManager.constructor = Application;

  ApplicationArduinoPinManager.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationArduinoPinManager.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationArduinoPinManagerWindow(self, metadata, scheme));
      onInited();
    });

    this._setScheme(scheme);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationArduinoPinManager = OSjs.Applications.ApplicationArduinoPinManager || {};
  OSjs.Applications.ApplicationArduinoPinManager.Class = ApplicationArduinoPinManager;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
