        const sampleTexts = {
            news: `أعلنت المملكة العربية السعودية عن إطلاق مشروع "نيوم" كأحد أهم المشاريع الضخمة ضمن رؤية 2030. يهدف المشروع إلى بناء مدينة ذكية مستدامة على ساحل البحر الأحمر بتكلفة تتجاوز 500 مليار دولار. ستعتمد المدينة بالكامل على الطاقة المتجددة وستضم أحدث التقنيات في مجالات الذكاء الاصطناعي والروبوتات.`,
            review: `قمت بتجربة هاتف آيفون 15 برو ماكس لمدة شهر كامل. التصميم رائع والكاميرا ممتازة خصوصاً في التصوير الليلي. الأداء سريع جداً مع شريحة A17 Pro. السلبيات الوحيدة هي السعر المرتفع ووزن الجهاز الثقيل نسبياً. بشكل عام أنصح به لمحبي التصوير والأداء العالي.`,
            article: `يعد الذكاء الاصطناعي من أهم التقنيات التي ستغير مستقبل العمل. تشير الدراسات إلى أن 40% من الوظائف الحالية قد تتأثر بالأتمتة خلال العقد القادم. لكن في المقابل، ستظهر ملايين الوظائف الجديدة في مجالات تطوير وصيانة أنظمة الذكاء الاصطناعي. المفتاح هو التكيف والتعلم المستمر.`
        };

        const prompts = {
            summary: 'قم بتلخيص النص التالي في 2-3 جمل مركزة:\n\n',
            keywords: 'استخرج 8-10 كلمات مفتاحية من النص التالي، وقدمها كقائمة مفصولة بفواصل:\n\n',
            sentiment: 'حلل مشاعر النص التالي (إيجابي/سلبي/محايد) واشرح السبب بإختصار:\n\n',
            entities: 'استخرج الكيانات المهمة (أشخاص، أماكن، منظمات، تواريخ، أرقام) من النص التالي:\n\n',
            questions: 'بناءً على النص التالي، قم بتوليد 5 أسئلة مهمة يمكن طرحها:\n\n'
        };

        const typeTitles = {
            summary: 'ملخص النص',
            keywords: 'الكلمات المفتاحية',
            sentiment: 'تحليل المشاعر',
            entities: 'الكيانات المستخرجة',
            questions: 'الأسئلة المُولدة'
        };

        let currentType = 'summary';

        document.addEventListener('DOMContentLoaded', () => {
            const textInput = document.getElementById('text-input');
            const analyzeBtn = document.getElementById('analyze-btn');
            const clearBtn = document.getElementById('clear-btn');
            const typeBtns = document.querySelectorAll('.analysis-type-btn');
            const sampleBtns = document.querySelectorAll('.sample-btn');

            // Type selection
            typeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    typeBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentType = btn.dataset.type;
                });
            });

            // Sample texts
            sampleBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    textInput.value = sampleTexts[btn.dataset.sample];
                });
            });

            // Clear
            clearBtn.addEventListener('click', () => {
                textInput.value = '';
                document.getElementById('results-section').classList.add('hidden');
            });

            // Analyze
            analyzeBtn.addEventListener('click', () => runAnalysis());
        });

        async function runAnalysis() {
                const textInput = document.getElementById('text-input');
                const analyzeBtn = document.getElementById('analyze-btn');
                const text = textInput.value.trim();
                if (!text) {
                    alert('يرجى إدخال نص للتحليل');
                    return;
                }

                analyzeBtn.disabled = true;
                analyzeBtn.innerHTML = '<span class="typing-indicator"><span></span><span></span><span></span></span> جاري التحليل...';

                // Update stats
                updateStats(text);

                // Show results section
                document.getElementById('results-section').classList.remove('hidden');
                document.getElementById('result-type').textContent = typeTitles[currentType];
                document.getElementById('result-title').textContent = 'نتيجة التحليل';

                const resultBox = document.getElementById('analysis-result');
                resultBox.innerHTML = '<span class="typing-indicator"><span></span><span></span><span></span></span>';

                try {
                    const gemini = window.BrightAIGemini;
                    if (!gemini) throw new Error('Gemini client is not loaded');

                    const response = await gemini.generateText(
                        `أنت محلل نصوص خبير. أجب باللغة العربية بشكل مختصر ومفيد.\n\n${prompts[currentType]}${text}`,
                        {
                            temperature: 0.7,
                            maxOutputTokens: 500
                        }
                    );

                    const result = response.text;

                    // Animate result
                    resultBox.innerHTML = '';
                    await typeText(resultBox, result);

                    // Show keywords if applicable
                    if (currentType === 'keywords') {
                        showKeywords(result);
                    } else {
                        document.getElementById('keywords-section').classList.add('hidden');
                    }

                } catch (error) {
                    console.error(error);
                    const message = window.BrightAIGemini?.getErrorMessage(error) || 'حدث خطأ في التحليل. يرجى المحاولة مرة أخرى.';
                    resultBox.innerHTML = `
                        <div class="text-red-400 mb-3">${escapeHtml(message)}</div>
                        <button type="button" id="retry-analysis-btn" class="sample-btn">
                            <i class="fa-solid fa-rotate-right ml-2"></i> إعادة المحاولة
                        </button>
                    `;
                    document.getElementById('retry-analysis-btn')?.addEventListener('click', runAnalysis, { once: true });
                }

                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles ml-2"></i> تحليل النص';
        }

        function updateStats(text) {
            const words = text.split(/\s+/).filter(w => w.length > 0);
            const sentences = text.split(/[.!?،؟]+/).filter(s => s.trim().length > 0);
            const chars = text.length;
            const readTime = Math.ceil(words.length / 200); // 200 words per minute

            document.getElementById('stat-words').textContent = words.length.toLocaleString('ar-SA');
            document.getElementById('stat-sentences').textContent = sentences.length.toLocaleString('ar-SA');
            document.getElementById('stat-chars').textContent = chars.toLocaleString('ar-SA');
            document.getElementById('stat-time').textContent = readTime + ' د';
        }

        async function typeText(element, text) {
            for (const char of text) {
                if (char === '\n') {
                    element.appendChild(document.createElement('br'));
                } else {
                    element.appendChild(document.createTextNode(char));
                }
                await new Promise(r => setTimeout(r, 15));
            }
        }

        function showKeywords(result) {
            const container = document.getElementById('keywords-container');
            const section = document.getElementById('keywords-section');

            // Extract keywords (assuming comma-separated)
            const keywords = result.split(/[,،\n]+/).map(k => k.trim()).filter(k => k.length > 0 && k.length < 30);

            container.innerHTML = keywords.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join('');
            section.classList.remove('hidden');
        }

        function escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, (char) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[char]));
        }
