import { useEffect, useMemo, useState } from "react";
import { Shield, LayoutDashboard, Server, Bug, FileUp, Download, Plus, Search, Activity, CheckCircle2, AlertTriangle, Clock3, X } from "lucide-react";

const API = "http://localhost:4000/api";
type Asset = { id: string; name: string; host: string; type: string; environment: string };
type Finding = { id: string; title: string; assetId: string; severity: string; exploitability: string; status: string; description: string; recommendation: string; source: string; createdAt: string; riskScore: number };
type Tab = "Overview" | "Assets" | "Findings" | "Evidence";
export default function App() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"asset" | "finding" | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [assetForm, setAssetForm] = useState({name:"",host:"",type:"Web application",environment:"Isolated lab"});
  const [findingForm, setFindingForm] = useState({title:"",assetId:"",severity:"Medium",exploitability:"Medium",description:"",recommendation:""});
  async function refresh() {
    try {
      const [a,f] = await Promise.all([fetch(`${API}/assets`),fetch(`${API}/findings`)]);
      if (!a.ok || !f.ok) throw new Error("API unavailable");
      setAssets(await a.json()); setFindings(await f.json());
    } catch { setNotice("API not connected. Start the server using the README instructions."); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  const stats = useMemo(() => ({
    open: findings.filter(f=>f.status==="Open").length,
    critical: findings.filter(f=>f.severity==="Critical" && f.status!=="Resolved").length,
    progress: findings.filter(f=>f.status==="In Progress").length,
    resolved: findings.filter(f=>f.status==="Resolved").length
  }),[findings]);
  const visibleFindings = findings.filter(f => `${f.title} ${f.severity} ${f.source}`.toLowerCase().includes(search.toLowerCase()));
  async function createAsset(e: React.FormEvent) {
    e.preventDefault(); const r=await fetch(`${API}/assets`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(assetForm)});
    if(r.ok){setAssetForm({name:"",host:"",type:"Web application",environment:"Isolated lab"});setModal(null);setNotice("Asset added.");refresh();} else setNotice("Could not add asset.");
  }
  async function createFinding(e: React.FormEvent) {
    e.preventDefault(); const r=await fetch(`${API}/findings`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(findingForm)});
    if(r.ok){setFindingForm({title:"",assetId:"",severity:"Medium",exploitability:"Medium",description:"",recommendation:""});setModal(null);setNotice("Finding added.");refresh();} else setNotice("Could not add finding. Select an asset.");
  }
  async function updateStatus(id:string,status:string) {
    await fetch(`${API}/findings/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})}); refresh();
  }
  async function importFile(kind:"nmap"|"burp", file?:File) {
    if(!file)return; const form=new FormData();form.append("file",file);
    const r=await fetch(`${API}/import/${kind}`,{method:"POST",body:form});const data=await r.json();
    setNotice(r.ok?`${data.message} Imported: ${data.imported}.`:(data.error??"Import failed."));refresh();
  }
  const exportData=()=>window.open(`${API}/export`,"_blank");
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Shield size={21}/></div><div><strong>SentinelScope</strong><span>SECURITY OPERATIONS</span></div></div>
      <div className="workspace"><span className="workspace-dot"/> LAB WORKSPACE <span className="chevron">⌄</span></div>
      <div className="nav-label">WORKSPACE</div>
      {(["Overview","Assets","Findings","Evidence"] as Tab[]).map((t,i)=><button key={t} className={`nav-item ${tab===t?"active":""}`} onClick={()=>setTab(t)}>{[<LayoutDashboard size={17}/>,<Server size={17}/>,<Bug size={17}/>,<FileUp size={17}/>][i]}{t}{t==="Findings"&&<span className="nav-count">{findings.length}</span>}</button>)}
      <div className="sidebar-bottom"><div className="safe-note"><Shield size={16}/><div><b>Authorized testing only</b><p>Use this workspace for systems you own or have permission to assess.</p></div></div><div className="profile"><div className="avatar">G</div><div><b>Security Analyst</b><span>Local workspace</span></div><span className="dots">•••</span></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> <b>{tab}</b></div><div className="top-actions"><span className="live"><i/> LOCAL LAB</span><button className="icon-button" onClick={exportData} title="Export assessment"><Download size={17}/></button><div className="avatar small">G</div></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">SECURITY ASSESSMENT PLATFORM</div><h1>{tab==="Overview"?"Assessment overview":tab}</h1><p>{tab==="Overview"?"Monitor your lab assets, security findings, and remediation progress.":tab==="Assets"?"Inventory the systems included in this authorized assessment.":tab==="Findings"?"Review, prioritize, and track security observations.":"Import scanner evidence from your isolated lab."}</p></div><div className="heading-actions">{tab==="Assets"&&<button className="primary" onClick={()=>setModal("asset")}><Plus size={16}/> Add asset</button>}{tab==="Findings"&&<button className="primary" onClick={()=>setModal("finding")}><Plus size={16}/> New finding</button>}</div></div>
        {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}
        {tab==="Overview"&&<><div className="stat-grid">
          <Stat icon={<Bug/>} label="Total findings" value={findings.length} hint="Across all assets"/>
          <Stat icon={<AlertTriangle/>} label="Open findings" value={stats.open} hint="Require investigation" tone="amber"/>
          <Stat icon={<Activity/>} label="In progress" value={stats.progress} hint="Remediation underway" tone="blue"/>
          <Stat icon={<CheckCircle2/>} label="Resolved" value={stats.resolved} hint="Marked as remediated" tone="green"/>
        </div><div className="section-grid"><section className="panel"><div className="panel-head"><div><h2>Recent findings</h2><p>Latest security observations</p></div><button className="text-button" onClick={()=>setTab("Findings")}>View all →</button></div><FindingTable findings={findings.slice(0,5)} assets={assets} updateStatus={updateStatus}/></section><section className="panel asset-panel"><div className="panel-head"><div><h2>Assessment assets</h2><p>Systems in your lab scope</p></div><button className="text-button" onClick={()=>setTab("Assets")}>View all →</button></div>{assets.slice(0,5).map(a=><div className="asset-row" key={a.id}><div className="asset-icon"><Server size={17}/></div><div className="asset-info"><b>{a.name}</b><span>{a.host} · {a.type}</span></div><span className="environment">{a.environment}</span></div>)}</section></div><div className="bottom-banner"><div className="banner-icon"><Shield/></div><div><b>Evidence first. Validate before reporting.</b><p>Scanner output is an observation. Review the evidence and confirm business impact before classifying an issue as a vulnerability.</p></div></div></>}
        {tab==="Assets"&&<section className="panel"><div className="panel-head"><div><h2>Asset inventory</h2><p>{assets.length} assets registered in this assessment</p></div><button className="primary" onClick={()=>setModal("asset")}><Plus size={16}/> Add asset</button></div><div className="asset-table">{assets.map(a=><div className="asset-card" key={a.id}><div className="asset-icon"><Server/></div><div className="asset-info"><b>{a.name}</b><span>{a.host}</span></div><span className="type-tag">{a.type}</span><span className="environment">{a.environment}</span></div>)}</div></section>}
        {tab==="Findings"&&<section className="panel"><div className="panel-head"><div><h2>Findings register</h2><p>{findings.length} observations recorded</p></div><div className="searchbox"><Search size={16}/><input placeholder="Search findings..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div><FindingTable findings={visibleFindings} assets={assets} updateStatus={updateStatus}/></section>}
        {tab==="Evidence"&&<div className="evidence-grid"><ImportCard title="Nmap XML report" detail="Import an XML export from Nmap to register discovered lab hosts and open-port observations." accept=".xml" onFile={f=>importFile("nmap",f)} /><ImportCard title="Burp Suite CSV report" detail="Import a Burp Suite issue export as findings for manual validation." accept=".csv" onFile={f=>importFile("burp",f)}/><div className="panel evidence-note"><Shield/><div><b>Keep your assessment authorized</b><p>Run scanners separately against your own isolated lab targets. This application only parses exported evidence; it does not launch scans or exploits.</p></div></div></div>}
        {loading&&<div className="loading"><Clock3 size={16}/> Loading assessment data…</div>}
        <footer>SentinelScope <span>·</span> Local assessment workspace <span>·</span> MVP 1.0</footer>
      </div>
    </main>
    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><form className="modal" onSubmit={modal==="asset"?createAsset:createFinding}><div className="modal-head"><div><h2>{modal==="asset"?"Add assessment asset":"Create finding"}</h2><p>{modal==="asset"?"Register a system within your authorized scope.":"Record a validated security observation."}</p></div><button type="button" className="icon-button" onClick={()=>setModal(null)}><X/></button></div>
      {modal==="asset"?<><Field label="Asset name"><input required value={assetForm.name} onChange={e=>setAssetForm({...assetForm,name:e.target.value})} placeholder="e.g. Demo API Server"/></Field><Field label="IP address / hostname"><input required value={assetForm.host} onChange={e=>setAssetForm({...assetForm,host:e.target.value})} placeholder="192.168.56.40"/></Field><Field label="Asset type"><select value={assetForm.type} onChange={e=>setAssetForm({...assetForm,type:e.target.value})}><option>Web application</option><option>Linux server</option><option>Windows workstation</option><option>Database</option><option>Network host</option><option>Mobile application</option></select></Field><Field label="Environment"><input value={assetForm.environment} onChange={e=>setAssetForm({...assetForm,environment:e.target.value})}/></Field></>:<><Field label="Finding title"><input required value={findingForm.title} onChange={e=>setFindingForm({...findingForm,title:e.target.value})} placeholder="Short, clear issue title"/></Field><Field label="Affected asset"><select required value={findingForm.assetId} onChange={e=>setFindingForm({...findingForm,assetId:e.target.value})}><option value="">Select an asset</option>{assets.map(a=><option value={a.id} key={a.id}>{a.name} ({a.host})</option>)}</select></Field><div className="form-row"><Field label="Severity"><select value={findingForm.severity} onChange={e=>setFindingForm({...findingForm,severity:e.target.value})}>{["Critical","High","Medium","Low","Info"].map(x=><option>{x}</option>)}</select></Field><Field label="Exploitability"><select value={findingForm.exploitability} onChange={e=>setFindingForm({...findingForm,exploitability:e.target.value})}>{["High","Medium","Low","Unknown"].map(x=><option>{x}</option>)}</select></Field></div><Field label="Description"><textarea value={findingForm.description} onChange={e=>setFindingForm({...findingForm,description:e.target.value})} placeholder="What did you observe?"/></Field><Field label="Recommendation"><textarea value={findingForm.recommendation} onChange={e=>setFindingForm({...findingForm,recommendation:e.target.value})} placeholder="What should be done to address it?"/></Field></>}
      <div className="modal-actions"><button type="button" className="secondary" onClick={()=>setModal(null)}>Cancel</button><button className="primary" type="submit">{modal==="asset"?"Save asset":"Create finding"}</button></div></form></div>}
  </div>;
}
function Stat({icon,label,value,hint,tone=""}:{icon:React.ReactNode,label:string,value:number,hint:string,tone?:string}){return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>}
function FindingTable({findings,assets,updateStatus}:{findings:Finding[],assets:Asset[],updateStatus:(id:string,s:string)=>void}){return <div className="table-wrap"><table><thead><tr><th>FINDING</th><th>ASSET</th><th>SEVERITY</th><th>RISK</th><th>STATUS</th></tr></thead><tbody>{findings.map(f=><tr key={f.id}><td><b>{f.title}</b><small>{f.source}</small></td><td>{assets.find(a=>a.id===f.assetId)?.name??"Unknown"}</td><td><span className={`severity ${f.severity.toLowerCase()}`}>{f.severity}</span></td><td><b className="risk-number">{f.riskScore.toFixed(1)}</b></td><td><select className="status-select" value={f.status} onChange={e=>updateStatus(f.id,e.target.value)}><option>Open</option><option>In Progress</option><option>Resolved</option></select></td></tr>)}</tbody></table>{findings.length===0&&<div className="empty">No findings match your search.</div>}</div>}
function ImportCard({title,detail,accept,onFile}:{title:string,detail:string,accept:string,onFile:(f?:File)=>void}){return <div className="panel import-card"><div className="upload-icon"><FileUp/></div><h2>{title}</h2><p>{detail}</p><label className="upload-button">Choose file<input type="file" accept={accept} onChange={e=>onFile(e.target.files?.[0])}/></label></div>}
function Field({label,children}:{label:string,children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}
