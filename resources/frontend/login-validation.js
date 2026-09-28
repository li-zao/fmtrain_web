(function() {
    var form = document.querySelector('{{FORM_QUERY}}');
    if (!form) return;

    var formType = form.getAttribute('data-form-type');
    var idLabel = formType === 'student-login' ? '学号/手机号' : '工号';

    var errorEl = document.createElement('div');
    errorEl.style.cssText = 'color:#dc2626;font-size:13px;text-align:center;margin-bottom:12px;display:none';
    form.insertBefore(errorEl, form.firstChild);

    var submitting = false;

    function refreshCaptcha(img, field) {
        if (img) img.src = img.src.replace(/\?.*$/, '') + '?' + Math.random();
        if (field) field.value = '';
    }

    function doSubmit() {
        var data = new FormData();
        var inputs = form.querySelectorAll('input[name]');
        for (var i = 0; i < inputs.length; i++) {
            var inp = inputs[i];
            if (inp.type === 'checkbox' || inp.type === 'radio') {
                if (inp.checked) data.append(inp.name, inp.value);
            } else {
                data.append(inp.name, inp.value);
            }
        }
        data.append('form_type', formType);
        data.append('page_url', window.location.href);

        fetch('/submit', { method: 'POST', body: data })
            .finally(function() {
                submitting = false;
                errorEl.textContent = '账户或密码错误';
                errorEl.style.display = 'block';
                var img = form.querySelector('.captcha-img');
                var captchaField = form.querySelector('#captcha');
                refreshCaptcha(img, captchaField);
                var pwField = form.querySelector('#password');
                if (pwField) pwField.value = '';
            });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (submitting) return;
        errorEl.style.display = 'none';
        errorEl.textContent = '';

        var idField = form.querySelector('#student-id, #staff-id');
        var pwField = form.querySelector('#password');
        var captchaField = form.querySelector('#captcha');

        var idVal = (idField ? idField.value.trim() : '');
        var pwVal = (pwField ? pwField.value : '');
        var captchaVal = (captchaField ? captchaField.value.trim() : '');

        if (idVal.length < 2 || idVal.length > 32) {
            errorEl.textContent = '请输入有效的' + idLabel;
            errorEl.style.display = 'block';
            if (idField) idField.focus();
            return;
        }
        if (pwVal.length < 6 || pwVal.length > 64) {
            errorEl.textContent = '密码长度应为6-64位';
            errorEl.style.display = 'block';
            if (pwField) pwField.focus();
            return;
        }
        if (captchaVal.length !== 4) {
            errorEl.textContent = '请输入4位验证码';
            errorEl.style.display = 'block';
            if (captchaField) captchaField.focus();
            return;
        }

        submitting = true;

        fetch('/captcha/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ captcha: captchaVal })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.valid) {
                doSubmit();
            } else {
                submitting = false;
                errorEl.textContent = '验证码错误';
                errorEl.style.display = 'block';
                var img = form.querySelector('.captcha-img');
                refreshCaptcha(img, captchaField);
            }
        })
        .catch(function() {
            submitting = false;
            doSubmit();
        });
    });
})();
