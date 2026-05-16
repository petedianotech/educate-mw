
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  User, 
  Calendar, 
  ChevronRight, 
  ArrowLeft, 
  Tag, 
  Share2, 
  ChevronLeft,
  ChevronRightSquare,
  List,
  Facebook,
  Twitter,
  MessageCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { BLOG_POSTS, BlogPost } from '../data/blogPosts';
import SEO from './SEO';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BlogViewProps {
  onBack: () => void;
  onPostClick: (slug: string) => void;
  theme: 'light' | 'dark';
}

export function BlogView({ onBack, onPostClick, theme }: BlogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [dbPosts, setDbPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const postsPerPage = 5;

  useEffect(() => {
    // Fetch all materials of type blog and sort locally to avoid index composite requirement
    const q = query(
      collection(db, 'materials'), 
      where('type', '==', 'blog')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          category: data.category || 'General',
          author: data.author || 'Admin',
          date: data.date,
          readTime: data.readTime,
          image: data.image,
          tags: data.tags || [],
          createdAt: data.createdAt
        } as BlogPost & { createdAt: any };
      });
      // Sort locally by createdAt desc
      posts.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setDbPosts(posts);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching blog posts:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const allPosts = useMemo(() => {
    // Combined posts, dbPosts first then filtered BLOG_POSTS to avoid duplicates by slug
    const combined = [...dbPosts, ...BLOG_POSTS];
    const seen = new Set();
    return combined.filter(post => {
      if (!post.slug) return false;
      const duplicate = seen.has(post.slug);
      seen.add(post.slug);
      return !duplicate;
    });
  }, [dbPosts]);

  const categories = useMemo(() => {
    const cats = ['All'];
    allPosts.forEach(post => {
      if (!cats.includes(post.category)) cats.push(post.category);
    });
    return cats;
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    return allPosts.filter(post => {
      const matchesSearch = (post.title?.toLowerCase().includes((searchQuery || '').toLowerCase())) || 
                          (post.excerpt?.toLowerCase().includes((searchQuery || '').toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, allPosts]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const displayedPosts = filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`p-4 flex items-center sticky top-0 z-20 ${theme === 'dark' ? 'bg-gray-950/80' : 'bg-white/80'} backdrop-blur-xl border-b ${theme === 'dark' ? 'border-gray-800' : 'border-slate-200'}`}>
        <button onClick={onBack} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white hover:bg-gray-800' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'}`}>
          <ArrowLeft size={20} />
        </button>
        <div className="ml-4 flex flex-col">
          <h1 className="text-lg font-black tracking-tight uppercase">Educate MW Blog</h1>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Malawi Syllabus & Exam Tips</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`} size={20} />
          <input 
            type="text" 
            placeholder="Search for MSCE tips, news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-bold ${theme === 'dark' ? 'bg-gray-900 border-gray-800 focus:border-indigo-500' : 'bg-white border-slate-100 focus:border-indigo-500 shadow-sm'}`}
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? (theme === 'dark' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-indigo-600 border-indigo-500 text-white')
                  : (theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300')
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Post Grid */}
        <div className="space-y-4">
          {displayedPosts.length > 0 ? (
            displayedPosts.map((post, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={post.id}
                onClick={() => onPostClick(post.slug)}
                className={`group cursor-pointer rounded-3xl overflow-hidden border transition-all ${
                  theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:border-indigo-500/50' : 'bg-white border-slate-100 hover:border-indigo-500/50 shadow-sm'
                }`}
              >
                <div className="h-48 relative overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">{post.category}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    <div className="flex items-center gap-1"><Calendar size={12} /> {post.date}</div>
                    <div className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</div>
                  </div>
                  <h3 className="text-lg font-black leading-tight mb-2 group-hover:text-indigo-400 transition-colors">{post.title}</h3>
                  <p className={`text-sm font-medium line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>{post.excerpt}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20">
              <Search size={48} className="mx-auto mb-4 text-gray-500 opacity-20" />
              <p className="text-sm font-bold opacity-50 uppercase tracking-widest">No articles found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-6">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={`p-3 rounded-xl border transition-all disabled:opacity-30 ${theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-slate-200 hover:border-slate-300'}`}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-black uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className={`p-3 rounded-xl border transition-all disabled:opacity-30 ${theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-slate-200 hover:border-slate-300'}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface BlogPostViewProps {
  slug: string;
  onBack: () => void;
  onPostClick: (slug: string) => void;
  theme: 'light' | 'dark';
}

export function BlogPostView({ slug, onBack, onPostClick, theme }: BlogPostViewProps) {
  const [dbPosts, setDbPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all materials of type blog and find the one with the slug locally
    const q = query(collection(db, 'materials'), where('type', '==', 'blog'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          category: data.category || 'General',
          author: data.author || 'Admin',
          date: data.date,
          readTime: data.readTime,
          image: data.image,
          tags: data.tags || []
        } as BlogPost;
      });
      setDbPosts(posts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [slug]);

  const post = useMemo(() => {
    return dbPosts[0] || BLOG_POSTS.find(p => p.slug === slug);
  }, [dbPosts, slug]);

  const [showToc, setShowToc] = useState(false);

  if (loading && dbPosts.length === 0 && !BLOG_POSTS.find(p => p.slug === slug)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Loading Article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <h1 className="text-2xl font-black mb-4">Post Not Found</h1>
        <button onClick={onBack} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Back to Blog</button>
      </div>
    );
  }

  const relatedPosts = useMemo(() => {
    const combined = [...dbPosts, ...BLOG_POSTS];
    return combined.filter(p => p.slug !== post.slug && (p.category === post.category || p.tags?.some(t => post.tags?.includes(t)))).slice(0, 2);
  }, [post, dbPosts]);

  // Simple TOC generation from content headers
  const toc = post.content.match(/^#{1,3}\s+(.+)$/gm)?.map(m => {
    const level = (m.match(/#/g) || []).length;
    const text = m.replace(/^#+\s+/, '');
    return { level, text, id: text.toLowerCase().replace(/[^\w]+/g, '-') };
  }) || [];

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this article on Educate MW: ${post.title}`;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      default:
        if (navigator.share) {
          navigator.share({
            title: post.title,
            text: post.excerpt,
            url: url,
          }).catch(console.error);
        } else {
          navigator.clipboard.writeText(url);
          alert('Link copied to clipboard!');
        }
        return;
    }
    window.open(shareUrl, '_blank');
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} overflow-y-auto`}>
      <SEO 
        title={`${post.title} | Educate MW Blog`}
        description={post.excerpt}
        keywords={post.tags.join(', ')}
        canonical={`https://educatemw.app/blog/${post.slug}`}
        ogImage={post.image}
      />

      <div className={`p-4 flex items-center sticky top-0 z-30 ${theme === 'dark' ? 'bg-gray-950/80' : 'bg-white/80'} backdrop-blur-xl border-b ${theme === 'dark' ? 'border-gray-800' : 'border-slate-200'}`}>
        <button onClick={onBack} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white hover:bg-gray-800' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'}`}>
          <ArrowLeft size={20} />
        </button>
        <div className="ml-4 truncate max-w-[200px]">
          <h1 className="text-xs font-black uppercase tracking-widest truncate">{post.title}</h1>
        </div>
        <div className="ml-auto flex gap-2">
           <button onClick={() => handleShare('native')} className={`w-10 h-10 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
              <Share2 size={18} />
           </button>
           <button onClick={() => setShowToc(!showToc)} className={`w-10 h-10 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
              <List size={18} />
           </button>
        </div>
      </div>

      <div className="pb-24">
        {/* Cover Image */}
        <div className="h-64 relative overflow-hidden">
           <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
           <div className="absolute bottom-6 left-6 right-6">
              <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-3 inline-block">{post.category}</span>
              <h1 className="text-2xl font-black text-white leading-tight">{post.title}</h1>
           </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
           {/* Breadcrumbs */}
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-8 overflow-x-auto no-scrollbar">
              <span className="cursor-pointer" onClick={onBack}>Blog</span>
              <ChevronRight size={12} />
              <span className="opacity-50 line-clamp-1">{post.title}</span>
           </div>

           {/* Author & Meta */}
           <div className={`flex flex-col gap-6 mb-8 p-6 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 border-2 border-indigo-500/10">
                    <User size={24} />
                 </div>
                 <div>
                    <p className="text-sm font-black uppercase tracking-tight">{post.author}</p>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">
                       <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                       <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Share this article</p>
                 <div className="flex gap-3">
                    <button 
                      onClick={() => handleShare('whatsapp')}
                      className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform"
                    >
                       <MessageCircle size={18} fill="white" />
                    </button>
                    <button 
                      onClick={() => handleShare('facebook')}
                      className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 active:scale-90 transition-transform"
                    >
                       <Facebook size={18} fill="white" />
                    </button>
                    <button 
                      onClick={() => handleShare('twitter')}
                      className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                       <Twitter size={18} fill="white" />
                    </button>
                 </div>
              </div>
           </div>

           {/* Table of Contents Popup */}
           <AnimatePresence>
             {showToc && toc.length > 0 && (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className={`mb-8 p-6 rounded-3xl border-2 ${theme === 'dark' ? 'bg-gray-900 border-indigo-500/20' : 'bg-white border-indigo-100 shadow-xl shadow-indigo-600/5'}`}
               >
                 <h4 className="font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                    <List size={16} className="text-indigo-500" /> Table of Contents
                 </h4>
                 <div className="space-y-2">
                    {toc.map((item, i) => (
                      <div 
                        key={i} 
                        className={`text-sm font-bold cursor-pointer hover:text-indigo-400 transition-colors ${item.level === 3 ? 'ml-4 opacity-70' : ''}`}
                      >
                         • {item.text}
                      </div>
                    ))}
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Markdown Content */}
           <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : 'prose-slate'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
           </div>

           {/* Author Signature & Schema */}
           <div className="mt-12 pt-8 border-t border-gray-800">
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map(tag => (
                  <span key={tag} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-gray-900 text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-black uppercase tracking-widest text-xs mb-4">Related Articles</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {relatedPosts.map(rp => (
                      <div 
                        key={rp.id}
                        onClick={() => onPostClick(rp.slug)}
                        className={`p-4 rounded-2xl border flex gap-4 cursor-pointer hover:border-indigo-500/50 transition-all ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-100 shadow-sm'}`}
                      >
                        <img src={rp.image} alt={rp.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        <div>
                          <h5 className="text-sm font-black leading-tight line-clamp-1">{rp.title}</h5>
                          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{rp.category}</p>
                        </div>
                        <ChevronRight className="ml-auto self-center text-gray-500" size={16} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
      
      {/* Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "image": [post.image],
          "datePublished": post.date,
          "author": [{
            "@type": "Organization",
            "name": post.author,
            "url": "https://educatemw.app"
          }],
          "description": post.excerpt
        })}
      </script>
    </div>
  );
}
