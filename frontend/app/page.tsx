
'use client'
import { useState } from 'react'
import CostForm from './components/CostForm.tsx'  
import { ApiResponse } from './types.tsx'


export default function Home() {
  const [result, setResult] = useState<ApiResponse | null>(null)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const form = e.target

    const res = await fetch("http://localhost:8000/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    <div style={{ padding: 20 }}>
      <h1>CostOps AI 🚀</h1>
      <CostForm />
      
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