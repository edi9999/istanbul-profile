/**
 * Created by Ralph Varjabedian on 2/19/14.
 */

var profile_send = null;
try {
   profile_send = require('./profile_send');
}
catch (err) {
}

var accumulate = {};
var stack = [];
var profile_dir = "/lib-profile";

// ms: total time it takes (stack based)
// subms: total time it takes for sub functions (stack based)
// cbms: total time it took for it's callback to be called (if it has one) (only callback time, add to it ms if you want total)

if (profile_send) profile_send.setAccumulate(accumulate);

module.exports = {
   STRIP_COMMENTS: /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
   copyFunctionSignature: function(fn) {
      var fnText = fn.toString().replace(this.STRIP_COMMENTS, '');
      return fnText.substring(0, fnText.indexOf("{"));
   },
   start: function(name, filename, args) {
      // new node
      var _p = {name: name, filename: filename, cb: null, subms: 0, cbms: 0};

      if (args.length > 0 && typeof(args[args.length - 1]) == "function") {
         // has callback, lets track that
         var self = this;
         var originalcb = args[args.length - 1];
         eval("var override = " + this.copyFunctionSignature(originalcb) + "{self.endcb(_p);return originalcb.apply(this, arguments);}");
         _p.cb = override;
      }
      if (profile_send) profile_send.stack_start(stack.length, _p.filename, _p.name, _p.cb != null);
      stack.push(_p);
      _p.time = process.hrtime();
      return _p;
   },
   end: function(_p) {
      var diff = process.hrtime(_p.time);
      var ms = (diff[0] * 1000) + (diff[1] / 1e6);
      _p.ms = ms; // only the time it took from try/finally, makes sense only if we have callback, but if we have nested functions then what?

      var poped = stack.pop();
      if (poped !== _p)
         throw new Error("invalid stack");

      var parent = null;
      if (stack.length > 0)
         parent = stack[stack.length - 1];

      // link parent, important
      //_p.parent = parent;

      var accu = this.getAccumulate(_p);

      accu.calls++;
      accu.ms += _p.ms;
      accu.subms += _p.subms;

      if (stack.length > 0) {
         var parent = stack[stack.length - 1];
         parent.subms += ms;
         var parentAccu = this.getAccumulate(parent);
         var found = false;
         for (var i = 0; i < parentAccu.children.length; i++) {
            if (parentAccu.children[i] == accu.id) {
               found = true;
               break;
            }
         }
         if (!found)
            parentAccu.children.push(accu.id);
      }

      if (profile_send) profile_send.accumulate_changed();
      if (profile_send) profile_send.stack_done(stack.length, _p.filename, _p.name, _p.ms, _p.subms);
   },
   endcb: function(_p) {
      var diff = process.hrtime(_p.time);
      var ms = (diff[0] * 1000) + (diff[1] / 1e6);
      _p.cbms = ms - _p.ms;

      var accu = this.getAccumulate(_p);

      accu.cbcalls++;
      accu.cbms += _p.cbms;

      if (profile_send) profile_send.accumulate_changed();
      if (profile_send) profile_send.callback_done(_p.filename, _p.name, _p.ms, _p.subms, _p.cbms);
   },
   accumulateID: 0,
   getAccumulate: function(_p) {
      var key = this.getFilename(_p.filename) + ":" + _p.name;
      // new accumulate node
      if (!accumulate[key])
         accumulate[key] = {id: this.accumulateID++, filename: _p.filename, name: _p.name, calls: 0, ms: 0, subms: 0, cbcalls: 0, cbms: 0, children: []};
      return accumulate[key];
   },
   getFilename: function(filename) {
      return filename.substring(__dirname.length + profile_dir.length);
   }
};