'use client';
import { useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
type User={fullName:string;email:string;role:string};
export default function Dashboard(){
  const router=useRouter(); const [user,setUser]=useState<User|null>(null); const [error,setError]=useState('');
  useEffect(()=>{let active=true;fetch(`${API}/auth/me`,{credentials:'include'}).then(r=>{if(r.status===401){router.replace('/sign-in');return null;}if(!r.ok)throw new Error();return r.json();}).then(data=>{if(active&&data)setUser(data);}).catch(()=>{if(active)setError('We could not load your account.');});return()=>{active=false;};},[router]);
  async function logout(){await fetch(`${API}/auth/logout`,{method:'POST',credentials:'include'});router.replace('/sign-in');}
  return <section><h1>Your dashboard</h1>{error?<p role="alert">{error} <button onClick={()=>location.reload()}>Retry</button></p>:user?<><p>Welcome, {user.fullName}.</p><p>Signed in as {user.email}.</p><button onClick={logout}>Sign out</button></>:<p role="status">Loading your account…</p>}</section>;
}
