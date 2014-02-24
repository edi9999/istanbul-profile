/**
 * Created by Ralph Varjabedian on 2/24/14.
 */

var colors = require('colors');
var fs = require('fs');

setInterval(printAccumulate, 1000 * 10); // every 10 seconds

function printAccumulate() {
   if (!obj.accumulate || !obj.dirty)
      return;

   obj.dirty = false;
   //json
   //{filename: _p.filename, name:_p.name, calls: 0, ms: 0, subms: 0, cbcalls: 0, cbms: 0}
   fs.writeFileSync("profile_output_total.js", "var data = " + JSON.stringify(obj.accumulate, null, 3));

   //csv
   fs.writeFileSync("profile_output_total.csv", ['filename','name', 'calls',
      'ms', 'ms-avg',
      'subms', 'subms-avg',
      'cbcalls',
      'cbms', 'cbms-avg',
      '\r\n'].join(','));
   for (var k in obj.accumulate) {
      fs.appendFileSync("profile_output_total.csv", [
         obj.accumulate[k].filename,
         obj.accumulate[k].name,
         obj.accumulate[k].calls,
         obj.accumulate[k].ms,
         obj.accumulate[k].ms/obj.accumulate[k].calls,
         obj.accumulate[k].subms,
         obj.accumulate[k].subms/obj.accumulate[k].calls,
         obj.accumulate[k].cbcalls,
         obj.accumulate[k].cbms,
         obj.accumulate[k].cbcalls ? obj.accumulate[k].cbms/obj.accumulate[k].cbcalls : 0,
         '\r\n'].join(','));
   }

   console.log(" [ Accumulated profiling data saved ] ");
}

module.exports = obj = {
   dirty : false,
   setAccumulate: function(accumulate) {
      this.accumulate = accumulate;
   },
   stack_start: function(level, filename, functionName, hasCallback) {
      console.log(this.getLevel(level), functionName.yellow + "()" + " {".green);
   },
   stack_done: function(level, filename, functionName, ms, subms) {
      console.log(this.getLevel(level), "}".green, ("" + ms), "ms".grey, ("" + subms).blue, "subms".grey);
   },
   accumulate_changed: function() {
      this.dirty = true;
   },
   callback_done: function(filename, functionName, ms, subms, cbms) {
      console.log(functionName.yellow + "()" + "(callback)".red, "(" + (cbms + ms), "total".grey + ")", "(" + cbms, "cbms".grey + ")", ("(" + ms).blue, "ms".grey + ")", ("(" + subms).blue, "subms".grey + ")");
   },
   getLevel : function(level) {
      var x = "";
      for (var i = 0; i < level; i++) x += "   ";
      return x;
   }
}