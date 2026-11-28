// Rasterize the official favicon geometry without an external build dependency.
const SIGMA: &[(f64,f64)] = &[(85.266,48.5),(238.,48.5),(222.173,81.5),(215.842,86.5),(124.835,87.5),(147.784,119.5),(94.763,161.5),(194.475,161.5),(179.439,198.5),(172.317,206.5),(18.,206.5),(33.036,172.5),(44.115,157.5),(93.971,122.5),(67.856,87.5),(67.065,81.5)];
fn inside(x:f64,y:f64)->bool {
    let mut hit=false;
    for i in 0..SIGMA.len() {
        let (a,b)=SIGMA[i]; let (c,d)=SIGMA[(i+1)%SIGMA.len()];
        if (b>y)!=(d>y) && x<(c-a)*(y-b)/(d-b)+a { hit=!hit; }
    }
    hit
}
fn chunk(out:&mut Vec<u8>,kind:&[u8;4],data:&[u8]){
    out.extend_from_slice(&(data.len() as u32).to_be_bytes());
    out.extend_from_slice(kind);out.extend_from_slice(data);
    let mut crc=0xffffffffu32;
    for &b in kind.iter().chain(data) {
        crc^=b as u32;
        for _ in 0..8 {crc=if crc&1!=0 {(crc>>1)^0xedb88320}else{crc>>1};}
    }
    out.extend_from_slice(&(!crc).to_be_bytes());
}
fn png(size:usize)->Vec<u8>{
    let mut raw=Vec::new();
    for y in 0..size {
        raw.push(0);
        for x in 0..size {
            let mut n=0u16;
            for sy in 0..4 {for sx in 0..4 {
                if inside((x as f64+(sx as f64+0.5)/4.)*256./size as f64,(y as f64+(sy as f64+0.5)/4.)*256./size as f64){n+=1;}
            }}
            for (bg,fg) in [(16u16,207u16),(18,38),(21,59)] {raw.push(((bg*(16-n)+fg*n)/16) as u8);}
            raw.push(255);
        }
    }
    let mut z=vec![0x78,0x01];
    let count=raw.chunks(65535).len();
    for (i,block) in raw.chunks(65535).enumerate(){
        z.push(if i+1==count{1}else{0});
        let len=block.len() as u16;
        z.extend_from_slice(&len.to_le_bytes());z.extend_from_slice(&(!len).to_le_bytes());z.extend_from_slice(block);
    }
    let (mut a,mut b)=(1u32,0u32);
    for &v in &raw {a=(a+v as u32)%65521;b=(b+a)%65521;}
    z.extend_from_slice(&((b<<16)|a).to_be_bytes());
    let mut out=b"\x89PNG\r\n\x1a\n".to_vec();
    let mut header=Vec::new();header.extend_from_slice(&(size as u32).to_be_bytes());header.extend_from_slice(&(size as u32).to_be_bytes());header.extend_from_slice(&[8,6,0,0,0]);
    chunk(&mut out,b"IHDR",&header);chunk(&mut out,b"IDAT",&z);chunk(&mut out,b"IEND",&[]);out
}
fn write_if_changed(path:&str,data:&[u8]){
    if std::fs::read(path).ok().as_deref()!=Some(data){std::fs::write(path,data).expect("write generated icon");}
}
fn main(){
    let logo = "../../site/assets/sim-logo.svg";
    println!("cargo:rerun-if-changed={logo}");
    write_if_changed("../bootstrap/sim-logo.svg", &std::fs::read(logo).expect("read ΣIM logo"));
    std::fs::create_dir_all("icons").expect("create icons");
    write_if_changed("icons/icon.png",&png(256));
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref()==Ok("windows"){
        let sizes=[16usize,32,48,256];
        let images:Vec<_>=sizes.iter().map(|&s|png(s)).collect();
        let mut ico=vec![0,0,1,0,4,0];let mut offset=6+16*sizes.len();
        for (&s,img) in sizes.iter().zip(&images){
            ico.extend_from_slice(&[s as u8,s as u8,0,0,1,0,32,0]);
            ico.extend_from_slice(&(img.len() as u32).to_le_bytes());ico.extend_from_slice(&(offset as u32).to_le_bytes());offset+=img.len();
        }
        for img in images{ico.extend_from_slice(&img);}
        write_if_changed("icons/icon.ico",&ico);
    }
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&[
                "save_project_copy", "open_project", "save_pdf", "startup_status", "retry_startup", "open_editor",
            ])),
    )
    .expect("configure Desktop permissions");
}
