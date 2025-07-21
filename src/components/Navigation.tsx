'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Activity, Settings, Monitor } from 'lucide-react'

interface NavigationProps {
  className?: string
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Main',
      path: '/',
      icon: Home,
      description: 'WebXR Spatial Interface'
    },
    {
      name: 'Demo',
      path: '/demo',
      icon: Activity,
      description: 'Component Testing Environment'
    }
  ]

  return (
    <div className={`fixed top-4 left-4 z-50 ${className}`}>
      <div className="bg-black/90 backdrop-blur-sm border border-cyan-500/50 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            
            return (
              <motion.button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`p-3 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                  isActive
                    ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-600/50 hover:border-cyan-500/30'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={item.description}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.name}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Navigation 