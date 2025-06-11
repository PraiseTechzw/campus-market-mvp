import { useEffect, useState } from 'react';
declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady(): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize any required services here
    setIsReady(true);
  }, []);

  return isReady;
}
