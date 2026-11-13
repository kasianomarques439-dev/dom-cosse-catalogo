'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Mail, Menu } from 'lucide-react';
export default function AuthForm({mode}:{mode:'login'|'recover'|'reset'}) {
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const router=useRouter();
  async function submit(e:FormEvent){
    e.preventDefault();setBusy(true);setMessage('');
    try {
      if(mode==='login') {
        const login=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
        if(!login.ok){const data=await login.json();setMessage(login.status===429?'Limite de tentativas atingido. Aguarde até 15 minutos para tentar novamente.':login.status===401?'E-mail ou senha incorretos.':data.error||'Não foi possível entrar.');return}
        const res=await fetch('/api/admin/check',{cache:'no-store'});
        if(!res.ok){
          const data=await res.json().catch(()=>({error:''}));
          await fetch('/api/auth/logout',{method:'POST'});
          setMessage(data.error||'Não foi possível confirmar a autorização.');
          return;
        }
        router.replace('/admin');router.refresh();return;
      }
      if(mode==='recover'){
        const res=await fetch('/api/auth/recovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
        const data=await res.json();setMessage(data.message||'Se houver uma conta para esse e-mail, você receberá as instruções.');return;
      }
      if(password.length<12){setMessage('Use uma senha com pelo menos 12 caracteres.');return}
      const res=await fetch('/api/auth/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
      if(!res.ok){setMessage('Não foi possível redefinir a senha. Abra novamente o link recebido.');return}
      setMessage('Senha atualizada. Você já pode entrar.');router.push('/admin/login');
    } catch {
      setMessage('Não foi possível conectar ao serviço. Tente novamente em instantes.');
    } finally {
      setBusy(false);
    }
  }
  const title=mode==='recover'?'Recuperar acesso':'Criar nova senha';
  if(mode==='login')return <div className="da-login-page"><header className="da-login-header"><Link href="/" className="da-logo"><img src="/dom-cosse-logo.png" alt="Dom Cossé Avios de Mate"/></Link><Link href="/" aria-label="Ver o site"><Menu/></Link></header><main><h1>ÁREA<br/>ADMINISTRATIVA</h1><form onSubmit={submit}><label><Mail/><input type="email" placeholder="E-mail" aria-label="E-mail" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label><LockKeyhole/><input type="password" placeholder="Senha" aria-label="Senha" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{message&&<p className="da-error" role="alert">{message}</p>}<button className="da-button" disabled={busy}>{busy?'AGUARDE…':'ENTRAR'}</button><Link className="da-recover" href="/admin/recover">Esqueci minha senha</Link></form><img className="da-login-photo" src="/images/originais/IMG_2331.png" alt="Cuia Dom Cossé"/></main></div>;
  return <main className="login-wrap"><form className="login-card" onSubmit={submit}><div className="logo" style={{margin:'0 auto 1rem'}}><Image src="/dom-cosse-logo-badge.png" alt="Dom Cossé — Avios de Mate" width={1024} height={1024}/></div><h1 className="section-title" style={{textAlign:'center',marginBottom:'1rem'}}>{title}</h1>{mode==='recover'&&<div className="field" style={{marginBottom:'.8rem'}}><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div>}{mode==='reset'&&<div className="field" style={{marginBottom:'1rem'}}><label htmlFor="password">Nova senha</label><input id="password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)}/><small className="muted">Mínimo de 12 caracteres.</small></div>}{message&&<p className="notice" role="status">{message}</p>}<button className="btn" style={{width:'100%',marginTop:'.7rem'}} disabled={busy}>{busy?'Aguarde…':mode==='recover'?'Enviar instruções':'Salvar nova senha'}</button><p style={{textAlign:'center',marginTop:'1rem'}}><Link href="/admin/login">Voltar para entrar</Link></p></form></main>
}
