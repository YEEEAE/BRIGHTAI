document.addEventListener('DOMContentLoaded', function() {
    const apiKey = 'GEMINI_KEY_REDACTED'; // ضع هنا مفتاح API الفعلي

    async function geminiRequest(prompt) {
        const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'x-goog-api-key': apiKey,
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }],
                    }]
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, details: ${JSON.stringify(error)}`);
            }

            const data = await response.json();
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0 && data.candidates[0].content.parts[0].text) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Invalid response from Gemini API: No text found in response");
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            throw error;
        }
    }

  async function detectLanguage(text) {
       try {
            const franc = await import('https://esm.sh/franc@6?bundle');
           const detectedLang = franc.franc(text);
           if (detectedLang === 'ara') {
               return 'ar';
            }
           if (detectedLang === 'eng'){
               return 'en';
          }
           return 'en';
      } catch (error) {
        console.error('Error detecting language:', error);
       return 'en';
       }
  }

    // --- Resume and Cover Letter Generator ---
    window.generateResume = async function() {
        const template = document.getElementById('template-select').value;
        let language = document.getElementById('language-select').value;
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const linkedin = document.getElementById('linkedin').value;
        const objective = document.getElementById('objective').value;
        const resumeFile = document.getElementById('resume-upload').files[0]; // Get the uploaded file
         const outputDiv = document.getElementById('resume-output');

          outputDiv.textContent = `${language === 'ar' ? 'جاري إنشاء السيرة الذاتية وخطاب التقديم...' : 'Generating resume and cover letter...'}`;
          try {
            let resumeText = '';
            if (resumeFile) {
                resumeText = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target.result);
                    reader.onerror = (error) => reject(error);
                   reader.readAsText(resumeFile);
                });
               const detectedFileLang = await detectLanguage(resumeText)
                if(detectedFileLang){
                   language = detectedFileLang;
                  document.getElementById('language-select').value = language;
               }
            }

          let experience = '';
          document.querySelectorAll('#experience-fields .experience-entry').forEach(entry => {
            const company = entry.querySelector('.company').value;
            const position = entry.querySelector('.position').value;
            const date = entry.querySelector('.date').value;
            const responsibilities = entry.querySelector('.responsibilities').value;
              experience += `${language === 'ar' ? 'الشركة' : 'Company'}: ${company}\n${language === 'ar' ? 'المسمى الوظيفي' : 'Position'}: ${position}\n${language === 'ar' ? 'الفترة' : 'Period'}: ${date}\n${language === 'ar' ? 'المسؤوليات' : 'Responsibilities'}: ${responsibilities}\n\n`;
          });

            let education = '';
          document.querySelectorAll('#education-fields .education-entry').forEach(entry => {
              const degree = entry.querySelector('.degree').value;
             const university = entry.querySelector('.university').value;
             const graduationDate = entry.querySelector('.graduation-date').value;
              education += `${language === 'ar' ? 'الشهادة' : 'Degree'}: ${degree}\n${language === 'ar' ? 'الجامعة' : 'University'}: ${university}\n${language === 'ar' ? 'سنة التخرج' : 'Graduation Year'}: ${graduationDate}\n\n`;
          });

           const skills = document.getElementById('skills').value;

          let projects = '';
          document.querySelectorAll('#projects-fields .project-entry').forEach(entry => {
              const projectName = entry.querySelector('.project-name').value;
             const projectDescription = entry.querySelector('.project-description').value;
              const projectTools = entry.querySelector('.project-tools').value;
              projects += `${language === 'ar' ? 'اسم المشروع' : 'Project Name'}: ${projectName}\n${language === 'ar' ? 'الوصف' : 'Description'}: ${projectDescription}\n${language === 'ar' ? 'الأدوات' : 'Tools'}: ${projectTools}\n\n`;
           });

        const jobTitle = document.getElementById('job-title').value;
        const companyName = document.getElementById('company-name').value;
        const relevantSkills = document.getElementById('relevant-skills').value;
        const interestReason = document.getElementById('interest-reason').value;


           let cvPrompt = '';
            let coverLetterPrompt = '';
            if (language === 'ar') {
                cvPrompt = `قم بإنشاء سيرة ذاتية احترافية باللغة العربية بناءً على المعلومات التالية، باستخدام قالب ${template}:\n`;
                cvPrompt += `الاسم: ${name}\nالبريد الإلكتروني: ${email}\nرقم الهاتف: ${phone}\nLinkedIn: ${linkedin}\n`;
                cvPrompt += `الهدف المهني: ${objective}\nالخبرة المهنية: ${experience}\nالتعليم: ${education}\n`;
               cvPrompt += `المهارات: ${skills}\nالمشاريع: ${projects}\n`;
                if(resumeText){
                   cvPrompt += `بالإضافة إلى تحليل السيرة الذاتية المرفقة: ${resumeText}\n`;
                 }
               cvPrompt += "يجب أن يكون التنسيق متناسقًا (ترويسة، خطوط مميزة، أقسام مرتبة).";

                coverLetterPrompt = `قم بإنشاء خطاب تقديم رسمي باللغة العربية للوظيفة ${jobTitle} في شركة ${companyName} بناءً على المعلومات التالية:\n`;
               coverLetterPrompt += `المهارات ذات الصلة: ${relevantSkills}\nسبب الاهتمام بالشركة: ${interestReason}\n`;
               coverLetterPrompt += "يجب أن يشمل الخطاب تحية مخصصة، مقدمة توضح شغف المستخدم بالوظيفة، تسليط الضوء على المهارات والخبرات ذات الصلة، وفقرة ختامية تحث على التواصل مع شكر مخصص.";
          } else if (language === 'en') {
                cvPrompt = `Create a professional resume in English based on the following information, using the ${template} template:\n`;
               cvPrompt += `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nLinkedIn: ${linkedin}\n`;
               cvPrompt += `Objective: ${objective}\nExperience: ${experience}\nEducation: ${education}\n`;
               cvPrompt += `Skills: ${skills}\nProjects: ${projects}\n`;
                if(resumeText){
                   cvPrompt += `In addition to analyze the attached resume: ${resumeText}\n`;
               }
                cvPrompt += "The format should be consistent (header, distinct fonts, organized sections).";

                coverLetterPrompt = `Create a formal cover letter in English for the position of ${jobTitle} at ${companyName} based on the following information:\n`;
                coverLetterPrompt += `Relevant Skills: ${relevantSkills}\nReason for Interest in the Company: ${interestReason}\n`;
                coverLetterPrompt += "The letter should include a personalized salutation, an introduction outlining the user's passion for the position, highlighting relevant skills and experiences, and a concluding paragraph urging contact with a personalized thank you.";
           }
           const generatedCV = await geminiRequest(cvPrompt);
           const generatedCoverLetter = await geminiRequest(coverLetterPrompt);

           const cvImprovementPrompt = language === 'ar' ? `حسن النص التالي واجعله أكثر جاذبية باستخدام لغة احترافية: ${generatedCV}` : `Improve the following text and make it more engaging using professional language: ${generatedCV}`;
           const coverLetterImprovementPrompt = language === 'ar' ? `حسن النص التالي واجعله أكثر جاذبية باستخدام لغة احترافية: ${generatedCoverLetter}` : `Improve the following text and make it more engaging using professional language: ${generatedCoverLetter}`;

           const improvedCV = await geminiRequest(cvImprovementPrompt);
           const improvedCoverLetter = await geminiRequest(coverLetterImprovementPrompt);


          outputDiv.innerHTML = `<strong>${language === 'ar' ? 'السيرة الذاتية' : 'Resume'}:</strong><pre style="direction: ${language === 'ar' ? 'rtl' : 'ltr'}; text-align: ${language === 'ar' ? 'right' : 'left'};">${improvedCV}</pre><br>`;
          outputDiv.innerHTML += `<strong>${language === 'ar' ? 'خطاب التقديم' : 'Cover Letter'}:</strong><pre style="direction: ${language === 'ar' ? 'rtl' : 'ltr'}; text-align: ${language === 'ar' ? 'right' : 'left'};">${improvedCoverLetter}</pre>`;

          // Store generated content for download
          outputDiv.dataset.cvContent = improvedCV;
           outputDiv.dataset.coverLetterContent = improvedCoverLetter;

          document.getElementById('download-resume').style.display = 'inline-block';
           document.getElementById('download-cover-letter').style.display = 'inline-block';

      } catch (error) {
         outputDiv.innerHTML = `<strong>${language === 'ar' ? 'حدث خطأ أثناء إنشاء السيرة الذاتية وخطاب التقديم' : 'Error generating resume and cover letter'}:</strong><br> ${error.message}`;
       }
   };

    document.getElementById('download-resume').addEventListener('click', function () {
        const { jsPDF } = window.jspdf;
         const language = document.getElementById('language-select').value;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        pdf.setFont(language === 'ar' ? 'Amiri-Regular' : 'Helvetica', 'normal');
       pdf.text(document.getElementById('resume-output').dataset.cvContent, 10, 10, { align: language === 'ar' ? 'right' : 'left' });
        pdf.save("resume.pdf");
   });

    document.getElementById('download-cover-letter').addEventListener('click', function () {
       const { jsPDF } = window.jspdf;
        const language = document.getElementById('language-select').value;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        pdf.setFont(language === 'ar' ? 'Amiri-Regular' : 'Helvetica', 'normal');
        pdf.text(document.getElementById('resume-output').dataset.coverLetterContent, 10, 10, { align: language === 'ar' ? 'right' : 'left' });
        pdf.save("cover_letter.pdf");
    });

    // --- Saudi Job Search Tool ---
    window.searchSaudiJobs = async function () {
        const location = document.getElementById('job-location').value;
       const jobField = document.getElementById('job-field').value;
        const skills = document.getElementById('job-skills').value;
        const resumeFile = document.getElementById('resume-upload').files[0];
        const outputDiv = document.getElementById('saudi-jobs-output');
        const downloadButton = document.getElementById('download-search-results');
        outputDiv.textContent = 'جاري البحث عن الوظائف...';

       try {
          let resumeText = '';
           let language = document.getElementById('language-select').value;

           if (resumeFile) {
                resumeText = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                   reader.onload = (event) => resolve(event.target.result);
                    reader.onerror = (error) => reject(error);
                  reader.readAsText(resumeFile);
                });
            const detectedFileLang = await detectLanguage(resumeText)
            if(detectedFileLang){
              language = detectedFileLang;
             }
          }

           let prompt = `ابحث عن وظائف في المملكة العربية السعودية، في مدينة ${location} ومجال ${jobField}، مستخدماً المهارات التالية: ${skills}. `;
            if(resumeText){
             prompt += ` بالإضافة إلى تحليل السيرة الذاتية المرفقة لتحسين فرص القبول: ${resumeText}`;
            }
            prompt += 'قم بإعداد تقرير يتضمن فرص التحسين في السيرة الذاتية، وأبرز الوظائف المناسبة التي تم العثور عليها، بالإضافة إلى نصائح عملية لتطوير السيرة الذاتية وزيادة فرص القبول.';

            const result = await geminiRequest(prompt);
            outputDiv.innerHTML = `<strong>نتائج البحث:</strong><br><pre style="direction: ${language === 'ar' ? 'rtl' : 'ltr'}; text-align: ${language === 'ar' ? 'right' : 'left'};">${result}</pre>`;
             // Store generated content for download
           outputDiv.dataset.searchContent = result;
            downloadButton.style.display = 'inline-block';

       } catch (error) {
            outputDiv.innerHTML = `<strong>حدث خطأ أثناء البحث عن الوظائف:</strong><br> ${error.message}`;
        }
    };
    document.getElementById('download-search-results').addEventListener('click', function() {
        const { jsPDF } = window.jspdf;
        const language = document.getElementById('language-select').value;
       const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      pdf.setFont(language === 'ar' ? 'Amiri-Regular' : 'Helvetica', 'normal');
        pdf.text(document.getElementById('saudi-jobs-output').dataset.searchContent, 10, 10, { align: language === 'ar' ? 'right' : 'left' });
        pdf.save("job_search_results.pdf");
   });

    // --- Interactive Chart ---
    let chart;

    document.getElementById('generateChart').addEventListener('click', () => {
        const chartType = document.getElementById('chartType').value;
        const labels = document.getElementById('chartLabels').value.split(',').map(label => label.trim());
        const data = document.getElementById('chartData').value.split(',').map(Number);

        if (labels.length === 0 || data.length === 0 || labels.length !== data.length) {
            alert('يرجى إدخال عناوين وقيم صحيحة');
           return;
        }

        const ctx = document.getElementById('myChart').getContext('2d');

        if (chart) {
           chart.destroy();
        }

        chart = new Chart(ctx, {
           type: chartType,
           data: {
              labels: labels,
               datasets: [{
                   label: 'بيانات المستخدم',
                    data: data,
                  backgroundColor: chartType === 'pie' ? [
                      'rgba(255, 99, 132, 0.6)',
                       'rgba(54, 162, 235, 0.6)',
                      'rgba(255, 206, 86, 0.6)',
                       'rgba(75, 192, 192, 0.6)',
                      'rgba(153, 102, 255, 0.6)',
                     'rgba(255, 159, 64, 0.6)'
                   ] : 'rgba(75, 192, 192, 0.2)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                   borderWidth: 1
                }]
           },
          options: {
                responsive: true,
               plugins: {
                  legend: {
                       position: 'top',
                    }
              }
           }
        });
    });

    document.getElementById('exportPDF').addEventListener('click', () => {
       const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();

        if (!chart) {
            alert('يرجى إنشاء رسم بياني أولاً');
            return;
        }

        const chartImage = chart.toBase64Image();
        pdf.text("PDF الرسم البياني", 10, 10);
       pdf.addImage(chartImage, 'PNG', 10, 20, 180, 100);
       pdf.save("chart.pdf");
    });

    // --- Other Tool Functions ---
    window.analyzeInventory = async function() {
       const input = document.getElementById('inventory-input').value.trim();
        const outputDiv = document.getElementById('inventory-output');
        if (!input) {
            outputDiv.textContent = 'الرجاء إدخال بيانات المخزون.';
           return;
       }
        outputDiv.textContent = 'جاري تحليل بيانات المخزون...';
       try {
            const prompt = `قم بتحليل بيانات المخزون التالية وتقديم توصيات: ${input}`;
            const result = await geminiRequest(prompt);
          outputDiv.innerHTML = `<strong>تحليل المخزون:</strong><br>${result}`;
        } catch (error) {
           outputDiv.innerHTML = `<strong>حدث خطأ أثناء تحليل المخزون:</strong><br> ${error.message}`;
       }
    };

    window.analyzeSales = async function() {
       const input = document.getElementById('sales-input').value.trim();
        const outputDiv = document.getElementById('sales-output');
        if (!input) {
            outputDiv.textContent = 'الرجاء إدخال بيانات المبيعات.';
            return;
       }
        outputDiv.textContent = 'جاري تحليل بيانات المبيعات...';

       try {
            const prompt = `قم بتحليل بيانات المبيعات التالية وتقديم توصيات: ${input}`;
           const result = await geminiRequest(prompt);
            outputDiv.innerHTML = `<strong>تحليل المبيعات:</strong><br>${result}`;
        } catch (error) {
           outputDiv.innerHTML = `<strong>حدث خطأ أثناء تحليل المبيعات:</strong><br> ${error.message}`;
        }
    };

   window.generateInvoice = async function() {
        const input = document.getElementById('invoice-input').value.trim();
        const outputDiv = document.getElementById('invoice-output');
        if (!input) {
           outputDiv.textContent = 'الرجاء إدخال بيانات الفاتورة.';
            return;
      }
        outputDiv.textContent = 'jاري إنشاء الفاتورة...';

       try {
           const prompt = `قم بإنشاء فاتورة بناءً على البيانات التالية: ${input}`;
           const result = await geminiRequest(prompt);
           outputDiv.innerHTML = `<strong>الفاتورة:</strong><br>${result}`;
        } catch (error) {
          outputDiv.innerHTML = `<strong>حدث خطأ أثناء إنشاء الفاتورة:</strong><br> ${error.message}`;
        }
    };
    window.predictSuccess = async function() {
       const input = document.getElementById('financial-input').value.trim();
        const outputDiv = document.getElementById('financial-output');
        if (!input) {
          outputDiv.textContent = 'الرجاء إدخال بيانات مالية.';
           return;
       }
        outputDiv.textContent = 'جاري توقع النجاح المالي...';
       try {
            const prompt = `قم بتحليل البيانات المالية التالية وتقديم توقع للنجاح المالي: ${input}`;
           const result = await geminiRequest(prompt);
            outputDiv.innerHTML = `<strong>توقع النجاح المالي:</strong><br>${result}`;
        } catch (error) {
            outputDiv.innerHTML = `<strong>حدث خطأ أثناء توقع النجاح المالي:</strong><br> ${error.message}`;
       }
    };

    window.calculateROI = async function() {
       const input = document.getElementById('roi-input').value.trim();
       const outputDiv = document.getElementById('roi-output');
       if (!input) {
           outputDiv.textContent = 'الرجاء إدخال بيانات الاستثمار.';
          return;
       }
       outputDiv.textContent = 'جاري حساب عائد الاستثمار...';

        try {
            const prompt = `قم بحساب عائد الاستثمار بناءً على البيانات التالية: ${input}`;
           const result = await geminiRequest(prompt);
            outputDiv.innerHTML = `<strong>عائد الاستثمار:</strong><br>${result}`;
       } catch (error) {
            outputDiv.innerHTML = `<strong>حدث خطأ أثناء حساب عائد الاستثمار:</strong><br> ${error.message}`;
       }
    };
    window.analyzeEmployeeData = async function() {
        const input = document.getElementById('employee-input').value.trim();
      const outputDiv = document.getElementById('employee-output');
       if (!input) {
           outputDiv.textContent = 'الرجاء إدخال بيانات الموظفين.';
            return;
        }
      outputDiv.textContent = 'جاري تحليل بيانات الموظفين...';
        try {
           const prompt = `قم بتحليل بيانات الموظفين التالية وتقديم رؤى حول الأداء والتطور الوظيفي: ${input}`;
           const result = await geminiRequest(prompt);
           outputDiv.innerHTML = `<strong>تحليل بيانات الموظفين:</strong><br>${result}`;
        } catch (error) {
          outputDiv.innerHTML = `<strong>حدث خطأ أثناء تحليل بيانات الموظفين:</strong><br> ${error.message}`;
        }
   };
    window.generateLearningPlan = async function() {
      const input = document.getElementById('learning-input').value.trim();
        const outputDiv = document.getElementById('learning-output');
        if (!input) {
          outputDiv.textContent = 'الرجاء إدخال موضوع الدراسة.';
            return;
        }
       outputDiv.textContent = 'جاري توليد توصيات التعلم...';
       try {
            const prompt = `قم بتوليد خطة تعلم مخصصة للموضوع التالي: ${input}`;
           const result = await geminiRequest(prompt);
           outputDiv.innerHTML = `<strong>توصيات التعلم:</strong><br>${result}`;
        } catch (error) {
          outputDiv.innerHTML = `<strong>حدث خطأ أثناء توليد توصيات التعلم:</strong><br> ${error.message}`;
        }
    };
    window.analyzeHomework = async function() {
      const input = document.getElementById('homework-input').value.trim();
        const outputDiv = document.getElementById('homework-output');
        if (!input) {
           outputDiv.textContent = 'الرجاء إدخال الواجب.';
           return;
       }
        outputDiv.textContent = 'جاري تحليل الواجب...';
        try {
            const prompt = `قم بتحليل الواجب التالي وتقديم ملاحظات: ${input}`;
            const result = await geminiRequest(prompt);
            outputDiv.innerHTML = `<strong>تحليل الواجب:</strong><br>${result}`;
        } catch (error) {
           outputDiv.innerHTML = `<strong>حدث خطأ أثناء تحليل الواجب:</strong><br> ${error.message}`;
        }
   };

    window.askTutor = async function() {
      const input = document.getElementById('tutor-input').value.trim();
        const outputDiv = document.getElementById('tutor-output');
        if (!input) {
            outputDiv.textContent = 'الرجاء إدخال سؤالك.';
           return;
       }
       outputDiv.textContent = 'جاري البحث عن إجابة...';
       try {
           const prompt = `أجب على السؤال التالي: ${input}`;
            const result = await geminiRequest(prompt);
           outputDiv.innerHTML = `<strong>الإجابة:</strong><br>${result}`;
        } catch (error) {
            outputDiv.innerHTML = `<strong>حدث خطأ أثناء البحث عن الإجابة:</strong><br> ${error.message}`;
        }
   };
    window.generateContent = async function() {
        const input = document.getElementById('content-input').value.trim();
       const template = document.getElementById('content-template').value
      const outputDiv = document.getElementById('content-output');
       if (!input) {
            outputDiv.textContent = 'الرجاء إدخال موضوع المحتوى.';
            return;
        }
        outputDiv.textContent = 'جاري توليد المحتوى...';
        try {
            const prompt = `قم بتوليد  ${template}  عربي حول الموضوع التالي: ${input}`;
           const result = await geminiRequest(prompt);
           outputDiv.innerHTML = `<strong>المحتوى:</strong><br>${result}`;
        } catch (error) {
           outputDiv.innerHTML = `<strong>حدث خطأ أثناء توليد المحتوى:</strong><br> ${error.message}`;
        }
   };
    window.summarizeText = async function() {
       const input = document.getElementById('summarizer-input').value.trim();
       const outputDiv = document.getElementById('summarizer-output');
       const length = document.getElementById('summarizer-length').value;
        if (!input) {
           outputDiv.textContent = 'الرجاء إدخال النص المراد تلخيصه.';
          return;
        }
        outputDiv.textContent = 'جاري تلخيص النص...';
        try {
           const prompt = `قم بتلخيص النص التالي بشكل ${length}: ${input}`;
            const result = await geminiRequest(prompt);
           outputDiv.innerHTML = `<strong>ملخص النص:</strong><br>${result}`;
       } catch (error) {
           outputDiv.innerHTML = `<strong>حدث خطأ أثناء تلخيص النص:</strong><br> ${error.message}`;
       }
   };
   window.checkGrammar = async function() {
       const input = document.getElementById('grammar-input').value.trim();
        const outputDiv = document.getElementById('grammar-output');
        if (!input) {
            outputDiv.textContent = 'الرجاء إدخال النص المراد تدقيقه.';
          return;
       }
        outputDiv.textContent = 'جاري تدقيق النص...';

       try {
            const prompt = `قم بتدقيق النص التالي لغويًا وقواعديًا: ${input}`;
            const result = await geminiRequest(prompt);
          outputDiv.innerHTML = `<strong>النص المدقق:</strong><br>${result}`;
       } catch (error) {
            outputDiv.innerHTML = `<strong>حدث خطأ أثناء تدقيق النص:</strong><br> ${error.message}`;
       }
    };
    window.generateImage = async function() {
        const input = document.getElementById('image-input').value.trim();
        const outputDiv = document.getElementById('image-output');
        if (!input) {
            outputDiv.textContent = 'الرجاء إدخال وصف للصورة.';
          return;
        }
        outputDiv.textContent = 'جاري إنشاء الصورة...';

       try {
            const prompt = `قم بإنشاء صورة بناءً على الوصف التالي: ${input}`; // Consider actual image generation API
            const result = await geminiRequest(prompt); // Placeholder
           outputDiv.innerHTML = `<strong>وصف الصورة:</strong><br>${result}`;
        } catch (error) {
           outputDiv.innerHTML = `<strong>حدث خطأ أثناء إنشاء الصورة:</strong><br> ${error.message}`;
       }
    };

    window.generateQuiz = async function() {
      const input = document.getElementById('quiz-input').value.trim();
       const outputDiv = document.getElementById('quiz-output');
      if (!input) {
           outputDiv.textContent = 'الرجاء إدخال المادة التعليمية.';
            return;
       }
        outputDiv.textContent = 'جاري إنشاء الاختبار...';
        try {
            const prompt = `قم بإنشاء اختبار مخصص بناءً على المادة التعليمية التالية: ${input}`;
            const result = await geminiRequest(prompt);
           outputDiv.innerHTML = `<strong>الاختبار:</strong><br>${result}`;
       } catch (error) {
           outputDiv.innerHTML = `<strong>حدث خطأ أثناء إنشاء الاختبار:</strong><br> ${error.message}`;
        }
    };
    window.generatePresentation = async function() {
       const input = document.getElementById('presentation-input').value.trim();
        const outputDiv = document.getElementById('presentation-output');
        if (!input) {
            outputDiv.textContent = 'الرجاء إدخال موضوع العرض التقديمي.';
           return;
        }
      outputDiv.textContent = 'جاري إنشاء العرض التقديمي...';
       try {
           const prompt = `قم بإنشاء عرض تقديمي احترافي بناءً على الموضوع التالي: ${input}`;
            const result = await geminiRequest(prompt);
           outputDiv.innerHTML = `<strong>العرض التقديمي:</strong><br>${result}`;
       } catch (error) {
          outputDiv.innerHTML = `<strong>حدث خطأ أثناء إنشاء العرض التقديمي:</strong><br> ${error.message}`;
       }
   };
    window.analyzeSentiment = async function() {
        const input = document.getElementById('sentiment-input').value.trim();
      const outputDiv = document.getElementById('sentiment-output');
      if (!input) {
            outputDiv.textContent = 'الرجاء إدخال النص المراد تحليله.';
            return;
        }
        outputDiv.textContent = 'جاري تحليل المشاعر...';
        try {
            const prompt = `قم بتحليل المشاعر في النص التالي: ${input}`;
            const result = await geminiRequest(prompt);
           outputDiv.innerHTML = `<strong>تحليل المشاعر:</strong><br>${result}`;
        } catch (error) {
          outputDiv.innerHTML = `<strong>حدث خطأ أثناء تحليل المشاعر:</strong><br> ${error.message}`;
        }
    };
    window.analyzeLiteraryText = async function() {
       const input = document.getElementById('literary-input').value.trim();
       const outputDiv = document.getElementById('literary-output');
        if (!input) {
           outputDiv.textContent = 'الرجاء إدخال النص الأدبي.';
           return;
        }
      outputDiv.textContent = 'جاري تحليل النص الأدبي...';
        try {
            const prompt = `قم بتحليل النص الأدبي التالي لتحديد السمات الأدبية: ${input}`;
          const result = await geminiRequest(prompt);
           outputDiv.innerHTML = `<strong>تحليل النص الأدبي:</strong><br>${result}`;
       } catch (error) {
           outputDiv.innerHTML = `<strong>حدث خطأ أثناء تحليل النص الأدبي:</strong><br> ${error.message}`;
        }
    };
    window.generateMarketingPlan = async function() {
      const input = document.getElementById('marketing-input').value.trim();
        const outputDiv = document.getElementById('marketing-output');
        if (!input) {
           outputDiv.textContent = 'الرجاء إدخال بيانات المنتج والسوق.';
            return;
        }
      outputDiv.textContent = 'جاري إنشاء الخطة التسويقية...';
        try {
            const prompt = `قم بإنشاء خطة تسويقية بناءً على البيانات التالية: ${input}`;
            const result = await geminiRequest(prompt);
            outputDiv.innerHTML = `<strong>الخطة التسويقية:</strong><br>${result}`;
        } catch (error) {
          outputDiv.innerHTML = `<strong>حدث خطأ أثناء إنشاء الخطة التسويقية:</strong><br> ${error.message}`;
       }
   };
    window.analyzeGeographicData = async function() {
       const input = document.getElementById('geographic-input').value.trim();
        const outputDiv = document.getElementById('geographic-output');
       if (!input) {
            outputDiv.textContent = 'الرجاء إدخال البيانات الجغرافية.';
          return;
       }
        outputDiv.textContent = 'جاري تحليل البيانات الجغرافية...';
        try {
           const prompt = `قم بتحليل البيانات الجغرافية التالية وإظهار النتائج على خريطة تفاعلية: ${input}`; // Consider actual map integration
           const result = await geminiRequest(prompt); // Placeholder
           outputDiv.innerHTML = `<strong>تحليل البيانات الجغرافية:</strong><br>${result}`;
        } catch (error) {
          outputDiv.innerHTML = `<strong>حدث خطأ أثناء تحليل البيانات الجغرافية:</strong><br> ${error.message}`;
       }
   };
    window.generateInteractiveStory = async function() {
        const input = document.getElementById('story-input').value.trim();
       const outputDiv = document.getElementById('story-output');
        if (!input) {
           outputDiv.textContent = 'الرجاء إدخال نص القصة.';
          return;
       }
       outputDiv.textContent = 'جاري إنشاء القصة التفاعلية...';
        try {
           const prompt = `قم بإنشاء قصة تفاعلية بناءً على النص التالي: ${input}`;
           const result = await geminiRequest(prompt);
            outputDiv.innerHTML = `<strong>القصة التفاعلية:</strong><br>${result}`;
        } catch (error) {
           outputDiv.innerHTML = `<strong>حدث خطأ أثناء إنشاء القصة التفاعلية:</strong><br> ${error.message}`;
        }
    };
window.analyzeHealthData = async function() {
     const input = document.getElementById('health-input').value.trim();
     const outputDiv = document.getElementById('health-output');
     if (!input) {
         outputDiv.textContent = 'الرجاء إدخال البيانات الصحية.';
         return;
     }
     outputDiv.textContent = 'جاري تحليل البيانات الصحية...';
     try {
         const prompt = `قم بتحليل البيانات الصحية التالية وتقديم توصيات: ${input}`;
         const result = await geminiRequest(prompt);
         outputDiv.innerHTML = `<strong>تحليل البيانات الصحية:</strong><br>${result}`;
     } catch (error) {
         outputDiv.innerHTML = `<strong>حدث خطأ أثناء تحليل البيانات الصحية:</strong><br> ${error.message}`;
     }
 };
 window.generateNewsletter = async function() {
     const input = document.getElementById('newsletter-output');
     if (!input) {
         outputDiv.textContent = 'الرجاء إدخال نص الرسالة الإخبارية.';
         return;
     }
     outputDiv.textContent = 'جاري إنشاء الرسالة الإخبارية...';
     try {
         const prompt = `قم بإنشاء رسالة إخبارية احترافية بناءً على النص التالي: ${input}`;
         const result = await geminiRequest(prompt);
         outputDiv.innerHTML = `<strong>الرسالة الإخبارية:</strong><br>${result}`;
     } catch (error) {
         outputDiv.innerHTML = `<strong>حدث خطأ أثناء إنشاء الرسالة الإخبارية:</strong><br> ${error.message}`;
     }
 };
 window.analyzePersonalFinance = async function() {
     const input = document.getElementById('finance-input').value.trim();
     const outputDiv = document.getElementById('finance-output');
     if (!input) {
         outputDiv.textContent = 'الرجاء إدخال البيانات المالية.';
         return;
     }
     outputDiv.textContent = 'جاري تحليل البيانات المالية...';
     try {
         const prompt = `قم بتحليل البيانات المالية الشخصية التالية وتقديم توصيات: ${input}`;
         const result = await geminiRequest(prompt);
         outputDiv.innerHTML = `<strong>تحليل البيانات المالية:</strong><br>${result}`;
     } catch (error) {
         outputDiv.innerHTML = `<strong>حدث خطأ أثناء تحليل البيانات المالية:</strong><br> ${error.message}`;
     }
 };
 window.generateLegalDocument = async function() {
     const input = document.getElementById('legal-input').value.trim();
     const outputDiv = document.getElementById('legal-output');
     if (!input) {
         outputDiv.textContent = 'الرجاء إدخال تفاصيل الوثيقة القانونية.';
         return;
     }
     outputDiv.textContent = 'جاري إنشاء الوثيقة القانونية...';
     try {
         const prompt = `قم بإنشاء وثيقة قانونية بناءً على التفاصيل التالية: ${input}`;
         const result = await geminiRequest(prompt);
         outputDiv.innerHTML = `<strong>الوثيقة القانونية:</strong><br>${result}`;
     } catch (error) {
         outputDiv.innerHTML = `<strong>حدث خطأ أثناء إنشاء الوثيقة القانونية:</strong><br> ${error.message}`;
     }
 };
 window.analyzeSocialMedia = async function() {
     const input = document.getElementById('social-input').value.trim();
     const outputDiv = document.getElementById('social-output');
     if (!input) {
         outputDiv.textContent = 'الرجاء إدخال بيانات وسائل التواصل الاجتماعي.';
         return;
     }
     outputDiv.textContent = 'جاري تحليل البيانات الاجتماعية...';
     try {
         const prompt = `قم بتحليل بيانات وسائل التواصل الاجتماعي التالية: ${input}`;
         const result = await geminiRequest(prompt);
         outputDiv.innerHTML = `<strong>تحليل البيانات الاجتماعية:</strong><br>${result}`;
     } catch (error) {
         outputDiv.innerHTML = `<strong>حدث خطأ أثناء تحليل البيانات الاجتماعية:</strong><br> ${error.message}`;
     }
 };

 window.generateHtmlCode = async function() {
     const websiteType = document.getElementById('website-type').value;
     const components = Array.from(document.querySelectorAll('input[name="components"]:checked')).map(c => c.value);
     const colors = document.getElementById('colors').value;
     const fonts = document.getElementById('fonts').value;
     const content = document.getElementById('content').value;
     const cssOption = document.querySelector('input[name="css_option"]:checked')?.value;
     const inlineCssCode = document.getElementById('inline-css-code').value;
     const externalCssFile = document.getElementById('external-css-file').value;
     const outputDiv = document.getElementById('html-output');
     const downloadButton = document.getElementById('download-html');

     if (!websiteType || components.length === 0 || !content) {
         outputDiv.textContent = 'الرجاء إدخال جميع المواصفات المطلوبة.';
         return;
     }

     outputDiv.textContent = 'جاري إنشاء كود HTML...';

     try {
         let prompt = `أنشئ كود HTML ل${websiteType} يتضمن `;
         if (components.length> 0) {
           prompt += components.join(', ') + ' كمكونات أساسية. ';
        }
         prompt += `استخدم الألوان ${colors} والخطوط ${fonts}. المحتوى هو: ${content}. `;

         if (cssOption === 'inline' && inlineCssCode) {
             prompt += `أضف CSS مدمج: ${inlineCssCode}. `;
         } else if (cssOption === 'external' && externalCssFile) {
             prompt += `استخدم ملف CSS خارجي من الرابط: ${externalCssFile}. `;
         }

       prompt += "أضف تعليقات داخل الكود لشرح كل قسم، ودعم اللغة العربية.";

        const generatedHTML = await geminiRequest(prompt);

         // Example for contact page with simple form and link back to homepage
         if (websiteType === 'contact') {
            const exampleHTML = `
                 <!-- بداية صفحة التواصل -->
                <!DOCTYPE html>
                 <html lang="ar" dir="rtl">
                 <head>
                     <meta charset="UTF-8">
                    <title>تواصل معنا</title>
                     <!-- إضافة CSS مدمج لتخصيص التصميم -->
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .container { width: 80%; margin: auto; text-align: center; }
                        input[type="text"], textarea { width: 100%; padding: 10px; margin: 5px 0; }
                         button { padding: 10px 20px; background-color: #007bff; color: white; border: none; }
                    </style>
                </head>
               <body>
                   <div class="container">
                         <h1>تواصل معنا</h1>
                        <!-- نموذج الاتصال -->
                         <form>
                            <input type="text" placeholder="اسمك"><br>
                           <input type="text" placeholder="بريدك الإلكتروني"><br>
                              <textarea placeholder="رسالتك"></textarea><br>
                         <button type="submit">إرسال</button>
                         </form>
                         <!-- رابط للعودة للصفحة الرئيسية -->
                         <p><a href="index.html">العودة إلى الصفحة الرئيسية</a></p>
                    </div>
                 </body>
               </html>
                <!-- نهاية صفحة التواصل -->
               `;
        outputDiv.innerHTML = exampleHTML;
         downloadButton.style.display = 'inline-block';
         } else {
           outputDiv.innerHTML = `<pre><code class="language-html">${generatedHTML}</code></pre>`;
          downloadButton.style.display = 'inline-block';
             hljs.highlightAll();
        }


     } catch (error) {
        outputDiv.innerHTML = `<strong>حدث خطأ أثناء إنشاء كود HTML:</strong><br> ${error.message}`;
      }
 };

document.querySelectorAll('input[name="css_option"]').forEach(radio => {
 radio.addEventListener('change', function() {
   if (this.value === 'inline') {
     document.getElementById('inline-css-code').style.display = 'block';
     document.getElementById('external-css-file').style.display = 'none';
   } else if (this.value === 'external') {
     document.getElementById('inline-css-code').style.display = 'none';
     document.getElementById('external-css-file').style.display = 'block';
   }
 });
});

document.getElementById('download-html').addEventListener('click', function() {
     const content = document.getElementById('html-output').textContent;
   const filename = 'generated_code.html';
    const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
     a.href = url;
     a.download = filename;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
 });
document.getElementById('add-experience').addEventListener('click', function() {
     const experienceFields = document.getElementById('experience-fields');
     const newEntry = document.createElement('div');
     newEntry.classList.add('experience-entry');
     newEntry.innerHTML = `
         <input type="text" class="company" placeholder="اسم الشركة">
         <input type="text" class="position" placeholder="المسمى الوظيفي">
          <input type="text" class="date" placeholder="تاريخ البدء - تاريخ الانتهاء">
         <textarea class="responsibilities" placeholder="المهام والمسؤوليات"></textarea>
         <button type="button" class="remove-experience">إزالة</button>
     `;
     experienceFields.appendChild(newEntry);
     newEntry.querySelector('.remove-experience').addEventListener('click', function() {
         newEntry.remove();
     });
 });
  document.getElementById('add-education').addEventListener('click', function() {
         const educationFields = document.getElementById('education-fields');
         const newEntry = document.createElement('div');
         newEntry.classList.add('education-entry');
         newEntry.innerHTML = `
             <input type="text" class="degree" placeholder="الشهادة">
             <input type="text" class="university" placeholder="اسم الجامعة">
             <input type="text" class="graduation-date" placeholder="سنة التخرج">
             <button type="button" class="remove-education">إزالة</button>
         `;
         educationFields.appendChild(newEntry);
         newEntry.querySelector('.remove-education').addEventListener('click', function() {
             newEntry.remove();
         });
     });
     document.getElementById('add-project').addEventListener('click', function() {
         const projectFields = document.getElementById('projects-fields');
         const newEntry = document.createElement('div');
         newEntry.classList.add('project-entry');
         newEntry.innerHTML = `
              <input type="text" class="project-name" placeholder="اسم المشروع">
              <textarea class="project-description" placeholder="وصف المشروع"></textarea>
              <textarea class="project-tools" placeholder="الأدوات المستخدمة"></textarea>
             <button type="button" class="remove-project">إزالة</button>
        `;
         projectFields.appendChild(newEntry);
         newEntry.querySelector('.remove-project').addEventListener('click', function() {
            newEntry.remove();
      });
    });

    function showNotification(message, type = 'info') {
        const colors = {
            success: 'var(--accent-color)',
            error: 'var(--accent-secondary)',
            info: 'var(--primary-color)'
        };
        
        const notification = document.createElement('div');
        notification.style.backgroundColor = colors[type];
        notification.style.color = 'var(--text-primary)';
        notification.innerText = message;
        // ...existing code...
    }

    // Update chart colors
    const chartConfig = {
        backgroundColor: [
            'rgba(56, 189, 248, 0.6)',
            'rgba(30, 58, 138, 0.6)',
            'rgba(239, 68, 68, 0.6)'
        ],
        borderColor: 'var(--accent-color)'
    };
});
