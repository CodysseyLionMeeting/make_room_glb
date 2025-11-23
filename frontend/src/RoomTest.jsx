import React, { useMemo, useState, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

// ==========================================
// 1. 설정값 및 템플릿 정의
// ==========================================
const TILE_SIZE = 0.5;
const WALL_HEIGHT = 2.5;

// 방 템플릿 정의
const ROOM_TEMPLATES = {
  small_studio: {
    name: "소형 스튜디오",
    description: "작은 원룸 (2.5m x 3m)",
    width: 2.5,
    depth: 3.0,
    // 바닥 타일 생성 함수
    generateFloor: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      for (let x = 0; x < xCount; x++) {
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `floor-${x}-${z}`,
            type: "floor",
            position: [x * TILE_SIZE + TILE_SIZE / 2, 0, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, 0],
          });
        }
      }
      return tiles;
    },
    // 벽 타일 생성 함수
    generateWalls: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      const yCount = WALL_HEIGHT / TILE_SIZE;

      for (let y = 0; y < yCount; y++) {
        const yPos = y * TILE_SIZE + TILE_SIZE / 2;

        // 뒷벽
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-back-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, 0],
            rotation: [-Math.PI / 2, 0, 0],
          });
        }
        // 앞벽
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-front-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, depth],
            rotation: [Math.PI / 2, 0, 0],
          });
        }
        // 왼쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-left-${z}-${y}`,
            type: "wall",
            position: [0, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, Math.PI / 2],
          });
        }
        // 오른쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-right-${z}-${y}`,
            type: "wall",
            position: [width, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, -Math.PI / 2],
          });
        }
      }
      return tiles;
    },
  },
  rectangular: {
    name: "일자형 원룸",
    description: "기본 직사각형 구조 (3m x 4m)",
    width: 3.0,
    depth: 4.0,
    // 바닥 타일 생성 함수
    generateFloor: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      for (let x = 0; x < xCount; x++) {
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `floor-${x}-${z}`,
            type: "floor",
            position: [x * TILE_SIZE + TILE_SIZE / 2, 0, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, 0],
          });
        }
      }
      return tiles;
    },
    // 벽 타일 생성 함수
    generateWalls: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      const yCount = WALL_HEIGHT / TILE_SIZE;

      for (let y = 0; y < yCount; y++) {
        const yPos = y * TILE_SIZE + TILE_SIZE / 2;

        // 뒷벽
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-back-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, 0],
            rotation: [-Math.PI / 2, 0, 0],
          });
        }
        // 앞벽
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-front-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, depth],
            rotation: [Math.PI / 2, 0, 0],
          });
        }
        // 왼쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-left-${z}-${y}`,
            type: "wall",
            position: [0, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, Math.PI / 2],
          });
        }
        // 오른쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-right-${z}-${y}`,
            type: "wall",
            position: [width, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, -Math.PI / 2],
          });
        }
      }
      return tiles;
    },
  },
  lshaped: {
    name: "ㄱ자 방",
    description: "ㄱ자 형태 구조 (5m x 5m)",
    width: 5.0,
    depth: 5.0,
    generateFloor: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      // ㄱ자 형태: 작은 사각형 두 개로 구성
      // 하단 부분 (0-5, 0-3)
      for (let x = 0; x < xCount; x++) {
        for (let z = 0; z < zCount * 0.6; z++) {
          tiles.push({
            key: `floor-${x}-${z}`,
            type: "floor",
            position: [x * TILE_SIZE + TILE_SIZE / 2, 0, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, 0],
          });
        }
      }
      // 상단 부분 (0-3, 3-5)
      for (let x = 0; x < xCount * 0.6; x++) {
        for (let z = Math.floor(zCount * 0.6); z < zCount; z++) {
          tiles.push({
            key: `floor-${x}-${z}`,
            type: "floor",
            position: [x * TILE_SIZE + TILE_SIZE / 2, 0, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, 0],
          });
        }
      }
      return tiles;
    },
    generateWalls: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      const yCount = WALL_HEIGHT / TILE_SIZE;
      const splitX = Math.floor(xCount * 0.6);
      const splitZ = Math.floor(zCount * 0.6);

      for (let y = 0; y < yCount; y++) {
        const yPos = y * TILE_SIZE + TILE_SIZE / 2;

        // 하단 뒷벽 (전체)
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-back-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, 0],
            rotation: [-Math.PI / 2, 0, 0],
          });
        }

        // 하단 왼쪽 벽
        for (let z = 0; z < splitZ; z++) {
          tiles.push({
            key: `wall-left-bottom-${z}-${y}`,
            type: "wall",
            position: [0, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, Math.PI / 2],
          });
        }

        // 하단 오른쪽 벽
        for (let z = 0; z < splitZ; z++) {
          tiles.push({
            key: `wall-right-bottom-${z}-${y}`,
            type: "wall",
            position: [width, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, -Math.PI / 2],
          });
        }

        // 상단 왼쪽 벽
        for (let z = splitZ; z < zCount; z++) {
          tiles.push({
            key: `wall-left-top-${z}-${y}`,
            type: "wall",
            position: [0, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, Math.PI / 2],
          });
        }

        // 상단 앞벽
        for (let x = 0; x < splitX; x++) {
          tiles.push({
            key: `wall-front-top-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, depth],
            rotation: [Math.PI / 2, 0, 0],
          });
        }

        // 내부 벽 (ㄱ자 꺾이는 부분)
        for (let x = splitX; x < xCount; x++) {
          tiles.push({
            key: `wall-inner-h-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, splitZ * TILE_SIZE],
            rotation: [Math.PI / 2, 0, 0],
          });
        }
        for (let z = splitZ; z < zCount; z++) {
          tiles.push({
            key: `wall-inner-v-${z}-${y}`,
            type: "wall",
            position: [splitX * TILE_SIZE, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, -Math.PI / 2],
          });
        }
      }
      return tiles;
    },
  },
  square: {
    name: "정사각형 원룸",
    description: "정방형 구조 (4m x 4m)",
    width: 4.0,
    depth: 4.0,
    generateFloor: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      for (let x = 0; x < xCount; x++) {
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `floor-${x}-${z}`,
            type: "floor",
            position: [x * TILE_SIZE + TILE_SIZE / 2, 0, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, 0],
          });
        }
      }
      return tiles;
    },
    generateWalls: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      const yCount = WALL_HEIGHT / TILE_SIZE;

      for (let y = 0; y < yCount; y++) {
        const yPos = y * TILE_SIZE + TILE_SIZE / 2;

        // 뒷벽
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-back-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, 0],
            rotation: [-Math.PI / 2, 0, 0],
          });
        }
        // 앞벽
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-front-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, depth],
            rotation: [Math.PI / 2, 0, 0],
          });
        }
        // 왼쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-left-${z}-${y}`,
            type: "wall",
            position: [0, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, Math.PI / 2],
          });
        }
        // 오른쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-right-${z}-${y}`,
            type: "wall",
            position: [width, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, -Math.PI / 2],
          });
        }
      }
      return tiles;
    },
  },
  corridor: {
    name: "복도형 원룸",
    description: "긴 복도 형태 (6m x 2.5m)",
    width: 6.0,
    depth: 2.5,
    generateFloor: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      for (let x = 0; x < xCount; x++) {
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `floor-${x}-${z}`,
            type: "floor",
            position: [x * TILE_SIZE + TILE_SIZE / 2, 0, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, 0],
          });
        }
      }
      return tiles;
    },
    generateWalls: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      const yCount = WALL_HEIGHT / TILE_SIZE;

      for (let y = 0; y < yCount; y++) {
        const yPos = y * TILE_SIZE + TILE_SIZE / 2;

        // 뒷벽
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-back-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, 0],
            rotation: [-Math.PI / 2, 0, 0],
          });
        }
        // 앞벽
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-front-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, depth],
            rotation: [Math.PI / 2, 0, 0],
          });
        }
        // 왼쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-left-${z}-${y}`,
            type: "wall",
            position: [0, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, Math.PI / 2],
          });
        }
        // 오른쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-right-${z}-${y}`,
            type: "wall",
            position: [width, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, -Math.PI / 2],
          });
        }
      }
      return tiles;
    },
  },
  ushaped: {
    name: "ㄷ자형 원룸",
    description: "ㄷ자 구조 (5m x 5m)",
    width: 5.0,
    depth: 5.0,
    generateFloor: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;

      // ㄷ자 형태: 중앙 상단 부분을 제외
      const excludeXStart = Math.floor(xCount * 0.3);
      const excludeXEnd = Math.floor(xCount * 0.7);
      const excludeZStart = Math.floor(zCount * 0.6);

      for (let x = 0; x < xCount; x++) {
        for (let z = 0; z < zCount; z++) {
          // 중앙 상단 영역 제외
          if (x >= excludeXStart && x < excludeXEnd && z >= excludeZStart) {
            continue;
          }
          tiles.push({
            key: `floor-${x}-${z}`,
            type: "floor",
            position: [x * TILE_SIZE + TILE_SIZE / 2, 0, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, 0],
          });
        }
      }
      return tiles;
    },
    generateWalls: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      const yCount = WALL_HEIGHT / TILE_SIZE;

      const excludeXStart = Math.floor(xCount * 0.3);
      const excludeXEnd = Math.floor(xCount * 0.7);
      const excludeZStart = Math.floor(zCount * 0.6);

      for (let y = 0; y < yCount; y++) {
        const yPos = y * TILE_SIZE + TILE_SIZE / 2;

        // 뒷벽 (전체)
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-back-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, 0],
            rotation: [-Math.PI / 2, 0, 0],
          });
        }

        // 왼쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-left-${z}-${y}`,
            type: "wall",
            position: [0, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, Math.PI / 2],
          });
        }

        // 오른쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-right-${z}-${y}`,
            type: "wall",
            position: [width, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, -Math.PI / 2],
          });
        }

        // 앞벽 (좌측)
        for (let x = 0; x < excludeXStart; x++) {
          tiles.push({
            key: `wall-front-left-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, depth],
            rotation: [Math.PI / 2, 0, 0],
          });
        }

        // 앞벽 (우측)
        for (let x = excludeXEnd; x < xCount; x++) {
          tiles.push({
            key: `wall-front-right-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, depth],
            rotation: [Math.PI / 2, 0, 0],
          });
        }

        // 내부 벽 (ㄷ자 안쪽)
        // 좌측 내부 벽
        for (let z = excludeZStart; z < zCount; z++) {
          tiles.push({
            key: `wall-inner-left-${z}-${y}`,
            type: "wall",
            position: [excludeXStart * TILE_SIZE, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, -Math.PI / 2],
          });
        }
        // 우측 내부 벽
        for (let z = excludeZStart; z < zCount; z++) {
          tiles.push({
            key: `wall-inner-right-${z}-${y}`,
            type: "wall",
            position: [excludeXEnd * TILE_SIZE, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, Math.PI / 2],
          });
        }
        // 상단 내부 벽
        for (let x = excludeXStart; x < excludeXEnd; x++) {
          tiles.push({
            key: `wall-inner-top-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, excludeZStart * TILE_SIZE],
            rotation: [-Math.PI / 2, 0, 0],
          });
        }
      }
      return tiles;
    },
  },
  wide_rectangular: {
    name: "넓은 직사각형",
    description: "큰 원룸 (5m x 4m)",
    width: 5.0,
    depth: 4.0,
    generateFloor: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      for (let x = 0; x < xCount; x++) {
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `floor-${x}-${z}`,
            type: "floor",
            position: [x * TILE_SIZE + TILE_SIZE / 2, 0, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, 0],
          });
        }
      }
      return tiles;
    },
    generateWalls: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      const yCount = WALL_HEIGHT / TILE_SIZE;

      for (let y = 0; y < yCount; y++) {
        const yPos = y * TILE_SIZE + TILE_SIZE / 2;

        // 뒷벽
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-back-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, 0],
            rotation: [-Math.PI / 2, 0, 0],
          });
        }
        // 앞벽
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-front-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, depth],
            rotation: [Math.PI / 2, 0, 0],
          });
        }
        // 왼쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-left-${z}-${y}`,
            type: "wall",
            position: [0, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, Math.PI / 2],
          });
        }
        // 오른쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-right-${z}-${y}`,
            type: "wall",
            position: [width, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, -Math.PI / 2],
          });
        }
      }
      return tiles;
    },
  },
  // NEW: Custom parametric template (사용자가 크기를 조절할 수 있는 템플릿)
  custom: {
    name: "사용자 정의",
    description: "크기 조절 가능",
    width: 4.0, // 기본값
    depth: 4.0, // 기본값
    // generateFloor와 generateWalls는 rectangular와 동일
    generateFloor: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      for (let x = 0; x < xCount; x++) {
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `floor-${x}-${z}`,
            type: "floor",
            position: [x * TILE_SIZE + TILE_SIZE / 2, 0, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, 0],
          });
        }
      }
      return tiles;
    },
    generateWalls: (width, depth) => {
      const tiles = [];
      const xCount = width / TILE_SIZE;
      const zCount = depth / TILE_SIZE;
      const yCount = WALL_HEIGHT / TILE_SIZE;

      for (let y = 0; y < yCount; y++) {
        const yPos = y * TILE_SIZE + TILE_SIZE / 2;

        // 뒷벽
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-back-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, 0],
            rotation: [-Math.PI / 2, 0, 0],
          });
        }
        // 앞벽
        for (let x = 0; x < xCount; x++) {
          tiles.push({
            key: `wall-front-${x}-${y}`,
            type: "wall",
            position: [x * TILE_SIZE + TILE_SIZE / 2, yPos, depth],
            rotation: [Math.PI / 2, 0, 0],
          });
        }
        // 왼쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-left-${z}-${y}`,
            type: "wall",
            position: [0, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, Math.PI / 2],
          });
        }
        // 오른쪽 벽
        for (let z = 0; z < zCount; z++) {
          tiles.push({
            key: `wall-right-${z}-${y}`,
            type: "wall",
            position: [width, yPos, z * TILE_SIZE + TILE_SIZE / 2],
            rotation: [0, 0, -Math.PI / 2],
          });
        }
      }
      return tiles;
    },
  },
};

// ==========================================
// 2. 타일 컴포넌트 (수정됨: 재질 및 그림자 적용)
// ==========================================
function Tile({
  tileKey,
  position,
  rotation = [0, 0, 0],
  type = "floor",
  isSelected = false,
  textureUrl = null,
  onSelect
}) {
  const { scene } = useGLTF("/tile.glb");
  const clone = useMemo(() => scene.clone(), [scene]);
  const [texture, setTexture] = useState(null);
  const groupRef = useRef();

  // 텍스처 로드
  useEffect(() => {
    if (textureUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(textureUrl, (loadedTexture) => {
        // JPEG/PNG 이미지는 sRGB 색상 공간으로 설정 (밝기 문제 해결)
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
      });
    } else {
      setTexture(null);
    }
  }, [textureUrl]);

  // [핵심 수정] GLB 모델의 재질을 코드로 강제 교체합니다.
  useEffect(() => {
    clone.traverse((child) => {
      if (child.isMesh) {
        // 1. 그림자 설정: 빛을 받아 그림자를 만들고(cast), 다른 그림자를 받기도 함(receive)
        child.castShadow = true;
        child.receiveShadow = true;

        // 2. 재질 교체: 벽과 바닥 색상을 다르게 설정
        // 선택된 타일은 파란색으로 하이라이트
        let color;
        if (isSelected) {
          color = "#4499ff"; // 선택된 타일은 파란색
        } else if (texture) {
          color = "#888888"; // 텍스처가 있으면 회색 (밝기 조절)
        } else {
          color = type === "wall" ? "#d0d0d0" : "#f5f5f5";
        }

        // 기존 재질을 빛에 반응하는 표준 재질로 교체
        child.material = new THREE.MeshStandardMaterial({
          color: isSelected ? "#4499ff" : (texture ? "#ffffff" : color), // 선택 시 파란색, 텍스처 있으면 흰색, 없으면 기존 색상
          map: texture, // 텍스처 적용
          roughness: 0.8, // 거칠기 증가 (빛 반사 감소)
          metalness: 0.0, // 금속성 제거
          side: THREE.DoubleSide, // 양면 렌더링
          // 자연광 효과 감소 (밝기 조정)
          emissive: isSelected
            ? new THREE.Color(0x2266cc) // 선택 시 파란색 발광
            : (texture ? new THREE.Color(0x000000) : new THREE.Color(0x000000)), // 자체 발광 제거
          emissiveIntensity: isSelected ? 0.5 : 0, // 선택 시만 발광
          toneMapped: true, // 톤 매핑 활성화로 자연스러운 밝기
        });

        // userData에 tileKey 저장
        child.userData.tileKey = tileKey;
      }
    });
  }, [clone, type, isSelected, texture, tileKey]);

  const pointerDownPos = useRef(null);

  const handlePointerDown = (e) => {
    // 클릭 시작 위치 저장
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    // 클릭 종료 위치와 시작 위치 비교
    if (pointerDownPos.current) {
      const deltaX = Math.abs(e.clientX - pointerDownPos.current.x);
      const deltaY = Math.abs(e.clientY - pointerDownPos.current.y);

      // 움직임이 5픽셀 이하면 클릭으로 간주 (드래그가 아님)
      if (deltaX < 5 && deltaY < 5) {
        e.stopPropagation();
        console.log("Tile clicked:", tileKey, "isSelected:", isSelected, "shiftKey:", e.shiftKey);
        onSelect(tileKey, e.shiftKey); // Shift 키 상태 전달
      } else {
        console.log("Dragged, not selecting");
      }

      pointerDownPos.current = null;
    }
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <primitive object={clone} />
    </group>
  );
}

// ==========================================
// 3. 방 생성기 (템플릿 기반 + Parametric)
// ==========================================
const RoomBuilder = React.forwardRef(({ template, selectedTiles, tileTextures, onTileSelect, customWidth, customDepth }, ref) => {
  const roomTemplate = ROOM_TEMPLATES[template];
  const groupRef = useRef();

  // 부모 컴포넌트에서 접근할 수 있도록 ref 노출
  React.useImperativeHandle(ref, () => ({
    getScene: () => groupRef.current,
  }));

  // Custom 템플릿인 경우 customWidth/customDepth 사용, 아니면 템플릿의 기본값 사용
  const actualWidth = template === 'custom' ? customWidth : roomTemplate.width;
  const actualDepth = template === 'custom' ? customDepth : roomTemplate.depth;

  // 템플릿에서 타일 데이터 생성
  const floorTileData = roomTemplate.generateFloor(actualWidth, actualDepth);
  const wallTileData = roomTemplate.generateWalls(actualWidth, actualDepth);

  const floorTiles = [];
  const wallTiles = [];

  // 바닥 타일 생성
  floorTileData.forEach((tileData) => {
    floorTiles.push(
      <Tile
        key={tileData.key}
        tileKey={tileData.key}
        type={tileData.type}
        position={tileData.position}
        rotation={tileData.rotation}
        isSelected={selectedTiles.includes(tileData.key)}
        textureUrl={tileTextures[tileData.key] || null}
        onSelect={onTileSelect}
      />
    );
  });

  // 벽 타일 생성
  wallTileData.forEach((tileData) => {
    wallTiles.push(
      <Tile
        key={tileData.key}
        tileKey={tileData.key}
        type={tileData.type}
        position={tileData.position}
        rotation={tileData.rotation}
        isSelected={selectedTiles.includes(tileData.key)}
        textureUrl={tileTextures[tileData.key] || null}
        onSelect={onTileSelect}
      />
    );
  });

  return (
    <group ref={groupRef}>
      <group>{floorTiles}</group>
      <group>{wallTiles}</group>
    </group>
  );
});

// ==========================================
// 4. 메인 씬 (수정됨: 조명 및 그림자 설정)
// ==========================================
export default function App() {
  const [currentTemplate, setCurrentTemplate] = useState("rectangular"); // 선택된 템플릿
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [tileTextures, setTileTextures] = useState({});
  const [uploadedImages, setUploadedImages] = useState([]); // 업로드된 이미지 목록
  const [selectedImage, setSelectedImage] = useState(null); // 선택된 이미지
  const [ambientIntensity, setAmbientIntensity] = useState(0.3); // 주변광 강도
  const [directionalIntensity, setDirectionalIntensity] = useState(0.6); // 방향광 강도
  const [isExporting, setIsExporting] = useState(false); // 내보내기 진행 상태
  const [showTemplates, setShowTemplates] = useState(false); // 템플릿 섹션 표시 여부
  const [sidebarWidth, setSidebarWidth] = useState(280); // 우측 사이드바 너비
  const [isResizing, setIsResizing] = useState(false); // 리사이징 중인지 여부

  // NEW: Parametric Room Size (Feature 1)
  const [customWidth, setCustomWidth] = useState(4.0); // 사용자 정의 방 가로 크기 (미터)
  const [customDepth, setCustomDepth] = useState(4.0); // 사용자 정의 방 세로 크기 (미터)

  const fileInputRef = useRef(null);
  const roomBuilderRef = useRef(null);

  const roomTemplate = ROOM_TEMPLATES[currentTemplate];

  // 사이드바 리사이징 핸들러
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 250 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // 타일 선택/해제 핸들러
  const handleTileSelect = (tileKey, shiftKey = false) => {
    console.log("handleTileSelect called with:", tileKey, "shiftKey:", shiftKey);

    // Shift + 클릭: 클릭한 타일의 영역 전체 선택
    if (shiftKey) {
      if (tileKey.startsWith("floor")) {
        // 바닥 전체 선택
        console.log("Shift + Click: Selecting all floor tiles");
        handleSelectAllFloor();
      } else if (tileKey.startsWith("wall-front")) {
        // 앞벽 전체 선택
        console.log("Shift + Click: Selecting front wall");
        handleSelectWall("front");
      } else if (tileKey.startsWith("wall-back")) {
        // 뒷벽 전체 선택
        console.log("Shift + Click: Selecting back wall");
        handleSelectWall("back");
      } else if (tileKey.startsWith("wall-left")) {
        // 왼쪽 벽 전체 선택
        console.log("Shift + Click: Selecting left wall");
        handleSelectWall("left");
      } else if (tileKey.startsWith("wall-right")) {
        // 오른쪽 벽 전체 선택
        console.log("Shift + Click: Selecting right wall");
        handleSelectWall("right");
      }
      return;
    }

    // 일반 클릭: 개별 타일 선택/해제
    setSelectedTiles((prev) => {
      const isCurrentlySelected = prev.includes(tileKey);
      console.log("Currently selected:", prev, "Is selected:", isCurrentlySelected);

      if (isCurrentlySelected) {
        // 이미 선택된 경우 선택 해제
        const newSelection = prev.filter((key) => key !== tileKey);
        console.log("Deselecting, new selection:", newSelection);
        return newSelection;
      } else {
        // 선택되지 않은 경우 선택
        const newSelection = [...prev, tileKey];
        console.log("Selecting, new selection:", newSelection);
        return newSelection;
      }
    });
  };

  // 파일 업로드 핸들러 (이미지를 백엔드로 전송하여 심리스 텍스처 생성)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      console.log("[DEBUG] 파일 선택됨:", file.name, file.type, file.size);

      try {
        // FormData 생성
        const formData = new FormData();
        formData.append("file", file);

        console.log("[DEBUG] 백엔드로 요청 전송 중...");

        // 백엔드로 전송
        // 개발 환경에서는 localhost:8000, 프로덕션에서는 /api/ 프록시 사용
        const apiUrl = import.meta.env.DEV
          ? "http://localhost:8000/upload-texture"
          : "/api/upload-texture";
        const response = await fetch(apiUrl, {
          method: "POST",
          body: formData,
        });

        console.log("[DEBUG] 응답 받음:", response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[ERROR] 응답 오류:", errorText);
          throw new Error(`텍스처 생성 실패: ${response.status} ${errorText}`);
        }

        const contentType = response.headers.get("content-type");
        console.log("[DEBUG] Content-Type:", contentType);

        const data = await response.json();
        console.log("[DEBUG] 응답 데이터:", {
          success: data.success,
          size: data.size,
          texture_url_length: data.texture_url ? data.texture_url.length : 0
        });

        if (!data.success || !data.texture_url) {
          throw new Error("서버 응답이 올바르지 않습니다.");
        }

        // 심리스 텍스처를 갤러리에 추가
        setUploadedImages((prev) => [
          ...prev,
          {
            id: Date.now(),
            url: data.texture_url, // 백엔드에서 받은 base64 이미지
            name: file.name,
          },
        ]);

        console.log("[SUCCESS] 이미지 갤러리에 추가됨");

        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("[ERROR] 이미지 업로드 실패:", error);
        console.error("[ERROR] 에러 스택:", error.stack);
        alert(`이미지 처리 중 오류가 발생했습니다.\n\n에러: ${error.message}\n\n백엔드 서버가 http://localhost:8000 에서 실행 중인지 확인해주세요.`);
      }
    }
  };

  // 이미지를 선택된 타일에 적용
  const handleApplyImage = () => {
    if (selectedImage && selectedTiles.length > 0) {
      setTileTextures((prev) => {
        const newTextures = { ...prev };
        selectedTiles.forEach((tileKey) => {
          newTextures[tileKey] = selectedImage.url;
        });
        return newTextures;
      });

      // 선택 해제
      setSelectedTiles([]);
      setSelectedImage(null);
    }
  };

  // 선택 모두 해제
  const handleClearSelection = () => {
    setSelectedTiles([]);
    setSelectedImage(null);
  };

  // 이미지 삭제
  const handleDeleteImage = (imageId) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
    if (selectedImage && selectedImage.id === imageId) {
      setSelectedImage(null);
    }
  };

  // 템플릿 변경 핸들러
  const handleTemplateChange = (templateKey) => {
    setCurrentTemplate(templateKey);
    setSelectedTiles([]);
    setTileTextures({});
  };

  // 바닥 전체 선택
  const handleSelectAllFloor = () => {
    // custom 템플릿인 경우 customWidth/customDepth 사용, 아니면 템플릿 기본값 사용
    const actualWidth = currentTemplate === 'custom' ? customWidth : roomTemplate.width;
    const actualDepth = currentTemplate === 'custom' ? customDepth : roomTemplate.depth;
    const floorTileData = roomTemplate.generateFloor(actualWidth, actualDepth);
    const floorKeys = floorTileData.map((tile) => tile.key);
    setSelectedTiles(floorKeys);
  };

  // 특정 벽면 전체 선택
  const handleSelectWall = (wallType) => {
    // custom 템플릿인 경우 customWidth/customDepth 사용, 아니면 템플릿 기본값 사용
    const actualWidth = currentTemplate === 'custom' ? customWidth : roomTemplate.width;
    const actualDepth = currentTemplate === 'custom' ? customDepth : roomTemplate.depth;
    const wallTileData = roomTemplate.generateWalls(actualWidth, actualDepth);
    const wallKeys = wallTileData
      .filter((tile) => tile.key.startsWith(`wall-${wallType}`))
      .map((tile) => tile.key);
    setSelectedTiles(wallKeys);
  };

  // 이미지 압축 함수 (JPEG로 변환하여 파일 크기 감소)
  const compressImage = (imageUrl, quality = 0.8, maxSize = 512) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");

        // 이미지 크기를 최대 maxSize로 제한 (비율 유지)
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("이미지 압축 실패"));
              return;
            }
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("이미지 로드 실패"));
      img.src = imageUrl;
    });
  };

  // 타일을 벽면별로 그룹화
  const groupTilesByWall = () => {
    const groups = {
      'wall-front': { tiles: [], minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
      'wall-back': { tiles: [], minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
      'wall-left': { tiles: [], minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
      'wall-right': { tiles: [], minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
      'floor': { tiles: [], minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
    };

    Object.keys(tileTextures).forEach(tileKey => {
      const parts = tileKey.split('-');
      let groupKey = null;
      let x = 0, y = 0;

      if (tileKey.startsWith('wall-front')) {
        groupKey = 'wall-front';
        x = parseInt(parts[2]);
        y = parseInt(parts[3]);
      } else if (tileKey.startsWith('wall-back')) {
        groupKey = 'wall-back';
        x = parseInt(parts[2]);
        y = parseInt(parts[3]);
      } else if (tileKey.startsWith('wall-left')) {
        groupKey = 'wall-left';
        x = parseInt(parts[2]);
        y = parseInt(parts[3]);
      } else if (tileKey.startsWith('wall-right')) {
        groupKey = 'wall-right';
        x = parseInt(parts[2]);
        y = parseInt(parts[3]);
      } else if (tileKey.startsWith('floor')) {
        groupKey = 'floor';
        x = parseInt(parts[1]);
        y = parseInt(parts[2]);
      }

      if (groupKey && tileTextures[tileKey]) {
        groups[groupKey].tiles.push({ tileKey, x, y, imageUrl: tileTextures[tileKey] });
        groups[groupKey].minX = Math.min(groups[groupKey].minX, x);
        groups[groupKey].maxX = Math.max(groups[groupKey].maxX, x);
        groups[groupKey].minY = Math.min(groups[groupKey].minY, y);
        groups[groupKey].maxY = Math.max(groups[groupKey].maxY, y);
      }
    });

    return groups;
  };

  // 각 벽의 타일들을 하나의 텍스처로 합치기
  const mergeWallTextures = async (group, tileSize = 512) => {
    if (group.tiles.length === 0) return null;

    const width = (group.maxX - group.minX + 1) * tileSize;
    const height = (group.maxY - group.minY + 1) * tileSize;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 배경을 흰색으로
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 각 타일 이미지를 압축하고 적절한 위치에 그리기
    for (const tile of group.tiles) {
      try {
        // 이미지 압축
        const compressedUrl = await compressImage(tile.imageUrl, 0.8, tileSize);

        // 이미지 로드 및 그리기
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvasX = (tile.x - group.minX) * tileSize;
            const canvasY = (tile.y - group.minY) * tileSize;
            ctx.drawImage(img, canvasX, canvasY, tileSize, tileSize);
            resolve();
          };
          img.onerror = reject;
          img.src = compressedUrl;
        });
      } catch (error) {
        console.error(`타일 ${tile.tileKey} 처리 실패:`, error);
      }
    }

    // Canvas를 이미지로 변환
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // GLB 파일로 내보내기
  const handleExportGLB = async () => {
    if (!roomBuilderRef.current) {
      alert("3D 씬이 준비되지 않았습니다.");
      return;
    }

    setIsExporting(true);

    try {
      // 1. 타일을 벽면별로 그룹화
      console.log("타일 그룹화 중...");
      const wallGroups = groupTilesByWall();

      // 2. 각 벽의 텍스처를 합치기
      console.log("벽면별 텍스처 합치는 중...");
      const mergedTextures = {};

      for (const [groupKey, group] of Object.entries(wallGroups)) {
        if (group.tiles.length > 0) {
          console.log(`${groupKey} 처리 중... (타일 ${group.tiles.length}개)`);
          const mergedTexture = await mergeWallTextures(group);
          if (mergedTexture) {
            mergedTextures[groupKey] = {
              texture: mergedTexture,
              group: group
            };
          }
        }
      }

      // 3. 씬을 복제하고 합쳐진 텍스처 적용
      console.log("씬 복제 및 텍스처 교체 중...");
      const scene = roomBuilderRef.current.getScene();
      const clonedScene = scene.clone(true);

      // z축을 벽 높이의 절반만큼 올림
      clonedScene.position.z += WALL_HEIGHT / 2;

      // 합쳐진 텍스처를 로드
      const textureLoader = new THREE.TextureLoader();
      const loadedTextures = {};
      const texturePromises = [];

      for (const [groupKey, data] of Object.entries(mergedTextures)) {
        const promise = new Promise((resolve) => {
          textureLoader.load(data.texture, (texture) => {
            // JPEG/PNG 이미지는 sRGB 색상 공간으로 설정 (밝기 문제 해결)
            texture.colorSpace = THREE.SRGBColorSpace;
            loadedTextures[groupKey] = texture;
            resolve();
          });
        });
        texturePromises.push(promise);
      }

      await Promise.all(texturePromises);

      // 4. 각 메쉬의 UV 좌표를 재계산하고 텍스처 적용
      console.log("UV 좌표 재계산 중...");
      clonedScene.traverse((child) => {
        if (child.isMesh && child.userData.tileKey) {
          const tileKey = child.userData.tileKey;

          // 어느 그룹에 속하는지 확인
          let groupKey = null;
          if (tileKey.startsWith('wall-front')) groupKey = 'wall-front';
          else if (tileKey.startsWith('wall-back')) groupKey = 'wall-back';
          else if (tileKey.startsWith('wall-left')) groupKey = 'wall-left';
          else if (tileKey.startsWith('wall-right')) groupKey = 'wall-right';
          else if (tileKey.startsWith('floor')) groupKey = 'floor';

          if (groupKey && loadedTextures[groupKey] && mergedTextures[groupKey]) {
            const group = mergedTextures[groupKey].group;
            const tile = group.tiles.find(t => t.tileKey === tileKey);

            if (tile) {
              // UV 좌표 재계산
              const geometry = child.geometry.clone();
              const uvAttribute = geometry.attributes.uv;

              const gridWidth = group.maxX - group.minX + 1;
              const gridHeight = group.maxY - group.minY + 1;

              const tileUVX = (tile.x - group.minX) / gridWidth;
              const tileUVY = (tile.y - group.minY) / gridHeight;
              const tileUVWidth = 1 / gridWidth;
              const tileUVHeight = 1 / gridHeight;

              // UV 좌표 업데이트
              for (let i = 0; i < uvAttribute.count; i++) {
                const u = uvAttribute.getX(i);
                const v = uvAttribute.getY(i);

                uvAttribute.setXY(
                  i,
                  tileUVX + u * tileUVWidth,
                  tileUVY + v * tileUVHeight
                );
              }

              uvAttribute.needsUpdate = true;
              child.geometry = geometry;

              // 재질 업데이트
              child.material = child.material.clone();
              child.material.map = loadedTextures[groupKey];

              // 자연광 효과 제거 (밝기 조정)
              child.material.color = new THREE.Color(0xffffff);
              child.material.emissive = new THREE.Color(0x000000);
              child.material.emissiveIntensity = 0;
              child.material.toneMapped = true;
              child.material.needsUpdate = true;
            }
          } else {
            // 텍스처가 없는 타일
            child.material = child.material.clone();
            child.material.color = new THREE.Color(0xffffff);
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
            child.material.toneMapped = true;
            child.material.needsUpdate = true;
          }
        }
      });

      // 5. GLB로 내보내기
      console.log("GLB 파일 생성 중...");
      const exporter = new GLTFExporter();

      exporter.parse(
        clonedScene,
        (gltf) => {
          const blob = new Blob([gltf], { type: "application/octet-stream" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `room_${currentTemplate}_${Date.now()}.glb`;
          link.click();
          URL.revokeObjectURL(link.href);

          setIsExporting(false);
          const textureCount = Object.keys(mergedTextures).length;
          const totalTiles = Object.values(wallGroups).reduce((sum, group) => sum + group.tiles.length, 0);
          alert(`GLB 파일이 다운로드되었습니다!\n\n🎨 합쳐진 텍스처: ${textureCount}개\n🔲 총 타일: ${totalTiles}개`);
        },
        (error) => {
          console.error("GLB 내보내기 실패:", error);
          alert("GLB 내보내기 중 오류가 발생했습니다.");
          setIsExporting(false);
        },
        {
          binary: true,
          embedImages: true, // 이미지를 GLB에 포함
        }
      );
    } catch (error) {
      console.error("내보내기 실패:", error);
      alert("내보내기 중 오류가 발생했습니다: " + error.message);
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* CSS 애니메이션 정의 */}
      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          /* 스크롤바 스타일링 */
          ::-webkit-scrollbar {
            width: 8px;
          }

          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}
      </style>

      <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "row" }}>
        {/* 3D 캔버스 */}
      <div
        style={{
          flex: 1,
          height: "100%",
          background: "#888888",
          position: "relative",
        }}
      >
        {/* 상단 컨트롤 패널 */}
        <div
          style={{
            position: "absolute",
            top: 15,
            left: 15,
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.9)",
            padding: "10px",
            borderRadius: "6px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            width: "180px",
            maxHeight: "calc(100vh - 30px)",
            overflowY: "auto",
          }}
        >
          {/* 템플릿 선택 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "bold" }}>
              🏠 템플릿
            </h4>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#555";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#666";
                e.currentTarget.style.transform = "scale(1)";
              }}
              style={{
                padding: "3px 8px",
                fontSize: "10px",
                cursor: "pointer",
                background: "#666",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                transition: "all 0.2s ease",
              }}
            >
              {showTemplates ? "숨기기 ▲" : "펼치기 ▼"}
            </button>
          </div>

          {/* 현재 선택된 템플릿 표시 */}
          <div style={{ marginBottom: "10px" }}>
            <button
              style={{
                width: "100%",
                padding: "6px 8px",
                marginBottom: "6px",
                fontSize: "11px",
                cursor: "default",
                background: "#2196F3",
                color: "white",
                border: "1px solid #1976D2",
                borderRadius: "4px",
                fontWeight: "bold",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
                {ROOM_TEMPLATES[currentTemplate].name}
              </div>
              <div style={{ fontSize: "9px", opacity: 0.85 }}>
                {ROOM_TEMPLATES[currentTemplate].description}
              </div>
            </button>
          </div>

          {/* 템플릿 목록 (접을 수 있음) */}
          {showTemplates && (
            <div
              style={{
                marginBottom: "10px",
                maxHeight: "250px",
                overflowY: "auto",
                animation: "slideDown 0.3s ease-out"
              }}
            >
              <div style={{ fontSize: "10px", color: "#666", marginBottom: "6px", fontWeight: "bold" }}>
                다른 템플릿:
              </div>
              {Object.keys(ROOM_TEMPLATES)
                .filter(key => key !== currentTemplate)
                .map((templateKey) => {
                  const template = ROOM_TEMPLATES[templateKey];
                  return (
                    <button
                      key={templateKey}
                      onClick={() => {
                        handleTemplateChange(templateKey);
                        setShowTemplates(false); // 선택 후 자동으로 접기
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#e0e0e0";
                        e.currentTarget.style.transform = "translateX(4px)";
                        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f0f0f0";
                        e.currentTarget.style.transform = "translateX(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      style={{
                        width: "100%",
                        padding: "6px",
                        marginBottom: "4px",
                        fontSize: "10px",
                        cursor: "pointer",
                        background: "#f0f0f0",
                        color: "#333",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontWeight: "normal",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: "1px" }}>{template.name}</div>
                      <div style={{ fontSize: "8px", opacity: 0.7 }}>{template.description}</div>
                    </button>
                  );
                })}
            </div>
          )}

          {/* 조명 조절 */}
          <h4 style={{ margin: "10px 0 8px 0", fontSize: "12px", fontWeight: "bold" }}>
            💡 조명
          </h4>
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "10px", color: "#666", display: "block", marginBottom: "3px" }}>
              주변광: {ambientIntensity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={ambientIntensity}
              onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
              style={{ width: "100%", height: "4px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "10px", color: "#666", display: "block", marginBottom: "3px" }}>
              방향광: {directionalIntensity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={directionalIntensity}
              onChange={(e) => setDirectionalIntensity(parseFloat(e.target.value))}
              style={{ width: "100%", height: "4px" }}
            />
          </div>

          {/* NEW: Parametric Room Size Sliders (Custom 템플릿일 때만 표시) */}
          {currentTemplate === 'custom' && (
            <>
              <h4 style={{ margin: "10px 0 8px 0", fontSize: "12px", fontWeight: "bold" }}>
                📐 방 크기
              </h4>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontSize: "10px", color: "#666", display: "block", marginBottom: "3px" }}>
                  가로 (Width): {customWidth.toFixed(1)}m
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="0.5"
                  value={customWidth}
                  onChange={(e) => {
                    setCustomWidth(parseFloat(e.target.value));
                    setSelectedTiles([]); // 크기 변경 시 선택 초기화
                    setTileTextures({}); // 텍스처도 초기화
                  }}
                  style={{ width: "100%", height: "4px" }}
                />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "10px", color: "#666", display: "block", marginBottom: "3px" }}>
                  세로 (Depth): {customDepth.toFixed(1)}m
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="0.5"
                  value={customDepth}
                  onChange={(e) => {
                    setCustomDepth(parseFloat(e.target.value));
                    setSelectedTiles([]); // 크기 변경 시 선택 초기화
                    setTileTextures({}); // 텍스처도 초기화
                  }}
                  style={{ width: "100%", height: "4px" }}
                />
              </div>
            </>
          )}

        </div>

        <Canvas
          shadows
          camera={{ position: [5, 5, 8], fov: 50 }}
          onPointerMissed={() => {
            console.log("Canvas clicked (no object)");
          }}
        >
          <ambientLight intensity={ambientIntensity} />
          <directionalLight
            position={[5, 10, 7]}
            intensity={directionalIntensity}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <Environment preset="city" background={false} environmentIntensity={0.15} />

          <OrbitControls
            minDistance={2}
            maxDistance={15}
            enablePan={true}
            enableDamping={false}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE, // 좌클릭: 회전 (드래그 시)
              MIDDLE: THREE.MOUSE.DOLLY, // 휠클릭: 줌
              RIGHT: THREE.MOUSE.PAN, // 우클릭: 팬
            }}
          />
          <axesHelper args={[2]} position={[-0.5, 0, -0.5]} />

          {/* RoomBuilder with Parametric Size Support */}
          <RoomBuilder
            ref={roomBuilderRef}
            template={currentTemplate}
            selectedTiles={selectedTiles}
            tileTextures={tileTextures}
            onTileSelect={handleTileSelect}
            customWidth={customWidth}
            customDepth={customDepth}
          />
        </Canvas>
      </div>

      {/* 우측 사이드바 - 이미지 갤러리 */}
      <div
        style={{
          width: `${sidebarWidth}px`,
          height: "100%",
          background: "rgba(255, 255, 255, 0.95)",
          padding: "12px 16px",
          boxShadow: "-2px 0 10px rgba(0,0,0,0.2)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          transition: isResizing ? "none" : "width 0.2s ease",
        }}
      >
        {/* 리사이징 핸들 */}
        <div
          onMouseDown={() => setIsResizing(true)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "6px",
            height: "100%",
            cursor: "ew-resize",
            background: isResizing ? "rgba(33, 150, 243, 0.5)" : "transparent",
            transition: "background 0.2s ease",
            zIndex: 1000,
          }}
          onMouseEnter={(e) => {
            if (!isResizing) {
              e.currentTarget.style.background = "rgba(33, 150, 243, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        />
        <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "bold" }}>
          이미지 갤러리
        </h3>

        {/* 업로드 버튼 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#45a049";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#4CAF50";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
          style={{
            padding: "8px 12px",
            marginBottom: "10px",
            fontSize: "13px",
            cursor: "pointer",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            width: "100%",
            transition: "all 0.2s ease",
          }}
        >
          + 이미지 업로드
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />

        {/* 선택 정보 */}
        <div
          style={{
            marginBottom: "8px",
            padding: "6px 8px",
            background: "#f0f0f0",
            borderRadius: "4px",
            fontSize: "11px",
          }}
        >
          <div>타일: <strong>{selectedTiles.length}개</strong> | 이미지: <strong>{selectedImage ? "1개" : "0개"}</strong></div>
        </div>

        {/* 일괄 선택 버튼 */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>
            일괄 선택
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <button
              onClick={handleSelectAllFloor}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F57C00";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FF9800";
                e.currentTarget.style.transform = "scale(1)";
              }}
              style={{
                padding: "6px 8px",
                fontSize: "11px",
                cursor: "pointer",
                background: "#FF9800",
                color: "white",
                border: "none",
                borderRadius: "4px",
                transition: "all 0.2s ease",
              }}
            >
              🟫 바닥 전체
            </button>
            <button
              onClick={() => handleSelectWall("back")}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#7B1FA2";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#9C27B0";
                e.currentTarget.style.transform = "scale(1)";
              }}
              style={{
                padding: "6px 8px",
                fontSize: "11px",
                cursor: "pointer",
                background: "#9C27B0",
                color: "white",
                border: "none",
                borderRadius: "4px",
                transition: "all 0.2s ease",
              }}
            >
              뒷벽
            </button>
            <button
              onClick={() => handleSelectWall("front")}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#7B1FA2";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#9C27B0";
                e.currentTarget.style.transform = "scale(1)";
              }}
              style={{
                padding: "6px 8px",
                fontSize: "11px",
                cursor: "pointer",
                background: "#9C27B0",
                color: "white",
                border: "none",
                borderRadius: "4px",
                transition: "all 0.2s ease",
              }}
            >
              앞벽
            </button>
            <button
              onClick={() => handleSelectWall("left")}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#7B1FA2";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#9C27B0";
                e.currentTarget.style.transform = "scale(1)";
              }}
              style={{
                padding: "6px 8px",
                fontSize: "11px",
                cursor: "pointer",
                background: "#9C27B0",
                color: "white",
                border: "none",
                borderRadius: "4px",
                transition: "all 0.2s ease",
              }}
            >
              왼쪽 벽
            </button>
            <button
              onClick={() => handleSelectWall("right")}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#7B1FA2";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#9C27B0";
                e.currentTarget.style.transform = "scale(1)";
              }}
              style={{
                padding: "6px 8px",
                fontSize: "11px",
                cursor: "pointer",
                background: "#9C27B0",
                color: "white",
                border: "none",
                borderRadius: "4px",
                transition: "all 0.2s ease",
              }}
            >
              오른쪽 벽
            </button>
          </div>
        </div>

        {/* 적용 버튼 */}
        <button
          onClick={handleApplyImage}
          disabled={!selectedImage || selectedTiles.length === 0}
          onMouseEnter={(e) => {
            if (selectedImage && selectedTiles.length > 0) {
              e.currentTarget.style.background = "#1976D2";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (selectedImage && selectedTiles.length > 0) {
              e.currentTarget.style.background = "#2196F3";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
          style={{
            padding: "8px 12px",
            marginBottom: "6px",
            fontSize: "13px",
            cursor:
              !selectedImage || selectedTiles.length === 0
                ? "not-allowed"
                : "pointer",
            background:
              !selectedImage || selectedTiles.length === 0 ? "#ccc" : "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            transition: "all 0.2s ease",
          }}
        >
          선택한 타일에 적용
        </button>

        <button
          onClick={handleClearSelection}
          disabled={selectedTiles.length === 0 && !selectedImage}
          onMouseEnter={(e) => {
            if (selectedTiles.length > 0 || selectedImage) {
              e.currentTarget.style.background = "#d32f2f";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (selectedTiles.length > 0 || selectedImage) {
              e.currentTarget.style.background = "#f44336";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
          style={{
            padding: "6px 10px",
            marginBottom: "6px",
            fontSize: "12px",
            cursor:
              selectedTiles.length === 0 && !selectedImage
                ? "not-allowed"
                : "pointer",
            background:
              selectedTiles.length === 0 && !selectedImage ? "#ccc" : "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            transition: "all 0.2s ease",
          }}
        >
          선택 해제
        </button>

        {/* GLB 내보내기 버튼 */}
        <button
          onClick={handleExportGLB}
          disabled={isExporting}
          onMouseEnter={(e) => {
            if (!isExporting) {
              e.currentTarget.style.background = "#0097A7";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isExporting) {
              e.currentTarget.style.background = "#00BCD4";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
          style={{
            padding: "8px 12px",
            marginBottom: "12px",
            fontSize: "13px",
            cursor: isExporting ? "not-allowed" : "pointer",
            background: isExporting ? "#ccc" : "#00BCD4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            transition: "all 0.2s ease",
          }}
        >
          {isExporting ? "⏳ 내보내는 중..." : "📦 GLB 파일로 내보내기"}
        </button>

        {/* 이미지 갤러리 */}
        <div style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px" }}>
          업로드된 이미지 ({uploadedImages.length})
        </div>

        {uploadedImages.length === 0 ? (
          <div style={{ fontSize: "11px", color: "#666", textAlign: "center", padding: "12px" }}>
            업로드된 이미지가 없습니다
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                onClick={() => setSelectedImage(image)}
                onMouseEnter={(e) => {
                  if (selectedImage?.id !== image.id) {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                style={{
                  position: "relative",
                  border:
                    selectedImage?.id === image.id
                      ? "2px solid #2196F3"
                      : "1px solid #ddd",
                  borderRadius: "6px",
                  padding: "6px",
                  cursor: "pointer",
                  background:
                    selectedImage?.id === image.id ? "#e3f2fd" : "white",
                  transition: "all 0.2s ease",
                }}
              >
                <img
                  src={image.url}
                  alt={image.name}
                  style={{
                    width: "100%",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "#333",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {image.name}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(image.id);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(211, 47, 47, 1)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(244, 67, 54, 0.9)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    padding: "3px 6px",
                    fontSize: "10px",
                    background: "rgba(244, 67, 54, 0.9)",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    transition: "all 0.2s ease",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "12px", fontSize: "10px", color: "#999", lineHeight: "1.4", padding: "8px", background: "#f9f9f9", borderRadius: "4px" }}>
          <strong>💡 사용법:</strong> 이미지 업로드 → 타일 선택 (클릭 또는 일괄) → 이미지 선택 → 적용
        </div>
      </div>
    </div>
    </>
  );
}