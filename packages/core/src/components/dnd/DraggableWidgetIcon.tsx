import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';

interface DraggableWidgetIconProps {
  type: string;
  data?: any; // Extra data like default color
  children: ReactNode;
}

export const DraggableWidgetIcon = ({ type, data, children }: DraggableWidgetIconProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `draggable-tool-${type}`,
    data: { type, ...data },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
    touchAction: 'none', // Required for dnd-kit pointer events
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="h-100">
      {children}
    </div>
  );
};
