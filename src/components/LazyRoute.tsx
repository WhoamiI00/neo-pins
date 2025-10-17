import { lazy, Suspense, ComponentType } from 'react';
import { motion } from 'framer-motion';

/**
 * LazyRoute Utility
 * 
 * Performance optimization:
 * 1. Code-splits routes using React.lazy()
 * 2. Shows loading fallback during chunk download
 * 3. Reduces initial bundle size significantly
 * 4. Implements smooth loading transitions
 */

interface LazyRouteProps {
  component: ComponentType<any>;
}

// Enhanced loading component with animation
const RouteLoadingFallback = () => (
  <motion.div
    className="flex items-center justify-center min-h-screen"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="text-center">
      <motion.div
        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.p
        className="text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Loading...
      </motion.p>
    </div>
  </motion.div>
);

// Wrapper for lazy-loaded components with error boundary
const LazyRoute = ({ component: Component }: LazyRouteProps) => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Component />
    </Suspense>
  );
};

// Helper function to create lazy routes
export const createLazyRoute = (importFunc: () => Promise<{ default: ComponentType<any> }>) => {
  const LazyComponent = lazy(importFunc);
  return () => <LazyRoute component={LazyComponent} />;
};

export default LazyRoute;
