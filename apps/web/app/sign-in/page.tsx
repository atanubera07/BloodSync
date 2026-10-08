'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export default function SignIn() {
  const router = useRouter(); const [error,setError]=useState(''); const [pending,setPending]=useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setPending(true);
    const data = new FormData(event.currentTarget);
    try { const response=await fetch(`${API}/auth/login`,{method:'POST',headers:{'content-type':'application/json'},credentials:'include',body:JSON.stringify({email:data.get('email'),password:data.get('password')})}); if(!response.ok) throw new Error(response.status===429?'Too many attempts. Please wait 15 minutes and try again.':'Invalid email or password'); router.push('/dashboard'); }
    catch (message) { setError(message instanceof Error?message.message:'Sign in failed. Try again.'); } finally { setPending(false); }
  }
  return <section className="form-page"><h1>Sign in</h1><form onSubmit={submit}><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button disabled={pending}>{pending?'Signing in…':'Sign in'}</button>{error&&<p role="alert">{error}</p>}</form><p><a href="/forgot-password">Forgot your password?</a></p><p>New here? <a href="/sign-up">Create an account</a></p></section>;
}
