import type { FormatTypeValue } from "@/types/formatter";

/**
 * Sample code shown in the input editor when a type is selected.
 * Copied 1:1 from the legacy Vue app (resources/js/pages/Formatter/Index.vue).
 */
export const SAMPLE_CODE: Record<FormatTypeValue, string> = {
  json: `{"name":"John Doe","age":30,"city":"New York","hobbies":["reading","coding","gaming"]}`,
  html: `<!DOCTYPE html><html><head><title>Example</title></head><body><div class="container"><h1>Hello World</h1><p>This is a  test  paragraph  with   extra   spaces.</p><ul><li>Item 1</li><li>Item 2</li></ul></div></body></html>`,
  css: `.container{display:flex;gap:16px;align-items:center}.container .card{padding:24px;background:#ffffff;color:#1f2937;border-radius:12px}.container .card:hover{background:#f3f4f6}`,
  javascript: `function   example(  param  )  {
if(param>0){
return  true;
}else{
return   false;
}
}
const  arr=[1,2,3,4,5];
const  result=arr.map(x=>x*2);`,
  sql: `select users.id,users.name,orders.total from users left join orders on orders.user_id=users.id where users.active=1 and orders.total>100 order by orders.created_at desc limit 10;`,
};

export function getSampleCode(type: string | undefined): string {
  if (!type) return "";
  return SAMPLE_CODE[type as FormatTypeValue] ?? "";
}
