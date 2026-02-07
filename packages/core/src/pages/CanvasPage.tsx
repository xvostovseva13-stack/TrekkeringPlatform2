import { useCallback, useEffect, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NoteNode from '../components/canvas/NoteNode';
import CanvasToolbar, { CanvasTool } from '../components/canvas/CanvasToolbar';

// Define custom node types
const nodeTypes = {
  note: NoteNode,
};

const CanvasPage = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [activeTool, setActiveTool] = useState<CanvasTool>('cursor');

  const handleDeleteNode = useCallback(async (id: string) => {
    const electron = window.electron;
    if (electron && electron.db) {
      try {
        await electron.db.deleteWidget({ id });
        setNodes((nds) => nds.filter((node) => node.id !== id));
      } catch (error) {
        console.error("Failed to delete widget:", error);
      }
    }
  }, [setNodes]);

  // Load widgets from DB
  useEffect(() => {
    const loadWidgets = async () => {
      const electron = window.electron;
      if (electron && electron.db) {
        try {
          const widgets = await electron.db.getWidgets();
          
          const flowNodes: Node[] = widgets.map((w: any) => {
            const position = JSON.parse(w.position);
            const settings = JSON.parse(w.settings || '{}');
            
            return {
              id: w.id,
              type: w.type, // 'note' maps to NoteNode
              position: position,
              data: { 
                label: w.data?.title || settings.title || 'Untitled Note',
                content: w.data?.content || '',
                dataSourceId: w.dataSourceId,
                color: w.data?.color || '#fff9c4',
                onDelete: handleDeleteNode
              },
            };
          });

          setNodes(flowNodes);
        } catch (e) {
          console.error("Failed to load widgets", e);
        }
      }
    };
    loadWidgets();
  }, [setNodes, handleDeleteNode]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Bring to front on drag start
  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setNodes((ns) => {
        // Find the full node object from state (the passed 'node' might be partial)
        const targetNode = ns.find(n => n.id === node.id);
        if (!targetNode) return ns;
        
        // Move to end of array to render on top
        const others = ns.filter((n) => n.id !== node.id);
        return [...others, targetNode];
      });
    },
    [setNodes]
  );

  // Save position on drag end
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const electron = window.electron;
      if (electron && electron.db) {
        electron.db.updateWidgetPosition(node.id, node.position);
      }
    },
    []
  );

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 80px)' }} className="bg-light rounded-3 shadow-sm border overflow-hidden position-relative">
      
      {/* Tool Menu */}
      <CanvasToolbar activeTool={activeTool} onToolChange={setActiveTool} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        
        // Grid Snapping
        snapToGrid={true}
        snapGrid={[10, 10]}

        // UX / Tools
        // Hand Mode: Left (1) or Middle (2) to Pan. Selection disabled.
        // Cursor Mode: Only Middle (2) to Pan. Left draws selection box.
        panOnDrag={activeTool === 'hand' ? [1, 2] : [2]}
        selectionOnDrag={activeTool === 'cursor'}
        panOnScroll={true}
        zoomOnScroll={true}
      >
        <Background 
          bgColor="#eef2ff" 
          color="#000000" 
          variant={BackgroundVariant.Dots} 
          gap={20}
          size={1}
        />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default CanvasPage;
