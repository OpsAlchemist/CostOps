'use client'
import { useState } from 'react'

interface CostFormProps {
  onEstimateComplete?: (data: any) => void
}

export default function CostForm({ onEstimateComplete }: CostFormProps) {
  const [cpu, setCpu] = useState(2)
  const [ram, setRam] = useState(4)
  const [storage, setStorage] = useState(50)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch("http://localhost:8000/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpu, ram, storage })
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      
      const data = await res.json()
      setResult(data)
      onEstimateComplete?.(data) // Pass data to parent if callback exists
    } catch (err) {
      console.error(err)
      setError('Failed to get estimate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label>CPU:</label>
          <input
            type="number"
            min="1"
            value={cpu}
            onChange={(e) => setCpu(Number(e.target.value))}
            style={{ width: '100px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label>RAM (GB):</label>
          <input
            type="number"
            min="1"
            value={ram}
            onChange={(e) => setRam(Number(e.target.value))}
            style={{ width: '100px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label>Storage (GB):</label>
          <input
            type="number"
            min="1"
            value={storage}
            onChange={(e) => setStorage(Number(e.target.value))}
            style={{ width: '100px' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? "Calculating..." : "Estimate Cost"}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 20, padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <h3>💰 Estimated Costs</h3>
          <ul>
            <li><strong>AWS:</strong> ${result.costs.aws}</li>
            <li><strong>Azure:</strong> ${result.costs.azure}</li>
            <li><strong>GCP:</strong> ${result.costs.gcp}</li>
          </ul>
          
          <h3>🧠 AI Recommendation</h3>
          <p>{result.recommendation}</p>
        </div>
      )}
    </div>
  )
}