import React, { useState, useEffect, useRef } from 'react';
import { LineChart, BarChart2, Zap, Circle, Triangle, Layers, RotateCw } from 'lucide-react';

interface PlotPoint {
  x: number | string;
  y: number;
  label?: string;
}

interface PlotData {
  type: 'line' | 'bar' | 'scatter';
  title?: string;
  xAxis?: string;
  yAxis?: string;
  data: PlotPoint[];
}

interface GeometryData {
  type: 'circle' | 'triangle' | 'cube' | 'sphere' | 'tesseract';
  title?: string;
  params?: {
    radius?: number;
    width?: number;
    height?: number;
    [key: string]: any;
  };
  labels?: string[];
}

export function EmiVisualizer({ 
  code, 
  language, 
  theme 
}: { 
  code: string; 
  language: string; 
  theme: 'light' | 'dark' 
}) {
  const [error, setError] = useState<string | null>(null);

  // Check language type
  const isPlot = language.includes('plot');
  const isGeometry = language.includes('geometry');

  if (!isPlot && !isGeometry) {
    return (
      <pre className="p-3 bg-gray-950 text-gray-200 rounded-lg overflow-x-auto text-xs font-mono">
        <code>{code}</code>
      </pre>
    );
  }

  try {
    const cleanJSON = code.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    const data = JSON.parse(cleanJSON);

    if (isPlot) {
      return <EmiPlotView data={data} theme={theme} />;
    } else {
      return <EmiGeometryView data={data} theme={theme} />;
    }
  } catch (err: any) {
    return (
      <div className="my-4 border border-rose-500/20 bg-rose-500/5 p-4 rounded-2xl text-xs">
        <p className="font-bold text-rose-500 mb-1">Visualizer Parsing Error</p>
        <p className="opacity-70 dark:text-gray-300 mb-3 font-mono">{err?.message}</p>
        <pre className="p-3 bg-gray-950 text-gray-200 rounded-lg overflow-x-auto text-[11px] font-mono">
          <code>{code}</code>
        </pre>
      </div>
    );
  }
}

// ==========================================
// INTERACTIVE PLOTS & GRAPHS
// ==========================================
function EmiPlotView({ data, theme }: { data: PlotData; theme: 'light' | 'dark' }) {
  const [hoveredPoint, setHoveredPoint] = useState<PlotPoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const plotData = data.data || [];
  if (plotData.length === 0) {
    return <div className="p-4 text-center text-xs opacity-50">No data points provided.</div>;
  }

  // Parse numerical min and max limits
  let minX = 0;
  let maxX = 1;
  const isXNumeric = plotData.every(p => !isNaN(Number(p.x)));

  if (isXNumeric) {
    const xValues = plotData.map(p => Number(p.x));
    minX = Math.min(...xValues, 0); // Include 0 by default for standard educational alignment
    maxX = Math.max(...xValues) * 1.1 || 1;
  } else {
    minX = 0;
    maxX = plotData.length - 1;
  }

  const yValues = plotData.map(p => p.y);
  const minY = Math.min(...yValues, 0);
  const maxY = Math.max(...yValues) * 1.15 || 1;

  // SVG parameters
  const height = 240;
  const width = 450;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Scale functions
  const getX = (item: PlotPoint, index: number) => {
    const val = isXNumeric ? Number(item.x) : index;
    const ratio = (val - minX) / (maxX - minX || 1);
    return paddingLeft + ratio * chartWidth;
  };

  const getY = (yVal: number) => {
    const ratio = (yVal - minY) / (maxY - minY || 1);
    return height - paddingBottom - ratio * chartHeight;
  };

  // Create path for line chart
  const linePath = plotData.reduce((acc, point, index) => {
    const x = getX(point, index);
    const y = getY(point.y);
    return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  return (
    <div className={`my-5 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-slate-50 border-slate-200'} rounded-3xl p-5 shadow-sm overflow-hidden`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {data.title || 'Dynamic Analysis'}
          </h4>
          {data.xAxis && data.yAxis && (
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
              {data.yAxis} against {data.xAxis}
            </p>
          )}
        </div>
        <div className="flex gap-1.5">
          {data.type === 'bar' ? (
            <BarChart2 size={16} className="text-indigo-400" />
          ) : (
            <LineChart size={16} className="text-indigo-400" />
          )}
        </div>
      </div>

      <div className="relative overflow-x-auto hide-scrollbar">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[320px]">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const h = height - paddingBottom - ratio * chartHeight;
            const yVal = minY + ratio * (maxY - minY);
            return (
              <g key={index}>
                <line 
                  x1={paddingLeft} 
                  y1={h} 
                  x2={width - paddingRight} 
                  y2={h} 
                  stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} 
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={h + 4} 
                  className="fill-gray-500 text-[9px] font-bold text-right"
                  textAnchor="end"
                >
                  {yVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* X axis gridlines */}
          {plotData.map((point, index) => {
            if (index % Math.ceil(plotData.length / 5) !== 0 && index !== plotData.length - 1) return null;
            const x = getX(point, index);
            return (
              <g key={index}>
                <line 
                  x1={x} 
                  y1={paddingTop} 
                  x2={x} 
                  y2={height - paddingBottom} 
                  stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'}  
                  strokeWidth="1"
                  strokeDasharray="1 3"
                />
                <text 
                  x={x} 
                  y={height - paddingBottom + 16} 
                  className="fill-gray-400 text-[9px] font-bold"
                  textAnchor="middle"
                >
                  {isXNumeric ? Number(point.x).toFixed(0) : String(point.x)}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text 
            x={width / 2 + paddingLeft / 2} 
            y={height - 5} 
            className="fill-gray-500 text-[10px] font-black uppercase text-center"
            textAnchor="middle"
          >
            {data.xAxis || 'x-axis'}
          </text>
          
          <text 
            x={12} 
            y={height / 2} 
            className="fill-gray-500 text-[10px] font-black uppercase"
            transform={`rotate(-90 12 ${height / 2})`}
            textAnchor="middle"
          >
            {data.yAxis || 'y-axis'}
          </text>

          {/* MAIN CHART SERIES */}
          {data.type === 'bar' ? (
            plotData.map((point, index) => {
              const xPos = getX(point, index) - 10;
              const yPos = getY(point.y);
              const barH = height - paddingBottom - yPos;
              const isHovered = hoveredIndex === index;
              return (
                <rect
                  key={index}
                  x={xPos}
                  y={yPos}
                  width="20"
                  height={Math.max(barH, 2)}
                  rx="4"
                  className={`${isHovered ? 'fill-indigo-400' : 'fill-indigo-600'} transition-all duration-200 cursor-pointer`}
                  onMouseEnter={() => {
                    setHoveredPoint(point);
                    setHoveredIndex(index);
                  }}
                  onMouseLeave={() => {
                    setHoveredPoint(null);
                    setHoveredIndex(null);
                  }}
                />
              );
            })
          ) : (
            <>
              {/* Line path shadow / Glow */}
              <path 
                d={linePath} 
                fill="none" 
                stroke="url(#chartGlow)" 
                strokeWidth="12" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="opacity-10"
              />
              {/* Line path */}
              <path 
                d={linePath} 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              {/* Line dots on hover/points */}
              {plotData.map((point, index) => {
                const x = getX(point, index);
                const y = getY(point.y);
                const isHovered = hoveredIndex === index;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={isHovered ? '7' : '4.5'}
                    className={`${isHovered ? 'fill-emerald-400 stroke-white' : 'fill-indigo-600'} transition-all duration-200 cursor-pointer stroke-2 stroke-indigo-950`}
                    onMouseEnter={() => {
                      setHoveredPoint(point);
                      setHoveredIndex(index);
                    }}
                    onMouseLeave={() => {
                      setHoveredPoint(null);
                      setHoveredIndex(null);
                    }}
                  />
                );
              })}
            </>
          )}

          {/* Gradients */}
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Coordinate Tooltip Overlay */}
      <div className={`mt-3 py-2 px-4 rounded-xl text-center flex items-center justify-between text-xs transition-colors ${theme === 'dark' ? 'bg-gray-950/80 border-gray-800' : 'bg-white border-slate-100'} border`}>
        <span className="text-gray-400 font-bold uppercase tracking-wide text-[9px]">Value Monitor</span>
        {hoveredPoint ? (
          <div className="flex gap-2.5 font-mono text-[11px] font-bold text-indigo-400 animate-in fade-in duration-100">
            <span>{data.xAxis || 'X'}: <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{hoveredPoint.x}</span></span>
            <span>{data.yAxis || 'Y'}: <span className="text-emerald-500">{hoveredPoint.y}</span></span>
          </div>
        ) : (
          <span className="text-gray-500 font-bold text-[10px]">Hover or tap on visual elements for details</span>
        )}
      </div>
    </div>
  );
}

// ==========================================
// INTERACTIVE GEOMETRY VIEWER (2D, 3D, 4D)
// ==========================================
function EmiGeometryView({ data, theme }: { data: GeometryData; theme: 'light' | 'dark' }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotationSpeed, setRotationSpeed] = useState(0.015);
  const [angleX, setAngleX] = useState(0.4);
  const [angleY, setAngleY] = useState(0.5);
  const [angleZ, setAngleZ] = useState(0.3);
  const [angleW, setAngleW] = useState(0.2); // W angle for 4D Tesseract

  const isThreeD = ['cube', 'sphere', 'tesseract'].includes(data.type);

  useEffect(() => {
    let animationFrameId: number;
    let rotation = { x: angleX, y: angleY, z: angleZ, w: angleW };

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI settings
    const scale = window.devicePixelRatio || 1;
    canvas.width = 300 * scale;
    canvas.height = 300 * scale;
    ctx.scale(scale, scale);

    const draw = () => {
      ctx.clearRect(0, 0, 300, 300);
      
      // Rotate coordinates slightly for 3D and 4D
      rotation.x += rotationSpeed;
      rotation.y += rotationSpeed * 1.3;
      rotation.z += rotationSpeed * 0.7;
      rotation.w += rotationSpeed * 0.5;

      const center = { x: 150, y: 150 };

      if (data.type === 'cube') {
        const size = 50;
        // Build 8 vertices
        const vertices = [
          [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
          [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ].map(([x, y, z]) => {
          // Multiply size
          return [x * size, y * size, z * size];
        });

        // 3D rotations
        const rotated = vertices.map(([x, y, z]) => {
          // X rotation
          let cos = Math.cos(rotation.x), sin = Math.sin(rotation.x);
          let y1 = y * cos - z * sin;
          let z1 = y * sin + z * cos;

          // Y rotation
          cos = Math.cos(rotation.y); sin = Math.sin(rotation.y);
          let x2 = x * cos + z1 * sin;
          let z2 = -x * sin + z1 * cos;

          // Z rotation
          cos = Math.cos(rotation.z); sin = Math.sin(rotation.z);
          let x3 = x2 * cos - y1 * sin;
          let y3 = x2 * sin + y1 * cos;

          // Perspective scaling
          const factor = 160 / (200 + z2);
          return {
            x: center.x + x3 * factor,
            y: center.y + y3 * factor,
            z: z2
          };
        });

        // Define cube faces (indices)
        const faces = [
          [0, 1, 2, 3], // Front
          [4, 5, 6, 7], // Back
          [0, 1, 5, 4], // Top
          [2, 3, 7, 6], // Bottom
          [0, 3, 7, 4], // Left
          [1, 2, 6, 5]  // Right
        ];

        // Draw connecting edges
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1.5;
        
        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7]
        ];

        edges.forEach(([u, v]) => {
          ctx.beginPath();
          ctx.moveTo(rotated[u].x, rotated[u].y);
          ctx.lineTo(rotated[v].x, rotated[v].y);
          ctx.stroke();
        });

        // Add small glowing indicator points
        rotated.forEach((v) => {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(v.x, v.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });

      } else if (data.type === 'sphere') {
        const radius = 65;
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
        ctx.lineWidth = 1;

        // Draw longitude lines
        for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += Math.PI / 6) {
          ctx.beginPath();
          const thetaCos = Math.cos(lat);
          const thetaSin = Math.sin(lat);
          
          for (let lon = 0; lon <= Math.PI * 2; lon += 0.1) {
            const x = radius * Math.cos(lon) * thetaCos;
            const y = radius * Math.sin(lon) * thetaCos;
            const z = radius * thetaSin;

            // Simple spin matrix
            let cos = Math.cos(rotation.x), sin = Math.sin(rotation.x);
            let y1 = y * cos - z * sin;
            let z1 = y * sin + z * cos;

            cos = Math.cos(rotation.y); sin = Math.sin(rotation.y);
            let x2 = x * cos + z1 * sin;

            if (lon === 0) {
              ctx.moveTo(center.x + x2, center.y + y1);
            } else {
              ctx.lineTo(center.x + x2, center.y + y1);
            }
          }
          ctx.stroke();
        }

        // Draw latitude lines
        for (let lon = 0; lon < Math.PI * 2; lon += Math.PI / 6) {
          ctx.beginPath();
          const lonCos = Math.cos(lon);
          const lonSin = Math.sin(lon);
          
          for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += 0.1) {
            const x = radius * lonCos * Math.cos(lat);
            const y = radius * lonSin * Math.cos(lat);
            const z = radius * Math.sin(lat);

            let cos = Math.cos(rotation.x), sin = Math.sin(rotation.x);
            let y1 = y * cos - z * sin;
            let z1 = y * sin + z * cos;

            cos = Math.cos(rotation.y); sin = Math.sin(rotation.y);
            let x2 = x * cos + z1 * sin;

            if (lat === -Math.PI / 2) {
              ctx.moveTo(center.x + x2, center.y + y1);
            } else {
              ctx.lineTo(center.x + x2, center.y + y1);
            }
          }
          ctx.stroke();
        }

        // Beautiful shaded outer outline
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();

      } else if (data.type === 'tesseract') {
        const size = 38;
        // 16 Vertices of a 4D Hypercube
        const vertices: number[][] = [];
        for (let x = -1; x <= 1; x += 2) {
          for (let y = -1; y <= 1; y += 2) {
            for (let z = -1; z <= 1; z += 2) {
              for (let w = -1; w <= 1; w += 2) {
                vertices.push([x * size, y * size, z * size, w * size]);
              }
            }
          }
        }

        // Rotate in 4 Dimensions (XY plane & ZW plane)
        const projected2D = vertices.map(([x, y, z, w]) => {
          // XY Rotate
          let cosXY = Math.cos(rotation.x), sinXY = Math.sin(rotation.x);
          let rx = x * cosXY - y * sinXY;
          let ry = x * sinXY + y * cosXY;

          // ZW Rotate
          let cosZW = Math.cos(rotation.w), sinZW = Math.sin(rotation.w);
          let rz = z * cosZW - w * sinZW;
          let rw = z * sinZW + w * cosZW;

          // 4D to 3D perspective projection factor
          const d4 = 170; // 4D viewer distance
          const factor3D = d4 / (d4 + rw);
          const x3d = rx * factor3D;
          const y3d = ry * factor3D;
          const z3d = rz * factor3D;

          // 3D to 2D perspective projection
          const d3 = 180; // 3D viewer distance
          const factor2D = d3 / (d3 + z3d);
          
          return {
            x: center.x + x3d * factor2D,
            y: center.y + y3d * factor2D,
            r: factor3D * 3.5 // variable point radius
          };
        });

        // Helper to check if two 4D vertices share an edge (differ by exactly one coordinate)
        const shareEdge = (i: number, j: number) => {
          let diffSum = 0;
          for (let k = 0; k < 4; k++) {
            if (vertices[i][k] !== vertices[j][k]) diffSum++;
          }
          return diffSum === 1;
        };

        // Draw tesseract 4D edges
        ctx.lineWidth = 1.25;
        for (let i = 0; i < 16; i++) {
          for (let j = i + 1; j < 16; j++) {
            if (shareEdge(i, j)) {
              // Interconnecting lines color gradient
              ctx.strokeStyle = i < 8 ? 'rgba(99, 102, 241, 0.75)' : 'rgba(236, 72, 153, 0.75)';
              ctx.beginPath();
              ctx.moveTo(projected2D[i].x, projected2D[i].y);
              ctx.lineTo(projected2D[j].x, projected2D[j].y);
              ctx.stroke();
            }
          }
        }

        // Draw tesseract outer/internal nodes
        projected2D.forEach((n, idx) => {
          ctx.fillStyle = idx < 8 ? '#10b981' : '#f43f5e';
          ctx.beginPath();
          ctx.arc(n.x, n.y, Math.max(n.r, 2), 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [data.type, rotationSpeed]);

  return (
    <div className={`my-5 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-slate-50 border-slate-200'} rounded-3xl p-5 shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase`}>
            {data.title || 'Geometric Space'}
          </h4>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">
            {isThreeD ? 'Interactive 3D / 4D Vector Projection' : '2D Figure Geometry Model'}
          </span>
        </div>
        <div className="flex gap-1">
          <RotateCw size={14} className="text-indigo-400 rotate-animation" />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center">
        {isThreeD ? (
          <div className="relative w-[300px] h-[300px] flex items-center justify-center">
            <canvas ref={canvasRef} className="w-[300px] h-[300px]" />
            <div className={`absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase ${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <Layers size={11} className="text-indigo-400" />
              <span>Dim: {data.type === 'tesseract' ? '4D Space' : '3D Space'}</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center py-6">
            {data.type === 'circle' ? (
              <svg viewBox="0 0 200 200" className="w-[200px] h-[200px]">
                <circle cx="100" cy="100" r="70" className="stroke-indigo-600 fill-indigo-500/10 stroke-[2.5]" />
                <line x1="100" y1="100" x2="170" y2="100" className="stroke-emerald-500 stroke-[2]" strokeDasharray="3 3" />
                <circle cx="100" cy="100" r="4.5" className="fill-slate-900 dark:fill-white" />
                <text x="135" y="90" className="fill-emerald-500 font-bold text-[11px]" textAnchor="middle">r = {data.params?.radius || 'r'}</text>
                <text x="100" y="115" className="fill-gray-400 font-bold text-[9px]" textAnchor="middle">Center (0,0)</text>
              </svg>
            ) : data.type === 'triangle' ? (
              <svg viewBox="0 0 200 200" className="w-[200px] h-[200px]">
                <polygon points="100,30 35,150 165,150" className="stroke-indigo-600 fill-indigo-500/10 stroke-[2.5]" />
                <text x="100" y="20" className="fill-gray-400 font-bold text-[11px] text-center" textAnchor="middle">A</text>
                <text x="25" y="165" className="fill-gray-400 font-bold text-[11px]" textAnchor="middle">B</text>
                <text x="175" y="165" className="fill-gray-400 font-bold text-[11px]" textAnchor="middle">C</text>
                {/* Labeled sides */}
                <text x="55" y="95" className="fill-emerald-500 font-bold text-[11px]">{data.params?.sideA || 'a'}</text>
                <text x="140" y="95" className="fill-emerald-500 font-bold text-[11px]">{data.params?.sideB || 'b'}</text>
                <text x="100" y="168" className="fill-emerald-500 font-bold text-[11px]" textAnchor="middle">{data.params?.sideC || 'c'}</text>
              </svg>
            ) : (
              <div className="text-xs py-10 opacity-50 font-medium">Visualization not available</div>
            )}
          </div>
        )}
      </div>

      {isThreeD && (
        <div className="mt-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-500">
            <span>Rotation Speed</span>
            <span className="font-mono text-indigo-400">{(rotationSpeed * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="0.05" 
            step="0.002"
            value={rotationSpeed} 
            onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 outline-none cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
