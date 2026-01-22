import React, { useRef, useEffect, useState } from 'react';

const STATUS_COLORS = {
  pending: '#9CA3AF',
  in_progress: '#3B82F6',
  completed: '#10B981',
  blocked: '#EF4444',
};

const DependencyGraph = ({ graphData, selectedTask, onSelectTask }) => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState({});

  useEffect(() => {
    calculateNodePositions();
  }, [graphData]);

  useEffect(() => {
    drawGraph();
  }, [graphData, selectedTask, zoom, pan, nodePositions]);

  const calculateNodePositions = () => {
    const { nodes } = graphData;
    if (nodes.length === 0) return;

    const positions = {};
    const layers = {};
    const visited = new Set();

    // Simple hierarchical layout
    const calculateLayer = (nodeId, layer = 0) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      if (!layers[layer]) layers[layer] = [];
      layers[layer].push(nodeId);

      // Find nodes that depend on this node
      const dependents = graphData.edges
        .filter(edge => edge.to === nodeId)
        .map(edge => edge.from);

      dependents.forEach(depId => {
        calculateLayer(depId, layer + 1);
      });
    };

    // Start with nodes that have no dependencies
    const rootNodes = nodes
      .filter(node => !graphData.edges.some(edge => edge.from === node.id))
      .map(node => node.id);

    if (rootNodes.length === 0 && nodes.length > 0) {
      // If no root nodes, start with first node
      calculateLayer(nodes[0].id, 0);
    } else {
      rootNodes.forEach(nodeId => calculateLayer(nodeId, 0));
    }

    // Add any remaining nodes
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        if (!layers[0]) layers[0] = [];
        layers[0].push(node.id);
      }
    });

    // Calculate positions
    const layerKeys = Object.keys(layers).sort((a, b) => parseInt(a) - parseInt(b));
    const horizontalSpacing = 200;
    const verticalSpacing = 100;

    layerKeys.forEach((layerKey, layerIndex) => {
      const layerNodes = layers[layerKey];
      const layerWidth = layerNodes.length * horizontalSpacing;
      const startX = -layerWidth / 2 + horizontalSpacing / 2;

      layerNodes.forEach((nodeId, index) => {
        positions[nodeId] = {
          x: startX + index * horizontalSpacing,
          y: layerIndex * verticalSpacing,
        };
      });
    });

    setNodePositions(positions);
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply transformations
    ctx.save();
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;

    graphData.edges.forEach(edge => {
      const fromPos = nodePositions[edge.from];
      const toPos = nodePositions[edge.to];

      if (!fromPos || !toPos) return;

      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();

      // Draw arrow
      const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
      const arrowLength = 15;
      const arrowAngle = Math.PI / 6;

      ctx.beginPath();
      ctx.moveTo(toPos.x, toPos.y);
      ctx.lineTo(
        toPos.x - arrowLength * Math.cos(angle - arrowAngle),
        toPos.y - arrowLength * Math.sin(angle - arrowAngle)
      );
      ctx.moveTo(toPos.x, toPos.y);
      ctx.lineTo(
        toPos.x - arrowLength * Math.cos(angle + arrowAngle),
        toPos.y - arrowLength * Math.sin(angle + arrowAngle)
      );
      ctx.stroke();
    });

    // Draw nodes
    graphData.nodes.forEach(node => {
      const pos = nodePositions[node.id];
      if (!pos) return;

      const isSelected = selectedTask === node.id;
      const nodeRadius = 40;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = STATUS_COLORS[node.status] || '#9CA3AF';
      ctx.fill();

      // Draw selection ring
      if (isSelected) {
        ctx.strokeStyle = '#1E40AF';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Draw node border
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw task ID
      ctx.fillText(`#${node.id}`, pos.x, pos.y);

      // Draw task title below node
      ctx.fillStyle = '#1F2937';
      ctx.font = '12px sans-serif';
      const maxWidth = 100;
      const title = node.title.length > 15 ? node.title.substring(0, 15) + '...' : node.title;
      ctx.fillText(title, pos.x, pos.y + nodeRadius + 15, maxWidth);
    });

    ctx.restore();
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvas.width / 2 - pan.x) / zoom;
    const y = (e.clientY - rect.top - canvas.height / 2 - pan.y) / zoom;

    // Check if click is on a node
    for (const node of graphData.nodes) {
      const pos = nodePositions[node.id];
      if (!pos) continue;

      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (distance < 40) {
        onSelectTask(node.id);
        return;
      }
    }

    // Click on empty space - deselect
    onSelectTask(null);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No tasks to visualize</p>
          <p className="text-sm">Create tasks and add dependencies to see the graph</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Blocked</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            Zoom +
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.3, prev * 0.8))}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            Zoom -
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            Reset View
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="border-2 border-gray-300 rounded-lg cursor-move bg-white"
        style={{ width: '100%', height: '600px' }}
      />

      <div className="mt-2 text-xs text-gray-500 text-center">
        Click nodes to select • Drag to pan • Scroll to zoom
      </div>
    </div>
  );
};

export default DependencyGraph;
