/**
 * App — Root Component
 * =====================
 * Tab-based SPA layout:
 *   Sidebar (desktop) | Header | Main content area
 *
 * Tabs: Input → Score → Skills → Optimize → Bullet Tool
 */
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '@/src/store'
import Sidebar   from '@/components/layout/Sidebar'
import Header    from '@/components/layout/Header'
import InputPage      from '@/components/pages/InputPage'
import ScorePage      from '@/components/pages/ScorePage'
import SkillGapPage   from '@/components/pages/SkillGapPage'
import OptimizePage   from '@/components/pages/OptimizePage'
import BulletPage     from '@/components/pages/BulletPage'

const pages = {
  input:    InputPage,
  score:    ScorePage,
  skills:   SkillGapPage,
  optimize: OptimizePage,
  bullet:   BulletPage,
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
}

export default function App() {
  const { activeTab, sidebarOpen } = useStore()
  const ActivePage = pages[activeTab] || InputPage

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        <Header />

        {/* Page content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px 28px',
          position: 'relative',
        }}>
          {/* Scan line effect */}
          <ScanLine />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ maxWidth: 1080, margin: '0 auto' }}
            >
              <ActivePage />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function ScanLine() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden',
      opacity: 0.03,
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, var(--amber), transparent)',
        animation: 'scan 8s linear infinite',
      }} />
    </div>
  )
}
