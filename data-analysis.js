document.addEventListener('DOMContentLoaded', function () {
    // Add structured data for Arabic content for better SEO
    function addArabicStructuredData() {
        const scriptElement = document.createElement('script');
        scriptElement.type = 'application/ld+json';
        const data = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "ما هي خدمات تحليل البيانات التي تقدمها Bright AI في المملكة العربية السعودية؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "تقدم Bright AI مجموعة متكاملة من خدمات تحليل البيانات في المملكة العربية السعودية تشمل تحليل البيانات الضخمة، التنبؤ بالاتجاهات، تحليل النصوص العربية، وتحليل الأداء للشركات والمؤسسات في مختلف القطاعات السعودية."
                    }
                },
                {
                    "@type": "Question",
                    "name": "كيف يمكن للشركات السعودية الاستفادة من خدمات تحليل البيانات؟",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "يمكن للشركات السعودية الاستفادة من خدمات تحليل البيانات لتحسين عملية اتخاذ القرار، فهم سلوك العملاء بشكل أفضل، تحسين كفاءة العمليات، وتطوير استراتيجيات تنافسية في السوق المحلي والإقليمي بما يتماشى مع رؤية السعودية 2030."
                    }
                }
            ]
        };
        scriptElement.textContent = JSON.stringify(data);
        document.head.appendChild(scriptElement);
    }
    
    // Call the function to add structured data
    addArabicStructuredData();
    
    // --- Chart.js Configuration ---
    // Function to create a chart
    function createChart(canvasId, chartType, labels, data, label, backgroundColor, borderColor) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    borderWidth: 1
                }]
            },
             options: {
                 responsive: true,
                 maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Enhanced Sample Data with Saudi market focus
    const dataChartData = {
        labels: ['البيانات التاريخية', 'البيانات الحالية', 'البيانات المستقبلية'],
        data: [10, 20, 30],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        label:'تحليل البيانات في السوق السعودي'
    };

    const predictChartData = {
        labels: ['2020', '2021', '2022', '2023', '2024'],
        data: [40, 50, 60, 70, 80],
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)',
        label:'توقع نمو الأعمال في المملكة'
    };

    const processChartData = {
        labels: ['الخطوة 1', 'الخطوة 2', 'الخطوة 3', 'الخطوة 4'],
        data: [20, 25, 30, 35],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        label:'أتمتة العمليات للشركات السعودية'
    };
   const predictionChartData = {
        labels: ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'],
        data: [60, 70, 80, 90],
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        label:'البيانات التنبؤية للسوق المحلي'
   };
      const customerBehaviorChartData = {
        labels: ['العملاء الجدد', 'العملاء الدائمون', 'العملاء المتفاعلون'],
        data: [40, 50, 60],
        backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                    'rgba(255, 205, 86, 0.2)'
                ],
                borderColor: [
                   'rgba(255, 99, 132, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(255, 205, 86, 1)'
                ],
          label:'سلوك العملاء في المملكة'
    };
    
    // Create Charts
    createChart('dataChart', 'line', dataChartData.labels, dataChartData.data,dataChartData.label,dataChartData.backgroundColor,dataChartData.borderColor);
    createChart('predictChart', 'bar', predictChartData.labels, predictChartData.data, predictChartData.label,predictChartData.backgroundColor, predictChartData.borderColor);
    createChart('processChart', 'doughnut', processChartData.labels, processChartData.data, processChartData.label, processChartData.backgroundColor, processChartData.borderColor);
    createChart('predictionChart', 'line', predictionChartData.labels, predictionChartData.data,predictionChartData.label,predictionChartData.backgroundColor, predictionChartData.borderColor);
    createChart('customerBehaviorChart', 'pie', customerBehaviorChartData.labels, customerBehaviorChartData.data,customerBehaviorChartData.label,customerBehaviorChartData.backgroundColor, customerBehaviorChartData.borderColor);

     // --- Three.js Configuration ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, document.getElementById('canvas3d').offsetWidth / document.getElementById('canvas3d').offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({alpha: true});
    const canvas3d=document.getElementById('canvas3d');

    renderer.setSize(canvas3d.offsetWidth, canvas3d.offsetHeight);
    canvas3d.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(15, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x3498db, wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    camera.position.z = 50;

    function animate() {
        requestAnimationFrame(animate);
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    animate();
    
    window.addEventListener('resize', () => {
        camera.aspect = canvas3d.offsetWidth / canvas3d.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas3d.offsetWidth, canvas3d.offsetHeight);
    });

    // --- SVG Workflow Chart with Saudi-specific process ---
    const svg = document.getElementById('workflow-svg');
    const steps = [
        { x: 50, y: 100, text: 'جمع البيانات' },
        { x: 250, y: 100, text: 'تحليل البيانات' },
        { x: 450, y: 100, text: 'استخراج الرؤى' },
        { x: 650, y: 100, text: 'اتخاذ القرارات' },
    ];
    const radius = 30;
     steps.forEach((step, index) => {
       const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
       circle.setAttribute('cx', step.x);
       circle.setAttribute('cy', step.y);
       circle.setAttribute('r', radius);
       circle.setAttribute('fill', '#3498db');
       svg.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
       text.setAttribute('x', step.x);
       text.setAttribute('y', step.y + 5 );
       text.setAttribute('text-anchor', 'middle');
       text.setAttribute('fill', 'white');
       text.setAttribute('font-size', '14');
       text.textContent = step.text;
       svg.appendChild(text);
       if (index < steps.length - 1) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
             line.setAttribute('x1', step.x + radius);
            line.setAttribute('y1', step.y);
             line.setAttribute('x2', steps[index + 1].x - radius);
             line.setAttribute('y2', step.y);
            line.setAttribute('stroke', '#ddd');
           line.setAttribute('stroke-width', '2');
           svg.appendChild(line);
      }
    });
    
    // Add schema markup for better search visibility in Saudi Arabia
    function addLocalBusinessSchema() {
        const scriptElement = document.createElement('script');
        scriptElement.type = 'application/ld+json';
        const data = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Bright AI - خدمات تحليل البيانات",
            "image": "https://d.top4top.io/p_33354e90u1.png",
            "url": "https://brightai.site/data-analysis.html",
            "telephone": "+966538229013",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "الرياض",
                "addressRegion": "الرياض",
                "addressCountry": "المملكة العربية السعودية"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": "24.7136",
                "longitude": "46.6753"
            },
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"
                ],
                "opens": "09:00",
                "closes": "17:00"
            },
            "priceRange": "$$",
            "servesCuisine": "تحليل البيانات والذكاء الاصطناعي"
        };
        scriptElement.textContent = JSON.stringify(data);
        document.head.appendChild(scriptElement);
    }
    
    // Call the function to add local business schema
    addLocalBusinessSchema();
    
    // Add event tracking for analytics
    function setupEventTracking() {
        const serviceLinks = document.querySelectorAll('.service');
        serviceLinks.forEach((link, index) => {
            link.addEventListener('click', function() {
                if (typeof gtag === 'function') {
                    gtag('event', 'service_click', {
                        'event_category': 'engagement',
                        'event_label': 'Service ' + (index + 1)
                    });
                }
            });
        });
    }
    
    // Call the function to setup event tracking
    setupEventTracking();
});