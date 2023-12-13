function TinyEmitter() {}

TinyEmitter.prototype = {
    on: function(e, n, t) {
        var r = this.e || (this.e = {});
        (r[e] || (r[e] = [])).push({ fn: n, ctx: t });
        return this;
    },
    once: function(e, n, t) {
        var r = this;

        function i() {
            r.off(e, i);
            n.apply(t, arguments);
        }

        i._ = n;
        return this.on(e, i, t);
    },
    emit: function(e) {
        var n = [].slice.call(arguments, 1);
        var t = ((this.e || (this.e = {}))[e] || []).slice();
        var r = 0;
        var i = t.length;

        for (r; r < i; r++) {
            t[r].fn.apply(t[r].ctx, n);
        }
        return this;
    },
    off: function(e, n) {
        var t = this.e || (this.e = {});
        var r = t[e];
        var i = [];

        if (r && n) {
            for (var f = 0, o = r.length; f < o; f++) {
                if (r[f].fn !== n && r[f].fn._ !== n) i.push(r[f]);
            }
        }

        i.length ? (t[e] = i) : delete t[e];
        return this;
    },
};

module.exports = TinyEmitter;