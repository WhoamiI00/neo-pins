import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEO Component
 * 
 * Dynamically updates page meta tags for better SEO
 * Handles:
 * - Page titles
 * - Meta descriptions
 * - Open Graph tags
 * - Twitter cards
 * - Canonical URLs
 */

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
}

const SEO = ({
  title = 'PinBoard - Save Ideas You Love',
  description = 'Collect your favorite ideas and organize them beautifully. Create boards, share pins, and discover inspiring content from our community.',
  image = '/lovable-uploads/dd15324d-eb74-4e88-9e81-b3dac66be0a1.png',
  url,
  type = 'website',
  noindex = false,
}: SEOProps) => {
  const location = useLocation();
  const baseUrl = 'https://neo-pins.vercel.app';
  const fullUrl = url || `${baseUrl}${location.pathname}${location.search}`;
  const fullImage = image.startsWith('http') ? image : `${baseUrl}${image}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to update or create meta tags
    const updateMetaTag = (selector: string, content: string, attribute: string = 'content') => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (selector.includes('property=')) {
          element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        } else if (selector.includes('name=')) {
          element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, content);
    };

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // Update meta description
    updateMetaTag('meta[name="description"]', description);

    // Update robots meta
    updateMetaTag('meta[name="robots"]', noindex ? 'noindex, nofollow' : 'index, follow');

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', title);
    updateMetaTag('meta[property="og:description"]', description);
    updateMetaTag('meta[property="og:image"]', fullImage);
    updateMetaTag('meta[property="og:url"]', fullUrl);
    updateMetaTag('meta[property="og:type"]', type);

    // Update Twitter Card tags
    updateMetaTag('meta[name="twitter:title"]', title);
    updateMetaTag('meta[name="twitter:description"]', description);
    updateMetaTag('meta[name="twitter:image"]', fullImage);
    updateMetaTag('meta[name="twitter:url"]', fullUrl);

  }, [title, description, fullImage, fullUrl, type, noindex]);

  return null; // This component doesn't render anything
};

export default SEO;
