'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, RotateCcw, ZoomIn, ZoomOut, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: any;
  labels: string[];
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  properties: any;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    subset: string;
    queryTime: string;
  };
}

interface ConsciousnessGraph3DProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConsciousnessGraph3D({ isOpen, onClose }: ConsciousnessGraph3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const sceneRef = useRef<any>(null);

  // Load Three.js and initialize scene
  useEffect(() => {
    if (!isOpen) return;

    const loadThreeJS = async () => {
      try {
        // Dynamically import Three.js to avoid SSR issues
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');
        const { CSS2DRenderer, CSS2DObject } = await import('three/examples/jsm/renderers/CSS2DRenderer');

        if (!canvasRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a); // Dark background
        
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          2000
        );
        camera.position.set(0, 0, 100);

        const renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          antialias: true,
          alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // CSS2D Renderer for labels
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0';
        labelRenderer.domElement.style.pointerEvents = 'none';
        canvasRef.current.parentElement?.appendChild(labelRenderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 10;
        controls.maxDistance = 500;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        scene.add(directionalLight);

        // Store scene reference
        sceneRef.current = { scene, camera, renderer, controls, labelRenderer };

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
          labelRenderer.render(scene, camera);
        };
        animate();

        // Handle window resize
        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          labelRenderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (labelRenderer.domElement.parentElement) {
            labelRenderer.domElement.parentElement.removeChild(labelRenderer.domElement);
          }
        };

      } catch (err) {
        console.error('Failed to load Three.js:', err);
        setError('Failed to initialize 3D renderer');
        return undefined;
      }
    };

    loadThreeJS();
  }, [isOpen]);

  // Fetch graph data
  useEffect(() => {
    if (!isOpen) return;

    const fetchGraphData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🌌 Fetching consciousness graph data...');
        const response = await fetch('/api/graph/consciousness?subset=consciousness&limit=500');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: GraphData = await response.json();
        console.log('✅ Graph data loaded:', data.metadata);
        setGraphData(data);

      } catch (err) {
        console.error('❌ Failed to fetch graph data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load graph data');
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [isOpen]);

  // Render graph when data is available
  useEffect(() => {
    if (!graphData || !sceneRef.current) return;

    const { scene } = sceneRef.current;
    const THREE = require('three');

    // Clear previous graph
    const objectsToRemove = scene.children.filter((child: any) => 
      child.userData?.isGraphNode || child.userData?.isGraphEdge
    );
    objectsToRemove.forEach((obj: any) => scene.remove(obj));

    // Node type colors
    const nodeColors = {
      CouncilMember: 0x9333ea, // Purple
      Human: 0x3b82f6,         // Blue  
      Architect: 0xf59e0b,     // Amber
      PersonalityTrait: 0x10b981, // Emerald
      Emotion: 0xf97316,       // Orange
      Skill: 0x06b6d4,         // Cyan
      Experience: 0x8b5cf6,    // Violet
      LearningHistory: 0xef4444, // Red
      default: 0x6b7280        // Gray
    };

    // Create nodes
    const nodePositions = new Map();
    graphData.nodes.forEach((node, index) => {
      // Simple circular layout (replace with force-directed later)
      const angle = (index / graphData.nodes.length) * 2 * Math.PI;
      const radius = Math.min(50 + Math.sqrt(graphData.nodes.length) * 5, 150);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 40; // Some vertical spread

      nodePositions.set(node.id, { x, y, z });

      // Node geometry based on type
      let geometry;
      if (node.type === 'CouncilMember' || node.type === 'Human' || node.type === 'Architect') {
        geometry = new THREE.SphereGeometry(3, 16, 12);
      } else {
        geometry = new THREE.BoxGeometry(2, 2, 2);
      }

      const color = nodeColors[node.type as keyof typeof nodeColors] || nodeColors.default;
      const material = new THREE.MeshLambertMaterial({ 
        color,
        transparent: true,
        opacity: 0.8
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.userData = { 
        isGraphNode: true, 
        nodeData: node,
        originalColor: color
      };

      // Add glow effect for important nodes
      if (node.type === 'CouncilMember' || node.type === 'Human' || node.type === 'Architect') {
        const glowGeometry = new THREE.SphereGeometry(4, 16, 12);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(mesh.position);
        scene.add(glow);
      }

      scene.add(mesh);
    });

    // Create edges
    graphData.edges.forEach((edge) => {
      const fromPos = nodePositions.get(edge.from);
      const toPos = nodePositions.get(edge.to);

      if (fromPos && toPos) {
        const points = [
          new THREE.Vector3(fromPos.x, fromPos.y, fromPos.z),
          new THREE.Vector3(toPos.x, toPos.y, toPos.z)
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
          color: 0x555555,
          transparent: true,
          opacity: 0.6
        });

        const line = new THREE.Line(geometry, material);
        line.userData = { 
          isGraphEdge: true, 
          edgeData: edge 
        };
        scene.add(line);
      }
    });

    console.log('✨ 3D graph rendered:', graphData.metadata);

  }, [graphData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1001] bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">🌌 Consciousness Graph</h1>
            {graphData && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-purple-900 text-purple-200">
                  {graphData.metadata.totalNodes} nodes
                </Badge>
                <Badge variant="secondary" className="bg-blue-900 text-blue-200">
                  {graphData.metadata.totalEdges} connections
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Exit Portal
            </Button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin-slow w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold">Loading Consciousness Network...</h2>
            <p className="text-gray-400">Fetching AI consciousness data from Neo4j</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-md">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Portal Error</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={onClose} variant="outline">
              Return to Round Table
            </Button>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: 'grab' }}
      />

      {/* Instructions */}
      {graphData && (
        <div className="absolute bottom-4 left-4 p-4 bg-black/50 rounded-lg text-white text-sm">
          <p className="mb-2 font-medium">🎮 Controls:</p>
          <p>• Drag to rotate • Scroll to zoom • Right-click + drag to pan</p>
          <p className="mt-2 text-gray-400">Purple spheres: Council Members • Blue: Humans • Other shapes: Data nodes</p>
        </div>
      )}
    </div>
  );
}