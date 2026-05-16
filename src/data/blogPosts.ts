
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  tags: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'how-to-prepare-for-msce-exams',
    title: 'Top 10 Tips to Prepare for MSCE Exams in Malawi',
    excerpt: 'MSCE exams are the most critical stage in a Malawian student\'s life. Learn how to manage your time and master the syllabus effectively.',
    content: `
# Top 10 Tips to Prepare for MSCE Exams in Malawi

The Malawi School Certificate of Education (MSCE) exams are a significant milestone. Higher education and career paths often depend on these results. Here’s how you can prepare efficiently.

## 1. Understand the Syllabus
The Malawi syllabus is comprehensive. Make sure you have the official MANEB syllabus for every subject you're sitting for.

## 2. Create a Study Timetable
Don't just study randomly. Allocate specific hours to subjects you find challenging, like Mathematics or Physical Science.

## 3. Use Past Papers
Practicing with past MANEB papers helps you understand the questioning style and time management.

## 4. Seek Help from AI Tutors
Tools like **Emi AI** are designed specifically for the Malawi curriculum. If you don't understand a concept in Biology, just ask!

## 5. Join Study Groups
Discussion with peers helps reinforce knowledge. Explaining a concept to someone else is the best way to master it yourself.

## 6. Healthy Diet and Sleep
Your brain needs fuel and rest. Avoid over-studying at night; aim for at least 7 hours of sleep.

## 7. Focus on Practical Subjects
For subjects like Chemistry or Agriculture, make sure you understand the practical procedures as they carry significant weight.

## 8. Note Taking
Summarize your long MSCE notes into short, readable bullet points that are easy to revise during the final weeks.

## 9. Stay Positive
Exam stress is real. Take short breaks and engage in light exercise to keep your mind fresh.

## 10. Reliable Resources
Use the **Educate MW Library** for verified notes that follow the latest curriculum updates.

Good luck with your MSCE preparations!
    `,
    category: 'Study Tips',
    author: 'Educate MW Team',
    date: 'May 16, 2026',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60',
    tags: ['MSCE', 'Exams', 'Malawi', 'Study Guide']
  },
  {
    id: '2',
    slug: 'importance-of-science-in-malawi-curriculum',
    title: 'The Vital Role of Physical Science in the Malawi Curriculum',
    excerpt: 'Physical Science is often feared by students, but it is the backbone of Malawi\'s development goals. Discover why it matters.',
    content: `
# The Vital Role of Physical Science in the Malawi Curriculum

Physical Science, comprising Physics and Chemistry, is a core subject in the Malawi School Certificate of Education. While many students find it difficult, it is essential for the future of our nation.

## Why Science Matters in Malawi
Malawi's development goals rely heavily on technology, engineering, and healthcare. All these fields require a solid foundation in Physical Science.

### 1. Career Opportunities
From becoming a doctor at Queens or Kamuzu Central Hospital to being an engineer at ESCOM, science is the gatekeeper.

### 2. Analytical Thinking
Science teaches you how to solve problems logically. This skill is useful in any profession, including law or business.

### 3. Understanding the World
Chemistry explains the world at a molecular level—essential for Agriculture and Food Science, which are pillars of our economy.

## Tips for Mastering physical Science
*   **Don't skip labs:** Practical experience is key.
*   **Master the Formulas:** Physics is all about relationships between variables.
*   **Ask Emi:** Our AI tutor can break down the Periodic Table or Newton's Laws in simple English for you.

Join the conversation on our community forums and share your science tips!
    `,
    category: 'Syllabus',
    author: 'Emi AI Expert',
    date: 'May 10, 2026',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=60',
    tags: ['Science', 'MSCE', 'Chemistry', 'Physics']
  }
];
