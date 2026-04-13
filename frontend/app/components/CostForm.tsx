'use client'
import { useState } from 'react'
export default function CostForm() {
  const [cpu, setCpu] = useState(2)
  const [ram, setRam] = useState(4)
  const [storage, setStorage] = useState(50)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8000/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ cpu, ram, storage })
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }
  return (
    <div style={{ marginTop: 20 }}>
      <form onSubmit={handleSubmit}>
        <div>
          <label>CPU:</label>
          <input type="number" value={cpu} onChange={e => setCpu(Number(e.target.value))} />
        </div>
        <div>
          <label>RAM (GB):</label>
          <input type="number" value={ram} onChange={e => setRam(Number(e.target.value))} />
        </div>
        <div>
          <label>Storage (GB):</label>
          <input type="number" value={storage} onChange={e => setStorage(Number(e.target.value))} />
        </div>
        <button type="submit">
          {loading ? "Calculating..." : "Estimate Cost"}
        </button>
      </form>
      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>💰 Costs</h3>
          <ul>
            <li>AWS: ${result.costs.aws}</li>
            <li>Azure: ${result.costs.azure}</li>
            <li>GCP: ${result.costs.gcp}</li>
          </ul>
          <h3>🧠 AI Recommendation</h3>
          <p>{result.recommendation}</p>
        </div>
      )}
    </div>
  )
}