/**
 * TrendingTopics Component
 * 
 * Displays curated list of trending and in-demand topics/technologies.
 * Features horizontal scrolling cards with quick access to learning paths.
 * 
 * Props:
 * - limit: Number of topics to show (default: all)
 * - onTopicClick: Callback when a topic is clicked
 * 
 * Usage:
 * <TrendingTopics limit={6} />
 */

import { motion } from 'framer-motion';
import { TrendingUp, Star, Flame, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TRENDING_TOPICS = [
    {
        id: 'generative-ai',
        name: 'Generative AI & ChatGPT',
        category: 'AI/ML',
        trending: true,
        icon: '🤖',
        description: 'Build AI-powered applications with GPT models'
    },
    {
        id: 'nextjs-14',
        name: 'Next.js 14 & Server Components',
        category: 'Frontend',
        trending: true,
        icon: '⚡',
        description: 'Modern React framework with server components'
    },
    {
        id: 'docker-kubernetes',
        name: 'Docker & Kubernetes',
        category: 'DevOps',
        inDemand: true,
        icon: '🐳',
        description: 'Container orchestration and deployment'
    },
    {
        id: 'system-design',
        name: 'System Design',
        category: 'Backend',
        inDemand: true,
        icon: '🏗️',
        description: 'Design scalable distributed systems'
    },
    {
        id: 'cloud-architecture',
        name: 'Cloud Architecture (AWS/Azure)',
        category: 'Cloud',
        trending: true,
        icon: '☁️',
        description: 'Cloud infrastructure and services'
    },
    {
        id: 'graphql',
        name: 'GraphQL APIs',
        category: 'Backend',
        inDemand: true,
        icon: '🔗',
        description: 'Modern API query language'
    },
    {
        id: 'microservices',
        name: 'Microservices Architecture',
        category: 'Backend',
        inDemand: true,
        icon: '🔧',
        description: 'Build scalable service-oriented systems'
    },
    {
        id: 'web3-blockchain',
        name: 'Web3 & Blockchain',
        category: 'Emerging',
        trending: true,
        icon: '⛓️',
        description: 'Decentralized applications and smart contracts'
    },
    {
        id: 'cybersecurity',
        name: 'Cybersecurity Fundamentals',
        category: 'Security',
        inDemand: true,
        icon: '🔒',
        description: 'Secure your applications and infrastructure'
    },
    {
        id: 'data-engineering',
        name: 'Data Engineering',
        category: 'Data',
        trending: true,
        icon: '📊',
        description: 'Build data pipelines and warehouses'
    },
];

export default function TrendingTopics({ limit, onTopicClick }) {
    const navigate = useNavigate();
    const topics = limit ? TRENDING_TOPICS.slice(0, limit) : TRENDING_TOPICS;

    const handleTopicClick = (topic) => {
        if (onTopicClick) {
            onTopicClick(topic);
        } else {
            // Navigate to search page with the topic name
            navigate(`/search?query=${encodeURIComponent(topic.name)}`);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Flame className="w-6 h-6 text-orange-500" />
                    Trending & In-Demand Topics
                </h2>
            </div>

            {/* Horizontal scrollable container */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                {topics.map((topic, index) => (
                    <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex-shrink-0 w-72 snap-start"
                    >
                        <div
                            onClick={() => handleTopicClick(topic)}
                            className="card-gradient hover:scale-105 transition-transform cursor-pointer h-full relative overflow-hidden group"
                        >
                            {/* Badge */}
                            <div className="absolute top-3 right-3 z-10">
                                {topic.trending && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-medium shadow-lg">
                                        <TrendingUp className="w-3 h-3" />
                                        Trending
                                    </div>
                                )}
                                {topic.inDemand && !topic.trending && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-indigo-500 text-white rounded-full text-xs font-medium shadow-lg">
                                        <Star className="w-3 h-3" />
                                        In Demand
                                    </div>
                                )}
                            </div>

                            {/* Icon */}
                            <div className="text-5xl mb-3">{topic.icon}</div>

                            {/* Content */}
                            <h3 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {topic.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">{topic.description}</p>

                            {/* Category */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                    {topic.category}
                                </span>
                                <ArrowRight className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
}
