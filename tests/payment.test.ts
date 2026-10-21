// @vitest-environment node
import {beforeEach,it,expect,vi} from 'vitest';
const db=vi.hoisted(()=>new Map<string,unknown>());
const auth=vi.hoisted(()=>({allowed:true}));
vi.mock('../netlify/functions/_shared/core',()=>({adminAllowed:async()=>auth.allowed,hashPin:vi.fn(),normalizePhone:vi.fn(),listJSON:vi.fn(),json:(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s}),store:{get:async(k:string)=>db.get(k)||null,setJSON:async(k:string,v:unknown)=>{db.set(k,v)}}}));
import handler from '../netlify/functions/portal-admin';
const request=(extra={})=>new Request('https://local/api/portal/admin',{method:'POST',body:JSON.stringify({action:'payment',clientId:'c1',chargeId:'q1',paidAt:'2026-10-21',method:'PIX',...extra})});
beforeEach(()=>{db.clear();auth.allowed=true;db.set('clients/id-c1',{id:'c1'});db.set('charges/c1/q1',{id:'q1',clientId:'c1',amount:10000,status:'pending',description:'Mensalidade'});});
it('salva o pagamento e baixa com valor do servidor sem duplicar',async()=>{expect((await handler(request({amount:1}))).status).toBe(201);expect(db.get('payments/c1/manual-q1')).toMatchObject({amount:10000,chargeId:'q1'});expect(db.get('charges/c1/q1')).toMatchObject({status:'paid',paidAt:'2026-10-21'});expect((await handler(request())).status).toBe(200);expect([...db.keys()].filter(k=>k.startsWith('payments/'))).toHaveLength(1);});
it('recusa acesso sem sessão',async()=>{auth.allowed=false;expect((await handler(request())).status).toBe(401);});
it('valida data, método e vínculo do cliente',async()=>{expect((await handler(request({paidAt:'2026-02-30'}))).status).toBe(400);expect((await handler(request({method:''}))).status).toBe(400);expect((await handler(request({clientId:'c2'}))).status).toBe(404);expect(db.has('payments/c1/manual-q1')).toBe(false);});
it('recusa cobrança já paga por outro meio',async()=>{db.set('charges/c1/q1',{clientId:'c1',status:'paid'});expect((await handler(request())).status).toBe(409);});
