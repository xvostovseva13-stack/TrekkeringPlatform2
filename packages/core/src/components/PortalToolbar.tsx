import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalToolbarProps {
  children: ReactNode;
}

const PortalToolbar = ({ children }: PortalToolbarProps) => {
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setContainer(document.getElementById('app-toolbar'));
    return () => setMounted(false);
  }, []);

  if (!mounted || !container) return null;

  return createPortal(children, container);
};

export default PortalToolbar;
