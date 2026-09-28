import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/admin-auth";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";

const MAX=8*1024*1024;
const MIME:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","image/avif":"avif"};
export async function POST(req:Request){
 if(!await getAdminSession())return NextResponse.json({error:"Unauthorized"},{status:401});
 try{const form=await req.formData();const file=form.get("file");if(!(file instanceof File))return NextResponse.json({error:"Choose an image file."},{status:400});const ext=MIME[file.type];if(!ext)return NextResponse.json({error:"Only JPG, PNG, WEBP, GIF, and AVIF images are allowed."},{status:415});if(file.size<1||file.size>MAX)return NextResponse.json({error:"Image must be smaller than 8 MB."},{status:413});const dir=path.join(process.cwd(),"public","uploads");await mkdir(dir,{recursive:true});const name=`${randomUUID()}.${ext}`;await writeFile(path.join(dir,name),Buffer.from(await file.arrayBuffer()),{flag:"wx"});return NextResponse.json({url:`/uploads/${name}`},{status:201});}catch{return NextResponse.json({error:"Image upload failed."},{status:500})}
}
