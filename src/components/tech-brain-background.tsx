"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";

export function TechBrainBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
        camera.position.set(0, 0, 10);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 1);
        container.appendChild(renderer.domElement);

        const brain = new THREE.Group();
        brain.rotation.set(-0.08, -0.35, 0);
        scene.add(brain);

        const wireMaterial = new THREE.MeshBasicMaterial({ color: 0xf8fafc, wireframe: true, transparent: true, opacity: 0.72 });
        const lobeGeometry = new THREE.IcosahedronGeometry(1.2, 3);
        const lobePositions: [number, number, number, number, number, number][] = [
            [-1.05, 0.15, 0.15, 1.28, 1.08, 1.06],
            [1.05, 0.15, 0.15, 1.28, 1.08, 1.06],
            [-0.72, -0.83, -0.04, 1.08, 0.8, 0.92],
            [0.72, -0.83, -0.04, 1.08, 0.8, 0.92],
            [0, 0.83, -0.18, 1.1, 0.72, 0.86],
        ];

        lobePositions.forEach(([x, y, z, scaleX, scaleY, scaleZ]) => {
            const lobe = new THREE.Mesh(lobeGeometry, wireMaterial);
            lobe.position.set(x, y, z);
            lobe.scale.set(scaleX, scaleY, scaleZ);
            brain.add(lobe);
        });

        const points = new Float32Array(420 * 3);
        for (let index = 0; index < points.length; index += 3) {
            const hemisphere = index % 2 === 0 ? -1 : 1;
            points[index] = hemisphere * (0.15 + Math.random() * 1.8);
            points[index + 1] = (Math.random() - 0.5) * 2.9;
            points[index + 2] = (Math.random() - 0.5) * 1.7;
        }
        const pointGeometry = new THREE.BufferGeometry();
        pointGeometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
        const pointCloud = new THREE.Points(pointGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.026, transparent: true, opacity: 0.8 }));
        brain.add(pointCloud);

        const ringMaterial = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.28 });
        [2.8, 3.65, 4.55].forEach((radius, index) => {
            const ring = new THREE.LineLoop(new THREE.CircleGeometry(radius, 96).rotateX(Math.PI / 2), ringMaterial);
            ring.rotation.set(index * 0.25, index * 0.5, index * 0.18);
            scene.add(ring);
        });

        const resize = () => {
            const { width, height } = container.getBoundingClientRect();
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
        resize();

        let animationFrame = 0;
        const render = (time: number) => {
            const seconds = time / 1000;
            if (!reducedMotion) {
                brain.rotation.y = -0.35 + Math.sin(seconds * 0.32) * 0.16;
                brain.rotation.z = Math.sin(seconds * 0.22) * 0.045;
                brain.scale.setScalar(1 + Math.sin(seconds * 1.1) * 0.018);
                pointCloud.rotation.y = seconds * 0.08;
            }
            renderer.render(scene, camera);
            animationFrame = requestAnimationFrame(render);
        };
        animationFrame = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrame);
            resizeObserver.disconnect();
            lobeGeometry.dispose();
            wireMaterial.dispose();
            pointGeometry.dispose();
            pointCloud.material.dispose();
            ringMaterial.dispose();
            renderer.dispose();
            renderer.domElement.remove();
        };
    }, []);

    return <div ref={containerRef} aria-hidden="true" className="fixed inset-0 -z-10 bg-black" />;
}