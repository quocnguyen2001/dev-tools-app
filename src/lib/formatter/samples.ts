import type { FormatTypeValue } from "@/types/formatter";

/**
 * Sample code shown in the input editor when a type is selected.
 * Copied 1:1 from the legacy Vue app (resources/js/pages/Formatter/Index.vue).
 */
export const SAMPLE_CODE: Record<FormatTypeValue, string> = {
  json: `{"id":"ord_8f3a","status":"paid","customer":{"id":"cus_91","name":"Linh Nguyen","email":"linh@example.com"},"items":[{"sku":"TS-001","title":"Cotton T-Shirt","qty":2,"price":19.5},{"sku":"MG-014","title":"Ceramic Mug","qty":1,"price":12}],"totals":{"subtotal":51,"shipping":4.99,"tax":4.48,"grand":60.47},"createdAt":"2026-05-17T09:42:00Z","tags":["priority","gift-wrap"]}`,
  html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Pricing</title></head><body><main class="container"><section class="hero"><h1>Simple, transparent pricing</h1><p class="lead">Pick a plan that fits your team. Cancel anytime.</p></section><section class="plans"><article class="plan"><h2>Starter</h2><p class="price">$9<span>/mo</span></p><ul><li>Up to 3 projects</li><li>Email support</li></ul><a href="/signup" class="btn">Choose Starter</a></article><article class="plan featured"><h2>Pro</h2><p class="price">$29<span>/mo</span></p><ul><li>Unlimited projects</li><li>Priority support</li><li>Advanced analytics</li></ul><a href="/signup?plan=pro" class="btn primary">Choose Pro</a></article></section></main></body></html>`,
  css: `:root{--surface:#ffffff;--text:#0f172a;--muted:#64748b;--accent:#2563eb;--radius:12px}.card{display:flex;flex-direction:column;gap:12px;padding:24px;background:var(--surface);color:var(--text);border-radius:var(--radius);box-shadow:0 1px 2px rgba(15,23,42,.06),0 4px 12px rgba(15,23,42,.04);transition:transform .15s ease,box-shadow .15s ease}.card:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(15,23,42,.08)}.card h3{margin:0;font-size:18px;font-weight:600}.card p{margin:0;color:var(--muted);line-height:1.5}.card .actions{display:flex;gap:8px;margin-top:auto}.card .actions button{padding:8px 14px;border-radius:8px;border:1px solid transparent;background:var(--accent);color:#fff;cursor:pointer}.card .actions button.ghost{background:transparent;color:var(--accent);border-color:currentColor}@media (max-width:640px){.card{padding:16px}}`,
  javascript: `// Compute paginated invoices grouped by status with running totals.
async function getInvoiceSummary(  client , {page=1,pageSize=20,from,to}={}  ){
const  rows=await client.query(\`select id, status, amount, issued_at from invoices where issued_at between $1 and $2\`,[from,to]);
const  byStatus=rows.reduce((acc,r)=>{
const  k=r.status||"unknown";
(acc[k]??=  {count:0,total:0}).count++;
acc[k].total+=Number(r.amount)||0;
return  acc;
},{});
const  start=(page-1)*pageSize;
const  items=rows.slice(start,start+pageSize).map(r=>({id:r.id,status:r.status,amount:r.amount,issuedAt:r.issued_at}));
return{page,pageSize,total:rows.length,items,byStatus};
}
export  default  getInvoiceSummary;`,
  sql: `with monthly as (select date_trunc('month',o.created_at) as month,o.customer_id,sum(o.total) as revenue,count(*) as orders from orders o where o.status='paid' and o.created_at>=now()-interval '12 months' group by 1,2) select c.id,c.name,c.email,sum(m.revenue) as ltv,sum(m.orders) as total_orders,max(m.month) as last_active_month from monthly m join customers c on c.id=m.customer_id group by c.id,c.name,c.email having sum(m.revenue)>=1000 order by ltv desc limit 25;`,
  php: `<?php
declare(strict_types=1);
namespace App\\Http\\Controllers;
use App\\Models\\Invoice;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;
class InvoiceController{
public function index(Request $request):JsonResponse{
$query=Invoice::query()->where('user_id',$request->user()->id);
if($status=$request->query('status')){$query->where('status',$status);}
if($from=$request->query('from')){$query->where('issued_at','>=',$from);}
$invoices=$query->orderByDesc('issued_at')->paginate(20);
$totals=[
'count'=>$invoices->total(),
'paid'=>$invoices->where('status','paid')->sum('amount'),
'due'=>$invoices->where('status','open')->sum('amount'),
];
return response()->json(['data'=>$invoices->items(),'meta'=>$totals]);
}}`,
};

export function getSampleCode(type: string | undefined): string {
  if (!type) return "";
  return SAMPLE_CODE[type] ?? "";
}
