'use client';
import { useState,type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
function ResetPasswordContent(){const token=useSearchParams().get('token');const [message,setMessage]=useState('');async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const password=new FormData(e.currentTarget).get('password');const r=await fetch(`${API}/auth/password/reset`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,password})});setMessage(r.ok?'Password updated. Sign in with your new password.':'The link is invalid or expired. Request another.');}return <section className="form-page"><h1>Choose a new password</h1>{token?<form onSubmit={submit}><label>New password<input name="password" type="password" minLength={12} maxLength={128} required /></label><button>Update password</button></form>:<p>Missing reset link. <a href="/forgot-password">Request a new link</a>.</p>}{message&&<p role="status">{message}</p>}</section>}

export default function Page(){return <Suspense fallback={<p>Loading…</p>}><ResetPasswordContent/></Suspense>}
