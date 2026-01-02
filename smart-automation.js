document.addEventListener('DOMContentLoaded', function () {
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
    
    // Sample Data
    const dataChartData = {
        labels: ['البيانات التاريخية', 'البيانات الحالية', 'البيانات المستقبلية'],
        data: [10, 20, 30],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
         label:'تحليل البيانات'
    };

    const predictChartData = {
        labels: ['2020', '2021', '2022', '2023', '2024'],
        data: [40, 50, 60, 70, 80],
         backgroundColor: 'rgba(255, 159, 64, 0.2)',
          borderColor: 'rgba(255, 159, 64, 1)',
          label:'توقع الاعمال'
    };

    const processChartData = {
        labels: ['الخطوة 1', 'الخطوة 2', 'الخطوة 3', 'الخطوة 4'],
        data: [20, 25, 30, 35],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
         borderColor: 'rgba(75, 192, 192, 1)',
         label:'أتمتة العمليات'
    };
    // Create Charts
    createChart('dataChart', 'line', dataChartData.labels, dataChartData.data,dataChartData.label,dataChartData.backgroundColor,dataChartData.borderColor);
    createChart('predictChart', 'bar', predictChartData.labels, predictChartData.data, predictChartData.label,predictChartData.backgroundColor, predictChartData.borderColor);
    createChart('processChart', 'doughnut', processChartData.labels, processChartData.data, processChartData.label, processChartData.backgroundColor, processChartData.borderColor);

     // --- Three.js Configuration ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, document.getElementById('canvas3d').offsetWidth / document.getElementById('canvas3d').offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({alpha: true});
    const canvas3d=document.getElementById('canvas3d');

    renderer.setSize(canvas3d.offsetWidth, canvas3d.offsetHeight);
    canvas3d.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry( 15, 15, 15 );
   const material = new THREE.MeshBasicMaterial({ color: 0x3498db, wireframe: true });
   const cube = new THREE.Mesh(geometry, material);
   scene.add(cube);
    camera.position.z = 50;

    function animate() {
        requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    animate();
       window.addEventListener('resize', () => {
       camera.aspect = canvas3d.offsetWidth / canvas3d.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas3d.offsetWidth, canvas3d.offsetHeight);
  });
});