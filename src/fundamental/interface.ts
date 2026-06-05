// pengabungan : interface dan type alias
interface Karyawan {
  nama: string;
  jabatan: string;
  gaji: number;
}
interface Manager extends Karyawan {
  departemen: string;
}

type jabatan = Karyawan | Manager;
function menyapa(k: jabatan): string {
    if ("departemen" in k) {
        return `Halo ${k.nama}, sebagai ${k.jabatan} di departemen ${k.departemen} ya.`;
    }
    return `Halo ${k.nama}, jabatanmu ${k.jabatan} ya.`;
}

console.info(menyapa({nama: "Budi", jabatan: "Programmer", gaji: 5000000 }));
console.info(menyapa({nama: "Siti", jabatan: "Manager", gaji: 10000000, departemen: "IT" }));

//pendalaman interface malalui kasus yang di berikan -> 
interface DetailProduk {
    beratKg: number;
    warna: string;
}

interface Produk {
    id: number;
    nama: string;
    harga: number;
    kategori: string;
    stok: number;
    detail?: DetailProduk; // optional
}

function ringkasanProduk(p: Produk): string {
    if (p.detail) { // pengecekan truthy, bisa juga p.detail !== undefined
        return `${p.nama} - Rp${p.harga} | Berat: ${p.detail.beratKg}kg, Warna: ${p.detail.warna}`;
    } else {
        return `${p.nama} - Rp${p.harga}`;
    }
}