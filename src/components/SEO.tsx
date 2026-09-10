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
  title = "Educate MW - Educate Malawi: Secondary School Study Platform, Notes & AI Tutor",
  description = "Malawi's digital learning platform for Form 1 - Form 4 students. Free MSCE study notes, MANEB past papers, MSCE points calculator, interactive quizzes, and 24/7 Emi AI tutor.",
  keywords = "Educate MW, Educate Malawi, MSCE notes, MSCE Points Calculator, MANEB past papers, Biology Form 3 notes Malawi, Form 1 notes, Form 2 notes, Form 4 notes, Mathematics Malawi MSCE, Physics, Chemistry, Emi AI tutor, UNIMA cutoff points, MUST cutoff points, MUBAS points calculator, KUHeS admission",
  canonical = "https://educatemw.app",
  ogType = "website",
  ogImage = "https://educatemw.app/og-image.png",
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

    updateOgTag('og:site_name', 'Educate MW');
    updateOgTag('og:title', title);
    updateOgTag('og:description', description);
    updateOgTag('og:type', ogType);
    updateOgTag('og:url', canonical);
    updateOgTag('og:image', ogImage);
    updateOgTag('og:locale', 'en_MW');

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
      "@type": "WebApplication",
      "name": "Educate MW",
      "operatingSystem": "Web, Android, iOS",
      "applicationCategory": "EducationApplication",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "1450"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "MWK"
      },
      "description": description,
      "publisher": {
        "@type": "Organization",
        "name": "Educate MW",
        "url": "https://educatemw.app",
        "logo": "https://educatemw.app/app-icon.png"
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
