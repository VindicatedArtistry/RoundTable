// Type declarations for Three.js examples/addons
declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher, MOUSE, TOUCH, Vector3 } from 'three';

  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);

    object: Camera;
    domElement: HTMLElement | Document;

    enabled: boolean;
    target: Vector3;

    minDistance: number;
    maxDistance: number;
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    keyPanSpeed: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string };
    mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE };
    touches: { ONE: TOUCH; TWO: TOUCH };

    update(): boolean;
    saveState(): void;
    reset(): void;
    dispose(): void;
    getPolarAngle(): number;
    getAzimuthalAngle(): number;
    getDistance(): number;
  }
}

declare module 'three/examples/jsm/renderers/CSS2DRenderer' {
  import { Camera, Object3D, Scene } from 'three';

  export class CSS2DObject extends Object3D {
    constructor(element: HTMLElement);
    element: HTMLElement;
    center: { x: number; y: number };
  }

  export class CSS2DRenderer {
    constructor(parameters?: { element?: HTMLElement });
    domElement: HTMLElement;
    getSize(): { width: number; height: number };
    setSize(width: number, height: number): void;
    render(scene: Scene, camera: Camera): void;
  }
}

declare module 'three/examples/jsm/renderers/CSS3DRenderer' {
  import { Camera, Object3D, Scene } from 'three';

  export class CSS3DObject extends Object3D {
    constructor(element: HTMLElement);
    element: HTMLElement;
  }

  export class CSS3DSprite extends CSS3DObject {
    constructor(element: HTMLElement);
  }

  export class CSS3DRenderer {
    constructor(parameters?: { element?: HTMLElement });
    domElement: HTMLElement;
    getSize(): { width: number; height: number };
    setSize(width: number, height: number): void;
    render(scene: Scene, camera: Camera): void;
  }
}
