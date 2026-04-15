(function () {
    const runBtn = document.getElementById('demo-run');
    const output = document.getElementById('demo-output');
    const promptInput = document.getElementById('demo-prompt');
    const outputType = document.getElementById('demo-output-type');
    let activeController = null;

    const originalBtnHtml = runBtn ? runBtn.innerHTML : '';

    function getSessionId() {
        return sessionStorage.getItem('brightai_demo_session') || '';
    }

    function setSessionId(id) {
        if (!id) return;
        sessionStorage.setItem('brightai_demo_session', id);
    }

    function resolveApiBase() {
        if (window.BRIGHTAI_API_BASE) return window.BRIGHTAI_API_BASE;
        if (location && location.origin && location.origin !== 'null') {
            return location.origin;
        }
        return 'http://localhost:3000';
    }

    async function streamDemo() {
        if (!runBtn || !output || !promptInput || !outputType) return;
        const message = promptInput.value.trim();
        if (!message) {
            output.textContent = 'يرجى كتابة طلب واضح قبل التشغيل.';
            return;
        }

        if (activeController) {
            activeController.abort();
        }

        activeController = new AbortController();
        runBtn.disabled = true;
        runBtn.innerHTML = 'جارٍ البث...';
        output.textContent = 'جارٍ الاتصال بخدمة الذكاء الاصطناعي...';

        try {
            const apiBase = resolveApiBase();
            const response = await fetch(`${apiBase}/api/ai/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    outputType: outputType.value,
                    sessionId: getSessionId()
                }),
                signal: activeController.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                output.textContent = errorData.error || 'تعذر الاتصال بالخدمة حالياً.';
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                buffer = events.pop();

                for (const event of events) {
                    const line = event.split('\n').find((l) => l.startsWith('data:'));
                    if (!line) continue;
                    const payload = line.replace(/^data:\s*/, '').trim();
                    if (!payload) continue;
                    if (payload === '[DONE]') {
                        continue;
                    }
                    try {
                        const data = JSON.parse(payload);
                        if (data.sessionId) {
                            setSessionId(data.sessionId);
                        }
                        if (data.error) {
                            output.textContent = data.error;
                            continue;
                        }
                        if (data.token) {
                            fullText += data.token;
                            output.textContent = fullText;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                output.textContent = 'حدث خطأ أثناء البث. جرّب مرة أخرى.';
            }
        } finally {
            runBtn.disabled = false;
            runBtn.innerHTML = originalBtnHtml;
            activeController = null;
        }
    }

    if (runBtn) {
        runBtn.addEventListener('click', streamDemo);
    }
})();
