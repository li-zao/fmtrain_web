(function() {
    var start = Date.now();
    var sessionId = '{{SESSION_ID}}';
    var clicks = [];
    var fields = [];
    var timeline = [];
    var maxScroll = 0;

    function record(e, d) {
        timeline.push({t: ((Date.now() - start) / 1000).toFixed(1), e: e, d: d});
    }

    document.addEventListener('click', function(e) {
        var el = e.target.closest('a,button,input,select,textarea,[role="button"]');
        if (!el) return;
        var tag = el.tagName.toLowerCase();
        var txt = (el.textContent || el.value || '').trim().substring(0, 80);
        var h = el.getAttribute('href') || '';
        var id = el.id || '';
        var cls = (el.className && typeof el.className === 'string') ? el.className.split(' ')[0] : '';
        clicks.push({tag: tag, text: txt, href: h, id: id, class: cls});
        record('click', tag + (id ? '#' + id : '') + ' ' + (txt || h || '').substring(0, 60));
    });

    document.addEventListener('focusin', function(e) {
        var el = e.target.closest('input,select,textarea');
        if (!el) return;
        var name = el.name || el.id || '';
        var type = el.type || el.tagName.toLowerCase();
        if (!name && !type) return;
        var exists = fields.some(function(f) { return f.name === name && f.type === type; });
        if (!exists) {
            fields.push({name: name, type: type});
            record('focus', 'field:' + name + ' [' + type + ']');
        }
    });

    window.addEventListener('scroll', function() {
        var d = document.documentElement;
        var pct = Math.round(((d.scrollTop + d.clientHeight) / d.scrollHeight) * 100);
        if (pct > maxScroll) maxScroll = pct;
    });

    window.addEventListener('beforeunload', function() {
        var payload = JSON.stringify({
            session_id: sessionId,
            page_url: window.location.href,
            duration_ms: Date.now() - start,
            scroll_depth_pct: Math.min(maxScroll, 100),
            clicks: clicks,
            form_fields_focused: fields,
            timeline: timeline
        });
        navigator.sendBeacon('/api/interaction/track', payload);
    });
})();
