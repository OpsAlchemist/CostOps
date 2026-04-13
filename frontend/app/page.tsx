'use client'
import { useState } from 'react'

export default function Home() {
  const [result, setResult] = useState(null)

  const handleSubmit = async (e:any) => {
    e.preventDefault()
    const form = e.target

    const res = await fetch("http://localhost:8000/estimate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        cpu: Number(form.cpu.value),
        ram: Number(form.ram.value),
        storage: Number(form.storage.value)
      })
    })

    const data = await res.json()
    setResult(data)
  }

  return (
    <div style={{padding: 20}}>
      <h1>Multi-Cloud Cost Estimator</h1>
      <form onSubmit={handleSubmit}>
        <input name="cpu" placeholder="CPU" required /><br/>
        <input name="ram" placeholder="RAM (GB)" required /><br/>
        <input name="storage" placeholder="Storage (GB)" required /><br/>
        <button type="submit">Estimate</button>
      </form>

      {result && (
        <div>
          <h3>Costs:</h3>
          <pre>{JSON.stringify(result.costs, null, 2)}</pre>
          <h3>AI Recommendation:</h3>
          <p>{result.recommendation}</p>
        </div>
      )}
    </div>
  )
}


import CostForm from './components/CostForm'
export default function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>CostOps AI 🚀</h1>
      <CostForm />
    </div>
  )
}