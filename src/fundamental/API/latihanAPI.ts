//  0. dummy data produk
// type ResponseProduk =
//   | {
//       status: "ok";
//       produk: { 
//         id: 1; 
//         nama: "buku TypeScript"; 
//         harga: 100_000; 
//         stock: 5 };
//     }
//   | { 
//     status: "gagal";
//     pesan: "produk tidak ditemukan"
// };

// 1. Interface Produk
interface Produk {
  id: number;
  nama: string;
  harga: number;
  stok: number;
}
// 2. Type ResponAPI
type ResponAPI<T> =
  | { status: "ok"; produk: T }
  | { status: "gagal"; pesan: string };

//  3. Fungsi dapatkanProduk (simulasi)
function dapatkanProduk(id: number): ResponAPI<Produk> {
  if (id === 1) {
    // produk dummy
    const produkDummy: Produk ={
      id: 1,
      nama: "Buku TypeScript",
      harga: 100_000,
      stok: 5
    };
    return { status: "ok", produk: produkDummy };
  } else {
    return { status: "gagal", pesan: "Produk tidak ditemukan" };
  }
}

// 4. fungsi menampilkan produk
function tampilkan(respon: ResponAPI<Produk>): string {
  if (respon.status === "ok") {
    const p = respon.produk; // TypeScript tahu ini Produk
    return `${p.nama} - Rp${p.harga} (Stok: ${p.stok})`;
  } else {
    return `Maaf, terjadi error: ${respon.pesan}`;
  }
}

console.log(tampilkan(dapatkanProduk(1)));   // ID 1, harusnya sukses
console.log(tampilkan(dapatkanProduk(999))); // ID lain, error