type ResponseProduk = 
  | { jenis: "sukses"; data: { nama: string; harga: number } }
  | { jenis: "error"; pesan: string };

// ✅ Deklarasikan variabel, lalu kasih tipe
const response: ResponseProduk = {
  jenis: "sukses",
  data: {
    nama: "vem",
    harga: 123
  }
};

// Atau biarkan TypeScript infer sendiri (tanpa : ResponseProduk)
const response2 = {
  jenis: "sukses",
  data: { nama: "vem", harga: 123 }
} satisfies ResponseProduk;

console.log(response);
console.log()
console.log(response2);