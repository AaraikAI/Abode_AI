/**
 * Accessibility Checker Component
 *
 * Development tool for running accessibility audits in real-time
 * Provides visual feedback on WCAG violations
 */

'use client'

import { useEffect, useState } from 'react'
import { accessibility, AccessibilityAuditResult } from '@/lib/services/accessibility'

interface AccessibilityCheckerProps {
  enabled?: boolean
  showPanel?: boolean
  checkInterval?: number
}

export function AccessibilityChecker({
  enabled = process.env.NODE_ENV === 'development',
  showPanel = true,
  checkInterval = 5000
}: AccessibilityCheckerProps) {
  const [auditResult, setAuditResult] = useState<AccessibilityAuditResult | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const runAudit = async () => {
      const result = await accessibility.auditAccessibility()
      setAuditResult(result)

      // Log to console in development
      if (result.violations.length > 0) {
        console.group('🚨 Accessibility Violations')
        result.violations.forEach(violation => {
          console.error(`[${violation.impact}] ${violation.description}`)
          console.log('Help:', violation.help)
          console.log('Nodes:', violation.nodes)
        })
        console.groupEnd()
      }

      if (result.warnings.length > 0) {
        console.group('⚠️ Accessibility Warnings')
        result.warnings.forEach(warning => {
          console.warn(warning.description)
          console.log('Help:', warning.help)
        })
        console.groupEnd()
      }
    }

    runAudit()
    const interval = setInterval(runAudit, checkInterval)

    return () => clearInterval(interval)
  }, [enabled, checkInterval])

  if (!enabled || !showPanel || !auditResult) return null

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'
    if (score >= 70) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#1f2937',
        color: '#ffffff',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 9998,
        minWidth: '280px',
        maxWidth: isExpanded ? '500px' : '280px',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isExpanded ? '12px' : 0,
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>♿</span>
          <strong>Accessibility</strong>
        </div>
        <div
          style={{
            backgroundColor: getScoreColor(auditResult.score),
            color: '#ffffff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {auditResult.score}
        </div>
      </div>

      {isExpanded && (
        <div style={{ fontSize: '14px' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>✅ Passes:</span>
              <strong style={{ color: '#10b981' }}>{auditResult.passes}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>❌ Violations:</span>
              <strong style={{ color: '#ef4444' }}>{auditResult.violations.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>⚠️ Warnings:</span>
              <strong style={{ color: '#f59e0b' }}>{auditResult.warnings.length}</strong>
            </div>
          </div>

          {auditResult.violations.length > 0 && (
            <div style={{ marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                Top Violations:
              </div>
              {auditResult.violations.slice(0, 5).map((violation, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#374151',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#ef4444', marginBottom: '4px' }}>
                    {violation.impact.toUpperCase()}
                  </div>
                  <div style={{ marginBottom: '4px' }}>{violation.description}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {violation.nodes.length} node{violation.nodes.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: '12px',
              fontSize: '11px',
              color: '#9ca3af',
              textAlign: 'center'
            }}
          >
            Check console for details
          </div>
        </div>
      )}
    </div>
  )
}
