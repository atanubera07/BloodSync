'use client';
import { useState,type FormEvent } from 'react';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
export default function ForgotPassword(){const [sent,setSent]=useState(false);async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const email=new FormData(e.currentTarget).get('email');await fetch(`${API}/auth/password/forgot`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})});setSent(true);}return <section className="form-page"><h1>Reset your password</h1><form onSubmit={submit}><label>Email<input name="email" type="email" required /></label><button>Send reset link</button></form>{sent&&<p role="status">If an account exists, we sent a reset link.</p>}</section>}
