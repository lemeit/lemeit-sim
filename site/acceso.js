'use strict';
const role=document.getElementById('access-role'),code=document.getElementById('access-code'),password=document.getElementById('access-password'),message=document.getElementById('access-message');
role.onchange=()=>{const admin=role.value==='admin';document.getElementById('access-code-label').hidden=admin;document.getElementById('access-password-label').hidden=!admin;code.required=!admin;password.required=admin;message.textContent='';};
document.getElementById('access-form').onsubmit=async event=>{
 event.preventDefault();message.textContent='Verificando acceso…';
 const isAdmin=role.value==='admin';
 try{
  const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(isAdmin?{role:'admin',password:password.value}:{role:'student',code:code.value})});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'No se pudo ingresar');
  code.value='';password.value='';
  location.assign(isAdmin?'/admin.html':'/');
 }catch(error){message.textContent=error.message;}
};