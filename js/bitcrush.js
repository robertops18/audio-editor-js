(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var bitcrusher = require('bitcrusher');

window.getBitCrushNode = function (audioContext, bits) {
	var bitcrushNode = bitcrusher(audioContext, {
	    bitDepth: bits,
	    frequency: 0.5
	});
	return bitcrushNode;
}


},{"bitcrusher":2}],2:[function(require,module,exports){
var floor = Math.floor;

function clamp(min, max, v) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
}

module.exports = function(audioContext, opts) {

    opts = opts || {};

    var bufferSize      = opts.bufferSize || 4096,
        channelCount    = opts.channelCount || 2,
        bits            = clamp(1, Infinity, (opts.bitDepth || 8) | 0),
        normFreq        = clamp(0, 1, opts.frequency || 1),
        step            = 2 * Math.pow(0.5, bits),
        invStep         = 1 / step,
        phasor          = 0,
        last            = 0;

    var processor = audioContext.createScriptProcessor(bufferSize, channelCount, channelCount);
        
    processor.onaudioprocess = function(evt) {

        var ib = evt.inputBuffer,
            ob = evt.outputBuffer;

        for (var i = 0; i < channelCount; ++i) {

            var id = ib.getChannelData(i),
                od = ob.getChannelData(i);

            for (var s = 0, l = ob.length; s < l; ++s) {
                phasor += normFreq;
                if (phasor >= 1) {
                    phasor -= 1;
                    last = step * floor((id[s] * invStep) + 0.5);
                }
                od[s] = last;
            }

        }

    }

    Object.defineProperty(processor, 'bitDepth', {
        get: function() { return bits; },
        set: function(v) {
            bits = v;
            step = 2 * Math.pow(0.5, bits);
            invStep = 1 / step;
        }
    });

    Object.defineProperty(processor, 'frequency', {
        get: function() { return normFreq; },
        set: function(v) {
            normFreq = clamp(0, 1, v);
        }
    });

    return processor;

}
},{}]},{},[1]);
