/**
 * Web Vitals Monitoring Utility
 * 
 * This is an OPTIONAL utility to monitor Core Web Vitals in production.
 * 
 * To enable:
 * 1. npm install web-vitals
 * 2. Import in src/main.tsx:
 *    import './utils/webVitals';
 * 
 * Benefits:
 * - Track real user performance metrics
 * - Identify performance regressions
 * - Measure impact of optimizations
 * - Send data to analytics platform
 */

// NOTE: This file is for reference only.
// Install web-vitals package to use:
// npm install web-vitals

/*
import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

// Send metrics to your analytics service
function sendToAnalytics(metric: Metric) {
  // Replace with your analytics endpoint
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // Example: Send to Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Example: Send to custom endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', body);
  } else {
    fetch('/api/analytics', {
      body,
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }
}

// Initialize web vitals tracking
export function initWebVitals() {
  // Cumulative Layout Shift - measures visual stability
  getCLS(sendToAnalytics);

  // First Input Delay - measures interactivity
  getFID(sendToAnalytics);

  // First Contentful Paint - measures loading performance
  getFCP(sendToAnalytics);

  // Largest Contentful Paint - measures loading performance
  getLCP(sendToAnalytics);

  // Time to First Byte - measures server response time
  getTTFB(sendToAnalytics);
}

// Auto-initialize in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  initWebVitals();
}
*/

/**
 * Metric Thresholds (Good / Needs Improvement / Poor)
 * 
 * LCP (Largest Contentful Paint):
 * - Good: < 2.5s
 * - Needs Improvement: 2.5s - 4.0s
 * - Poor: > 4.0s
 * 
 * FID (First Input Delay):
 * - Good: < 100ms
 * - Needs Improvement: 100ms - 300ms
 * - Poor: > 300ms
 * 
 * CLS (Cumulative Layout Shift):
 * - Good: < 0.1
 * - Needs Improvement: 0.1 - 0.25
 * - Poor: > 0.25
 * 
 * FCP (First Contentful Paint):
 * - Good: < 1.8s
 * - Needs Improvement: 1.8s - 3.0s
 * - Poor: > 3.0s
 * 
 * TTFB (Time to First Byte):
 * - Good: < 800ms
 * - Needs Improvement: 800ms - 1800ms
 * - Poor: > 1800ms
 */

export {};
