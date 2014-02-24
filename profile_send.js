/**
 * Created by Ralph Varjabedian on 2/24/14.
 */

var colors = require('colors');

//setInterval(printAccumulate, 1000 * 10); // every 10 seconds

//function printAccumulate() {
//   //json
//   fs.writeFileSync("profile_output_total.js", "var data = " + JSON.stringify(accumulate, null, 3));
//   //csv
//   fs.writeFileSync("profile_output_total.csv", ['name', 'calls', 'total', 'average', '\r\n'].join(','));
//   for (var k in accumulate) {
//      fs.appendFileSync("profile_output_total.csv", [
//         '"' + k + '"',
//         accumulate[k].calls,
//         accumulate[k].total,
//         accumulate[k].total/accumulate[k].calls,
//         '\r\n'].join(','));
//   }
//}


module.exports = {
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