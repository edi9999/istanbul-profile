/**
 * Created by Ralph Varjabedian on 2/19/14.
 */

/* eslint-disable no-console */

var fs = require("fs");
var cwdLen = process.cwd().length;

function exitHandler(options, err) {
	printAccumulate();
	if (options.cleanup) {
		console.log(JSON.stringify({exit: "clean"}));
	}
	if (err) {
		console.log(err.stack);
	}
	if (options.exit) {
		process.exit();
	}
}

// do something when app is closing
process.on("exit", exitHandler.bind(null, {cleanup: true}));

// catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, {exit: true}));

// catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, {exit: true}));
// setInterval(printAccumulate, 1000 * 0.1);

var profileSend = {
	dirty: false,
	setAccumulate: function (accumulate) {
		this.accumulate = accumulate;
	},
	stack_start: function () {
		// console.log(this.getLevel(level), functionName.yellow + "()" + " {".green);
	},
	stack_done: function () {
		// console.log(this.getLevel(level), "}".green, ("" + ms), "ms".grey, ("" + subms).blue, "subms".grey);
	},
	accumulate_changed: function () {
		this.dirty = true;
	},
	callback_done: function () {
	},
	getLevel: function (level) {
		var x = "";
		for (var i = 0; i < level; i++) {
			x += "   ";
		}
		return x;
	},
};

var accumulate = {};
var stack = [];

var lastPrintAccumulate = +new Date();
function printAccumulateThrottled() {
	if (+new Date() - lastPrintAccumulate > 500) {
		printAccumulate();
		lastPrintAccumulate = +new Date();
	}
}

function printAccumulate() {
	if (!profileSend.accumulate || !profileSend.dirty) {
		return;
	}

	profileSend.dirty = false;
	// json
	// {filename: _p.filename, name:_p.name, calls: 0, ms: 0, subms: 0, cbcalls: 0, cbms: 0}

	for (var acc in profileSend.accumulate) {
		if (!profileSend.accumulate.hasOwnProperty(acc)) {
			continue;
		}
		profileSend.accumulate[acc].ms = parseInt(profileSend.accumulate[acc].ms * 1000, 10) / 1000;
	}
	fs.writeFileSync("p.json", JSON.stringify(profileSend.accumulate, null, 3));
	console.log(JSON.stringify({profile: "saved"}));
}

// ms: total time it takes (stack based)
// subms: total time it takes for sub functions (stack based)
// cbms: total time it took for it's callback to be called including function itself (ms) (if it has)

profileSend.setAccumulate(accumulate);

module.exports = {
	STRIP_COMMENTS: /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
	copyFunctionSignature: function (fn) {
		var fnText = fn.toString().replace(this.STRIP_COMMENTS, "");
		return fnText.substring(0, fnText.indexOf("{"));
	},
	start: function (name, filename, args) {
		// new node
		var _p = {name: name, filename: filename, cb: null, ms: 0, subms: 0, cbms: 0};

		if (args.length > 0 && typeof (args[args.length - 1]) == "function") {
			// has callback, lets track that
			var originalcb = args[args.length - 1];
			eval("var override = " + this.copyFunctionSignature(originalcb) + "{self.endcb(_p);return originalcb.apply(this, arguments);}");
			_p.cb = override;
		}
		profileSend.stack_start(stack.length, _p.filename, _p.name, _p.cb != null);
		stack.push(_p);
		_p.time = process.hrtime();
		return _p;
	},
	end: function (_p) {
		var diff = process.hrtime(_p.time);
		var ms = (diff[0] * 1000) + (diff[1] / 1e6);
		_p.ms = ms; // only the time it took from try/finally, makes sense only if we have callback, but if we have nested functions then what?

		var poped = stack.pop();
		if (poped !== _p) {
			throw new Error("invalid stack");
		}

		var parent = null;
		if (stack.length > 0) {
			parent = stack[stack.length - 1];
		}

		// link parent, important
		// _p.parent = parent;

		var accu = this.getAccumulate(_p);

		accu.calls++;
		accu.ms += _p.ms;
		accu.subms += _p.subms;

		if (stack.length > 0) {
			parent = stack[stack.length - 1];
			parent.subms += ms;
			var parentAccu = this.getAccumulate(parent);
			var found = false;
			for (var i = 0; i < parentAccu.children.length; i++) {
				if (parentAccu.children[i] === accu.id) {
					found = true;
					break;
				}
			}
			if (!found) {
				parentAccu.children.push(accu.id);
			}
		}

		if (profileSend) {
			profileSend.accumulate_changed();
		}
		if (profileSend) {
			profileSend.stack_done(stack.length, _p.filename, _p.name, _p.ms, _p.subms);
		}
		printAccumulateThrottled();
	},
	endcb: function (_p) {
		var diff = process.hrtime(_p.time);
		var ms = (diff[0] * 1000) + (diff[1] / 1e6);
		_p.cbms = ms; // cbms is the total (including ms, so u know)

		var accu = this.getAccumulate(_p);

		accu.cbcalls++;
		accu.cbms += _p.cbms;

		if (profileSend) {
			profileSend.accumulate_changed();
			profileSend.callback_done(_p.filename, _p.name, _p.ms, _p.subms, _p.cbms);
		}
	},
	accumulateID: 0,
	getAccumulate: function (_p) {
		var key = this.getFilename(_p.filename) + ":" + _p.name;
		// new accumulate node
		if (!accumulate[key]) {
			accumulate[key] = {id: this.accumulateID++, filename: _p.filename, name: _p.name, calls: 0, ms: 0, subms: 0, cbcalls: 0, cbms: 0, children: []};
		}
		return accumulate[key];
	},
	getFilename: function (filename) {
		return filename.substring(cwdLen);
	},
};
