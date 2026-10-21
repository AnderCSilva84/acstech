// @vitest-environment node
import {beforeEach,it,expect,vi} from 'vitest';
const db=vi.hoisted(()=>new Map<string,unknown>());
const auth=vi.hoisted(()=>({allowed:true,user:null as {sub:string}|null}));
vi.mock('../netlify/functions/_shared/core',()=>({adminAllowed:async()=>auth.allowed,authenticate:async()=>auth.user,json:(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s}),listJSON:async(prefix:string)=>[...db].filter(([k])=>k.startsWith(prefix)).map(([,v])=>v),store:{get:async(k:string)=>db.get(k)||null}}));
import receipt from '../netlify/functions/portal-receipt';
const request=(query:string)=>new Request(`https://local/api/portal/receipt?${query}`);
beforeEach(()=>{auth.allowed=true;auth.user=null;db.clear();db.set('clients/id-c1',{id:'c1',name:'Ana <script>',document:'123'});db.set('charges/c1/q1',{id:'q1',clientId:'c1',description:'Suporte',amount:10000,status:'paid'});});
it('não inventa data em pagamento antigo e escapa HTML',async()=>{const response=await receipt(request('clientId=c1&chargeId=q1'));expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');const html=await response.text();expect(html).toContain('Não registrada no lançamento original');expect(html).toContain('Ana &lt;script&gt;');});
it('recusa outra ficha, cobrança pendente e usuário sem sessão',async()=>{expect((await receipt(request('clientId=c2&chargeId=q1'))).status).toBe(404);db.set('charges/c1/q1',{clientId:'c1',status:'pending'});expect((await receipt(request('clientId=c1&chargeId=q1'))).status).toBe(404);auth.allowed=false;expect((await receipt(request('clientId=c1&chargeId=q1'))).status).toBe(401);});
it('usa a data do pagamento vinculado',async()=>{db.set('payments/c1/p1',{id:'p1',clientId:'c1',chargeId:'q1',description:'Suporte',amount:10000,paidAt:'2026-10-20',method:'PIX'});const html=await (await receipt(request('clientId=c1&chargeId=q1'))).text();expect(html).toContain('20/10/2026');expect(html).toContain('PIX');});
it('cliente autenticado só acessa o próprio comprovante',async()=>{auth.allowed=false;auth.user={sub:'c1'};expect((await receipt(request('clientId=c2&chargeId=q1'))).status).toBe(200);auth.user={sub:'c2'};expect((await receipt(request('clientId=c1&chargeId=q1'))).status).toBe(404);});
