document.addEventListener('DOMContentLoaded', function () {
    const chartContainer = document.getElementById('chart-container');
    
    if (chartContainer) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75, 
            chartContainer.offsetWidth / chartContainer.offsetHeight, 
            0.1, 
            1000
        );
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        renderer.setSize(chartContainer.offsetWidth, chartContainer.offsetHeight);
        chartContainer.appendChild(renderer.domElement);

        // Create multiple geometric shapes
        const geometries = [
            new THREE.TorusKnotGeometry(10, 3, 100, 16),
            new THREE.SphereGeometry(8, 32, 32),
            new THREE.ConeGeometry(8, 16, 32)
        ];

        const materials = [
            new THREE.MeshBasicMaterial({ color: 0x64FFDA, wireframe: true }),
            new THREE.MeshBasicMaterial({ color: 0xFF6B6B, wireframe: true }),
            new THREE.MeshBasicMaterial({ color: 0x4ECDC4, wireframe: true })
        ];

        const meshes = [];
        for (let i = 0; i < 3; i++) {
            const mesh = new THREE.Mesh(geometries[i], materials[i]);
            mesh.position.x = (i - 1) * 30;
            scene.add(mesh);
            meshes.push(mesh);
        }

        camera.position.z = 50;

        function animate() {
            requestAnimationFrame(animate);
            
            meshes.forEach((mesh, index) => {
                mesh.rotation.x += 0.005 + index * 0.002;
                mesh.rotation.y += 0.005 + index * 0.002;
                mesh.position.y = Math.sin(Date.now() * 0.001 + index) * 5;
            });
            
            renderer.render(scene, camera);
        }

        animate();

        window.addEventListener('resize', () => {
            camera.aspect = chartContainer.offsetWidth / chartContainer.offsetHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(chartContainer.offsetWidth, chartContainer.offsetHeight);
        });
    }
});