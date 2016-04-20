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

    // Load and set up scheme (GUI) here
    scheme.render(this, 'ArduinoPinManagerWindow', root);

    this.initUI(scheme, wmRef);

    return root;
  };


  ApplicationArduinoPinManagerWindow.prototype.initUI = function(scheme, wm){
    var self = this;
    var AnalogContainer = scheme.find(this, "AnalogContainer"),
        DigitalContainer = scheme.find(this, "DigitalContainer");

    var regexp = /^[AD][0-9][0-9]{0,2}/ ;
    var m, d, v ;

    var container, label, sw;

    scheme.find(self, "dac").on("change", function(ev){

    })


    callAPI("exec", {command : "lingpio export"}, function(err, res){

      if(err)
        alert("Error in lingpio launch : " + err);
      else


    VFS.scandir("root:///sys/class/gpio", function(err, res) {
      res.forEach(function (item, index, array) {
        var fn = item.filename;
        if ((m = fn.match(regexp)) !== null || (m = fn.match("SCK")) !== null) {
          VFS.read("root:///sys/class/gpio/" + fn + "/direction", function(err, res){
            if(err)
              alert("Direction reading error : " + err)
            else {
              VFS.abToText (res, "text/plain" , function(e,r){
                if(e)
                  alert("Error in direction file reading : " + e);
                else {
                  d = r.replace(/(\r\n|\n|\r)/gm,"");
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

                          scheme.find(self, fn+"Switch").set("value", (v%2==1 ? "HIGH" : "LOW"));
                          scheme.find(self, fn+"Switch").$element.setAttribute("data-value", (v%2==1 ? "HIGH" : "LOW"));
                          scheme.find(self, fn+"Button").set("value", d );
                          scheme.find(self, fn+"Button").$element.setAttribute("data-value", d);

                          scheme.find(self, fn+"Button").on("click", function(ev){
                            var direction = this.$element.attributes["data-value"].value,
                                newDirection,
                                pinLabel = this.$element.attributes["data-id"].value,
                                pin = this.$element.attributes["data-id"].value.indexOf("SCK") > -1 ? "SCK" : this.$element.attributes["data-id"].value.match(regexp)[0];


                            direction == "in" ? newDirection = "out" : newDirection = "in";

                            callAPI("exec", {command : "echo " + newDirection + " > /sys/class/gpio/" + pin + "/direction"}, function(err, res){
                              if(err) {
                                wm.notification({
                                  icon : "status/error.png",
                                  title : "Pin state",
                                  message : "Error during pin direction change"
                                })
                              }
                              else {

                                var elements = document.getElementsByClassName("pin-value");
                                elements.forEach(function(item, index, array){
                                  if(newDirection == "out")
                                    Utils.$addClass(item, "pin-value-hidden");
                                  else
                                    Utils.$removeClass(item, "pin-value-hidden");
                                })


                                scheme.find(self, pinLabel).$element.setAttribute("data-value", newDirection);
                                scheme.find(self, pinLabel).set("value", newDirection);
                                wm.notification({
                                  icon : "status/dialog-information.png",
                                  title : "Pin state",
                                  message : pin + " direction changed from " + direction + " to " + newDirection
                                })
                              }

                            })
                          });

                          scheme.find(self, fn+"Switch").on("click", function(ev){

                            var level = this.$element.attributes["data-value"].value,
                              newLevel,
                              pinLabel = this.$element.attributes["data-id"].value,
                              pin = this.$element.attributes["data-id"].value.indexOf("SCK") > -1 ? "SCK" : this.$element.attributes["data-id"].value.match(regexp)[0];

                            level == "HIGH" ? newLevel = "0" : newLevel = "1";

                            callAPI("exec", {command : "echo " + (level == "HIGH" ?  "0" : "1") + " > /sys/class/gpio/" + pin + "/value"}, function(err, res){
                              if(err) {
                                wm.notification({
                                  icon : "status/error.png",
                                  title : "Pin state",
                                  message : "Error during pin value change"
                                })
                              }
                              else {
                                //scheme.find(self, fn+"Switch").set("value", (v%2==1 ? "HIGH" : "LOW"));
                                //scheme.find(self, fn+"Switch").$element.setAttribute("data-value", (v%2==1 ? "HIGH" : "LOW"));

                                scheme.find(self, fn+"Switch").set("value", (level=="HIGH" ? "LOW" : "HIGH"));
                                scheme.find(self, fn+"Switch").$element.setAttribute("data-value", (level=="HIGH" ? "LOW" : "HIGH"));
                                wm.notification({
                                  icon : "status/dialog-information.png",
                                  title : "Pin state",
                                  message : pin + " value changed from " + level + " to " + (level=="HIGH" ? "LOW" : "HIGH") + "[" + newLevel + "]"
                                })
                              }

                            })
                          });

                          scheme.find(self, fn+"Read").on("click", function(ev){

                            var pinLabel = this.$element.attributes["data-id"].value,
                                pin = this.$element.attributes["data-id"].value.indexOf("SCK") > -1 ? "SCK" : this.$element.attributes["data-id"].value.match(regexp)[0],
                                pinValue = scheme.find(self, fn+"Value");

                            if(scheme.find(self, "dac").get("value") == false)
                              VFS.read("root:///sys/class/gpio/" + pin + "/value", function(err, res){
                              if(err)
                                wm.notification({
                                  icon : "status/error.png",
                                  title : "Pin state",
                                  message : "Error during reading of pin" + pin
                                });
                              else {
                                VFS.abToText(res, "text/plain", function (e, r) {
                                  scheme.find(self, fn + "Value").set("value", r);
                                })
                              }
                            });
                            else {
                              callAPI("exec", {command : "cat /sys/bus/iio/devices/iio:device0/in_voltage_" + pin + "_raw"}, function(err, res){
                                if(err)
                                  alert("ERROR in dac read of " + pin)
                                else{
                                  VFS.abToText(res, "text/plain", function (e, r) {
                                    if(e)
                                      alert("Error in dac pin value reding")
                                    else
                                        pinValue.set("value", r.length > 0 ? r : "no value")
                                  });
                                }
                              })
                            }

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

      scheme.find(self, "dac").on("change", function(ev){
            wm.notification({
              icon : "status/dialog-information.png",
              title : "Pin state",
              message : "ADC " + (ev.target.checked == true ? "enabled" : "disabled" )
            })
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
