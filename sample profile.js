/**
 * Created by Ralph Varjabedian on 2/19/14.
 */

var colors = require('colors');
var fs = require("fs");

var accumulate = {};

function printAccumulate() {
   //json
   fs.writeFileSync("profile_output_total.js", "var data = " + JSON.stringify(accumulate, null, 3));
   //csv
   fs.writeFileSync("profile_output_total.csv", ['name', 'calls', 'total', 'average', '\r\n'].join(','));
   for (var k in accumulate) {
      fs.appendFileSync("profile_output_total.csv", [
         '"' + k + '"',
         accumulate[k].calls,
         accumulate[k].total,
         accumulate[k].total/accumulate[k].calls,
         '\r\n'].join(','));
   }
}

setInterval(printAccumulate, 1000 * 10); // every 10 seconds

module.exports = {
   start: function(name, filename, args) {
      var _p = {name: name, filename: filename, cb: null};

      if (args.length > 0 && typeof(args[args.length - 1]) == "function") {
         // callback mode
         var self = this;
         var originalcb = args[args.length - 1];
         var override = function cb() { // how to create function signature similar to the old function, let's parse the arguments and generate one using eval?
            self.endcb(_p);
            return originalcb.apply(this, arguments);
         }
         _p.cb = override;
         override._def = originalcb; // very important for DynamicHttpLayer
      }
      _p.time = process.hrtime();
      return _p;
   },
   end: function(_p) {
      if (_p.cb) {
         // in finally and cb, ignore
         return;
      }
      this.endcb(_p);
   },
   endcb: function(_p) {
      // calculate time
      var diff = process.hrtime(_p.time);
      var ms = (diff[0] * 1000) + (diff[1] / 1e6);

      // accumulate
      var key = this.getFilename(_p.filename) + ":" + _p.name;
      if (!accumulate[key])
         accumulate[key] = {calls: 0, total: 0};
      accumulate[key].calls++;
      accumulate[key].total += ms;

      // print/write stuff
      if (_p.cb) {
         console.log(_p.name.yellow + "() (callback)".green, ("" + ms), "ms".grey);
      } else {
         console.log(_p.name.yellow + "() ".green, ("" + ms), "ms".grey);
      }
   },
   getFilename: function(filename) {
      return filename.substring(__dirname.length + "/lib-profile".length);
   }
};