import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = "Educate MW - MSCE Preparation & AI Tutor Malawi",
  description = "The ultimate learning app for Malawi! Get free MSCE notes, practice quizzes, and 24/7 help from Emi AI Tutor. Join thousands of Malawian students today.",
  keywords = "Malawi learning app, MSCE preparation, Free MSCE notes, Malawi secondary schools, AI tutor Malawi, Educational app Malawi, Educate MW, Emi AI",
  canonical = "https://educatemw.app",
  ogType = "website",
  ogImage = "https://educatemw.app/og-image.png", // Ensure this exists in public/
}) => {
  useEffect(() => {
    // Update Title
    document.title = title;

    // Update Meta Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Update Meta Keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    } else {
      const meta = document.createElement('meta');
      meta.name = "keywords";
      meta.content = keywords;
      document.head.appendChild(meta);
    }

    // Update Canonical Link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (linkCanonical) {
      linkCanonical.setAttribute('href', canonical);
    } else {
      linkCanonical = document.createElement('link');
      (linkCanonical as HTMLLinkElement).rel = "canonical";
      (linkCanonical as HTMLLinkElement).href = canonical;
      document.head.appendChild(linkCanonical);
    }

    // OG Tags
    const updateOgTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };

    updateOgTag('og:title', title);
    updateOgTag('og:description', description);
    updateOgTag('og:type', ogType);
    updateOgTag('og:url', canonical);
    updateOgTag('og:image', ogImage);

    // Twitter Tags
    const updateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };

    updateTwitterTag('twitter:card', 'summary_large_image');
    updateTwitterTag('twitter:title', title);
    updateTwitterTag('twitter:description', description);
    updateTwitterTag('twitter:image', ogImage);

    // Structured Data (JSON-LD)
    const structuredDataId = 'seo-structured-data';
    let script = document.getElementById(structuredDataId) as HTMLScriptElement;
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Educate MW",
      "operatingSystem": "Web, Android, iOS",
      "applicationCategory": "EducationApplication",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "1200"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "MWK"
      },
      "description": description,
      "publisher": {
        "@type": "Organization",
        "name": "Educate MW Malawi",
        "logo": "https://educatemw.app/logo.png"
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = structuredDataId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(structuredData);

  }, [title, description, keywords, canonical, ogType, ogImage]);

  return null;
};

export default SEO;
