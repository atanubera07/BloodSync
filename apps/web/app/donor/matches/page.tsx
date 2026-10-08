'use client';
import { useEffect, useState } from 'react';
import { AccountGate } from '../../../components/AccountGate';
import { apiJson } from '../../../lib/api';
type Match={id:string;bloodGroup:string;units:number;urgency:string;hospitalName:string;city:string;expiresAt:string;distanceKm:number|null;responded:boolean};
function Matches(){const [items,setItems]=useState<Match[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [pending,setPending]=useState('');
  async function load(){setError('');try{setItems(await apiJson<Match[]>('/donors/me/matches'));}catch(message){setError(String(message instanceof Error?message.message:message));}finally{setLoading(false);}}
  useEffect(()=>{void load();},[]);
  async function respond(id:string){setPending(id);setError('');try{await apiJson(`/donors/me/interests/${id}`,{method:'POST'});setItems(current=>current.map(item=>item.id===id?{...item,responded:true}:item));}catch(message){setError(String(message instanceof Error?message.message:message));}finally{setPending('');}}
  return <section><h1>Requests you can help with</h1><p>Responding shares your name and account email with the request owner. Contact the hospital to confirm all medical details.</p>{loading?<p role="status">Finding requests…</p>:error?<div role="alert"><p className="error">{error}</p><button onClick={()=>void load()}>Retry</button></div>:items.length===0?<p className="empty">No matching open requests right now. Check your <a href="/donor/profile">profile and approval status</a>.</p>:<div className="card-grid">{items.map(item=><article className="card" key={item.id}><div className="card-top"><strong>{item.bloodGroup}</strong><span className="badge">{item.urgency.toLowerCase()}</span></div><h2>{item.hospitalName}</h2><p>{item.city}{item.distanceKm!==null?` · ${item.distanceKm} km away`:''}</p><p>{item.units} unit{item.units===1?'':'s'} · Expires {new Date(item.expiresAt).toLocaleString()}</p><button disabled={item.responded||pending===item.id} onClick={()=>void respond(item.id)}>{item.responded?'Interest shared':pending===item.id?'Sharing…':'I can help'}</button></article>)}</div>}</section>;
}
export default function DonorMatchesPage(){return <AccountGate role="USER">{()=><Matches/>}</AccountGate>}
