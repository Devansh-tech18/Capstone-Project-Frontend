import { useState } from 'react'
import api from './services/api'
import { Sprout, Leaf, CloudRain, Activity, FlaskConical, History, Upload, Menu } from 'lucide-react'

const initial = { nitrogen: 80, phosphorus: 40, potassium: 40, temperature: 25, humidity: 70, ph: 6.5, rainfall: 100 }
function App() {
  const [active, setActive] = useState('overview')
  const [soil, setSoil] = useState(initial)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [yieldInput, setYieldInput] = useState({ crop: 'Wheat', area_hectares: 1, rainfall: 100, temperature: 25 })
  const [fert, setFert] = useState({ nitrogen: 40, phosphorus: 20, potassium: 30, crop: 'Wheat' })
  const [history, setHistory] = useState([])
  const [file, setFile] = useState(null)

  const run = async (path, body) => {
    setLoading(true); setError(''); setResult(null)
    try { const response = await api.post(path, body); setResult(response.data) }
    catch (e) { setError(e.response?.data?.message || e.response?.data?.detail || 'Could not connect. Check that Spring Boot and the Python ML service are running.') }
    finally { setLoading(false) }
  }
  const loadHistory = async () => {
    try { const r = await api.get('/history'); setHistory(r.data) }
    catch { setError('Could not load history. Check backend and MongoDB.') }
  }
  const disease = async (e) => {
    e.preventDefault()
    if (!file) return setError('Please select a leaf image first.')
    const data = new FormData(); data.append('file', file)
    setLoading(true); setError(''); setResult(null)
    try { const r = await api.post('/disease-detection', data); setResult(r.data) }
    catch (e) { setError(e.response?.data?.message || e.response?.data?.detail || 'Image analysis failed.') }
    finally { setLoading(false) }
  }
  const update = (setter, key, value) => setter(old => ({ ...old, [key]: value }))
  const nav = [
    ['overview','Overview',Sprout], ['crop','Crop recommendation',Leaf], ['yield','Yield prediction',Activity],
    ['disease','Disease detection',CloudRain], ['fertilizer','Fertilizer guidance',FlaskConical], ['history','History',History]
  ]
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon"><Sprout/></span><div><b>AgriSmart AI</b><small>Intelligent Farming</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      {nav.map(([id,label,Icon]) => <button key={id} className={`nav-item ${active===id?'selected':''}`} onClick={()=>{setActive(id);setResult(null);setError('');if(id==='history')loadHistory()}}><Icon size={18}/>{label}</button>)}
      <div className="sidebar-note"><Leaf size={18}/><b>Grow smarter.</b><span>Data-driven insights for better farming decisions.</span></div>
    </aside>
    <main className="main">
      <header><div><span className="eyebrow">SMART AGRICULTURE PLATFORM</span><h1>{nav.find(n=>n[0]===active)?.[1]}</h1></div><div className="status"><span/> AI services workspace</div></header>
      {active==='overview' && <><section className="hero"><div><span className="hero-tag">AI-POWERED FARMING</span><h2>Make every farming decision<br/>a smarter one.</h2><p>Analyze soil, estimate crop yield and explore crop health insights from one simple workspace.</p><button className="primary" onClick={()=>setActive('crop')}>Get crop recommendation <span>→</span></button></div><div className="hero-art"><div className="sun"/><div className="hill hill1"/><div className="hill hill2"/><Sprout size={105}/></div></section>
      <div className="section-heading"><div><h2>Explore your tools</h2><p>Choose an analysis to get started.</p></div></div>
      <div className="tool-grid">{nav.slice(1,5).map(([id,label,Icon],i)=><button className="tool-card" key={id} onClick={()=>setActive(id)}><span className={`tool-icon tone${i}`}><Icon/></span><b>{label}</b><small>{['Find crops suited to your soil and climate.','Estimate production from crop and weather inputs.','Upload a leaf image for the disease demo.','Review general NPK-based nutrient guidance.'][i]}</small><span className="card-arrow">Explore →</span></button>)}</div></>}
      {active==='crop' && <section className="panel"><h2>Crop recommendation</h2><p className="muted">Enter soil and environmental values to get a starter recommendation.</p><div className="form-grid">{Object.entries(soil).map(([key,val])=><label key={key}>{key[0].toUpperCase()+key.slice(1)}{key==='ph'?' (pH)':key==='rainfall'?' (mm)':''}<input type="number" step="any" value={val} onChange={e=>update(setSoil,key,e.target.value===''?'':Number(e.target.value))}/></label>)}</div><button className="primary" disabled={loading} onClick={()=>run('/crop-recommendation',soil)}>{loading?'Analyzing...':'Recommend crop'}</button></section>}
      {active==='yield' && <section className="panel"><h2>Crop yield prediction</h2><p className="muted">Enter crop and basic weather information.</p><div className="form-grid"><label>Crop<select value={yieldInput.crop} onChange={e=>update(setYieldInput,'crop',e.target.value)}>{['Wheat','Rice','Maize','Cotton','Millet'].map(x=><option>{x}</option>)}</select></label>{['area_hectares','rainfall','temperature'].map(k=><label key={k}>{k.replace('_',' ')}<input type="number" value={yieldInput[k]} onChange={e=>update(setYieldInput,k,Number(e.target.value))}/></label>)}</div><button className="primary" disabled={loading} onClick={()=>run('/yield-prediction',yieldInput)}>{loading?'Calculating...':'Predict yield'}</button></section>}
      {active==='fertilizer' && <section className="panel"><h2>Fertilizer and soil guidance</h2><p className="muted">Enter NPK values from a soil test for general educational suggestions.</p><div className="form-grid"><label>Crop<select value={fert.crop} onChange={e=>update(setFert,'crop',e.target.value)}>{['Wheat','Rice','Maize','Cotton','General'].map(x=><option>{x}</option>)}</select></label>{['nitrogen','phosphorus','potassium'].map(k=><label key={k}>{k}<input type="number" value={fert[k]} onChange={e=>update(setFert,k,Number(e.target.value))}/></label>)}</div><button className="primary" disabled={loading} onClick={()=>run('/fertilizer',fert)}>{loading?'Checking...':'Get guidance'}</button></section>}
      {active==='disease' && <section className="panel"><h2>Plant disease detection</h2><p className="muted">Upload a JPG or PNG leaf image. The current starter service verifies the upload; a trained CNN must be connected for actual diagnosis.</p><form onSubmit={disease} className="upload-box"><Upload size={32}/><b>Choose a leaf image</b><input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])}/>{file&&<small>{file.name}</small>}<button className="primary" disabled={loading}>{loading?'Uploading...':'Analyze image'}</button></form></section>}
      {active==='history' && <section className="panel"><div className="row-between"><div><h2>Recent analyses</h2><p className="muted">Latest saved prediction records.</p></div><button className="secondary" onClick={loadHistory}>Refresh</button></div>{history.length===0?<p className="empty">No analyses saved yet. Run a prediction to see it here.</p>:history.map(item=><div className="history-item" key={item.id}><b>{item.type}</b><small>{new Date(item.createdAt).toLocaleString()}</small><span>{JSON.stringify(item.result)}</span></div>)}</section>}
      {error&&<div className="alert">{error}</div>}
      {result&&<section className="result"><div className="result-label">ANALYSIS RESULT</div>{Object.entries(result).map(([k,v])=><div className="result-line" key={k}><b>{k.replaceAll('_',' ')}</b><span>{typeof v==='object'?JSON.stringify(v):String(v)}</span></div>)}</section>}
      <footer>Smart Agriculture AI · Academic capstone MVP <span>Use local agricultural expertise to validate recommendations.</span></footer>
    </main>
  </div>
}
export default App
